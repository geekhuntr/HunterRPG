# Surgical Instrument Practical

Quizlet-style study app built from three instructor tray lists (Minor 23 rows, Major 39 rows, D&C 19 rows = 81 rows).

- `src/rows.js` - every list row, transcribed verbatim (wording, quantity, note) and linked to a study record.
- `src/records.js` - 49 study records (name, aliases, category, one-sentence function, identifying features, look-alike and the difference), plus the "needs confirmation" flags.
- `src/compare.js`, `src/sources.js` - comparison cards and the references list.
- `src/engine.js` - prioritisation (missed items first), alias matching, and distractor selection that never puts two correct answers in one question.
- `src/app.js`, `src/styles.css` - the UI.
- `photos/` - 15 D&C instrument crops from the class tray photo (handwritten labels removed).

Build: `node build.js` writes `dist/index.html` (open locally) and `dist/artifact.html` (page body for publishing).
Tests: `node tests/data.test.js`.

Study notes only; confirm details with your instructor and course text.
