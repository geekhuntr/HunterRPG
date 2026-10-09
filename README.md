# D&C Tray Trainer

A Quizlet-style study app for the dilation & curettage (D&C) surgical instrument tray. No build step, no dependencies:
open `index.html` in a browser (or serve the folder with any static host, e.g. `python3 -m http.server`).

## How the learning algorithm works

Every instrument has two independently scheduled cards ("facets"):

| Facet | Question | Trains |
|---|---|---|
| **Recognition** (`see`) | picture -> name | visual identification at the back table |
| **Recall** (`know`) | function -> name, typed names | knowing what it is for |

* **Scheduler** (`js/srs.js`): SM-2 style with Anki-like learning steps (1m, 10m), graduation to 1 day (Easy: 4 days),
  per-card ease (floor 1.3), lapse handling with a 10-minute relearn step, and a 365-day cap.
* **Auto-grading**: quiz/type answers are graded automatically - wrong = Again, slow or typo = Hard, normal = Good,
  fast with a streak = Easy. Flashcards use self-rating with interval previews.
* **Queue**: learning cards first, then due reviews (lowest estimated retention first) with new cards interleaved
  (default 10 new cards/day); the same instrument is never shown back-to-back; missed cards return within the session.
* **Confusion tracking**: when you mix up two instruments the pair is recorded, and quiz distractors are chosen from
  look-alikes (same visual family), same-phase instruments, and your personal mix-up history.
* **Drill weakest 20** ignores due dates for cramming.

Progress, mix-ups and uploaded photos are stored in the browser's `localStorage`; use Progress -> Export to back up.

## Customising

* Edit `js/data.js` to match your tray (names, aliases, descriptions, phases). The set currently mirrors the labeled tray photo: 17 items.
* Instrument photos live in `assets/img/<id>.jpg` and are crops of the labeled tray photo (handwritten labels removed). Swap a file to change a picture, or use the Tray page to override one with your own photo in the browser.

## Tests

`node tests/srs.test.js`

> Educational aid only. Trays vary by facility and surgeon - verify against your own pick list and policies.
