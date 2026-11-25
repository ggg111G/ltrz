# Letterz · אותיות

A playful toy for little kids: Hebrew letters that come alive.

- **Home** – all the letters bob around. Tap one: it plays a note and jumps onto its own stage.
- **Stage** – tap the letter for a trick (jump, spin, squish, wiggle…), sparkles, its name and a word (🦁 אריה).
  Tap 3 times fast for a costume change (next artwork variant). Drag it and let go: it springs back.
  Tap the background for sparkles. Swipe or use the arrows for the next letter.
- **🔎 איפה?** – a voice asks for a letter, pick it out of three. Stars for right answers.

No build step: open `index.html`, or serve the folder (`npx serve .`) and open it on a tablet/phone.
Sound + speech start after the first tap. Speech uses the device's Hebrew text‑to‑speech voice
(iPad/iPhone have one built in).

## Swapping artwork

Everything is driven by [`letters.js`](letters.js).

- Letter art lives in `assets/letters/` as `<id>-<variant>.png` (or `.svg`). List the files in a letter's `art` array;
  the first is the default and the rest are the costume changes.
- A letter with an empty `art` list (צ ק ר ש ת right now) is drawn as a coloured glyph until you add artwork.
- Per‑letter backgrounds: put a file in `assets/bg/` and set `bg: 'alef'` on the letter.
- Your own voice: add `audio: 'assets/audio/alef.mp3'` to a letter and it plays instead of text‑to‑speech.

To export from Figma: select the letters component set (and the `bg` set), add an **SVG** export, export,
rename the files to the ids above (e.g. `Property 1=א, op=2.svg` → `alef-2.svg`), and set `ART_EXT = 'svg'`.
