# mrdchemistry.com

The homepage for Mr. D Chemistry, served by GitHub Pages. Navigation and the
three destination cards appear in this order:

- **Games** — https://games.mrdchemistry.com/ (repo: MrD-Chem/mrd-games)
- **Pathways** — `pathways/` in this repo
- **Notes** — https://notes.mrdchemistry.com/ (repo: MrD-Chem/mrd-notes).
  The navigation link stays available; the resting “Coming soon” card has no link
  or button until the notes are ready.

`assets/site.css` is copied from the games site so all three sites look alike.

## Files

- `index.html` — the page. Floating background molecules and the beaker
  meniscus are drawn once as inline SVG `<symbol>`s at the top of `<body>`;
  no JavaScript (the Content-Security-Policy blocks all scripts).
- `assets/home.css` — homepage layout, the “liquid glass” look and gentle
  CSS animations. The file's header comment explains how it stays fast:
  - The colour behind the glass is static gradients (`main::before`,
    `main::after`, `.site-footer::before`); glass surfaces are tinted, not blurred.
  - Real backdrop blur is used in two small places only: the floating header bar
    (720px and up, and only after the page has scrolled 40px, switched on by a CSS
    scroll timeline; browsers without scroll timelines get a darker bar with no blur,
    and with “reduce motion” the bar stays frosted because nothing moves behind it)
    and the floating Games / Pathways / Notes tab bar on phones.
  - `scroll-padding` on `html` keeps a link reached with the Tab key clear of the
    sticky header bar and phone tab bar. If either bar changes height, update it.
  - The destination cards are glass beakers with coloured liquid. Notes has dimmed,
    still decoration and opaque, readable text. Only linked cards react to hover.
  - Below 720px, cards become compact rows with 104px square cover art and 44px
    button capsules. Short Games / Pathways descriptions fit one line; the full
    Notes message wraps. Text can grow when students enlarge their font size.
  - Animations move transform/opacity only, play for about a minute after the page
    opens and then rest. Everything holds still for “reduce motion”.
  - Reduce transparency / more contrast / no backdrop-filter support get solid surfaces.
  - Footer bottom spacing clears the 60px phone tab bar and its 12px bottom offset.
- `assets/cover-games.svg`, `assets/cover-pathways.svg`, `assets/cover-notes.svg`
  — cover art for the three destination cards.
- `assets/cover-particle-dash.svg`, `assets/cover-isotope-mixer.svg`
  — the current class game icons. These 320×180 SVGs are supplied separately;
  CSS crops their centred subjects into square icon boxes with `object-fit: cover`.
- `assets/lab-bench.svg` — the bench Professor Mole stands behind.
- `assets/professor-mole.svg` — copied from the games site
  (`games/balance-quest/art/`). Copy it again if that art changes.

When you change a stylesheet, bump the `?v=` on its `<link>` in `index.html` so
browsers fetch the new copy. Both links currently use `20261115`.

## To change the featured games

The former “Featured games” section is now the “In class now” unit strip.
In `index.html`, find the teacher comment immediately above `<section class="featured wrap">`:

1. Edit the text inside `<h2 id="featured-title">` (currently “Unit 4: Atomic Structure”).
2. For each `<li>` inside `<ul class="feature-list">`, edit the game link's `href`,
   the image's `src`, the two `feature-tag` spans (subject and topic), the
   `feature-title`, and the `feature-blurb`. Keep decorative image `alt=""`.
3. Copy or remove a whole `<li>` to add or remove a game. Keep the “All games”
   pill pointing to `https://games.mrdchemistry.com/`.

Use relative image paths. Each game's tag is two spans,
`<span>Subject</span><span>Topic</span>`; CSS (`.dot-list`) draws the “·” between
them so it never dangles when the line wraps. Keep blurbs to one short sentence;
they wrap naturally on small screens.
