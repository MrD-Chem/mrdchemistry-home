# mrdchemistry.com

The homepage for MR.D Chemistry, served by GitHub Pages. It links to:

- **Games** — https://games.mrdchemistry.com (repo: MrD-Chem/mrd-games)
- **Notes** — https://notes.mrdchemistry.com (repo: MrD-Chem/mrd-notes)

`assets/site.css` is copied from the games site so all three sites look alike.

## Files

- `index.html` — the page. The floating background molecules are drawn once as
  inline SVG `<symbol>`s at the top of `<body>`; no JavaScript.
- `assets/home.css` — homepage layout and the gentle CSS animations
  (transform/opacity only, all turned off for "reduce motion").
- `assets/cover-games.svg`, `assets/cover-notes.svg` — cover art for the two big cards.
- `assets/variable-dash.svg` — icon for the Variable Dash featured card.
- `assets/lab-bench.svg` — the bench Professor Mole stands behind.
- `assets/professor-mole.svg`, `assets/great-scale.svg` — copied from the games
  site (`games/balance-quest/art/`). Copy them again if that art changes.

To change the featured games, edit the "Featured games" list in `index.html`.
Each game's tag is two spans, `<span>Subject</span><span>Topic</span>`; the "·"
between them is drawn by CSS (`.dot-list`) so it never dangles when the line wraps.
