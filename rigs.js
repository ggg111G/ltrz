// How each letter's drawing comes alive.
//
// Numbers are positions of shapes inside the letter's SVG (its direct children,
// counting from 0, in the order Figma exports them). If you re-export a letter
// and its layers change, update the numbers here. A letter without `eyes`
// gets its eyes found automatically (a dark dot sitting inside a light shape).
//
//   eyes:   [[eyeball shapes], [pupil shapes]] for each eye
//   parts:  named shapes the letter moves on its own; `origin` is the pivot
//   mood:   breath = seconds per breath, blink = average seconds between blinks,
//           look = how it watches your finger: 'follow', 'shy' (looks away) or 'own' (each eye its own way)
//           quirk = the little thing it does on its own and when tapped

window.RIGS = {
  alef: {
    eyes: [[[1], [2]], [[3], [4]]],
    parts: { mouth: { el: [5, 6], origin: 'center' } },
    mood: { breath: 2.6, blink: 4, look: 'follow', quirk: 'chatter' },
  },
  bet: {
    eyes: [[[2], [3]], [[4], [5]]],
    parts: { tongue: { el: [1, 6], origin: 'top' } },
    mood: { breath: 2.2, blink: 3.5, look: 'follow', quirk: 'tongue' },
  },
  gimel: {
    eyes: [[[6], [7]]],
    parts: { spikes: { el: [[3], [4], [5]], origin: 'bottom' } },
    mood: { breath: 3, blink: 5, look: 'follow', quirk: 'spikes' },
  },
  dalet: {
    eyes: [[[1], [2]]],
    mood: { breath: 3.4, blink: 6, look: 'follow', quirk: 'wink' },
  },
  he: {
    eyes: [[[14], [15]]],
    parts: { teeth: { el: [[5], [6], [7], [8], [9], [10], [11], [12]], origin: 'center' } },
    mood: { breath: 1.6, blink: 1.8, look: 'shy', quirk: 'nervous' },
  },
  vav: {
    eyes: [[[1, 2, 3], [24, 25, 26]], [[21, 22, 23], [27, 28, 29]]],
    mood: { breath: 3.2, blink: 4, look: 'follow', quirk: 'sway' },
  },
  zayin: {
    eyes: [],
    parts: { brow: { el: [1], origin: 'center' }, tongue: { el: [2, 3], origin: 'top' } },
    mood: { breath: 2.4, look: 'follow', quirk: 'lick' },
  },
  het: {
    eyes: [],
    parts: { lashes: { el: [[1], [2], [3], [4], [5], [6], [7], [8]], origin: 'bottom' }, lid: { el: [9], origin: 'center' } },
    mood: { breath: 4.5, look: 'follow', quirk: 'sleepy' },
  },
  tet: {
    eyes: [],
    parts: { brows: { el: [[1, 2], [3, 4]], origin: 'center' }, nose: { el: [5], origin: 'top' }, horn: { el: [6], origin: 'bottom' } },
    mood: { breath: 2, look: 'follow', quirk: 'grumpy' },
  },
  yod: {
    eyes: [[[1], [2]]],
    parts: { beak: { el: [3, 4, 5, 6], origin: 'left' } },
    mood: { breath: 1.4, blink: 3, look: 'follow', quirk: 'chomp' },
  },
  kaf: {
    eyes: [[[2, 3, 4], [5]]],
    parts: { dots: { el: [[6], [7], [8], [9], [10], [11], [12], [13], [14], [15], [16], [17]], origin: 'center' } },
    mood: { breath: 3, blink: 4, look: 'follow', quirk: 'twinkle' },
  },
  lamed: {
    eyes: [[[2], [3]]],
    parts: { beak: { el: [1], origin: 'right' }, wing: { el: [4], origin: 'top' } },
    mood: { breath: 2, blink: 3, look: 'follow', quirk: 'tweet' },
  },
  mem: {
    eyes: [[[1], [2]], [[5], [6]]],
    parts: { mouth: { el: [3, 4], origin: 'bottom' }, nose: { el: [7, 8], origin: 'center' } },
    mood: { breath: 2.8, blink: 3, look: 'own', quirk: 'sniff' },
  },
  nun: {
    eyes: [[[1], [3]], [[2], [4]]],
    parts: { lips: { el: [5, 6, 7, 8], origin: 'center' } },
    mood: { breath: 2.6, blink: 3.5, look: 'follow', quirk: 'kiss' },
  },
  samekh: {
    eyes: [[[5], [8]], [[6], [7]], [[3], [9]], [[4], [10]]],
    mood: { breath: 3, blink: 2, look: 'own', quirk: 'spin-eyes' },
  },
  ayin: {
    eyes: [[[1], [2]], [[3], [4]]],
    parts: { stalks: { el: [[5, 6, 7, 8, 9, 10, 11], [12]], origin: 'bottom' } },
    mood: { breath: 2.4, blink: 3, look: 'own', quirk: 'stalks' },
  },
  pe: {
    eyes: [[[8], [9]]],
    parts: { hat: { el: [5, 6, 7], origin: 'bottom' }, tail: { el: [2, 3, 4], origin: 'left' } },
    mood: { breath: 2, blink: 3.5, look: 'follow', quirk: 'party' },
  },
};

