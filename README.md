# Eugene Events

Event feed and calendar for Eugene, Oregon: Matthew Knight Arena, Autzen
Stadium and PK Park, the Hult Center (the Silva and the Soreng), the McDonald
Theatre and the Cuthbert Amphitheater, the WOW Hall, Lane Events Center, Beall
Concert Hall, Whirled Pies, the Jazz Station and the Very Little Theatre, the
campus grounds (Hayward Field, Jane Sanders Stadium, Papé Field), with
Springfield's Wildish Theater and Corvallis (Reser Stadium, Gill Coliseum, the
LaSells Stewart Center, Goss Stadium) as the "Springfield, Corvallis & Beyond"
group — and the home teams' seasons (Ducks football, men's and women's
basketball, the Emeralds, Beavers football and basketball) in a Teams view.

Live at **https://eugene.here.events/** (GitHub Pages, built by the Actions
workflow once a day at noon Pacific).

Built 2026-10-17 on the family's city pattern. Everything that makes this
Eugene's is `site/city.js` (every team, venue, type, default, share-code
registry, holiday and string), `site/index.html`, `scripts/fetch-events.mjs`
(the sources, with the Whirled Pies and Jazz Station parsers), `site/embed.js`,
`outlook.json`, `scripts/data/postseason.json`, `channels.json`, the manifest
and icons. Everything else — `app.js`, `filter.js`, `styles.css` bar its
`--v-*` hue lines, the shared `scripts/*.mjs` and their tests — is lqa-events'
own, byte for byte, copied in by `sync-shared.sh` from the lqa-events project.

## Sources

- **Ticketmaster Discovery API** — the rooms Ticketmaster lists, each by its
  venue id (every page; the Hult reads three ids and Lane Events Center two).
  Parking, suites, tours, VIP upgrades and season bundles are dropped per room
  (`tm.exclude`). Church events are left out (`isChurch`). Where a room's own
  calendar is the voice of record (the Hult, the McDonald, the Cuthbert, the
  Wildish — `tm.secondary`), Ticketmaster only fills the dates that calendar
  lacks. PK Park lists nothing there, so the Emeralds' home stands are
  injected from MiLB's schedule (city.js `inject`).
- **The Hult Center** — its listing pages (six), each show's page carrying
  schema.org markup per performance (`scripts/feeds.mjs` kind `linked`),
  pinned to the Hult row.
- **Cascade Tickets** — the McDonald's and the Cuthbert's listings on Kesey
  Enterprises' box-office site (kind `cards`: date and the show clock, not the
  doors).
- **Lane Events Center** and **the Wildish Theater** — their Events Calendar
  REST feeds (kind `tribe`); the fairgrounds' park-and-ride and RV-park rows
  are dropped.
- **Beall Concert Hall** — UO's Localist calendar by venue id (kind
  `localist`, added for this city); auditions, master classes and box-office
  rows dropped.
- **The Very Little Theatre** — its Ludus box office (kind `ludus`, added for
  this city, fetched through `scripts/cffi-fetch.py` because Ludus sits behind
  Cloudflare); past performances skipped, sold-out ones tagged.
- **GoDucks and OSU calendars** — the athletics departments' season iCalendars
  (kind `icsfile`), kept to the grounds Ticketmaster never lists: Hayward
  Field, Jane Sanders Stadium, Papé Field and PK Park for the Ducks, Goss
  Stadium for the Beavers.
- **Whirled Pies** — the pizzeria's WordPress event posts, the date leading
  each title (`parseWhirledPies` in fetch-events.mjs); the weekly open mics
  carry no date and are left out.
- **The Jazz Station** — the show cards of its Wix home page
  (`parseJazzStation`): the date is in each card's link, the page prints no
  clocks, a SOLD OUT button tags the row.
- **Seasons** — ESPN for the Ducks and the Beavers, MLB's Stats API (High-A,
  sportId 13) for the Emeralds (`scripts/schedules.mjs`).

## Build

```
cp .env.example .env   # TICKETMASTER_API_KEY=… (a free Discovery key)
ALLOW_NO_ARCHIVE=1 node scripts/fetch-events.mjs   # writes site/events.json, the .ics feeds, teams.json
node --test scripts/*.test.mjs
python3 -m http.server 8000 --directory site
```

`ALLOW_NO_ARCHIVE=1` is only for the first build, before the `events-archive`
branch exists; in CI the workflow sets it as a repository variable until the
first run has pushed the archive, then it is deleted.

## Sister sites

lqa-events (Seattle Center) is the source of truth for the shared files. See
its README for the pipeline, the share codes and the Teams view.
