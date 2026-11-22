// Page contract for lemo-opuscar: window.READY, window.render(t), window.DUR
import { renderScene } from './film.js';
import { DURATION, TOTAL_FRAMES, FPS } from './timeline.js';

const cv = document.getElementById('c');
const g = cv.getContext('2d');

try {
  await document.fonts.ready;
} catch (e) {
  console.warn("Font loading wait skipped", e);
}

window.DUR = DURATION;
window.TOTAL_FRAMES = TOTAL_FRAMES;
window.FPS = FPS;

window.render = async function(t) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  renderScene(g, t);
};

// Ready flag required by core/render/still.mjs and video.mjs
window.READY = true;
