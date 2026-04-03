# writingforjalyn

A private web app for sending notes to someone special. Sarah writes, Jalyn reads.

---

## Overview

A static site hosted on Vercel. No backend, no database, no frameworks. Notes are stored in a plain JSON file committed to this GitHub repo. When a note is added or changed, Vercel detects the commit and redeploys automatically — usually within 30 seconds.

---

## File Structure

```
writingforjalyn/
├── index.html       — Jalyn's reader interface
├── script.js        — All JS for the reader side
├── style.css        — All styles for the reader side
├── admin.html       — Sarah's admin console
├── admin.css        — Styles for the admin console
├── notes.json       — The note data (source of truth)
├── envelope.png     — Envelope illustration
├── icon.png         — App icon (Jalyn's side)
└── adminicon.png    — App icon (admin side)
```

---

## Data — notes.json

All notes live in `notes.json` as an array, newest first:

```json
[
  {
    "date": "April 3, 2026",
    "body": "the note text goes here.",
    "image": "https://res.cloudinary.com/..."
  }
]
```

- `date` — formatted date string, set automatically by the admin
- `body` — the note text (can be empty if the note is photo-only)
- `image` — optional Cloudinary URL for a photo note

---

## Admin Side — admin.html

Sarah's writing interface. Terminal-style aesthetic.

**Setup required:**
- A GitHub Personal Access Token (PAT) with `repo` scope — entered once and saved in `localStorage`

**How it works:**

1. On load, fetches `notes.json` from the GitHub API and populates the transmission list
2. Sarah writes a note in the message body field and optionally attaches a photo
3. On transmit:
   - If a photo is attached, it uploads to Cloudinary first and gets back a URL
   - The note object `{ date, body, image? }` is prepended to the notes array
   - The updated array is base64-encoded and committed back to the repo via GitHub API
   - Vercel picks up the commit and redeploys
4. The transmission list updates optimistically (rolls back if the commit fails)

**Image uploads — Cloudinary:**
- Cloud name: `dtggzaknr`
- Upload preset: `writingforjalyn` (unsigned)
- Images upload directly from the browser — no backend needed

**Features:**
- Live clock in the titlebar
- Stats panel showing total notes and latest date
- Inline edit and delete for any existing note
- Photo thumbnails in the transmission list for notes with images

---

## Reader Side — index.html + script.js + style.css

Jalyn's experience. Soft, handwritten aesthetic with falling hearts.

**Flow:**
1. Envelope screen shown on load
2. If there's an unread note, the envelope glows pink and the hint text reads "new note from sj ♡"
3. Tapping the envelope opens it and the note drifts up
4. Notes are navigable with previous/next arrows if there are multiple
5. Tapping outside the note closes it back to the envelope screen

**Features:**

| Feature | How it works |
|---|---|
| Unread indicator | Compares the newest note body to `sj_last_read` in `localStorage`. Glows the envelope and updates the hint text if they don't match. Clears when she opens the envelope. |
| Auto-refresh | Fetches `notes.json` when the browser tab becomes visible again (e.g. switching back to the app). Also polls every 5 minutes as a fallback. |
| Photo notes | If a note has an `image` field, the photo renders between the body text and the sign-off on the note card. |
| Save note | Uses `html2canvas` to render the note card as a PNG and download it. |
| Reply | Opens a pre-filled SMS to Sarah's number with a preview of the current note. |
| Falling hearts | 55 heart characters animated via `requestAnimationFrame`, staggered with random delays and speeds. |
| Note stack | Up to two "behind" cards are shown beneath the front note to give a layered paper feel. |

**Cache-busting:**
Every fetch appends `?t=Date.now()` to `notes.json` to prevent the browser from serving a stale cached version.

---

## Deployment

Hosted on Vercel, connected to this GitHub repo. Every push to `main` triggers a redeploy. No build step — Vercel serves the files as-is.

The admin page writes directly to GitHub via the API, which triggers the Vercel deploy. The full cycle from Sarah hitting transmit to Jalyn seeing the note is roughly 30–60 seconds.

---

## Local Development

Since this is plain HTML/CSS/JS with no build step, any local static file server works:

```bash
python -m http.server 3000
```

Then open `http://localhost:3000` for the reader or `http://localhost:3000/admin.html` for the admin.
