let notes = [];

function setUnreadIndicator(hasUnread) {
  document.getElementById('envWrap').classList.toggle('has-unread', hasUnread);
  const hint = document.getElementById('hint');
  if (hint && !hint.classList.contains('hidden')) {
    hint.textContent = hasUnread ? 'new note from sj ♡' : 'a letter from across the stars ♡';
  }
}

function markAsRead() {
  const newest = notes[0];
  if (newest) localStorage.setItem('sj_last_read', newest.body);
  document.getElementById('envWrap').classList.remove('has-unread');
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = 'a letter from across the stars ♡';
}

function fetchNotes() {
  return fetch('notes.json?t=' + Date.now())
    .then(r => r.json())
    .then(data => {
      const newFirst = data[0]?.body;
      const oldFirst = notes[0]?.body;
      notes = data;
      // if note view is closed and there's a new note, reset to index 0
      const noteOpen = document.getElementById('noteWrap').classList.contains('visible');
      if (!noteOpen && newFirst !== oldFirst) {
        currentNoteIdx = 0;
      }
      // unread indicator — compare newest note to last one she opened
      const lastRead = localStorage.getItem('sj_last_read');
      setUnreadIndicator(!!notes[0] && notes[0].body !== lastRead);
    })
    .catch(() => {
      if (!notes.length) notes = [{ date: '', body: 'could not load notes.' }];
    });
}

fetchNotes();

// refresh when Jalyn switches back to the app
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') fetchNotes();
});

// also poll every 5 minutes as a fallback
setInterval(fetchNotes, 5 * 60 * 1000);

// -------------------------
//  Note loading & navigation
// -------------------------

let currentNoteIdx = 0;

function loadNote(idx) {
  const n = notes[idx];
  document.getElementById('noteBody').textContent = n.body;
  document.getElementById('noteDate').textContent = n.date;
  const imgEl = document.getElementById('noteImage');
  if (n.image) {
    imgEl.src = n.image;
    imgEl.style.display = 'block';
  } else {
    imgEl.src = '';
    imgEl.style.display = 'none';
  }

  const musicEl = document.getElementById('noteMusic');
  if (n.music) {
    musicEl.src = n.music;
    musicEl.style.display = 'block';
  } else {
    musicEl.src = '';
    musicEl.style.display = 'none';
  }

  const total = notes.length;
  const nav = document.getElementById('noteNav');
  if (total > 1) {
    nav.style.display = 'flex';
    document.getElementById('noteCounter').textContent = `${idx + 1} / ${total}`;
    document.getElementById('prevBtn').disabled = idx === 0;
    document.getElementById('nextBtn').disabled = idx === total - 1;
  } else {
    nav.style.display = 'none';
  }

  const remaining = total - idx - 1;
  document.getElementById('noteBehind1').style.display = remaining >= 1 ? 'block' : 'none';
  document.getElementById('noteBehind2').style.display = remaining >= 2 ? 'block' : 'none';
}

function applyTilt() {
  const tilt = (Math.random() * 6 - 3);
  document.getElementById('mainNote').style.transform = `rotate(${tilt}deg)`;
}

function changeNote(dir) {
  currentNoteIdx = Math.max(0, Math.min(notes.length - 1, currentNoteIdx + dir));
  applyTilt();
  loadNote(currentNoteIdx);
}

// -------------------------
//  Envelope open / close
// -------------------------

let busy = false;

function openEnvelope() {
  if (busy) return;
  busy = true;
  markAsRead();
  currentNoteIdx = 0;
  applyTilt();
  loadNote(0);
  document.getElementById('envWrap').classList.add('hidden');
  document.getElementById('hint').classList.add('hidden');
  const nw = document.getElementById('noteWrap');
  nw.classList.add('drifting');
  nw.addEventListener('animationend', () => {
    nw.classList.remove('drifting');
    nw.classList.add('visible');
    busy = false;
  }, { once: true });
}

function closeNote() {
  if (busy) return;
  busy = true;
  const nw = document.getElementById('noteWrap');
  nw.classList.remove('visible');
  setTimeout(() => {
    document.getElementById('envWrap').classList.remove('hidden');
    document.getElementById('hint').classList.remove('hidden');
    busy = false;
  }, 520);
}

// -------------------------
//  Save note as image
// -------------------------

function replyToNote() {
  const body = notes[currentNoteIdx].body;
  const preview = body.length > 50 ? body.slice(0, 50).trimEnd() + '…' : body;
  const text = `replying to: "${preview}" 💌\n\n`;
  window.open(`sms:+19199464600&body=${encodeURIComponent(text)}`);
}

