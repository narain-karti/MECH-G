import { renderFilm, DUR } from './film.js';

const cv = document.getElementById('c');
const g = cv.getContext('2d');

window.DUR = DUR;
window.render = (t) => renderFilm(g, t);
window.READY = true;
console.log("[MECH-G Lemo-Keynote] Canvas initialized, DUR =", DUR);
