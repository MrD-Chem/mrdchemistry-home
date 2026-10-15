# mrdchemistry.com

The homepage for MR.D Chemistry, served by GitHub Pages. It links to:

- **Games** — https://games.mrdchemistry.com (repo: MrD-Chem/mrd-games)
- **Notes** — https://notes.mrdchemistry.com (repo: MrD-Chem/mrd-notes)

`assets/site.css` is copied from the games site so all three sites look alike.

## Files

- `index.html` — the page. The floating background molecules and the beaker
  meniscus are drawn once as inline SVG `<symbol>`s at the top of `<body>`;
  no JavaScript (the Content-Security-Policy blocks all scripts).
- `assets/home.css` — homepage layout, the "liquid glass" look and the gentle
  CSS animations. The file's header comment explains how it stays fast:
  - The colour behind the glass is static gradients (`main::before`,
    `main::after`, `.site-footer::before`); glass surfaces are tinted, not blurred.
  - Real backdrop blur is used in two small places only: the floating header bar
    (720px and up, and only after the page has scrolled 40px, switched on by a CSS
    scroll timeline; browsers without scroll timelines get a darker bar with no blur,
    and with "reduce motion" the bar stays frosted because nothing moves behind it)
    and the floating Games / Notes tab bar on phones.
  - `scroll-padding` on `html` keeps a link reached with the Tab key clear of the
    sticky header bar and the phone tab bar. If either bar changes height, update it.
  - The Games / Notes cards are glass beakers with coloured liquid and bubbles.
  - Animations move transform/opacity only, play for about a minute after the page
    opens and then rest. To make them loop forever, change their iteration counts
    to `infinite`. Everything holds still for "reduce motion".
  - Reduce transparency / more contrast / no backdrop-filter support get solid surfaces.
- `assets/cover-games.svg`, `assets/cover-notes.svg` — cover art for the two big cards.
- `assets/variable-dash.svg` — icon for the Variable Dash featured card.
- `assets/lab-bench.svg` — the bench Professor Mole stands behind.
- `assets/professor-mole.svg`, `assets/great-scale.svg` — copied from the games
  site (`games/balance-quest/art/`). Copy them again if that art changes.

When you change a stylesheet, bump the `?v=` on its `<link>` in `index.html` so
browsers fetch the new copy.

To change the featured games, edit the "Featured games" list in `index.html`.
Each game's tag is two spans, `<span>Subject</span><span>Topic</span>`; the "·"
between them is drawn by CSS (`.dot-list`) so it never dangles when the line wraps.
