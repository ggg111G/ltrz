// Name builder: drag letter characters into a row to spell a name.
// Letters standing side by side hold hands and dance together.
// A grown-up can type a name; then the row shows faint letters to match.
(() => {
  const { Character, sfx, confettiAt, show, remeasure, wait, rand } = window.__letterz;
  const $ = (s) => document.querySelector(s);
  const NS = 'http://www.w3.org/2000/svg';
  const L = window.LETTERS;

  // final forms share the base letter's colour; they're drawn as glyphs with eyes for now
  const FINALS = { kaf: 'ך', mem: 'ם', nun: 'ן', pe: 'ף', tsadi: 'ץ' };
  const BANK = [];
  L.forEach((l) => {
    BANK.push(l);
    if (FINALS[l.id]) BANK.push({ id: l.id + '-final', base: l.id, char: FINALS[l.id], name: l.name + ' סופית', color: l.color, art: [] });
  });
  const BASE_OF = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  const norm = (ch) => BASE_OF[ch] || ch;
  const byChar = (ch) => BANK.find((b) => b.char === ch);

  const screen = $('#names'), row = $('#nameRow'), slotsEl = $('#slots'), tray = $('#tray'), arms = $('#arms'), input = $('#nameInput');
  let target = '';
  try { target = localStorage.getItem('letterz-name') || ''; } catch (e) {}
  input.value = target;

  // the row: an array of { letter, el, ch } or null for an empty slot (target mode)
  let pieces = [];

  // ---------------------------------------------------------------- tray (built the first time the screen opens, so shapes can be measured)
  let trayBuilt = false;
  const buildTray = () => { if (trayBuilt) return; trayBuilt = true; BANK.forEach((letter) => {
    const b = document.createElement('button');
    b.className = 'tray-item';
    b.setAttribute('aria-label', letter.name);
    const art = document.createElement('div');
    art.className = 'art';
    b.appendChild(art);
    tray.appendChild(b);
    new Character(letter, art);
    b.addEventListener('pointerdown', (e) => startDrag(e, letter, null, b));
  }); };

  // ---------------------------------------------------------------- building the row
  function makePiece(letter) {
    const el = document.createElement('div');
    el.className = 'piece';
    const inner = document.createElement('div');
    inner.className = 'piece-inner';
    el.appendChild(inner);
    const ch = new Character(letter, inner);
    const p = { letter, el, ch };
    el.addEventListener('pointerdown', (e) => startDrag(e, letter, p, el));
    return p;
  }

  function layout() {
    slotsEl.innerHTML = '';
    const n = Math.max(pieces.length, target ? [...target].length : 0, 1);
    const size = Math.min(120, (row.clientWidth - 16) / n - 14);
    row.style.setProperty('--size', Math.max(44, size) + 'px');
    const chars = target ? [...target] : null;
    const count = chars ? chars.length : pieces.length;
    for (let i = 0; i < count; i++) {
      const p = pieces[i];
      if (p) { p.el.style.animationDelay = -(i * 0.18) + 's'; slotsEl.appendChild(p.el); }
      else {
        const ghost = document.createElement('div');
        ghost.className = 'ghost';
        ghost.textContent = chars ? chars[i] : '';
        slotsEl.appendChild(ghost);
      }
    }
    if (!count) {
      const hint = document.createElement('div');
      hint.className = 'ghost hint';
      hint.textContent = '👇';
      slotsEl.appendChild(hint);
    }
    updateDancing();
    requestAnimationFrame(remeasure);
  }

  // pieces dance only while they have a neighbour to hold hands with
  function updateDancing() {
    pieces.forEach((p, i) => {
      if (!p) return;
      const holding = (pieces[i - 1] && true) || (pieces[i + 1] && true);
      p.el.classList.toggle('dancing', !!holding);
    });
  }

  function insertAt(letter, index) {
    const p = makePiece(letter);
    if (target) {
      const chars = [...target];
      // find the slot: the one dropped on if free, else the nearest free one
      let i = clampIdx(index, chars.length);
      if (pieces[i]) {
        const free = chars.map((_, k) => k).filter((k) => !pieces[k]);
        if (!free.length) return false;
        i = free.reduce((a, b) => (Math.abs(b - index) < Math.abs(a - index) ? b : a));
      }
      if (norm(chars[i]) !== norm(letter.char)) return 'wrong';
      pieces[i] = p;
    } else {
      pieces.splice(clampIdx(index, pieces.length + 1), 0, p);
    }
    layout();
    p.el.animate([{ transform: 'scale(.3) translateY(-60px)' }, { transform: 'scale(1.15,.85)' }, { transform: 'none' }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    sfx.pop();
    p.ch.ready.then(() => p.ch.blink());
    checkDone();
    return true;
  }
  const clampIdx = (i, n) => Math.max(0, Math.min(n - 1, i));

  function removePiece(p) {
    const i = pieces.indexOf(p);
    if (i < 0) return;
    p.ch.destroy();
    if (target) pieces[i] = null; else pieces.splice(i, 1);
    layout();
  }

  // which position in the row is under x? (RTL: the first letter is on the right)
  function indexAt(x) {
    const kids = [...slotsEl.children];
    if (!kids.length) return 0;
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      if (target ? (x >= r.left && x <= r.right) : x > r.left + r.width / 2) return i;
    }
    if (target) {
      // nearest slot
      let best = 0, bd = Infinity;
      kids.forEach((k, i) => { const r = k.getBoundingClientRect(); const d = Math.abs(x - (r.left + r.width / 2)); if (d < bd) { bd = d; best = i; } });
      return best;
    }
    return kids.length;
  }

  // ---------------------------------------------------------------- dragging
  let drag = null;
  function startDrag(e, letter, piece, srcEl) {
    e.preventDefault();
    const r = srcEl.getBoundingClientRect();
    drag = { letter, piece, x0: e.clientX, y0: e.clientY, moved: false, ghost: null, id: e.pointerId, srcEl, w: r.width, h: r.height };
  }
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved && Math.hypot(dx, dy) > 10) {
      drag.moved = true;
      const g = document.createElement('div');
      g.className = 'drag-ghost';
      const size = Math.max(70, Math.min(130, drag.w * 1.3));
      g.style.width = size + 'px'; g.style.height = size * 1.15 + 'px';
      document.body.appendChild(g);
      drag.ghost = g; drag.size = size;
      drag.ghostCh = new Character(drag.letter, g);
      if (drag.piece) removePiece(drag.piece);
      sfx.pop();
    }
    if (drag.moved) {
      const tilt = Math.max(-20, Math.min(20, (e.movementX || 0) * 2));
      drag.ghost.style.transform = `translate(${e.clientX - drag.size / 2}px, ${e.clientY - drag.size * 0.6}px) rotate(${tilt}deg)`;
      row.classList.toggle('over', overRow(e.clientX, e.clientY));
      remeasure();
    }
  }, { passive: true });
  const overRow = (x, y) => { const r = row.getBoundingClientRect(); return y > r.top - 40 && y < r.bottom + 30 && x > r.left - 20 && x < r.right + 20; };

  addEventListener('pointerup', (e) => endDrag(e));
  addEventListener('pointercancel', (e) => endDrag(e, true));
  async function endDrag(e, cancel) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag; drag = null;
    row.classList.remove('over');
    if (!d.moved) {
      // a tap: tray letters hop into the next spot; row letters react
      if (d.piece) { d.piece.ch.react(e.clientX, e.clientY); return; }
      const res = insertAt(d.letter, target ? pieces.findIndex((p) => !p) : pieces.length);
      if (res === 'wrong') nope(d.srcEl);
      return;
    }
    const ghost = d.ghost;
    let res = false;
    if (!cancel && overRow(e.clientX, e.clientY)) res = insertAt(d.letter, indexAt(e.clientX));
    if (res === true) { d.ghostCh.destroy(); ghost.remove(); return; }
    // not placed: fly back down to the tray
    if (res === 'wrong') sfx.huff(); else sfx.whoosh();
    const to = d.srcEl.isConnected && !d.piece ? d.srcEl.getBoundingClientRect() : tray.getBoundingClientRect();
    await ghost.animate([{ transform: ghost.style.transform, opacity: 1 }, { transform: `translate(${to.left}px, ${to.top}px) scale(.4)`, opacity: 0.2 }], { duration: 450, easing: 'ease-in' }).finished.catch(() => {});
    d.ghostCh.destroy(); ghost.remove();
  }
  function nope(el) {
    sfx.huff();
    el.animate([0, -10, 10, -6, 6, 0].map((x) => ({ transform: `translateX(${x}px)` })), { duration: 400 });
  }

  // ---------------------------------------------------------------- holding hands
  // an arm from each letter to its neighbour, drawn every frame so it follows the dance
  function drawArms() {
    if (screen.classList.contains('active')) {
      const rr = row.getBoundingClientRect();
      arms.setAttribute('viewBox', `0 0 ${rr.width} ${rr.height}`);
      let html = '';
      for (let i = 0; i < pieces.length - 1; i++) {
        const a = pieces[i], b = pieces[i + 1];
        if (!a || !b || !a.ch.svg || !b.ch.svg) continue;
        const ra = a.ch.svg.getBoundingClientRect(), rb = b.ch.svg.getBoundingClientRect();
        // RTL: a is on the right, b on its left
        const x1 = ra.left - rr.left + ra.width * 0.08, y1 = ra.top - rr.top + ra.height * 0.55;
        const x2 = rb.right - rr.left - rb.width * 0.08, y2 = rb.top - rr.top + rb.height * 0.55;
        const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + Math.max(14, Math.abs(x1 - x2) * 0.35);
        html += `<path d="M${x1} ${y1} Q${(x1 + mx) / 2} ${my} ${mx} ${my - 4} Q${(x2 + mx) / 2} ${my} ${x2} ${y2}" class="arm"/>`;
        html += `<circle cx="${mx}" cy="${my - 4}" r="7" class="hands"/>`;
      }
      arms.innerHTML = html;
    }
    requestAnimationFrame(drawArms);
  }
  requestAnimationFrame(drawArms);

  // ---------------------------------------------------------------- finishing a name
  async function checkDone() {
    if (!target || pieces.some((p) => !p) || pieces.length !== [...target].length) return;
    await wait(350);
    sfx.sparkle();
    const r = row.getBoundingClientRect();
    confettiAt(r.left + r.width / 2, r.top + r.height / 2);
    setTimeout(() => confettiAt(r.left + r.width * 0.2, r.top), 300);
    setTimeout(() => confettiAt(r.left + r.width * 0.8, r.top), 600);
    row.classList.add('done');
    pieces.forEach((p, i) => setTimeout(() => p.ch.react(), i * 160));
    $('#nameShow').textContent = target + '!';
    $('#nameShow').animate([{ transform: 'scale(.2)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1 }, { transform: 'scale(1)' }], { duration: 600, easing: 'cubic-bezier(.3,1.6,.5,1)', fill: 'forwards' });
  }

  function reset() {
    pieces.forEach((p) => p && p.ch.destroy());
    pieces = target ? [...target].map(() => null) : [];
    row.classList.remove('done');
    $('#nameShow').textContent = '';
    layout();
  }

  // grown-up controls
  input.addEventListener('input', () => {
    target = input.value.replace(/[^א-ת]/g, '').slice(0, 10);
    try { localStorage.setItem('letterz-name', target); } catch (e) {}
    reset();
  });
  $('#clearBtn').addEventListener('click', () => { sfx.whoosh(); reset(); });
  $('#namesBtn').addEventListener('click', () => { sfx.pop(); show('names'); buildTray(); reset(); });
  addEventListener('resize', () => screen.classList.contains('active') && layout());

  window.__letterz.names = { insertAt, byChar, reset, get pieces() { return pieces; } };
})();
