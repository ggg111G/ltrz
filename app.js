(() => {
  const L = window.LETTERS;
  const EXT = window.ART_EXT || 'png';
  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const PALETTE = ['#FF8A3D', '#D6303A', '#13A08B', '#FFD36B', '#A98BD0', '#9FC4CC', '#F3A9CC', '#fff'];

  const artPath = (f) => 'assets/letters/' + (/\.\w+$/.test(f) ? f : f + '.' + EXT);
  const bgPath = (f) => 'assets/bg/' + (/\.\w+$/.test(f) ? f : f + '.' + EXT);

  function letterEl(letter, variant = 0) {
    if (letter.art && letter.art.length) {
      const img = new Image();
      img.src = artPath(letter.art[variant % letter.art.length]);
      img.alt = letter.char;
      img.draggable = false;
      return img;
    }
    const span = document.createElement('span');
    span.className = 'glyph';
    span.textContent = letter.char;
    span.style.setProperty('--c', letter.color);
    return span;
  }

  // ---------------------------------------------------------------- sound
  let ac;
  function audio() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, { type = 'sine', dur = 0.25, vol = 0.25, slide = 0, delay = 0 } = {}) {
    const a = audio(), t = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  // each letter gets its own note on a pentatonic scale -> the grid is a xylophone
  const PENTA = [0, 2, 4, 7, 9];
  const noteFor = (i) => 330 * Math.pow(2, (PENTA[i % 5] + 12 * (Math.floor(i / 5) % 3)) / 12);
  const sfx = {
    note: (i) => { tone(noteFor(i), { type: 'triangle', dur: 0.5, vol: 0.3 }); tone(noteFor(i) * 2, { dur: 0.3, vol: 0.06 }); },
    boing: () => tone(180, { type: 'sine', dur: 0.45, slide: 3.2, vol: 0.3 }),
    pop: () => tone(700, { type: 'square', dur: 0.08, slide: 0.4, vol: 0.12 }),
    whoosh: () => tone(900, { type: 'sawtooth', dur: 0.3, slide: 0.25, vol: 0.05 }),
    squeak: () => { tone(1200, { dur: 0.12, slide: 1.6, vol: 0.15 }); tone(1500, { dur: 0.1, slide: 1.4, vol: 0.12, delay: 0.12 }); },
    yay: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, { type: 'triangle', dur: 0.3, vol: 0.22, delay: i * 0.09 })),
    nope: () => { tone(300, { type: 'triangle', dur: 0.18, vol: 0.2 }); tone(240, { type: 'triangle', dur: 0.25, vol: 0.2, delay: 0.16 }); },
  };

  // ---------------------------------------------------------------- voice
  let heVoice = null;
  function loadVoices() {
    const vs = speechSynthesis.getVoices();
    heVoice = vs.find((v) => /^he|^iw/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  let currentAudio;
  function say(text, recording) {
    if (recording) {
      if (currentAudio) currentAudio.pause();
      currentAudio = new Audio(recording);
      currentAudio.play().catch(() => speak(text));
      return;
    }
    speak(text);
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'he-IL';
    if (heVoice) u.voice = heVoice;
    u.rate = 0.85; u.pitch = 1.25;
    speechSynthesis.speak(u);
  }

  // ---------------------------------------------------------------- sky
  (function buildSky() {
    const sky = $('#sky');
    sky.innerHTML = '<div class="sun"></div><div class="hills"></div>';
    for (let i = 0; i < 4; i++) {
      const c = document.createElement('div');
      c.className = 'cloud';
      c.style.top = rand(8, 70) + '%';
      c.style.width = rand(90, 160) + 'px';
      c.style.animationDuration = rand(28, 50) + 's';
      c.style.animationDelay = -rand(0, 40) + 's';
      sky.appendChild(c);
    }
  })();

  // ---------------------------------------------------------------- screens
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    if (id !== 'stage') clearTimeout(idleTimer);
  }
  document.querySelectorAll('[data-go]').forEach((b) =>
    b.addEventListener('click', () => { sfx.pop(); show(b.dataset.go); }));

  // ---------------------------------------------------------------- home grid
  const grid = $('#grid');
  L.forEach((letter, i) => {
    const b = document.createElement('button');
    b.className = 'tile';
    b.style.animationDelay = -(i * 0.23) + 's';
    b.setAttribute('aria-label', letter.name);
    const art = document.createElement('div');
    art.className = 'art';
    art.appendChild(letterEl(letter));
    b.appendChild(art);
    b.addEventListener('click', () => {
      sfx.note(i);
      art.animate([
        { transform: 'scale(1)' }, { transform: 'scale(1.25, .8)' }, { transform: 'scale(.85, 1.2) translateY(-18px)' }, { transform: 'scale(1)' },
      ], { duration: 380, easing: 'ease-out' });
      setTimeout(() => openStage(i), 330);
    });
    grid.appendChild(b);
  });

  // ---------------------------------------------------------------- stage
  const hero = $('#hero'), inner = hero.querySelector('.hero-inner'), fx = $('#fx');
  let idx = 0, variant = 0, idleTimer;

  function bgFor(letter) {
    const bgEl = $('#stageBg');
    bgEl.innerHTML = '';
    if (letter.bg) {
      bgEl.style.background = `url("${bgPath(letter.bg)}") center/cover no-repeat`;
      return;
    }
    const c = letter.color;
    bgEl.style.background = `radial-gradient(circle at 50% 40%, #fff8 0 18%, transparent 60%), linear-gradient(180deg, #FBE3EE 0%, ${c}66 60%, ${c} 100%)`;
    for (let k = 0; k < 7; k++) {
      const d = document.createElement('div');
      d.className = 'deco';
      const s = rand(40, 160);
      Object.assign(d.style, {
        width: s + 'px', height: s + 'px', left: rand(-5, 90) + '%', top: rand(-5, 85) + '%',
        background: pick(PALETTE), animationDelay: -rand(0, 7) + 's', animationDuration: rand(5, 9) + 's',
        borderRadius: pick(['50%', '30%', '50% 50% 0 0', '0']),
      });
      bgEl.appendChild(d);
    }
  }

  function renderHero(animIn = true) {
    const letter = L[idx];
    inner.innerHTML = '';
    inner.appendChild(letterEl(letter, variant));
    inner.classList.add('breathe');
    if (animIn) {
      inner.animate([
        { transform: 'translateY(-120vh) scale(.6, 1.4)' },
        { transform: 'translateY(0) scale(1.35, .65)', offset: 0.6 },
        { transform: 'translateY(-40px) scale(.9, 1.1)', offset: 0.8 },
        { transform: 'translateY(0) scale(1)' },
      ], { duration: 750, easing: 'ease-in' });
      setTimeout(sfx.boing, 420);
    }
  }

  function setCaption(withWord) {
    const letter = L[idx], cap = $('#caption');
    cap.innerHTML = `${letter.name}${withWord ? `<span class="word">${letter.emoji} ${letter.word}</span>` : ''}`;
    cap.classList.remove('pop'); void cap.offsetWidth; cap.classList.add('pop');
  }

  function openStage(i) {
    idx = (i + L.length) % L.length; variant = 0;
    show('stage');
    bgFor(L[idx]);
    renderHero(true);
    setCaption(false);
    setTimeout(() => say(L[idx].name, L[idx].audio), 650);
    scheduleIdle();
  }
  $('#nextBtn').addEventListener('click', () => { sfx.whoosh(); openStage(idx + 1); });
  $('#prevBtn').addEventListener('click', () => { sfx.whoosh(); openStage(idx - 1); });

  // the letter's bag of tricks
  const TRICKS = [
    () => [{ transform: 'none' }, { transform: 'translateY(0) scale(1.3,.7)', offset: .15 }, { transform: 'translateY(-38vh) scale(.85,1.15)', offset: .5 }, { transform: 'translateY(0) scale(1.3,.7)', offset: .85 }, { transform: 'none' }],
    () => [{ transform: 'rotate(0)' }, { transform: 'translateY(-15vh) rotate(180deg) scale(1.1)', offset: .5 }, { transform: 'rotate(360deg)' }],
    () => [0, -14, 12, -10, 8, -5, 3, 0].map((r) => ({ transform: `rotate(${r}deg)` })),
    () => [{ transform: 'scale(1)' }, { transform: 'scale(1.6,.45)', offset: .3 }, { transform: 'scale(.7,1.5)', offset: .6 }, { transform: 'scale(1.1,.9)', offset: .8 }, { transform: 'scale(1)' }],
    () => [{ transform: 'scale(1)' }, { transform: 'scale(1.45)', offset: .4 }, { transform: 'scale(.9)', offset: .75 }, { transform: 'scale(1)' }],
    () => [{ transform: 'scaleX(1)' }, { transform: 'scaleX(-1)', offset: .5 }, { transform: 'scaleX(1)' }],
    () => [0, 1, 2, 3, 4, 5, 6].map((k) => ({ transform: `translateX(${k % 2 ? 22 : -22}px) skewX(${k % 2 ? 8 : -8}deg)` })).concat([{ transform: 'none' }]),
  ];
  const TRICK_SOUND = [sfx.boing, sfx.whoosh, sfx.squeak, sfx.boing, sfx.pop, sfx.whoosh, sfx.squeak];
  let lastTrick = -1, taps = 0, tapReset;

  function doTrick() {
    let t; do { t = Math.floor(Math.random() * TRICKS.length); } while (t === lastTrick);
    lastTrick = t;
    inner.classList.remove('breathe');
    const a = inner.animate(TRICKS[t](), { duration: 800, easing: 'cubic-bezier(.3,1.4,.5,1)' });
    a.onfinish = () => inner.classList.add('breathe');
    TRICK_SOUND[t]();
  }

  function burst(x, y, n = 18, host = fx) {
    for (let k = 0; k < n; k++) {
      const b = document.createElement('div');
      b.className = 'bit';
      const s = rand(10, 24);
      Object.assign(b.style, {
        width: s + 'px', height: s + 'px', background: pick(PALETTE),
        borderRadius: pick(['50%', '3px', '50% 0']),
      });
      host.appendChild(b);
      const ang = rand(0, Math.PI * 2), dist = rand(80, 260);
      const dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist;
      b.animate([
        { transform: `translate(${x}px, ${y}px) scale(.2) rotate(0)`, opacity: 1 },
        { transform: `translate(${x + dx}px, ${y + dy}px) scale(1) rotate(${rand(-360, 360)}deg)`, opacity: 1, offset: .7 },
        { transform: `translate(${x + dx * 1.1}px, ${y + dy + 120}px) scale(.6) rotate(${rand(-540, 540)}deg)`, opacity: 0 },
      ], { duration: rand(800, 1300), easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => b.remove();
    }
  }

  function emojiPop(letter) {
    const e = document.createElement('div');
    e.className = 'emoji-pop';
    e.textContent = letter.emoji;
    const r = hero.getBoundingClientRect();
    const x = r.left + r.width * rand(0.1, 0.9) - 36, y = r.top + r.height * 0.3;
    fx.appendChild(e);
    e.animate([
      { transform: `translate(${x}px, ${y}px) scale(.2)`, opacity: 0 },
      { transform: `translate(${x}px, ${y - 120}px) scale(1.3) rotate(-10deg)`, opacity: 1, offset: .35 },
      { transform: `translate(${x + rand(-60, 60)}px, ${y - 320}px) scale(1) rotate(10deg)`, opacity: 0 },
    ], { duration: 1800, easing: 'ease-out' }).onfinish = () => e.remove();
  }

  // tap = trick + name; 3 quick taps = costume change (next art variant)
  function heroTap(cx, cy) {
    const letter = L[idx];
    taps++; clearTimeout(tapReset); tapReset = setTimeout(() => (taps = 0), 700);
    if (taps >= 3 && letter.art.length > 1) {
      taps = 0; variant++;
      sfx.yay();
      burst(cx, cy, 34);
      inner.animate([{ transform: 'scale(1)' }, { transform: 'scale(0) rotate(200deg)' }], { duration: 220 }).onfinish = () => {
        renderHero(false);
        inner.animate([{ transform: 'scale(0) rotate(-200deg)' }, { transform: 'scale(1.2)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(.3,1.6,.5,1)' });
      };
      return;
    }
    doTrick();
    burst(cx, cy);
    emojiPop(letter);
    setCaption(true);
    say(`${letter.name}. ${letter.word}`, letter.audio);
    scheduleIdle();
  }

  // drag the letter around; it springs home when let go
  let drag = null;
  hero.addEventListener('pointerdown', (e) => {
    hero.setPointerCapture(e.pointerId);
    drag = { x0: e.clientX, y0: e.clientY, x: 0, y: 0, vx: 0, lastX: e.clientX, moved: false };
  });
  hero.addEventListener('pointermove', (e) => {
    if (!drag) return;
    drag.x = e.clientX - drag.x0; drag.y = e.clientY - drag.y0;
    drag.vx = e.clientX - drag.lastX; drag.lastX = e.clientX;
    if (Math.hypot(drag.x, drag.y) > 12) {
      if (!drag.moved) { drag.moved = true; inner.classList.remove('breathe'); sfx.squeak(); }
      const tilt = Math.max(-30, Math.min(30, drag.vx * 2));
      hero.style.transform = `translate(${drag.x}px, ${drag.y}px) rotate(${tilt}deg) scale(1.08)`;
    }
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { heroTap(e.clientX, e.clientY); return; }
    const from = hero.style.transform;
    hero.style.transform = '';
    sfx.boing();
    hero.animate([
      { transform: from },
      { transform: `translate(${-d.x * 0.18}px, ${-d.y * 0.18}px) rotate(${-d.vx}deg) scale(.95,1.05)`, offset: .55 },
      { transform: `translate(${d.x * 0.05}px, ${d.y * 0.05}px) scale(1.04,.96)`, offset: .8 },
      { transform: 'none' },
    ], { duration: 700, easing: 'cubic-bezier(.3,1.2,.5,1)' }).onfinish = () => inner.classList.add('breathe');
    scheduleIdle();
  };
  hero.addEventListener('pointerup', endDrag);
  hero.addEventListener('pointercancel', endDrag);

  // tapping the sky makes sparkles
  $('#stage').addEventListener('pointerdown', (e) => {
    if (e.target.closest('#hero, .round')) return;
    burst(e.clientX, e.clientY, 10);
    sfx.note(Math.floor(rand(0, 12)));
  });

  // swipe to change letter (RTL: swipe right -> next)
  let sw = null;
  $('#stage').addEventListener('touchstart', (e) => { if (!e.target.closest('#hero')) sw = e.touches[0].clientX; }, { passive: true });
  $('#stage').addEventListener('touchend', (e) => {
    if (sw == null) return;
    const dx = e.changedTouches[0].clientX - sw; sw = null;
    if (Math.abs(dx) > 70) { sfx.whoosh(); openStage(idx + (dx > 0 ? 1 : -1)); }
  });

  // when left alone, the letter does a little something on its own
  function scheduleIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!$('#stage').classList.contains('active') || drag) return;
      inner.classList.remove('breathe');
      inner.animate(pick([TRICKS[2], TRICKS[0], TRICKS[6]])(), { duration: 800, easing: 'cubic-bezier(.3,1.4,.5,1)' })
        .onfinish = () => inner.classList.add('breathe');
      scheduleIdle();
    }, rand(5000, 9000));
  }

  // ---------------------------------------------------------------- find-the-letter game
  let target, score = 0;
  const fx2 = $('#fx2');
  function newRound() {
    const pool = L.slice();
    const choices = [];
    while (choices.length < 3) choices.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    target = pick(choices);
    $('#askText').textContent = `אֵיפֹה ${target.name}?`;
    const box = $('#choices');
    box.innerHTML = '';
    choices.forEach((c, k) => {
      const b = document.createElement('button');
      b.className = 'choice';
      b.appendChild(letterEl(c));
      b.animate([{ transform: 'scale(0) rotate(-20deg)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }],
        { duration: 450, delay: k * 120, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'backwards' });
      b.addEventListener('click', (e) => answer(c, b, e));
      box.appendChild(b);
    });
    setTimeout(() => say(`אֵיפֹה ${target.name}?`), 400);
  }
  function answer(c, b, e) {
    if (c === target) {
      score++;
      sfx.yay();
      burst(e.clientX, e.clientY, 40, fx2);
      b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3) rotate(10deg)' }, { transform: 'scale(1) rotate(-6deg)' }, { transform: 'scale(1)' }], { duration: 600 });
      $('#stars').textContent = '⭐'.repeat(((score - 1) % 5) + 1);
      say(pick(['יֵשׁ!', 'כׇּל הַכָּבוֹד!', 'מְצֻיָּן!', 'נָכוֹן!']));
      setTimeout(newRound, 1500);
    } else {
      sfx.nope();
      b.animate([0, -16, 16, -10, 10, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 450 });
      setTimeout(() => say(c.name), 200);
    }
  }
  $('#playBtn').addEventListener('click', () => { sfx.pop(); score = 0; $('#stars').textContent = ''; show('game'); newRound(); });
  $('#askBtn').addEventListener('click', () => say(`אֵיפֹה ${target.name}?`));

  // ---------------------------------------------------------------- start
  $('#tapToStart').addEventListener('click', () => {
    audio(); sfx.yay();
    if ('speechSynthesis' in window) speechSynthesis.speak(new SpeechSynthesisUtterance('')); // unlock iOS speech
    $('#tapToStart').classList.add('gone');
  });
})();