// Letters that are not drawn yet get googly eyes and one of these moods.
window.DEFAULT_MOOD = { breath: 2.6, blink: 3.5, look: 'follow', quirk: 'bounce' };

// How each background moves. Numbers are positions of shapes in the background SVG
// (inside its clipping group when Figma exported one). A list of lists animates each
// inner list as its own piece, one after another (`stagger` seconds apart).
//
//   a: drift (side to side), bob (up and down), sway (rock), skew (wave like cloth),
//      pulse (grow and shrink), glow, twinkle, blink, flicker, pop (jump up), light (switch on and off),
//      look (pupil looks around), snow (falling flakes, drawn by the app)
//   amp: how far / how much, dur: seconds per cycle, origin: pivot point

window.BG_RIGS = {
  // אור – the sun glows, its ray-arc shines, clouds float by
  alef: [
    { el: [11, 12, 13, 14, 15, 17, 18, 22, 23], a: 'glow', dur: 3 },
    { el: [8, 10], a: 'light', amp: 1.25, dur: 3 },
    { el: [[5, 7], [19, 21]], a: 'drift', amp: 24, dur: 9, stagger: 2.5 },
  ],
  // בית – lights go on and off in the windows, the door creaks open
  bet: [
    { el: [[8, 9], [5, 13], [2, 14], [3, 10], [6, 11], [15, 17], [16, 18], [7, 19], [4, 20]], a: 'light', amp: 1.35, dur: 5, stagger: 1.3, random: true },
    { el: [1], a: 'door', amp: 0.75, dur: 6, origin: 'left' },
    { el: [25], a: 'pulse', amp: 1.2, dur: 2 },
  ],
  // גינה – flowers spin in the hedge, the hedge tops bob
  gimel: [
    { el: [[12, 14, 15, 17, 18, 20, 21, 23, 24, 25], [26, 28, 29, 31, 32, 34, 35, 37, 38, 39]], a: 'spin', dur: 8, stagger: 1 },
    { el: [[7], [5], [8], [6], [9]], a: 'bob', amp: 6, dur: 2.4, stagger: 0.3 },
  ],
  // דרך – lights run along the road
  dalet: [
    { el: [[5], [6], [7]], a: 'light', amp: 1.4, dur: 2.4, stagger: 0.8 },
  ],
  // הר – snow falls on the mountain
  he: [
    { a: 'snow', n: 26 },
    { el: [7], a: 'bob', amp: 3, dur: 5 },
  ],
  // וילון – the curtains sway in a breeze
  vav: [
    { el: [[2], [3, 13], [4, 14, 15]], a: 'skew', amp: 3, dur: 4, stagger: 0.6, origin: 'top' },
    { el: [[12], [11], [10], [9]], a: 'bob', amp: 4, dur: 4, stagger: 0.4 },
  ],
  // זיגזג – the zigzag tiles flip in a wave, the bars slide
  zayin: [
    { el: [[15], [12], [11], [35], [29], [23], [19], [27], [22], [18], [38], [13], [16], [36], [31], [28], [37], [20], [24], [39], [40], [33], [30], [14], [17], [42], [41], [32], [34], [26], [25], [21]], a: 'flip', dur: 4, stagger: 0.12 },
    { el: [[7], [9], [8], [10]], a: 'drift', amp: 14, dur: 3, stagger: 0.75 },
  ],
  // חישוק – the hoops wobble round and round
  het: [
    { el: [[42, 43, 44, 45, 46], [37, 38, 39, 40, 41], [32, 33, 34, 35, 36], [27, 28, 29, 30, 31], [24, 25], [19, 20, 21, 22, 23], [13, 14, 15, 16, 17], [8, 9, 10, 11, 12], [1, 2, 3, 4, 5]], a: 'sway', amp: 7, dur: 3, stagger: 0.25 },
  ],
  // טוסט – the toast pops up, the steam puffs
  tet: [
    { el: [5, 7, 8, 9, 10, 11], a: 'pop', amp: 60, dur: 4 },
    { el: [12, 14], a: 'pulse', amp: 1.05, dur: 2.5 },
    { el: [4], a: 'rise', amp: 40, dur: 3 },
  ],
  // יד – the fingers wiggle, the hand waves
  yod: [
    { el: [[7], [6], [8]], a: 'bob', amp: 14, dur: 1.6, stagger: 0.25 },
    { el: [5], a: 'sway', amp: 4, dur: 3, origin: 'bottom' },
  ],
  // כלנית – the flower nods, its petals turn, the leaves flap
  kaf: [
    { el: [12], a: 'pulse', amp: 1.12, dur: 2 },
    { el: [8, 9, 10, 11, 12], a: 'sway', amp: 10, dur: 4 },
    { el: [[1], [2]], a: 'sway', amp: 8, dur: 2.5, stagger: 0.6, origin: 'bottom' },
  ],
  // לילה – the stars twinkle, the moon glows, clouds drift
  lamed: [
    { el: [[1, 2], [5, 6], [10, 11], [12, 13], [14, 15], [16, 17], [18, 19], [20, 21], [22, 23], [24, 25], [26, 27], [28, 29], [30, 31], [32, 33]], a: 'twinkle', dur: 2.2, stagger: 0.37, random: true },
    { el: [38, 39, 41], a: 'glow', dur: 4 },
    { el: [[42], [43]], a: 'drift', amp: 30, dur: 10, stagger: 3 },
  ],
  // מטוס – the planes fly and puff smoke
  mem: [
    { el: [[18], [17], [16], [15], [14], [13]], a: 'puff', dur: 1.6, stagger: 0.18 },
    { el: [[37], [36], [35], [34], [33], [32]], a: 'puff', dur: 1.6, stagger: 0.18 },
    { el: [[30], [29], [28], [27], [26], [25]], a: 'puff', dur: 1.6, stagger: 0.18 },
    { el: [[12], [11], [10], [9], [8], [6]], a: 'puff', dur: 1.6, stagger: 0.18 },
    { el: [5, 7, 19, 20, 21, 22, 23, 24, 31, 38, 39, 41, 42, 43], a: 'bob', amp: 6, dur: 3 },
  ],
  // נר – the flame flickers and glows
  nun: [
    { el: [8, 9, 10, 11], a: 'flicker', dur: 1.1, origin: 'bottom' },
    { el: [8, 9], a: 'glow', dur: 1.6 },
  ],
  // סכו״ם – the knife saws, the fork wiggles
  samekh: [
    { el: [9], a: 'bob', amp: 16, dur: 1.2 },
    { el: [7, 8], a: 'sway', amp: 6, dur: 2, origin: 'bottom' },
    { el: [6], a: 'bob', amp: 8, dur: 2.4 },
  ],
  // עין – the big eye looks around and blinks; its rays pulse
  ayin: [
    { el: [8, 9], a: 'look', amp: 60, dur: 7 },
    { el: [7, 8, 9], a: 'blink', dur: 4.5 },
    { el: [[1], [3], [4]], a: 'light', amp: 1.15, dur: 2.5, stagger: 0.5 },
  ],
};
