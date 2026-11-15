# Le Tran Lam Vinh — portfolio

A four-page portfolio (home, about, projects, contact) in a murim / cultivation martial-arts mood: ink ridgelines, bamboo, drifting embers, red seal chops. All artwork is original and drawn in code. Not affiliated with any game studio.

## Files
- css/style.css  all styles. one storm-night look painted in canvas (no image files)
- js/scene.js    canvas background scene (ridges, mist, bamboo, embers or fireflies); `LTLWater.setPalette(name)`
- js/seal.js     red seal chops (SVG, Chinese glyphs) used instead of icons
- js/main.js     header, music bar, menu, calendar, mode switch, page transitions
- js/player.js   audio player
- assets/        images, logos, audio

## Run
Open index.html, or serve the folder: `python3 -m http.server`.

## Change things
- Scene colours: `PAL` at the top of js/scene.js. Panel and text colours: the `:root` and `:root[data-hour="night"]` blocks in css/style.css.
- Seal glyphs: `SEALS` in js/seal.js; set `data-seal` on a `.seal` element.
- Music: the default track is "Color Your Night" by Shoji Meguro; replace the files in assets/audio and the list in js/player.js with music you have rights to.
