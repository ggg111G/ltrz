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
