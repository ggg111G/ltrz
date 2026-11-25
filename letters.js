// Letter manifest. To swap artwork, drop files into assets/letters/ and
// list them under `art` (first one is the default; tapping cycles through).
// SVG or PNG both work. A letter with an empty `art` list is drawn as a
// coloured glyph until its artwork exists.
// `bg` is optional: a file in assets/bg/ shown behind the letter on its stage.
// `audio` is optional: a recording (e.g. assets/audio/alef.mp3) used instead
// of the browser's text-to-speech.

window.LETTERS = [
  { id: 'alef',   char: 'א', name: 'אָלֶף',  word: 'אַרְיֵה',   emoji: '🦁', color: '#FF8A3D', art: ['alef-2', 'alef-3'] },
  { id: 'bet',    char: 'ב', name: 'בֵּית',  word: 'בַּרְוָז',   emoji: '🦆', color: '#A98BD0', art: ['bet-2', 'bet-1'] },
  { id: 'gimel',  char: 'ג', name: 'גִּימֶל', word: 'גְּלִידָה', emoji: '🍦', color: '#13A08B', art: ['gimel-2', 'gimel-1'] },
  { id: 'dalet',  char: 'ד', name: 'דָּלֶת',  word: 'דָּג',      emoji: '🐟', color: '#FFD36B', art: ['dalet-2', 'dalet-1'] },
  { id: 'he',     char: 'ה', name: 'הֵא',    word: 'הִיפּוֹפּוֹטָם', emoji: '🦛', color: '#FF8A3D', art: ['he-2', 'he-1'] },
  { id: 'vav',    char: 'ו', name: 'וָו',    word: 'וֶרֶד',     emoji: '🌹', color: '#A98BD0', art: ['vav-2', 'vav-1'] },
  { id: 'zayin',  char: 'ז', name: 'זַיִן',   word: 'זֶבְּרָה',   emoji: '🦓', color: '#F6B8D6', art: ['zayin-2', 'zayin-1'] },
  { id: 'het',    char: 'ח', name: 'חֵית',   word: 'חָתוּל',    emoji: '🐱', color: '#FFD36B', art: ['het-2', 'het-1'] },
  { id: 'tet',    char: 'ט', name: 'טֵית',   word: 'טְרַקְטוֹר', emoji: '🚜', color: '#D6303A', art: ['tet-2', 'tet-1'] },
  { id: 'yod',    char: 'י', name: 'יוֹד',   word: 'יָרֵחַ',    emoji: '🌙', color: '#9FC4CC', art: ['yod-2', 'yod-1'] },
  { id: 'kaf',    char: 'כ', name: 'כַּף',    word: 'כֶּלֶב',    emoji: '🐶', color: '#8E3B46', art: ['kaf-2', 'kaf-1'] },
  { id: 'lamed',  char: 'ל', name: 'לָמֶד',   word: 'לִימוֹן',   emoji: '🍋', color: '#13A08B', art: ['lamed-2', 'lamed-1'] },
  { id: 'mem',    char: 'מ', name: 'מֵם',    word: 'מְכוֹנִית',  emoji: '🚗', color: '#FF8A3D', art: ['mem-2', 'mem-1'] },
  { id: 'nun',    char: 'נ', name: 'נוּן',    word: 'נָמֵר',     emoji: '🐯', color: '#9FC4CC', art: ['nun-2', 'nun-1'] },
  { id: 'samekh', char: 'ס', name: 'סָמֶךְ',  word: 'סוּס',      emoji: '🐴', color: '#FFD36B', art: ['samekh-2', 'samekh-1'] },
  { id: 'ayin',   char: 'ע', name: 'עַיִן',   word: 'עוּגָה',    emoji: '🎂', color: '#A98BD0', art: ['ayin-2', 'ayin-1'] },
  { id: 'pe',     char: 'פ', name: 'פֵּא',    word: 'פִּיל',     emoji: '🐘', color: '#FF8A3D', art: ['pe-2'] },
  { id: 'tsadi',  char: 'צ', name: 'צָדִי',   word: 'צָב',       emoji: '🐢', color: '#13A08B', art: [] },
  { id: 'qof',    char: 'ק', name: 'קוֹף',   word: 'קוֹף',      emoji: '🐒', color: '#D6303A', art: [] },
  { id: 'resh',   char: 'ר', name: 'רֵישׁ',   word: 'רַכֶּבֶת',   emoji: '🚂', color: '#A98BD0', art: [] },
  { id: 'shin',   char: 'ש', name: 'שִׁין',   word: 'שֶׁמֶשׁ',    emoji: '☀️', color: '#FFD36B', art: [] },
  { id: 'tav',    char: 'ת', name: 'תָּו',    word: 'תַּפּוּחַ',  emoji: '🍎', color: '#D6303A', art: [] },
];

// Default file extension for entries in `art` / `bg` that don't include one.
window.ART_EXT = 'png';
