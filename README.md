# Letterz · אותיות

A playful toy for little kids: Hebrew letters that come alive.

Every letter is a little character drawn in Figma and brought to life in code:
its eyes follow your finger and blink, it breathes, and now and then it does its own thing
(ב waggles its tongue, ח snores, ט huffs, י chomps, ס's four eyes look every which way…).

- **Home** – all the letters, alive. Tap one and it reacts, then jumps onto its own stage.
- **Stage** – one big letter on its own background. Tap it to make it react, drag it and let go to watch it spring back,
  tap the background and it looks there. Swipe or use the arrows for the next letter.

- **📖 Story** – *אלף והניצוץ*, a bedtime story: a little spark from the sun travels from letter to letter, through
  each letter's place, until it goes back to the sky as a star. One page per letter; the text is in [`story.js`](story.js).

No build step, but it loads the SVGs with `fetch`, so serve the folder (`npx serve .`) rather than opening the file directly.

## How the letters move

[`rigs.js`](rigs.js) says which shapes in each SVG are eyes, pupils and moving parts, and gives each letter a mood
(breathing speed, how often it blinks, how it watches you, and its quirk). The quirks themselves are in `app.js` (`QUIRKS`).
Letters without a rig get their eyes found automatically; letters with no artwork yet get googly eyes.

Each background is built around a word starting with its letter (א אור, ב בית, ג גינה, ד דרך, ה הר, ו וילון, ז זיגזג,
ח חישוק, ט טוסט, י יד, כ כלנית, ל לילה, מ מטוס, נ נר, ס סכו״ם, ע עין) and moves with it: the sun glows, the windows light up,
snow falls on the mountain, the curtains sway, the candle flickers, the eye looks around. That is `BG_RIGS` in `rigs.js`.

## Swapping artwork

Everything is driven by [`letters.js`](letters.js).

- Letter art lives in `assets/letters/` as `<id>-<variant>.png` (or `.svg`). List the files in a letter's `art` array;
  the first is the default and the rest are the costume changes.
- A letter with an empty `art` list (צ ק ר ש ת right now) is drawn as a coloured glyph until you add artwork.
- Per‑letter backgrounds: put a file in `assets/bg/` and set `bg: 'alef'` on the letter.

To export from Figma: select the letters component set (and the `bg` set), add an **SVG** export, export,
rename the files to the ids above (e.g. `Property 1=א, op=2.svg` → `alef-2.svg`), and set `ART_EXT = 'svg'`.
