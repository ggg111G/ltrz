(() => {
  const L = window.LETTERS;
  const RIGS = window.RIGS || {};
  const EXT = window.ART_EXT || 'svg';
  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#4C1415';
  const $ = (s) => document.querySelector(s);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const PALETTE = ['#FF8A3D', '#D6303A', '#13A08B', '#FFD36B', '#A98BD0', '#9FC4CC', '#F3A9CC', '#fff'];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const artPath = (f) => 'assets/letters/' + (/\.\w+$/.test(f) ? f : f + '.' + EXT);
  const bgPath = (f) => 'assets/bg/' + (/\.\w+$/.test(f) ? f : f + '.' + EXT);

  // ------------------------------------------------------------------ sound (soft, optional)
  let ac;
  function audio() {
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
    } catch (e) { ac = null; }
    return ac;
  }
  function tone(freq, { type = 'sine', dur = 0.2, vol = 0.12, slide = 0, delay = 0 } = {}) {
    const a = audio(); if (!a) return;
    const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const sfx = {
    boing: () => tone(160, { dur: 0.4, slide: 3, vol: 0.14 }),
    pop: () => tone(620, { type: 'triangle', dur: 0.09, slide: 0.5, vol: 0.1 }),
    giggle: () => [0, 1, 2, 3].forEach((i) => tone(700 + i * 60, { type: 'triangle', dur: 0.07, slide: 1.3, vol: 0.07, delay: i * 0.08 })),
    tweet: () => { tone(1800, { dur: 0.08, slide: 1.4, vol: 0.06 }); tone(2100, { dur: 0.1, slide: 0.8, vol: 0.06, delay: 0.1 }); },
    chomp: () => [0, 1].forEach((i) => tone(220, { type: 'square', dur: 0.05, slide: 0.6, vol: 0.05, delay: i * 0.14 })),
    huff: () => tone(140, { type: 'sawtooth', dur: 0.25, slide: 0.7, vol: 0.05 }),
    sparkle: () => [0, 1, 2, 3, 4].forEach((i) => tone(1300 + i * 220, { dur: 0.12, vol: 0.04, delay: i * 0.05 })),
    kiss: () => tone(900, { dur: 0.06, slide: 2, vol: 0.08 }),
    yawn: () => tone(300, { type: 'triangle', dur: 0.6, slide: 0.6, vol: 0.06 }),
    whoosh: () => tone(800, { type: 'sawtooth', dur: 0.25, slide: 0.3, vol: 0.03 }),
  };

  // ------------------------------------------------------------------ pointer / gaze
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, t: 0 };
  addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); }, { passive: true });
  addEventListener('pointerdown', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.t = performance.now(); audio(); }, { passive: true });

  // ------------------------------------------------------------------ svg loading
  const svgCache = {};
  function fetchSvg(url) {
    if (!svgCache[url]) svgCache[url] = fetch(url).then((r) => { if (!r.ok) throw new Error(url); return r.text(); });
    return svgCache[url];
  }
  function glyphSvg(letter) {
    return `<svg viewBox="0 0 240 280" xmlns="${NS}">
      <text x="120" y="250" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="900" font-size="300"
        fill="${letter.color}" stroke="${INK}" stroke-width="8" paint-order="stroke" stroke-linejoin="round">${letter.char}</text>
      <circle cx="85" cy="70" r="24" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="85" cy="70" r="10" fill="${INK}"/>
      <circle cx="155" cy="70" r="24" fill="#fff" stroke="${INK}" stroke-width="5"/><circle cx="155" cy="70" r="10" fill="${INK}"/>
    </svg>`;
  }

  let uid = 0;
  function el(tag, attrs = {}) { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; }
  const ORIGINS = { center: 'center', top: '50% 0%', bottom: '50% 100%', left: '0% 50%', right: '100% 50%' };

  // ------------------------------------------------------------------ the character
  const ALL = new Set();

  class Character {
    constructor(letter, host, { big = false } = {}) {
      this.letter = letter; this.host = host; this.big = big;
      this.rig = RIGS[letter.id] || {};
      this.mood = Object.assign({}, window.DEFAULT_MOOD, this.rig.mood || {});
      this.eyes = []; this.parts = {};
      this.gazeOverride = null; this.wander = { x: 0, y: 0, next: 0 };
      this.alive = true;
      this.ready = this.build();
    }

    async build() {
      const hasArt = this.letter.art && this.letter.art.length;
      let text;
      try { text = hasArt ? await fetchSvg(artPath(this.letter.art[0])) : glyphSvg(this.letter); }
      catch (e) { text = glyphSvg(this.letter); }
      const n = ++uid;
      text = text.replace(/id="([^"]+)"/g, `id="$1_c${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1_c${n})`).replace(/href="#([^"]+)"/g, `href="#$1_c${n}"`);
      const wrap = document.createElement('div');
      wrap.innerHTML = text.trim();
      const svg = wrap.querySelector('svg');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.setAttribute('class', 'critter');
      svg.setAttribute('overflow', 'visible');
      svg.setAttribute('aria-hidden', 'true');
      this.svg = svg;
      this.host.appendChild(svg);

      const kids = [...svg.children];
      // eyes
      let eyeSpec = this.rig.eyes;
      if (!eyeSpec) eyeSpec = this.autoEyes(kids);
      for (const [ballIdx, pupilIdx] of eyeSpec) this.makeEye(kids, ballIdx, pupilIdx);
      // named parts
      for (const [name, spec] of Object.entries(this.rig.parts || {})) {
        const sets = Array.isArray(spec.el[0]) ? spec.el : [spec.el];
        this.parts[name] = sets.map((idx) => this.group(kids, idx, 'part', spec.origin));
      }
      // body wrappers: breathe > body > everything
      const breathe = el('g', { class: 'breathe-g' });
      const body = el('g', { class: 'body-g' });
      [...svg.children].forEach((c) => { if (!/^(defs|mask|clipPath)$/i.test(c.tagName)) body.appendChild(c); });
      breathe.appendChild(body); svg.appendChild(breathe);
      this.body = body; this.breatheG = breathe;
      breathe.style.animationDuration = this.mood.breath + 's';
      breathe.style.animationDelay = -rand(0, this.mood.breath) + 's';
      this.measure();
      ALL.add(this);
      this.scheduleBlink();
      this.scheduleQuirk();
    }

    // find a dark dot that sits inside a light shape
    autoEyes(kids) {
      const dark = (c) => /4c1415|#000/i.test(c.getAttribute('fill') || '');
      const light = (c) => /white|#fff|fecd65|#f8bddc|a1c8d0/i.test(c.getAttribute('fill') || '');
      const out = [];
      kids.forEach((p, i) => {
        if (!/circle|ellipse|rect/.test(p.tagName) || !dark(p)) return;
        let pb; try { pb = p.getBBox(); } catch (e) { return; }
        if (pb.width > 40) return;
        const cx = pb.x + pb.width / 2, cy = pb.y + pb.height / 2;
        for (let j = kids.length - 1; j >= 0; j--) {
          const b = kids[j]; if (b === p || !light(b) || !b.getBBox) continue;
          const bb = b.getBBox();
          if (cx > bb.x && cx < bb.x + bb.width && cy > bb.y && cy < bb.y + bb.height && bb.width > pb.width && bb.width < 120) { out.push([[j], [i]]); break; }
        }
      });
      return out;
    }

    group(kids, idx, cls, origin = 'center') {
      const nodes = idx.map((i) => kids[i]).filter(Boolean);
      const g = el('g', { class: cls });
      if (nodes.length) nodes[0].parentNode.insertBefore(g, nodes[0]);
      nodes.forEach((n) => g.appendChild(n));
      g.style.transformOrigin = ORIGINS[origin] || origin;
      return g;
    }

    makeEye(kids, ballIdx, pupilIdx) {
      const balls = ballIdx.map((i) => kids[i]).filter(Boolean);
      const pupils = pupilIdx.map((i) => kids[i]).filter(Boolean);
      if (!balls.length || !pupils.length) return;
      const eye = el('g', { class: 'eye' });
      balls[0].parentNode.insertBefore(eye, balls[0]);
      balls.forEach((b) => eye.appendChild(b));
      // keep the pupil inside the eyeball
      const shape = balls.find((b) => /path|circle|ellipse|rect/.test(b.tagName) && !b.getAttribute('mask'));
      const clipG = el('g');
      if (shape) {
        const sid = shape.id || (shape.id = 'eb' + ++uid);
        const cp = el('clipPath', { id: 'cp' + uid });
        const use = el('use'); use.setAttribute('href', '#' + sid);
        cp.appendChild(use); this.svg.insertBefore(cp, this.svg.firstChild);
        clipG.setAttribute('clip-path', `url(#cp${uid})`);
      }
      const bb = eye.getBBox();
      const pupil = el('g', { class: 'pupil' });
      pupils.forEach((p) => pupil.appendChild(p));
      clipG.appendChild(pupil); eye.appendChild(clipG);
      const pb = pupil.getBBox();
      const cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
      const range = Math.max(2, Math.min(bb.width - pb.width * 0.8, bb.height - pb.height * 0.8) / 2 * 0.75);
      // where the pupil was drawn, relative to the eye's centre; it drifts back half-way there when resting
      const rx = pb.x + pb.width / 2 - cx, ry = pb.y + pb.height / 2 - cy;
      this.eyes.push({ eye, pupil, cx, cy, range, rx, ry, x: 0, y: 0, own: { x: 0, y: 0, next: 0 } });
    }

    measure() {
      if (!this.svg) return;
      const r = this.svg.getBoundingClientRect();
      const vb = this.svg.viewBox.baseVal;
      const s = Math.min(r.width / vb.width, r.height / vb.height) || 1;
      this.screen = { s, ox: r.left + (r.width - vb.width * s) / 2 - vb.x * s, oy: r.top + (r.height - vb.height * s) / 2 - vb.y * s, visible: r.width > 0 && r.bottom > 0 && r.top < innerHeight };
    }

    visible() { return this.screen && this.screen.visible && this.host.offsetParent !== null; }

    // per-frame: move pupils
    tick(now) {
      if (!this.eyes.length || !this.visible()) return;
      const idle = now - pointer.t > 3000;
      const look = this.mood.look;
      if (idle && now > this.wander.next) {
        this.wander = { x: rand(-1, 1), y: rand(-0.7, 0.8), next: now + rand(900, 3200) };
        if (Math.random() < 0.3) this.wander.x = this.wander.y = 0;
      }
      for (const e of this.eyes) {
        let tx, ty;
        const sx = this.screen.ox + e.cx * this.screen.s, sy = this.screen.oy + e.cy * this.screen.s;
        if (this.spin) {
          const a = (now - this.spin.start) / 90 + (this.spin.dir * this.eyes.indexOf(e));
          tx = Math.cos(a) * e.range; ty = Math.sin(a) * e.range;
        } else if (this.gazeOverride && now < this.gazeOverride.until) {
          [tx, ty] = this.toward(e, sx, sy, this.gazeOverride.x, this.gazeOverride.y, 1);
        } else if (look === 'own' && (idle || Math.random() < 0.002 || now < e.own.next)) {
          if (now > e.own.next) e.own = { x: rand(-1, 1), y: rand(-1, 1), next: now + rand(500, 2200) };
          tx = e.own.x * e.range; ty = e.own.y * e.range;
        } else if (idle) {
          tx = this.wander.x * e.range; ty = this.wander.y * e.range;
        } else {
          [tx, ty] = this.toward(e, sx, sy, pointer.x, pointer.y, look === 'shy' ? -1 : 1);
        }
        // aim relative to the eye's centre, keeping a little of the drawn glance
        tx += e.rx * 0.5 - e.rx; ty += e.ry * 0.5 - e.ry;
        const k = this.spin ? 1 : 0.18;
        e.x += (tx - e.x) * k; e.y += (ty - e.y) * k;
        e.pupil.setAttribute('transform', `translate(${e.x.toFixed(2)} ${e.y.toFixed(2)})`);
      }
    }
    toward(e, sx, sy, px, py, sign) {
      const dx = px - sx, dy = py - sy, d = Math.hypot(dx, dy) || 1;
      const m = clamp(d / 140, 0, 1) * e.range * sign;
      return [dx / d * m, dy / d * m];
    }

    lookAt(x, y, ms = 1400) { this.gazeOverride = { x, y, until: performance.now() + ms }; }

    // ---------------- blinking
    scheduleBlink() {
      if (!this.eyes.length || !this.mood.blink) return;
      clearTimeout(this.blinkT);
      this.blinkT = setTimeout(() => {
        if (this.visible() && !this.sleeping) this.blink();
        this.scheduleBlink();
      }, -Math.log(1 - Math.random()) * this.mood.blink * 1000 + 300);
    }
    blink(which) {
      const eyes = which ? [which] : this.eyes;
      const stagger = this.mood.look === 'own' ? 90 : 0;
      eyes.forEach((e, i) => e.eye.animate(
        [{ transform: 'scaleY(1)' }, { transform: 'scaleY(.08)' }, { transform: 'scaleY(1)' }],
        { duration: 170, delay: i * stagger, easing: 'ease-in-out' }));
      if (Math.random() < 0.15 && !which) setTimeout(() => this.blink(), 260); // double blink
    }

    // ---------------- quirks
    scheduleQuirk() {
      clearTimeout(this.quirkT);
      this.quirkT = setTimeout(() => {
        if (this.visible() && !this.busy && !reduceMotion) this.quirk(false);
        this.scheduleQuirk();
      }, rand(this.big ? 3500 : 5000, this.big ? 7500 : 14000));
    }
    quirk(tapped) {
      const q = QUIRKS[this.mood.quirk] || QUIRKS.bounce;
      return q(this, tapped);
    }

    async react(x, y) {
      if (x != null) this.lookAt(x, y, 1600);
      if (this.busy) { this.bodyAnim(SQUISH, 380); return; }
      this.busy = true;
      try { await this.quirk(true); } finally { this.busy = false; }
    }

    bodyAnim(frames, duration, opts = {}) {
      return this.body.animate(frames, { duration, easing: 'cubic-bezier(.3,1.4,.5,1)', ...opts }).finished.catch(() => {});
    }
    partAnim(name, framesFn, duration, opts = {}) {
      const gs = this.parts[name] || [];
      return Promise.all(gs.map((g, i) => g.animate(framesFn(i, gs.length), { duration, easing: 'ease-in-out', ...opts, delay: (opts.stagger || 0) * i }).finished.catch(() => {})));
    }
    eyesAnim(frames, duration) { this.eyes.forEach((e) => e.eye.animate(frames, { duration, easing: 'cubic-bezier(.3,1.5,.5,1)' })); }

    floatText(txt, { color = '#fff', size = 34, dx = 0 } = {}) {
      const r = this.svg.getBoundingClientRect();
      const s = document.createElement('div');
      s.className = 'floaty'; s.textContent = txt;
      Object.assign(s.style, { left: r.left + r.width * (0.7 + dx) + 'px', top: r.top + r.height * 0.1 + 'px', color, fontSize: size * (this.big ? 1.6 : 0.8) + 'px' });
      document.body.appendChild(s);
      s.animate([
        { transform: 'translate(0,0) scale(.4)', opacity: 0 },
        { transform: `translate(${rand(10, 30)}px,-30px) scale(1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${rand(-20, 40)}px,-${this.big ? 160 : 70}px) scale(1.1) rotate(${rand(-20, 20)}deg)`, opacity: 0 },
      ], { duration: 1800, easing: 'ease-out' }).onfinish = () => s.remove();
    }

    destroy() { this.alive = false; clearTimeout(this.blinkT); clearTimeout(this.quirkT); ALL.delete(this); }
  }

  // shared body moves
  const SQUISH = [{ transform: 'scale(1)' }, { transform: 'scale(1.12,.86)' }, { transform: 'scale(.95,1.06)' }, { transform: 'scale(1)' }];
  const HOP = (h = 40) => [{ transform: 'translateY(0) scale(1)' }, { transform: 'translateY(0) scale(1.12,.86)', offset: 0.15 }, { transform: `translateY(-${h}px) scale(.94,1.08)`, offset: 0.5 }, { transform: 'translateY(0) scale(1.1,.9)', offset: 0.85 }, { transform: 'translateY(0) scale(1)' }];
  const SHAKE = (a = 6, n = 6) => Array.from({ length: n + 1 }, (_, i) => ({ transform: i === n ? 'rotate(0)' : `rotate(${i % 2 ? a : -a}deg)` }));
  const WIGGLE = (a = 10) => [0, -a, a, -a * 0.7, a * 0.5, 0].map((r) => ({ transform: `rotate(${r}deg)` }));

  // each letter's personality: (character, tapped) => promise
  const QUIRKS = {
    // א: chatty — mouth flaps open and shut
    async chatter(c, t) {
      const n = t ? 4 : 2;
      if (t) { sfx.giggle(); c.bodyAnim(HOP(30), 700); }
      await c.partAnim('mouth', () => Array.from({ length: n * 2 + 1 }, (_, i) => ({ transform: i % 2 ? 'scale(1.3,1.04)' : 'scale(1)' })), 160 * n);
    },
    // ב: silly — waggles its tongue
    async tongue(c, t) {
      if (t) { sfx.giggle(); c.eyesAnim([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.35)' }, { transform: 'scaleY(.35)' }, { transform: 'scaleY(1)' }], 900); c.bodyAnim(SHAKE(4, 8), 800); }
      await c.partAnim('tongue', () => [0, 14, -14, 10, -8, 0].map((r) => ({ transform: `rotate(${r}deg) scaleY(${t ? 1.25 : 1.05})` })), t ? 900 : 700);
    },
    // ג: proud — its crown of spikes pops up one by one
    async spikes(c, t) {
      if (t) { sfx.pop(); c.bodyAnim(HOP(24), 650); }
      await c.partAnim('spikes', () => [{ transform: 'translateY(0)' }, { transform: `translateY(-${t ? 18 : 9}px) scale(1.1)` }, { transform: 'translateY(0)' }], 360, { stagger: 110 });
    },
    // ד: sly — winks and leans in
    async wink(c, t) {
      const e = c.eyes[0];
      if (e) e.eye.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.06)', offset: 0.3 }, { transform: 'scaleY(.06)', offset: 0.7 }, { transform: 'scaleY(1)' }], { duration: 650 });
      if (t) sfx.pop();
      await c.bodyAnim([{ transform: 'rotate(0)' }, { transform: `rotate(${t ? -10 : -5}deg)`, offset: 0.4 }, { transform: 'rotate(0)' }], 900);
    },
    // ה: nervous — teeth chatter, startled when touched
    async nervous(c, t) {
      if (t) {
        sfx.boing();
        c.eyesAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], 900);
        c.bodyAnim(HOP(60), 700);
      }
      await c.partAnim('teeth', (i) => Array.from({ length: 9 }, (_, k) => ({ transform: `translateY(${k % 2 ? (i % 2 ? 3 : -3) : 0}px)` })), t ? 700 : 500);
    },
    // ו: tall and bendy — sways like a reed, boings when touched
    async sway(c, t) {
      if (t) { sfx.boing(); await c.bodyAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.2,.7)' }, { transform: 'scale(.85,1.25)' }, { transform: 'scale(1.06,.95)' }, { transform: 'scale(1)' }], 850); return; }
      await c.bodyAnim([{ transform: 'rotate(0)' }, { transform: 'rotate(-6deg)' }, { transform: 'rotate(6deg)' }, { transform: 'rotate(0)' }], 2200, { easing: 'ease-in-out' });
    },
    // ז: licks with its long tongue, eyebrow goes up
    async lick(c, t) {
      if (t) sfx.kiss();
      c.partAnim('brow', () => [{ transform: 'translateY(0)' }, { transform: 'translateY(-8px) rotate(-6deg)' }, { transform: 'translateY(0)' }], 700);
      await c.partAnim('tongue', () => [0, 10, -10, 8, -6, 0].map((s) => ({ transform: `skewX(${s}deg) scaleY(${t ? 1.12 : 1.04})` })), t ? 1000 : 800);
    },
    // ח: sleepy — flutters lashes and snores; jolts awake when touched, then dozes off
    async sleepy(c, t) {
      if (t) {
        sfx.boing();
        c.partAnim('lashes', () => [{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.6)' }, { transform: 'scaleY(1.6)' }, { transform: 'scaleY(1)' }], 1400);
        await c.bodyAnim(HOP(70), 700);
        await wait(700); sfx.yawn();
      }
      c.floatText('z', { color: '#4C1415', size: 26 });
      setTimeout(() => c.floatText('z', { color: '#4C1415', size: 34, dx: 0.08 }), 450);
      setTimeout(() => c.floatText('Z', { color: '#4C1415', size: 42, dx: 0.16 }), 900);
      await c.partAnim('lashes', (i) => [{ transform: 'rotate(0)' }, { transform: `rotate(${i % 2 ? 8 : -8}deg)` }, { transform: 'rotate(0)' }], 500, { stagger: 50 });
    },
    // ט: grumpy — frowns, huffs and puffs steam
    async grumpy(c, t) {
      c.partAnim('brows', (i) => [{ transform: 'rotate(0)' }, { transform: `rotate(${i ? -14 : 14}deg) translateY(4px)` }, { transform: `rotate(${i ? -14 : 14}deg) translateY(4px)` }, { transform: 'rotate(0)' }], t ? 1400 : 900);
      c.partAnim('horn', () => WIGGLE(12), 700);
      if (t) {
        sfx.huff();
        c.floatText('💨', { size: 30 }); setTimeout(() => c.floatText('💨', { size: 30, dx: -0.4 }), 250);
        await c.bodyAnim([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, ...SHAKE(3, 6).map((f) => ({ transform: 'scale(1.1) ' + f.transform })), { transform: 'scale(1)' }], 1000);
      } else await wait(900);
    },
    // י: tiny and hungry — chomps its beak, hops about
    async chomp(c, t) {
      sfx.chomp();
      const chomps = c.partAnim('beak', () => [0, -14, 0, -14, 0].map((r) => ({ transform: `rotate(${r}deg)` })), 420);
      if (t) { await c.bodyAnim(HOP(40), 450); sfx.chomp(); await c.bodyAnim(HOP(30), 420); await c.bodyAnim(HOP(18), 380); }
      else await c.bodyAnim(HOP(14), 450);
      await chomps;
    },
    // כ: sparkly — its dots twinkle in a wave; spins when touched
    async twinkle(c, t) {
      if (t) { sfx.sparkle(); c.bodyAnim([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(180deg) scale(.85)' }, { transform: 'rotate(360deg) scale(1)' }], 1000, { easing: 'ease-in-out' }); }
      await c.partAnim('dots', () => [{ transform: 'scale(1)', filter: 'none' }, { transform: 'scale(1.9)', filter: 'hue-rotate(160deg) brightness(1.3)' }, { transform: 'scale(1)', filter: 'none' }], 420, { stagger: 70 });
    },
    // ל: a bird — opens its beak and flaps
    async tweet(c, t) {
      sfx.tweet();
      c.partAnim('beak', () => [0, 18, 0, 18, 0].map((r) => ({ transform: `rotate(${r}deg)` })), 500);
      const flaps = t ? 3 : 1;
      if (t) c.bodyAnim([{ transform: 'translateY(0)' }, { transform: 'translateY(-50px) rotate(-6deg)', offset: 0.5 }, { transform: 'translateY(0)' }], 1100, { easing: 'ease-in-out' });
      await c.partAnim('wing', () => Array.from({ length: flaps * 2 + 1 }, (_, i) => ({ transform: `rotate(${i % 2 ? -22 : 0}deg)` })), 260 * flaps);
    },
    // מ: sniffs about; sneezes when touched
    async sniff(c, t) {
      await c.partAnim('nose', () => [1, 1.5, 1, 1.5, 1].map((s) => ({ transform: `scale(${s})` })), 600);
      if (t) {
        await c.bodyAnim([{ transform: 'rotate(0) scale(1)' }, { transform: 'rotate(-8deg) scale(.95,1.05)' }], 350, { fill: 'forwards' });
        sfx.huff();
        c.partAnim('mouth', () => [{ transform: 'scaleY(1)' }, { transform: 'scaleY(1.4)' }, { transform: 'scaleY(1)' }], 500);
        await c.bodyAnim([{ transform: 'rotate(-8deg) scale(.95,1.05)' }, { transform: 'rotate(10deg) scale(1.1,.9)' }, { transform: 'rotate(0) scale(1)' }], 600);
      }
    },
    // נ: blows kisses
    async kiss(c, t) {
      sfx.kiss();
      if (t) { c.floatText('❤', { color: '#D6303A', size: 40 }); setTimeout(() => c.floatText('❤', { color: '#F3A9CC', size: 30, dx: -0.3 }), 300); c.bodyAnim(SQUISH, 600); }
      await c.partAnim('lips', () => [{ transform: 'scale(1)' }, { transform: 'scale(.7,1.15)' }, { transform: 'scale(1.25,.9)' }, { transform: 'scale(1)' }], 700);
    },
    // ס: four eyes that each do their own thing; they whirl round when touched
    async 'spin-eyes'(c, t) {
      c.spin = { start: performance.now(), dir: t ? 1.6 : 0 };
      if (t) { sfx.sparkle(); c.bodyAnim(SQUISH, 600); }
      await wait(t ? 1400 : 900);
      c.spin = null;
      c.eyes.forEach((e, i) => setTimeout(() => c.blink(e), i * 120));
    },
    // ע: eyes on wobbly stalks
    async stalks(c, t) {
      if (t) { sfx.boing(); c.bodyAnim(SQUISH, 700); }
      await c.partAnim('stalks', (i) => WIGGLE((t ? 9 : 5) * (i ? -1 : 1)), t ? 1000 : 900);
    },
    // פ: party animal — bobs its hat, throws confetti
    async party(c, t) {
      c.partAnim('tail', () => [{ transform: 'scaleX(1)' }, { transform: 'scaleX(1.12) rotate(-4deg)' }, { transform: 'scaleX(1)' }], 600);
      if (t) {
        sfx.sparkle(); confetti(c);
        await c.partAnim('hat', () => [{ transform: 'translateY(0)' }, { transform: 'translateY(-40px) rotate(-15deg)' }, { transform: 'translateY(0)' }], 700, { easing: 'cubic-bezier(.3,1.5,.5,1)' });
      } else await c.partAnim('hat', () => WIGGLE(8), 800);
    },
    async bounce(c, t) {
      if (t) sfx.boing();
      await c.bodyAnim(HOP(t ? 50 : 16), t ? 700 : 500);
    },
  };

  function confetti(c) {
    const r = c.svg.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.3;
    for (let k = 0; k < 26; k++) {
      const b = document.createElement('div');
      b.className = 'bit';
      const s = rand(8, 18);
      Object.assign(b.style, { width: s + 'px', height: s + 'px', background: pick(PALETTE), borderRadius: pick(['50%', '3px']) });
      document.body.appendChild(b);
      const ang = rand(-Math.PI, 0), dist = rand(80, 240);
      b.animate([
        { transform: `translate(${x}px,${y}px) scale(.3)`, opacity: 1 },
        { transform: `translate(${x + Math.cos(ang) * dist}px,${y + Math.sin(ang) * dist}px) rotate(${rand(-360, 360)}deg)`, opacity: 1, offset: 0.6 },
        { transform: `translate(${x + Math.cos(ang) * dist * 1.1}px,${y + Math.sin(ang) * dist + 160}px) rotate(${rand(-540, 540)}deg)`, opacity: 0 },
      ], { duration: rand(900, 1400), easing: 'cubic-bezier(.2,.8,.4,1)' }).onfinish = () => b.remove();
    }
  }

  // ------------------------------------------------------------------ global loop
  let lastMeasure = 0;
  function frame(now) {
    if (now - lastMeasure > 500) { ALL.forEach((c) => c.measure()); lastMeasure = now; }
    ALL.forEach((c) => c.tick(now));
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  const remeasure = () => { lastMeasure = 0; };
  addEventListener('resize', remeasure); addEventListener('scroll', remeasure, true);

  // ------------------------------------------------------------------ sky
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

  // ------------------------------------------------------------------ screens
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
    remeasure();
  }
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { sfx.pop(); show(b.dataset.go); }));

  // ------------------------------------------------------------------ home: a crowd of characters
  const grid = $('#grid');
  L.forEach((letter, i) => {
    const b = document.createElement('button');
    b.className = 'tile';
    b.setAttribute('aria-label', letter.name);
    const art = document.createElement('div');
    art.className = 'art';
    b.appendChild(art);
    grid.appendChild(b);
    const ch = new Character(letter, art);
    b.addEventListener('click', async (e) => {
      ch.react(e.clientX, e.clientY);
      // everyone else turns to look
      ALL.forEach((o) => o !== ch && o.lookAt(e.clientX, e.clientY, 1200));
      await wait(650);
      mode = 'browse'; spark.classList.remove('on');
      openStage(i);
    });
  });

  // ------------------------------------------------------------------ stage: one big character
  const hero = $('#hero'), inner = hero.querySelector('.hero-inner');
  let idx = 0, star = null;

  // ---------------- animated backgrounds
  const BG_RIGS = window.BG_RIGS || {};
  const BG_ANIMS = {
    drift: (s) => [{ transform: 'translateX(0)' }, { transform: `translateX(${s.amp || 20}px)` }, { transform: 'translateX(0)' }],
    bob: (s) => [{ transform: 'translateY(0)' }, { transform: `translateY(${-(s.amp || 8)}px)` }, { transform: 'translateY(0)' }],
    sway: (s) => [{ transform: `rotate(${-(s.amp || 5)}deg)` }, { transform: `rotate(${s.amp || 5}deg)` }, { transform: `rotate(${-(s.amp || 5)}deg)` }],
    skew: (s) => [{ transform: `skewX(${-(s.amp || 3)}deg)` }, { transform: `skewX(${s.amp || 3}deg)` }, { transform: `skewX(${-(s.amp || 3)}deg)` }],
    spin: () => [{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }],
    pulse: (s) => [{ transform: 'scale(1)' }, { transform: `scale(${s.amp || 1.1})` }, { transform: 'scale(1)' }],
    glow: () => [{ filter: 'brightness(1) drop-shadow(0 0 0 #FFE9A0)' }, { filter: 'brightness(1.15) drop-shadow(0 0 14px #FFE9A0)' }, { filter: 'brightness(1) drop-shadow(0 0 0 #FFE9A0)' }],
    light: (s) => [{ filter: 'brightness(1)', offset: 0 }, { filter: 'brightness(1)', offset: 0.45 }, { filter: `brightness(${s.amp || 1.3})`, offset: 0.5 }, { filter: `brightness(${s.amp || 1.3})`, offset: 0.9 }, { filter: 'brightness(1)', offset: 0.95 }],
    twinkle: () => [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.4) rotate(45deg)', opacity: 0.4, offset: 0.5 }, { transform: 'scale(1)', opacity: 1 }],
    blink: () => [{ transform: 'scaleY(1)', offset: 0 }, { transform: 'scaleY(1)', offset: 0.9 }, { transform: 'scaleY(.05)', offset: 0.94 }, { transform: 'scaleY(1)', offset: 0.98 }],
    flicker: () => [0, 1, 2, 3, 4, 5, 6].map((k) => ({ transform: k % 6 === 0 ? 'scale(1)' : `scale(${0.9 + Math.random() * 0.14}, ${0.95 + Math.random() * 0.15}) skewX(${(Math.random() - 0.5) * 8}deg)` })),
    pop: (s) => [{ transform: 'translateY(0)', offset: 0 }, { transform: 'translateY(0)', offset: 0.5 }, { transform: `translateY(${-(s.amp || 50)}px)`, offset: 0.58, easing: 'ease-in' }, { transform: 'translateY(0)', offset: 0.7 }, { transform: 'translateY(-6px)', offset: 0.75 }, { transform: 'translateY(0)', offset: 0.8 }],
    rise: (s) => [{ transform: 'translateY(0) scale(1)', opacity: 1 }, { transform: `translateY(${-(s.amp || 40)}px) scale(1.3)`, opacity: 0 }],
    flip: () => [{ transform: 'rotate(0)', offset: 0 }, { transform: 'rotate(0)', offset: 0.75 }, { transform: 'rotate(180deg)', offset: 0.9 }, { transform: 'rotate(180deg)', offset: 1 }],
    puff: () => [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.35)', opacity: 0.75 }, { transform: 'scale(1)', opacity: 1 }],
    door: (s) => [{ transform: 'scaleX(1)', offset: 0 }, { transform: 'scaleX(1)', offset: 0.6 }, { transform: `scaleX(${s.amp || 0.8})`, offset: 0.7 }, { transform: `scaleX(${s.amp || 0.8})`, offset: 0.85 }, { transform: 'scaleX(1)', offset: 0.95 }],
    look: (s) => { const a = s.amp || 40; return [[0, 0], [a, 0], [a, 0], [-a, a * 0.3], [-a, a * 0.3], [0, -a * 0.2], [0, 0]].map(([x, y]) => ({ transform: `translate(${x}px, ${y}px)` })); },
  };
  const bgHost = $('#stageBg');
  let bgToken = 0;

  async function bgFor(letter) {
    const token = ++bgToken;
    bgHost.innerHTML = '';
    if (!letter.bg) {
      const c = letter.color;
      bgHost.style.background = `radial-gradient(circle at 50% 40%, #fff8 0 18%, transparent 60%), linear-gradient(180deg, #FBE3EE 0%, ${c}66 60%, ${c} 100%)`;
      return;
    }
    bgHost.style.background = letter.bgColor || letter.color;
    let text;
    try { text = await fetchSvg(bgPath(letter.bg)); } catch (e) { return; }
    if (token !== bgToken) return;
    const n = ++uid;
    text = text.replace(/id="([^"]+)"/g, `id="$1_b${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1_b${n})`).replace(/href="#([^"]+)"/g, `href="#$1_b${n}"`);
    bgHost.innerHTML = text;
    const svg = bgHost.querySelector('svg');
    svg.removeAttribute('width'); svg.removeAttribute('height');
    svg.setAttribute('class', 'bg-svg');
    fitBg();
    if (reduceMotion) return;
    const clipG = [...svg.children].find((c) => c.tagName === 'g' && c.getAttribute('clip-path'));
    const host = clipG || svg;
    const kids = [...host.children];
    const topOf = (node) => { while (node.parentNode !== host && node.parentNode) node = node.parentNode; return node; };
    for (const spec of BG_RIGS[letter.id] || []) {
      if (spec.a === 'snow') { snow(svg, spec.n || 20); continue; }
      const sets = Array.isArray(spec.el[0]) ? spec.el : [spec.el];
      const make = BG_ANIMS[spec.a]; if (!make) continue;
      sets.forEach((idx, i) => {
        const nodes = [...new Set(idx.map((k) => kids[k]).filter(Boolean).map(topOf))];
        if (!nodes.length) return;
        const g = el('g', { class: 'bgpart' });
        host.insertBefore(g, nodes[0]);
        nodes.forEach((nd) => g.appendChild(nd));
        g.style.transformOrigin = ORIGINS[spec.origin || 'center'] || spec.origin;
        const dur = (spec.dur || 3) * 1000;
        const delay = spec.random ? -Math.random() * dur : (spec.stagger || 0) * 1000 * i - dur * 20;
        g.animate(make(spec), { duration: dur, iterations: Infinity, delay, easing: spec.a === 'spin' ? 'linear' : 'ease-in-out' });
      });
    }
  }
  function fitBg() {
    const svg = bgHost.querySelector('svg'); if (!svg) return;
    const vb = svg.viewBox.baseVal;
    const narrower = innerWidth / innerHeight < vb.width / vb.height;
    svg.setAttribute('preserveAspectRatio', narrower ? 'xMidYMid slice' : 'xMidYMid meet');
  }
  addEventListener('resize', fitBg);
  function snow(svg, n) {
    const vb = svg.viewBox.baseVal;
    const g = el('g', { class: 'snow' });
    for (let k = 0; k < n; k++) {
      const r = rand(2.5, 6);
      const c = el('circle', { cx: rand(0, vb.width), cy: -10, r, fill: '#fff', stroke: '#C46A7A', 'stroke-width': 1 });
      g.appendChild(c);
      const dur = rand(5000, 9000), sway = rand(-25, 25);
      c.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${sway}px, ${vb.height * 0.5}px)` }, { transform: `translate(${-sway}px, ${vb.height + 20}px)` }],
        { duration: dur, iterations: Infinity, delay: -rand(0, dur) });
    }
    svg.appendChild(g);
  }

  // ------------------------------------------------------------------ story mode
  const STORY = window.STORY || { pages: [] };
  const storyCard = $('#storyCard'), spark = $('#spark');
  let mode = 'browse', page = 0;

  async function openStage(i, { from = 'top' } = {}) {
    idx = (i + L.length) % L.length;
    show('stage');
    $('#stage').classList.toggle('story', mode === 'story');
    bgFor(L[idx]);
    if (star) star.destroy();
    inner.innerHTML = '';
    star = new Character(L[idx], inner, { big: true });
    $('#caption').textContent = mode === 'story' ? '' : L[idx].name;
    await star.ready;
    star.measure();
    const entrance = from === 'top'
      ? [{ transform: 'translateY(-110vh) scale(.7,1.3)' }, { transform: 'translateY(0) scale(1.3,.7)', offset: 0.6 }, { transform: 'translateY(-30px) scale(.92,1.08)', offset: 0.8 }, { transform: 'none' }]
      : (() => { const s = from === 'left' ? -1 : 1; return [
          { transform: `translateX(${s * 100}vw)` },
          { transform: `translateX(${s * 66}vw) translateY(-40px) rotate(${-s * 6}deg)`, offset: 0.25 },
          { transform: `translateX(${s * 33}vw) translateY(0)`, offset: 0.5 },
          { transform: `translateX(${s * 10}vw) translateY(-30px) rotate(${-s * 4}deg)`, offset: 0.75 },
          { transform: 'translateX(0) scale(1.15,.85)', offset: 0.92 },
          { transform: 'none' }]; })();
    inner.animate(entrance, { duration: reduceMotion ? 1 : from === 'top' ? 750 : 1100, easing: from === 'top' ? 'ease-in' : 'ease-out' });
    setTimeout(sfx.boing, from === 'top' ? 420 : 950);
    setTimeout(() => star && star.blink(), 1100);
  }

  function setCard(html) {
    storyCard.innerHTML = html;
    storyCard.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, delay: 500, fill: 'backwards', easing: 'ease-out' });
  }

  async function openPage(p, dir = 1) {
    mode = 'story';
    const pages = STORY.pages;
    if (p < 0) { page = 0; return; }
    if (p >= pages.length) { theEnd(); return; }
    const leaving = spark.classList.contains('on') && dir;
    if (leaving) await sparkAway(dir);
    page = p;
    const li = L.findIndex((x) => x.id === pages[p].id);
    // forward pages arrive from the left (the way Hebrew reads), going back arrives from the right
    await openStage(li, { from: p === 0 && dir === 0 ? 'top' : dir > 0 ? 'left' : 'right' });
    setCard(`${p === 0 ? `<h2>${STORY.title}</h2>` : ''}<p>${pages[p].text}</p><span class="pg" dir="ltr">${p + 1} / ${pages.length}</span>`);
    sparkIn();
  }

  function theEnd() {
    sparkAway(1, true);
    setCard(`<h2>סוף</h2><p>🌙 לילה טוב 🌙</p><button class="pill" id="againBtn">📖 עוד פעם</button>`);
    setTimeout(() => { const b = $('#againBtn'); if (b) b.onclick = () => { sfx.pop(); openPage(0, 0); }; }, 0);
    page = STORY.pages.length;
    if (star) { star.sleeping = true; star.eyes.forEach((e) => e.eye.animate([{ transform: 'scaleY(1)' }, { transform: 'scaleY(.06)' }], { duration: 1600, fill: 'forwards', delay: 800 })); }
  }

  // the little spark that travels through the story
  let sparkFloat;
  function sparkIn() {
    spark.getAnimations().forEach((x) => x.cancel());
    spark.classList.add('on');
    const r = hero.getBoundingClientRect();
    const x = r.right - r.width * 0.05, y = r.top + r.height * 0.05;
    spark.style.left = x + 'px'; spark.style.top = y + 'px';
    spark.animate([{ transform: 'translate(-60vw, -30vh) scale(.3)', opacity: 0 }, { transform: 'translate(0,0) scale(1.4)', opacity: 1, offset: 0.8 }, { transform: 'scale(1)' }], { duration: 900, delay: 900, fill: 'backwards', easing: 'ease-out' });
    if (sparkFloat) sparkFloat.cancel();
    sparkFloat = spark.animate([{ translate: '0 0' }, { translate: '-14px -18px' }, { translate: '10px -8px' }, { translate: '0 0' }], { duration: 3200, iterations: Infinity, easing: 'ease-in-out', composite: 'add' });
  }
  async function sparkAway(dir, toSky = false) {
    const kf = toSky
      ? [{ transform: 'none' }, { transform: 'translate(-20vw, -60vh) scale(.5)' }]
      : [{ transform: 'none' }, { transform: `translate(${dir > 0 ? -70 : 70}vw, -20vh) scale(.6)`, opacity: 0.2 }];
    sfx.sparkle();
    await spark.animate(kf, { duration: 600, easing: 'ease-in', fill: toSky ? 'forwards' : 'none' }).finished.catch(() => {});
    if (!toSky) spark.classList.remove('on');
  }
  spark.addEventListener('click', () => {
    sfx.sparkle();
    spark.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.8) rotate(180deg)' }, { transform: 'scale(1) rotate(360deg)' }], { duration: 700 });
    if (star) { const r = spark.getBoundingClientRect(); star.lookAt(r.left, r.top, 1500); }
  });

  function go(delta) {
    sfx.whoosh();
    if (mode === 'story') openPage(page + delta, delta);
    else openStage(idx + delta);
  }
  $('#nextBtn').addEventListener('click', () => go(1));
  $('#prevBtn').addEventListener('click', () => go(-1));
  $('#storyBtn').addEventListener('click', () => { sfx.pop(); openPage(0, 0); });
  document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => {
    mode = 'browse'; spark.classList.remove('on'); spark.getAnimations().forEach((a) => a.cancel()); sparkFloat = null;
  }));
  // browsing from the home grid leaves story mode
  // drag the character around; it springs home when let go
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
      if (!drag.moved) { drag.moved = true; sfx.pop(); }
      const tilt = clamp(drag.vx * 2, -30, 30);
      hero.style.transform = `translate(${drag.x}px, ${drag.y}px) rotate(${tilt}deg) scale(1.06)`;
      remeasure();
    }
  });
  const endDrag = (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) { star && star.react(e.clientX, e.clientY); return; }
    const from = hero.style.transform;
    hero.style.transform = '';
    sfx.boing();
    hero.animate([
      { transform: from },
      { transform: `translate(${-d.x * 0.18}px, ${-d.y * 0.18}px) rotate(${-d.vx}deg) scale(.95,1.05)`, offset: 0.55 },
      { transform: `translate(${d.x * 0.05}px, ${d.y * 0.05}px) scale(1.04,.96)`, offset: 0.8 },
      { transform: 'none' },
    ], { duration: 700, easing: 'cubic-bezier(.3,1.2,.5,1)' }).onfinish = remeasure;
  };
  hero.addEventListener('pointerup', endDrag);
  hero.addEventListener('pointercancel', endDrag);

  // tapping the background: the character looks there
  $('#stage').addEventListener('pointerdown', (e) => {
    if (e.target.closest('#hero, .round, #spark, #storyCard') || !star) return;
    star.lookAt(e.clientX, e.clientY, 1500);
    if (Math.random() < 0.35) star.blink();
  });

  // swipe to change letter (RTL: swipe right -> next)
  let sw = null;
  $('#stage').addEventListener('touchstart', (e) => { if (!e.target.closest('#hero')) sw = e.touches[0].clientX; }, { passive: true });
  $('#stage').addEventListener('touchend', (e) => {
    if (sw == null) return;
    const dx = e.changedTouches[0].clientX - sw; sw = null;
    if (Math.abs(dx) > 70) go(dx > 0 ? 1 : -1);
  });

  window.__letterz = { ALL, openStage, openPage };
})();
