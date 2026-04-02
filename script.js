let notes = [];

function setUnreadIndicator(hasUnread) {
  document.getElementById('envWrap').classList.toggle('has-unread', hasUnread);
  const hint = document.getElementById('hint');
  if (hint && !hint.classList.contains('hidden')) {
    hint.textContent = hasUnread ? 'new note from sj ♡' : 'tap to open ♡';
  }
}

function markAsRead() {
  const newest = notes[0];
  if (newest) localStorage.setItem('sj_last_read', newest.body);
  document.getElementById('envWrap').classList.remove('has-unread');
  const hint = document.getElementById('hint');
  if (hint) hint.textContent = 'tap to open ♡';
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
//  Day counter
// -------------------------


// -------------------------
//  Note loading & navigation
// -------------------------

let currentNoteIdx = 0;

function loadNote(idx) {
  const n = notes[idx];
  document.getElementById('noteBody').textContent = n.body;
  document.getElementById('noteDate').textContent = n.date;

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

const heartsCanvas = document.getElementById('heartsCanvas');
const colors = ['#f5b8c8','#f9c8d4','#f0a8b8','#fcd0dc','#e8a0b4','#f4c0cc'];

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
