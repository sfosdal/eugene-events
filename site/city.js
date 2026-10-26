// The city — every fact that makes this calendar Eugene's rather than
// another town's, in one place (2026-10-17: built on the Denver site's
// pattern). The browser (filter.js, app.js) and the build (scripts/*.mjs)
// both read it; nothing else names a venue or a team. The shared files
// (app.js, filter.js, styles.css bar its --v-* hues, scripts/*.mjs bar
// fetch-events.mjs and sources.mjs) are lqa-events' own, byte for byte —
// see README "Sister sites".
//
// Loaded before filter.js (a plain script, so the tests can share it): it
// sets globalThis.LQACity (the name is the shared code's, not the city's).
(function (global) {
  'use strict';

  // The home teams, matched on the event title whatever the venue. Order =
  // the Teams strip, left to right; the first match wins (app.js teamFor).
  // Per team:
  //   re        the title match (Ticketmaster's titles — "Oregon Ducks
  //             Football vs. …" — and the injected ones, "<inject.name> vs …")
  //   venue     the home building; schedule = the club's own schedule page
  //   sport     keys the strip icon (app.js SPORT_ICONS), the game clock,
  //             the leader categories
  //   colors    [primary, accent] — the season calendar's home cells and
  //             card frames
  //   season    where the schedule comes from: ESPN for the Ducks and the
  //             Beavers, MLB's statsapi (sportId 13, High-A) for the Emeralds
  //   inject    a club whose home dates no ticket feed lists: the league's
  //             schedule puts them on the calendar under this ticket link.
  //             Ticketmaster lists nothing at PK Park, so the Emeralds'
  //             season is injected
  //   club      the club's name on Ticketmaster; wiki the article; opens
  //             when the season usually starts
  var TEAMS = [
    // Oregon Ducks football, Big Ten, Autzen Stadium — Ticketmaster lists the home Saturdays
    { slug: 'ducks', label: 'Ducks', name: 'Oregon Ducks', abbr: 'ORE', re: /oregon (ducks )?football|\bducks\b(?!.*(basketball|volleyball|softball|soccer|baseball|track))/i, sport: 'football', venue: 'Autzen Stadium', colors: ['#154733', '#fee123'],
      espn: { sport: 'football', league: 'college-football', id: '2483' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png', schedule: 'https://goducks.com/sports/football/schedule',
      club: 'Oregon Ducks Football', opens: 'late August', wiki: { title: 'Oregon Ducks football', teamPage: true } },
    // Oregon Ducks men's basketball, Big Ten, Matthew Knight Arena — Ticketmaster lists the home games
    { slug: 'ducksbasketball', label: 'Ducks Basketball', name: 'Oregon Ducks', abbr: 'ORE', re: /oregon (ducks )?men'?s basketball|oregon (ducks )?basketball(?!.*women)/i, sport: 'basketball', venue: 'Matthew Knight Arena', colors: ['#154733', '#fee123'],
      espn: { sport: 'basketball', league: 'mens-college-basketball', id: '2483' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png', schedule: 'https://goducks.com/sports/mens-basketball/schedule',
      club: "Oregon Ducks Men's Basketball", opens: 'early November', wiki: { title: "Oregon Ducks men's basketball", teamPage: true } },
    // Oregon Ducks women's basketball, Big Ten, Matthew Knight Arena — Ticketmaster lists the home games
    { slug: 'duckswomens', label: 'Ducks Women', name: 'Oregon Ducks', abbr: 'ORE', re: /oregon (ducks )?women'?s basketball/i, sport: 'basketball', venue: 'Matthew Knight Arena', colors: ['#fee123', '#154733'],
      espn: { sport: 'basketball', league: 'womens-college-basketball', id: '2483' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/2483.png', schedule: 'https://goducks.com/sports/womens-basketball/schedule',
      club: "Oregon Ducks Women's Basketball", opens: 'early November', wiki: { title: "Oregon Ducks women's basketball", teamPage: true } },
    // Eugene Emeralds, High-A Northwest League (Giants affiliate), PK Park — nothing on Ticketmaster, so the home stands are injected from MiLB's schedule
    { slug: 'emeralds', label: 'Emeralds', name: 'Eugene Emeralds', abbr: 'EUG', re: /\bemeralds\b/i, sport: 'baseball', venue: 'PK Park', colors: ['#004b35', '#f4b223'],
      season: { kind: 'mlb', id: 461, sportId: 13 }, form: { kind: 'milb', id: 461, league: 126, leagueName: 'Northwest League' },
      inject: { url: 'https://www.milb.com/eugene/tickets' },
      logo: 'https://www.mlbstatic.com/team-logos/461.svg', schedule: 'https://www.milb.com/eugene/schedule',
      club: 'Eugene Emeralds', opens: 'early April', wiki: { title: 'Eugene Emeralds', club: true },
      news: [['https://www.milb.com/eugene/feeds/news/rss.xml', 'MiLB.com']] },
    // Oregon State Beavers football, Pac-12, Reser Stadium (Corvallis) — Ticketmaster lists the home Saturdays
    { slug: 'beavers', label: 'Beavers', name: 'Oregon State Beavers', abbr: 'ORST', re: /oregon state (beavers )?football|\bbeavers\b(?!.*(basketball|volleyball|softball|soccer|baseball|wrestling|gymnastics))/i, sport: 'football', venue: 'Reser Stadium', colors: ['#dc4405', '#000000'],
      espn: { sport: 'football', league: 'college-football', id: '204' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/204.png', schedule: 'https://osubeavers.com/sports/football/schedule',
      club: 'Oregon State Beavers Football', opens: 'late August', wiki: { title: 'Oregon State Beavers football', teamPage: true } },
    // Oregon State Beavers men's basketball, Pac-12, Gill Coliseum — Ticketmaster lists the home games
    { slug: 'beaversbasketball', label: 'Beavers Basketball', name: 'Oregon State Beavers', abbr: 'ORST', re: /oregon state (beavers )?men'?s basketball|oregon state (beavers )?basketball(?!.*women)/i, sport: 'basketball', venue: 'Gill Coliseum', colors: ['#dc4405', '#000000'],
      espn: { sport: 'basketball', league: 'mens-college-basketball', id: '204' }, season: { kind: 'espn' }, form: { kind: 'espn' },
      logo: 'https://a.espncdn.com/i/teamlogos/ncaa/500/204.png', schedule: 'https://osubeavers.com/sports/mens-basketball/schedule',
      club: "Oregon State Beavers Men's Basketball", opens: 'early November', wiki: { title: "Oregon State Beavers men's basketball", teamPage: true } },
  ];

  // The venues, one record each, by size. Per venue:
  //   capacity how many people the place holds
  //   area     absent = Eugene proper (the campus included); 'town' = beyond
  //            the city — Springfield and Corvallis — the panel's second group
  //   type     the event type when the title decides nothing
  //   cssVar   the hue styles.css sets for it (dark block --v-*); color
  //            the same hue as a value, for the series graph
  //   url      the venue's own events listing — not a ticket vendor
  //   icon     a mark for listings without a team crest
  //   tm       its Ticketmaster Discovery listing (fetch-events.mjs reads
  //            the venue by id — every page; several ids comma-joined read as
  //            one). exclude drops the parking, suites, tours and bundles the
  //            rooms list beside their events; secondary: true makes the
  //            listing a second voice (a show the room's own calendar already
  //            carries that day is not listed twice under Ticketmaster's title)
  //   alias    the other spellings the feeds use for it, folded to this name
  //   feed     the room's own calendar, read by scripts/feeds.mjs (kinds
  //            tribe, cards, localist, ludus, icsfile — see there)
  // Scouted and left out (README "Sources scouted"): The Shedd (its calendar
  // refuses every fetch, nothing on Ticketmaster), Sessions Music Hall and
  // Sam Bond's Garage (sites gone, Ticketmaster empty), Old Nick's and the
  // 5th Street Public Market stage (no listings found), Oregon Contemporary
  // Theatre (behind a WAF), Eugene Cascades & Coast (a Simpleview calendar
  // whose token never left the page), and the Jazz Station's own clocks (its
  // Wix calendar prints none).
  var TM_EXCLUDE = /season tickets?|parking|suite|\btours?\b|ticket packages?|vip (upgrade|package|tailgate)|club (level|seating)|^half price:|\b\d+[- ]day pass|grounds pass|all[- ]session|mini[- ]plan/i;
  var VENUES = {
    // --- Eugene: the arena and the stadium, the Hult, the Kesey rooms, the WOW Hall, the clubs, the campus grounds ---
    'Matthew Knight Arena': { // the Ducks' arena (basketball, volleyball) and the biggest concerts
      geo: [44.04497, -123.06682],
      capacity: 12364,
      type: 'sports',
      cssVar: '--v-knight',
      color: '#ea9386',
      url: 'https://www.matthewknightarena.com/events',
      icon: 'https://www.google.com/s2/favicons?domain=www.matthewknightarena.com&sz=128',
      tm: { id: 'KovZpZAEe1eA', match: 'knight', fallbackUrl: 'https://www.matthewknightarena.com/events', exclude: TM_EXCLUDE },
      alias: /matthew knight|knight arena/i,
    },
    'Autzen Stadium': { // Ducks football
      geo: [44.05593, -123.063],
      capacity: 54000,
      type: 'sports',
      cssVar: '--v-autzen',
      color: '#eab186',
      url: 'https://goducks.com/sports/football/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=goducks.com&sz=128',
      tm: { id: 'KovZpa6Npe', match: 'autzen', fallbackUrl: 'https://goducks.com/sports/football/schedule', exclude: TM_EXCLUDE },
      alias: /autzen/i,
    },
    'PK Park': { // the Emeralds' and the Ducks' ballpark — Ticketmaster lists nothing there, so the Emeralds come from MiLB's schedule (inject) and the Ducks from the GoDucks calendar
      geo: [44.05594, -123.06297],
      capacity: 4000,
      type: 'sports',
      cssVar: '--v-pkpark',
      color: '#eacf86',
      url: 'https://www.milb.com/eugene/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=www.milb.com&sz=128',
      tm: { id: 'KovZpZA1nekA', match: 'pk park', fallbackUrl: 'https://www.milb.com/eugene/schedule', exclude: TM_EXCLUDE },
      alias: /pk park/i,
    },
    'Hult Center': { // the Silva Concert Hall and the Soreng Theater: the symphony, the ballet, the opera, Broadway, comedy — its own listing pages (FEEDS, `linked`), Ticketmaster second
      geo: [44.05249, -123.09322],
      capacity: 2448,
      type: 'arts',
      cssVar: '--v-hult',
      color: '#e6ea86',
      url: 'https://hultcenter.org/events-tickets/',
      icon: 'https://www.google.com/s2/favicons?domain=hultcenter.org&sz=128',
      tm: { id: 'KovZpZA11EnA,ZFr9jZekA1,ZFr9jZekFe', match: '', fallbackUrl: 'https://hultcenter.org/events-tickets/', exclude: TM_EXCLUDE, secondary: true }, // the Hult, the Silva and the Soreng ids; match '' takes whichever name each row carries
      alias: /hult center|silva concert hall|soreng/i,
    },
    'McDonald Theatre': { // Kesey Enterprises' 1925 house on Willamette — its Cascade Tickets listing (`cards`), Ticketmaster second
      geo: [44.04862, -123.09277],
      capacity: 1200,
      type: 'concert',
      cssVar: '--v-mcdonald',
      color: '#c8ea86',
      url: 'https://cascadetickets.com/mcdonald-theatre/',
      icon: 'https://www.google.com/s2/favicons?domain=cascadetickets.com&sz=128',
      tm: { id: 'KovZpZAFl6kA', match: 'mcdonald', fallbackUrl: 'https://cascadetickets.com/mcdonald-theatre/', exclude: TM_EXCLUDE, secondary: true },
      feed: { kind: 'cards', url: 'https://cascadetickets.com/mcdonald-theatre/', item: '<div class = "col-12 eventWrapper rhpSingleEvent', title: /<a id="eventTitle" class="url" href="([^"]+)" title="([^"]*)"/, when: /singleEventDate[^>]*>\s*([^<]+)<[\s\S]*?rhp-event__time-text--list"[^>]*>[\s\S]*?Show:\s*([^<*]+)/, place: /<a class="venueLink"[^>]*title="([^"]*)"/ },
      alias: /mcdonald theat/i,
    },
    'Cuthbert Amphitheater': { // Alton Baker Park's summer shed, Kesey's too — the season runs May to September
      geo: [44.05595, -123.07569],
      capacity: 5000,
      type: 'concert',
      cssVar: '--v-cuthbert',
      color: '#aaea86',
      url: 'https://cascadetickets.com/cuthbert-amphitheater/',
      icon: 'https://www.google.com/s2/favicons?domain=cascadetickets.com&sz=128',
      tm: { id: 'KovZpZAIIEAA', match: 'cuthbert', fallbackUrl: 'https://cascadetickets.com/cuthbert-amphitheater/', exclude: TM_EXCLUDE, secondary: true },
      feed: { kind: 'cards', url: 'https://cascadetickets.com/cuthbert-amphitheater/', item: '<div class = "col-12 eventWrapper rhpSingleEvent', title: /<a id="eventTitle" class="url" href="([^"]+)" title="([^"]*)"/, when: /singleEventDate[^>]*>\s*([^<]+)<[\s\S]*?rhp-event__time-text--list"[^>]*>[\s\S]*?Show:\s*([^<*]+)/, place: /<a class="venueLink"[^>]*title="([^"]*)"/ },
      alias: /cuthbert/i,
    },
    'WOW Hall': { // the Community Center for the Performing Arts, the 1932 Woodmen of the World hall — Ticketmaster lists its shows (its own calendar adds only classes and rentals)
      geo: [44.05121, -123.09706],
      capacity: 800,
      type: 'concert',
      cssVar: '--v-wow',
      color: '#8cea86',
      url: 'https://wowhall.org/calendar/',
      icon: 'https://www.google.com/s2/favicons?domain=wowhall.org&sz=128',
      tm: { id: 'KovZpZA1keEA', match: 'wow', fallbackUrl: 'https://wowhall.org/calendar/', exclude: TM_EXCLUDE },
      alias: /wow hall|community center for the performing arts/i,
    },
    'Lane Events Center': { // the county fairgrounds: the Wheeler Pavilion and the Performance Hall — its own Events Calendar feed (`tribe`) with Ticketmaster for the touring shows
      geo: [44.04381, -123.10729],
      capacity: 7000,
      type: 'community',
      cssVar: '--v-laneevents',
      color: '#86ea9d',
      url: 'https://www.laneeventscenter.org/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.laneeventscenter.org&sz=128',
      tm: { id: 'KovZpZA6elkA,KovZpa27Be', match: '', fallbackUrl: 'https://www.laneeventscenter.org/events/', exclude: TM_EXCLUDE },
      feed: { kind: 'tribe', url: 'https://www.laneeventscenter.org/wp-json/tribe/events/v1/events', drop: /park\s*(&|and)\s*ride|jurassic quest|rv park|office closed/i },
      alias: /lane events center|lane county fair|wheeler pavilion/i,
    },
    'Beall Concert Hall': { // the School of Music and Dance's 1921 hall — UO's Localist calendar, by venue id
      geo: [44.04101, -123.07815],
      capacity: 500,
      type: 'arts',
      cssVar: '--v-beall',
      color: '#86eabb',
      url: 'https://calendar.uoregon.edu/calendar/',
      icon: 'https://www.google.com/s2/favicons?domain=calendar.uoregon.edu&sz=128',
      feed: { kind: 'localist', url: 'https://calendar.uoregon.edu/api/2/events?venue_id=51071&days=365&pp=100', drop: /box office|audition|master ?class|rehearsal|studio class|convocation/i },
      alias: /beall/i,
    },
    'Whirled Pies': { // the downtown pizzeria's stage — its WordPress event posts (fetch-events.mjs parseWhirledPies)
      geo: [44.05114, -123.09564],
      capacity: 300,
      type: 'concert',
      cssVar: '--v-whirled',
      color: '#86ead9',
      url: 'https://whirledpies.com/calendar/',
      icon: 'https://www.google.com/s2/favicons?domain=whirledpies.com&sz=128',
      alias: /whirled pies/i,
    },
    'The Jazz Station': { // the 70-seat nonprofit club on Broadway — its Wix calendar's cards (fetch-events.mjs parseJazzStation; the page prints no clocks)
      geo: [44.0509, -123.0939],
      capacity: 70,
      type: 'concert',
      cssVar: '--v-jazz',
      color: '#86dcea',
      url: 'https://www.thejazzstation.org/calendar',
      icon: 'https://www.google.com/s2/favicons?domain=www.thejazzstation.org&sz=128',
      alias: /jazz station/i,
    },
    'Very Little Theatre': { // the 1929 community theatre — its Ludus box office (`ludus`)
      geo: [44.03406, -123.08254],
      capacity: 300,
      type: 'arts',
      cssVar: '--v-vlt',
      color: '#86beea',
      url: 'https://thevlt.com/',
      icon: 'https://www.google.com/s2/favicons?domain=thevlt.com&sz=128',
      feed: { kind: 'ludus', url: 'https://thevlt.ludus.com/index.php', drop: /^auditions?\b|^volunteer|^workshop|season (pass|ticket)|gift certificate/i },
      alias: /very little theat|\bvlt\b/i,
    },
    'Hayward Field': { // the track — the GoDucks calendar (FEEDS, `icsfile`) lists the meets; Ticketmaster has nothing
      geo: [44.04222, -123.0708],
      capacity: 12650,
      type: 'sports',
      cssVar: '--v-hayward',
      color: '#86a0ea',
      url: 'https://goducks.com/sports/track-and-field/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=goducks.com&sz=128',
      alias: /hayward field/i,
    },
    'Jane Sanders Stadium': { // Ducks softball — the GoDucks calendar
      geo: [44.04068, -123.07335],
      capacity: 2500,
      type: 'sports',
      cssVar: '--v-sanders',
      color: '#8986ea',
      url: 'https://goducks.com/sports/softball/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=goducks.com&sz=128',
      alias: /jane sanders/i,
    },
    'Papé Field': { // Ducks soccer and lacrosse — the GoDucks calendar
      geo: [44.05741, -123.06537],
      capacity: 1500,
      type: 'sports',
      cssVar: '--v-pape',
      color: '#a786ea',
      url: 'https://goducks.com/sports/womens-soccer/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=goducks.com&sz=128',
      alias: /pap[eé] field/i,
    },
    // --- beyond the city: Springfield's theatre, Corvallis and the Beavers ---
    'Wildish Theater': { // Springfield's 1940s cinema turned 280-seat theatre — its own Events Calendar feed (`tribe`), Ticketmaster second
      geo: [44.04635, -123.01827],
      capacity: 280,
      type: 'arts',
      area: 'town',
      cssVar: '--v-wildish',
      color: '#c586ea',
      url: 'https://www.wildishtheater.com/events/',
      icon: 'https://www.google.com/s2/favicons?domain=www.wildishtheater.com&sz=128',
      tm: { id: 'KovZpZA6eJaA', match: 'wildish', fallbackUrl: 'https://www.wildishtheater.com/events/', exclude: TM_EXCLUDE, secondary: true },
      feed: { kind: 'tribe', url: 'https://www.wildishtheater.com/wp-json/tribe/events/v1/events', drop: /rental|audition|private event/i },
      alias: /wildish/i,
    },
    'Reser Stadium': { // Corvallis — Beavers football
      geo: [44.56353, -123.27971],
      capacity: 35548,
      type: 'sports',
      area: 'town',
      cssVar: '--v-reser',
      color: '#e386ea',
      url: 'https://osubeavers.com/sports/football/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=osubeavers.com&sz=128',
      tm: { id: 'KovZpZA1tIkA', match: 'reser', fallbackUrl: 'https://osubeavers.com/sports/football/schedule', exclude: TM_EXCLUDE },
      alias: /reser stadium/i,
    },
    'Gill Coliseum': { // Corvallis — Beavers basketball, volleyball, gymnastics and wrestling
      geo: [44.56395, -123.28154],
      capacity: 9301,
      type: 'sports',
      area: 'town',
      cssVar: '--v-gill',
      color: '#ea86d2',
      url: 'https://osubeavers.com/sports/mens-basketball/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=osubeavers.com&sz=128',
      tm: { id: 'KovZpabpVe', match: 'gill', fallbackUrl: 'https://osubeavers.com/sports/mens-basketball/schedule', exclude: TM_EXCLUDE },
      alias: /gill coliseum/i,
    },
    'LaSells Stewart Center': { // Corvallis — OSU's Austin Auditorium: the touring ballet and the lecture series Ticketmaster carries
      geo: [44.55909, -123.27955],
      capacity: 1200,
      type: 'arts',
      area: 'town',
      cssVar: '--v-lasells',
      color: '#ea86b4',
      url: 'https://lasells.oregonstate.edu/calendar',
      icon: 'https://www.google.com/s2/favicons?domain=lasells.oregonstate.edu&sz=128',
      tm: { id: 'KovZpZAaIEaA', match: 'lasells', fallbackUrl: 'https://lasells.oregonstate.edu/calendar', exclude: TM_EXCLUDE },
      alias: /lasells|austin auditorium/i,
    },
    'Goss Stadium': { // Corvallis — Beavers baseball at Coleman Field: the OSU calendar (`icsfile`, this ground only); Ticketmaster lists nothing there
      geo: [44.56311, -123.27792],
      capacity: 3248,
      type: 'sports',
      area: 'town',
      cssVar: '--v-goss',
      color: '#ea8696',
      url: 'https://osubeavers.com/sports/baseball/schedule',
      icon: 'https://www.google.com/s2/favicons?domain=osubeavers.com&sz=128',
      feed: { kind: 'icsfile', url: 'https://osubeavers.com/calendar.ashx/calendar.ics', rooms: /goss stadium/i, type: 'sports', rename: [[/^\[[A-Z]\]\s*/, ''], [/\s+-\s+(WEAR|BLACKOUT|ORANGE OUT)\b.*$/i, '']] },
      alias: /goss stadium|coleman field/i,
    },
  };

  // City-wide feeds (scripts/feeds.mjs), each pinned to one row by `venue`
  // or folded by LOCATION through the aliases:
  //   the Hult Center's listing pages (six pages of event links whose pages
  //   carry schema.org markup per performance — `linked`), and the GoDucks
  //   calendar (`icsfile`), kept to the grounds Ticketmaster never lists —
  //   Hayward Field, Jane Sanders, Papé Field and PK Park (the arena and
  //   Autzen come from Ticketmaster, with ticket links)
  var HULT = function (n) { return { kind: 'linked', label: 'Hult Center page ' + n, url: n === 1 ? 'https://hultcenter.org/events-tickets/' : 'https://hultcenter.org/events-tickets/page/' + n + '/', match: /hultcenter\.org\/events\/[^/?#]+\/?$/, max: 60, venue: 'Hult Center' }; };
  var FEEDS = [
    HULT(1), HULT(2), HULT(3), HULT(4), HULT(5), HULT(6),
    { kind: 'icsfile', label: 'GoDucks calendar', url: 'https://goducks.com/calendar.ashx/calendar.ics', rooms: /hayward field|jane sanders|pap[eé] field|pk park/i, type: 'sports',
      rename: [[/^\[[A-Z]\]\s*/, ''], [/^Oregon, University of /, 'Oregon '], [/\s+-\s+(WEAR|BLACKOUT|STRIPE|WHITE OUT)\b.*$/i, ''], [/^(Oregon (?:Women's |Men's )?(?:Softball|Baseball|Soccer|Lacrosse|Track (?:&|and) Field|Volleyball|Basketball|Football|Tennis))\s+(?!vs\b)/, '$1 vs ']] }, // the summary runs the sport straight into the opponent
  ];

  // The usual view: every room on
  var DEFAULT_ON = ['Matthew Knight Arena', 'Autzen Stadium', 'PK Park', 'Hult Center', 'McDonald Theatre', 'Cuthbert Amphitheater', 'WOW Hall', 'Lane Events Center', 'Beall Concert Hall', 'Whirled Pies', 'The Jazz Station', 'Very Little Theatre', 'Hayward Field', 'Jane Sanders Stadium', 'Papé Field', 'Wildish Theater', 'Reser Stadium', 'Gill Coliseum', 'LaSells Stewart Center', 'Goss Stadium'];
  var DEFAULT_OFF = [];
  var PREFS_KNOWN_FROM = null; // no default-off venue yet, so nothing for saved prefs to be told about

  // Event types: every event lands in exactly one, from its flags, title,
  // then venue. The rows the panel shows, in order.
  var TYPES = [
    { key: 'concert', label: 'Concerts', title: 'Live music — the arena, the McDonald, the Cuthbert, the WOW Hall, the clubs' },
    { key: 'sports', label: 'Sports', title: 'The Ducks, the Emeralds, the Beavers and the campus grounds' },
    { key: 'arts', label: 'Arts & Theater', title: 'The Hult — the symphony, ballet, opera, Broadway, comedy — Beall Hall, the VLT, the Wildish' },
    { key: 'community', label: 'Community', title: 'The fairgrounds — expos, the county fair, markets, trivia nights' },
  ];
  var MOVIE_VENUE = null; // no cinema here

  // Share codes (?f=CODE): REGISTRY is every filterable key in a fixed
  // order and a code is a bitmask over it, so the list is APPEND-ONLY —
  // adding an entry adds a bit and every existing code keeps meaning what
  // it meant; removing or reordering one changes every link out there.
  // 34 slots from the first build: 7 base-36 digits.
  var CODE_LENGTH = 7;
  var REGISTRY = [
    ['venue', 'Matthew Knight Arena'], ['venue', 'Autzen Stadium'], ['venue', 'PK Park'], ['venue', 'Hult Center'], ['venue', 'McDonald Theatre'], ['venue', 'Cuthbert Amphitheater'], ['venue', 'WOW Hall'], ['venue', 'Lane Events Center'], ['venue', 'Beall Concert Hall'], ['venue', 'Whirled Pies'], ['venue', 'The Jazz Station'], ['venue', 'Very Little Theatre'], ['venue', 'Hayward Field'], ['venue', 'Jane Sanders Stadium'], ['venue', 'Papé Field'], ['venue', 'Wildish Theater'], ['venue', 'Reser Stadium'], ['venue', 'Gill Coliseum'], ['venue', 'LaSells Stewart Center'], ['venue', 'Goss Stadium'],
    ['badge', 'concert'], ['badge', 'sports'], ['badge', 'arts'], ['badge', 'community'],
    ['team', 'ducks'], ['team', 'ducksbasketball'], ['team', 'duckswomens'], ['team', 'emeralds'], ['team', 'beavers'], ['team', 'beaversbasketball'],
    ['cap', 'stadium'], ['cap', 'arena'], ['cap', 'hall'], ['cap', 'room'],
  ];

  // The words the page uses for the place
  var WORDS = {
    teamCity: 'Eugene', // the board drops it from the clubs' names ("Eugene Emeralds" → Emeralds)
    presetDefault: 'Every venue — the arena, Autzen, PK Park, the Hult, the McDonald, the Cuthbert, the WOW Hall, the clubs, the campus grounds, Springfield and Corvallis — every team and type',
    presetNeighborhood: 'Eugene proper only — the arena, Autzen, PK Park, the Hult, the McDonald, the Cuthbert, the WOW Hall, Beall Hall, the clubs and the campus grounds',
    presetBig: 'Only the places that hold 2,000 or more — the arena, Autzen, PK Park, the Hult, the Cuthbert, the fairgrounds, Hayward Field, Reser, Gill',
    phrases: { all: 'Showing everything.', none: 'Showing nothing yet — open Filter and pick some venues.', neighborhood: 'Showing Eugene proper only.', big: 'Showing the big venues only — the arena, Autzen, the Hult, the Cuthbert, the fairgrounds, Reser and Gill.' },
  };

  // Oregon's public holidays (app.js holidaysFor reads this instead of its
  // Seattle list): the federal set without Columbus Day, which Oregon does
  // not observe.
  function nthWeekday(y, month, weekday, n) { var d = new Date(y, month, 1); while (d.getDay() !== weekday) d.setDate(d.getDate() + 1); d.setDate(d.getDate() + (n - 1) * 7); return d; }
  function lastMonday(y, month) { var d = new Date(y, month + 1, 0); while (d.getDay() !== 1) d.setDate(d.getDate() - 1); return d; }
  var HOLIDAYS = function (y) {
    return [
      [new Date(y, 0, 1), "New Year's Day"],
      [nthWeekday(y, 0, 1, 3), 'Martin Luther King Jr. Day'],
      [nthWeekday(y, 1, 1, 3), "Presidents' Day"],
      [lastMonday(y, 4), 'Memorial Day'],
      [new Date(y, 5, 19), 'Juneteenth'],
      [new Date(y, 6, 4), 'Independence Day'],
      [nthWeekday(y, 8, 1, 1), 'Labor Day'],
      [new Date(y, 10, 11), 'Veterans Day'],
      [nthWeekday(y, 10, 4, 4), 'Thanksgiving'],
      [new Date(y, 11, 25), 'Christmas Day'],
    ];
  };

  global.LQACity = {
    key: 'eugene',
    name: 'Eugene',
    site: 'https://eugene.here.events/',
    userAgent: 'Mozilla/5.0 (compatible; eugene-events/1.0; +https://eugene.here.events/)',
    tz: 'America/Los_Angeles', tzName: 'Pacific', // the city's time zone: the ICS feed's TZID, the game clocks, the poster's footer
    state: 'Oregon', stateOutline: null, // no state drawing (the masthead's state strip went away 2026-10-13)
    // the calendar feed's header; the UID domain never changes (changing it
    // re-creates every event in subscribers' calendars)
    ics: { name: 'Eugene Events', short: 'Eugene Events', teams: 'Eugene home teams — every season', prodid: '-//here.events//eugene-events//EN', uidDomain: 'fosdal.net', // the UID domain the whole family issues (the shared ics test pins it)
      desc: 'Upcoming events in Eugene\, OR — Matthew Knight Arena\, Autzen Stadium\, PK Park\, the Hult Center\, the McDonald\, the Cuthbert\, the WOW Hall\, the clubs\, the campus grounds\, Springfield and Corvallis' },
    teams: TEAMS,
    map: { // the Map view (local-map.js; the ground drawn once by scripts/build-local-map.mjs from OpenStreetMap, committed as site/local-map.json) — every city gets one, Steve, 2026-10-26
      kind: 'urban',
      bbox: [43.955, -123.321, 44.643, -122.979], // south, west, north, east — every room, with a margin
      home: [44.028, -123.118, 44.063, -123.052], // the view at first: the city's own rooms; the fit button shows the whole frame
      roads: ['motorway', 'trunk', 'primary'],
      tolerance: 0.8,
      labels: [
        { name: 'Eugene', lat: 44.052, lon: -123.087, anchor: 'middle' },
        { name: 'Springfield', lat: 44.04624, lon: -123.02203, anchor: 'middle' },
        { name: 'Corvallis', lat: 44.56457, lon: -123.26204, anchor: 'middle' },
      ],
    },
    venues: VENUES,
    feeds: FEEDS,
    defaultOn: DEFAULT_ON,
    defaultOff: DEFAULT_OFF,
    prefsKnownFrom: PREFS_KNOWN_FROM,
    types: TYPES,
    movieVenue: MOVIE_VENUE,
    groundsVenue: null, // every listing is read by room (or kept to the rooms named), so nothing arrives under a name city.js lacks
    codeLength: CODE_LENGTH,
    registry: REGISTRY,
    words: WORDS,
    holidays: HOLIDAYS,
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