function saveNote() {
  const note = document.querySelector('.note');
  html2canvas(note, { useCORS: true, scale: 2 }).then(canvas => {
    const link = document.createElement('a');
    const d = new Date();
    link.download = `note-${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// -------------------------
//  Falling hearts
// -------------------------

// ── star field background ──
(function () {
  const canvas = document.getElementById('starBg');
  const ctx    = canvas.getContext('2d');
  const COUNT  = 220;
  let stars    = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); build(); });

  function build() {
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x:      rand(0, canvas.width),
        y:      rand(0, canvas.height),
        r:      rand(0.2, 1.3),
        base:   rand(0.15, 0.7),
        speed:  rand(0.3, 1.4),
        offset: rand(0, Math.PI * 2),
        hue:    Math.random() < 0.15 ? 'lavender' : Math.random() < 0.12 ? 'gold' : 'white',
      });
    }
  }
  build();

  let shooters = [];
  let lastShoot = 0;
  const SHOOT_MS = 4000;

  function spawnShooter() {
    shooters.push({
      x: rand(canvas.width * 0.05, canvas.width * 0.85),
      y: rand(0, canvas.height * 0.35),
      len:   rand(80, 140),
      speed: rand(6, 11),
      angle: rand(22, 38) * Math.PI / 180,
      life:  1,
      decay: rand(0.02, 0.032),
    });
  }

  function frame(ts) {
    requestAnimationFrame(frame);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = ts / 1000;

    for (const s of stars) {
      const alpha = Math.max(0, s.base + Math.sin(t * s.speed + s.offset) * 0.22);
      const color = s.hue === 'lavender'
        ? `rgba(190,170,255,${alpha})`
        : s.hue === 'gold'
        ? `rgba(255,235,160,${alpha})`
        : `rgba(220,230,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    if (ts - lastShoot > SHOOT_MS) { spawnShooter(); lastShoot = ts; }
    shooters = shooters.filter(s => s.life > 0);
    for (const s of shooters) {
      const tx = s.x + Math.cos(s.angle) * s.len;
      const ty = s.y + Math.sin(s.angle) * s.len;
      const g = ctx.createLinearGradient(s.x, s.y, tx, ty);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.5, `rgba(210,200,255,${s.life * 0.6})`);
      g.addColorStop(1, `rgba(255,255,255,${s.life})`);
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(tx, ty);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.1;
      ctx.stroke();
      s.x += Math.cos(s.angle) * s.speed;
      s.y += Math.sin(s.angle) * s.speed;
      s.life -= s.decay;
    }
  }
  requestAnimationFrame(frame);
})();

const heartsCanvas = document.getElementById('heartsCanvas');
const colors = ['#e8e0ff','#d8ccff','#f0e8ff','#fff0f8','#c8c0f0','#ffe8f8'];

const hearts = [];
for (let i = 0; i < 55; i++) {
  const el = document.createElement('div');
  el.className = 'heart';
  el.textContent = '♥';
  el.style.fontSize = `${7 + Math.random() * 11}px`;
  el.style.color = colors[Math.floor(Math.random() * colors.length)];
  heartsCanvas.appendChild(el);
  hearts.push({
    el,
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    speed: 0.6 + Math.random() * 1.2,
    delay: Math.random() * 8000,
    born: false,
  });
}

let lastTime = null;
function animate(ts) {
  if (!lastTime) lastTime = ts;
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  const vw = window.innerWidth;
  const vh = window.innerHeight;

  for (const h of hearts) {
    if (!h.born) {
      if (ts < h.delay) continue;
      h.born = true;
    }

    h.y += h.speed * (dt / 16);

    if (h.x < -20) h.x = vw + 20;
    if (h.x > vw + 20) h.x = -20;

    if (h.y > vh + 30) {
      h.y = -20;
      h.x = Math.random() * vw;
      h.speed = 0.6 + Math.random() * 1.2;
    }

    const p = h.y / vh;
    let opacity = 0;
    if (p < 0.08) opacity = (p / 0.08) * 0.5;
    else if (p < 0.85) opacity = 0.5 - ((p - 0.08) / 0.77) * 0.25;
    else opacity = Math.max(0, (1 - p) / 0.15 * 0.25);

    h.el.style.transform = `translate(${h.x}px, ${h.y}px)`;
    h.el.style.opacity = opacity;
  }

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
