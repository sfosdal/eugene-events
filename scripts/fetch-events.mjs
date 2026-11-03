#!/usr/bin/env node
/**
 * Aggregates upcoming events in Eugene, Oregon, into site/events.json and
 * site/events.ics. Runs in CI (see .github/workflows/events.yml) and locally
 * for preview. The pipeline is lqa-events' (scripts/*.mjs are its files,
 * byte for byte; the build itself is scripts/build.mjs); only the readers below and site/city.js are Eugene's.
 *
 * Each source returns [{ venue, title, date, time, url }]. Ticketmaster needs
 * a free Discovery API key in env TICKETMASTER_API_KEY (repo secret of the
 * same name); with no key it's skipped. Every room is read by its Ticketmaster
 * venue id (city.js `tm`); there is no city sweep, as in Chicago — the rooms
 * are read one by one, a second apart (the key is shared with the sister
 * cities' builds). The teams' seasons come from the NHL's feed, ESPN, MLB's
 * stats API and the AHL's HockeyTech feed (scripts/schedules.mjs).
 */
import './failures.mjs'; // first: every outside call retried, the ones still failing written to failures.json (Steve, 2026-10-29)
import { build, BROWSER_UA } from './build.mjs';
import { cardClock } from './feeds.mjs';

// --- Whirled Pies: the pizzeria's WordPress event posts (wp/v2/event) ---
// Each post is one night, its date leading the title ("10/28 PAINT AND SIP at Whirled Pies – …";
// "11/4 and 11/18 …" is two nights); the weekly open mics ("… Every Tuesday") carry no date and are
// left out. The clock is the show time in the body ("Doors 7 | Show 8", "Show @ 7:30 PM", "8PM").
const WHIRLED_URL = 'https://whirledpies.com/wp-json/wp/v2/event?per_page=100';
const htmlText = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#8211;|&ndash;/g, '–').replace(/&#8212;|&mdash;/g, '—').replace(/&#8217;|&rsquo;|&#039;|&#39;/g, "'").replace(/&#8220;|&#8221;|&ldquo;|&rdquo;|&quot;/g, '"').replace(/&#8230;|&hellip;/g, '…').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, ' ').trim();
export function parseWhirledPies(posts) {
  const out = [];
  const clockOf = (body) => { // the show (or games) clock over the doors; else the first clock the body prints (cardClock reads a "6-8pm" range as 6)
    const show = /(?:show|games?|music)\s*(?:@|at|:)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i.exec(body);
    if (!show) return cardClock(body);
    let h = Number(show[1]) % 12; const ap = (show[3] || 'pm').toLowerCase(); if (ap === 'pm') h += 12;
    return `${String(h).padStart(2, '0')}:${show[2] || '00'}`;
  };
  for (const post of posts || []) {
    const raw = htmlText(post.title?.rendered);
    const lead = /^((?:\d{1,2}\/\d{1,2}(?:\s*(?:,|and|&)\s*)?)+)\s*(.*)$/i.exec(raw);
    if (!lead) continue; // no date in front: a weekly night
    const title = lead[2].replace(/^[-–—:\s]+/, '').trim();
    if (!title) continue;
    const body = htmlText(post.content?.rendered);
    const time = clockOf(body);
    const type = /trivia|paint|bingo|market|benefit|fundrais/i.test(title) ? 'community' : /comedy|open mic|improv/i.test(title) ? 'arts' : 'concert';
    const posted = String(post.date || new Date().toISOString()).slice(0, 10); // the night is on or after the day the post went up (a December post for January's show)
    for (const m of lead[1].matchAll(/(\d{1,2})\/(\d{1,2})/g)) {
      const mo = m[1].padStart(2, '0'); const d = m[2].padStart(2, '0');
      let y = Number(posted.slice(0, 4)); if (`${y}-${mo}-${d}` < posted) y += 1;
      out.push({ venue: 'Whirled Pies', title, date: `${y}-${mo}-${d}`, time, url: post.link || 'https://whirledpies.com/calendar/', type });
    }
  }
  return out;
}
async function whirledPies() {
  const res = await fetch(WHIRLED_URL, { headers: { 'User-Agent': BROWSER_UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Whirled Pies HTTP ${res.status}`);
  const evs = parseWhirledPies(await res.json());
  console.log(`Whirled Pies: ${evs.length} nights`);
  return evs;
}

// --- The Jazz Station: the Wix home page's show cards ---
// Every show is a link to calendar#!event/YYYY/M/D/slug (the date is in the link). A list card runs
// image link, "<p>Sat · Oct 17</p>", "<h6>Title</h6>", a blurb, a More Info link; a featured card
// puts its <h6> title (or all-caps <p> lines) before the link, whose text may be "SOLD OUT" or a
// clock ("6 PM Show"). The list prints no clocks, so most rows have none.
const JAZZ_URL = 'https://www.thejazzstation.org/';
export function parseJazzStation(html) {
  const toks = [];
  for (const m of String(html || '').matchAll(/<a [^>]*href="(https?:\/\/[^"]*calendar#!event\/(\d{4})\/(\d{1,2})\/(\d{1,2})\/[^"]+)"[^>]*>([\s\S]*?)<\/a>|<(h6|p)\b[^>]*>([\s\S]*?)<\/\6>/g)) {
    if (m[1]) toks.push({ kind: 'link', url: m[1], date: `${m[2]}-${m[3].padStart(2, '0')}-${m[4].padStart(2, '0')}`, text: htmlText(m[5]) });
    else { const text = htmlText(m[7]); if (text) toks.push({ kind: m[6], text }); }
  }
  const fragment = (t) => /^\d{1,2}$|^(st|nd|rd|th)$|^(january|february|march|april|may|june|july|august|september|october|november|december)$/i.test(t);
  const dayLine = (t) => /^(mon|tue|wed|thu|fri|sat|sun)\w*\s*[·•]\s*[A-Za-z]{3,9}\.?\s+\d{1,2}$/i.test(t);
  const titleCase = (t) => t.toLowerCase().replace(/(^|\s|-)([a-z])/g, (_, a, b) => a + b.toUpperCase());
  const out = []; const seen = new Map();
  for (let i = 0; i < toks.length; i++) {
    const L = toks[i]; if (L.kind !== 'link') continue;
    let title = '';
    for (let j = i + 1; j < toks.length && toks[j].kind !== 'link'; j++) { // a list card: the date line, then the title
      if (toks[j].kind === 'p' && dayLine(toks[j].text)) { const h = toks.slice(j + 1).find((t) => t.kind !== 'p'); if (h && h.kind === 'h6') title = h.text; break; }
    }
    if (!title) { // a featured card: the title stands before the link
      const caps = [];
      for (let j = i - 1; j >= 0 && toks[j].kind !== 'link'; j--) {
        const t = toks[j];
        if (t.kind === 'h6' && !fragment(t.text)) { title = t.text; break; }
        if (t.kind === 'p' && /^[A-Z][A-Z .'&-]+$/.test(t.text) && t.text.length < 40) caps.unshift(t.text);
      }
      if (!title && caps.length) title = titleCase(caps.join(' '));
    }
    if (!title && i > 0 && toks[i - 1].kind === 'link' && toks[i - 1].date === L.date) title = seen.get(toks[i - 1].url) || ''; // "8 PM Show" after "6 PM Show"
    if (!title) continue;
    const c = /(\d{1,2})(?::(\d{2}))?\s*([AP])M\b/i.exec(L.text);
    const time = c ? `${String((Number(c[1]) % 12) + (c[3].toUpperCase() === 'P' ? 12 : 0)).padStart(2, '0')}:${c[2] || '00'}` : '';
    const key = `${L.url}|${time}`;
    if (seen.has(L.url) && !time) continue;
    seen.set(L.url, title);
    if (out.some((e) => `${e.url}|${e.time}` === key)) continue;
    const ev = { venue: 'The Jazz Station', title, date: L.date, time, url: L.url, type: 'concert' };
    if (/sold out/i.test(L.text)) ev.soldOut = true;
    out.push(ev);
  }
  return out;
}
async function jazzStation() {
  const res = await fetch(JAZZ_URL, { headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html' } });
  if (!res.ok) throw new Error(`Jazz Station HTTP ${res.status}`);
  const evs = parseJazzStation(await res.text());
  console.log(`The Jazz Station: ${evs.length} shows`);
  return evs;
}

await build({
  feedUrl: 'https://eugene.here.events/events.json',
  archiveUrl: 'https://raw.githubusercontent.com/sfosdal/eugene-events/archive/events-archive.json',
  primary: (s) => [...s.tmFirst, whirledPies, jazzStation, ...s.feedsFirst],
});
