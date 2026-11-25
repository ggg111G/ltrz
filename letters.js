// Letter manifest. To swap artwork, drop files into assets/letters/ and
// list them under `art` (first one is the default; tapping cycles through).
// SVG or PNG both work. A letter with an empty `art` list is drawn as a
// coloured glyph until its artwork exists.
// `bg` is optional: a file in assets/bg/ shown behind the letter on its stage.
// `audio` is optional: a recording (e.g. assets/audio/alef.mp3) used instead
// of the browser's text-to-speech.

window.LETTERS = [
  { id: 'alef',   char: 'א', name: 'אָלֶף',  word: 'אַרְיֵה',   emoji: '🦁', color: '#FF8A3D', art: ['alef'], bg: 'alef', bgColor: '#F8BDDC' },
  { id: 'bet',    char: 'ב', name: 'בֵּית',  word: 'בַּרְוָז',   emoji: '🦆', color: '#A98BD0', art: ['bet'], bg: 'bet', bgColor: '#FF8037' },
  { id: 'gimel',  char: 'ג', name: 'גִּימֶל', word: 'גְּלִידָה', emoji: '🍦', color: '#13A08B', art: ['gimel'], bg: 'gimel', bgColor: '#F8BDDC' },
  { id: 'dalet',  char: 'ד', name: 'דָּלֶת',  word: 'דָּג',      emoji: '🐟', color: '#FFD36B', art: ['dalet'], bg: 'dalet', bgColor: '#A98ACF' },
  { id: 'he',     char: 'ה', name: 'הֵא',    word: 'הִיפּוֹפּוֹטָם', emoji: '🦛', color: '#FF8A3D', art: ['he'], bg: 'he', bgColor: '#FECD65' },
  { id: 'vav',    char: 'ו', name: 'וָו',    word: 'וֶרֶד',     emoji: '🌹', color: '#A98BD0', art: ['vav'], bg: 'vav', bgColor: '#A1C8D0' },
  { id: 'zayin',  char: 'ז', name: 'זַיִן',   word: 'זֶבְּרָה',   emoji: '🦓', color: '#F6B8D6', art: ['zayin'], bg: 'zayin', bgColor: '#FECD65' },
  { id: 'het',    char: 'ח', name: 'חֵית',   word: 'חָתוּל',    emoji: '🐱', color: '#FFD36B', art: ['het'], bg: 'het', bgColor: '#F8BDDC' },
  { id: 'tet',    char: 'ט', name: 'טֵית',   word: 'טְרַקְטוֹר', emoji: '🚜', color: '#D6303A', art: ['tet'], bg: 'tet', bgColor: '#0A9B8C' },
  { id: 'yod',    char: 'י', name: 'יוֹד',   word: 'יָרֵחַ',    emoji: '🌙', color: '#9FC4CC', art: ['yod'], bg: 'yod', bgColor: '#FECD65' },
  { id: 'kaf',    char: 'כ', name: 'כַּף',    word: 'כֶּלֶב',    emoji: '🐶', color: '#8E3B46', art: ['kaf'], bg: 'kaf', bgColor: '#FF8037' },
  { id: 'lamed',  char: 'ל', name: 'לָמֶד',   word: 'לִימוֹן',   emoji: '🍋', color: '#13A08B', art: ['lamed'], bg: 'lamed', bgColor: '#9F4F50' },
  { id: 'mem',    char: 'מ', name: 'מֵם',    word: 'מְכוֹנִית',  emoji: '🚗', color: '#FF8A3D', art: ['mem'], bg: 'mem', bgColor: '#A1C8D0' },
  { id: 'nun',    char: 'נ', name: 'נוּן',    word: 'נָמֵר',     emoji: '🐯', color: '#9FC4CC', art: ['nun'], bg: 'nun', bgColor: '#FF8037' },
  { id: 'samekh', char: 'ס', name: 'סָמֶךְ',  word: 'סוּס',      emoji: '🐴', color: '#FFD36B', art: ['samekh'], bg: 'samekh', bgColor: '#0A9B8C' },
  { id: 'ayin',   char: 'ע', name: 'עַיִן',   word: 'עוּגָה',    emoji: '🎂', color: '#A98BD0', art: ['ayin'], bg: 'ayin', bgColor: '#F8BDDC' },
  { id: 'pe',     char: 'פ', name: 'פֵּא',    word: 'פִּיל',     emoji: '🐘', color: '#FF8A3D', art: ['pe'] },
  { id: 'tsadi',  char: 'צ', name: 'צָדִי',   word: 'צָב',       emoji: '🐢', color: '#13A08B', art: [] },
  { id: 'qof',    char: 'ק', name: 'קוֹף',   word: 'קוֹף',      emoji: '🐒', color: '#D6303A', art: [] },
  { id: 'resh',   char: 'ר', name: 'רֵישׁ',   word: 'רַכֶּבֶת',   emoji: '🚂', color: '#A98BD0', art: [] },
  { id: 'shin',   char: 'ש', name: 'שִׁין',   word: 'שֶׁמֶשׁ',    emoji: '☀️', color: '#FFD36B', art: [] },
  { id: 'tav',    char: 'ת', name: 'תָּו',    word: 'תַּפּוּחַ',  emoji: '🍎', color: '#D6303A', art: [] },
];

// Default file extension for entries in `art` / `bg` that don't include one.
window.ART_EXT = 'svg';
