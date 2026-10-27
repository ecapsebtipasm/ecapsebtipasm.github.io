const wall = document.querySelector('#flag-wall');
const REFRESH_MS = 2000;
let available = [];
let previous = [];
let cells = 0;
let columns = 0;
let rows = 0;
let refreshTimer;

function shuffled(source) {
  const result = [...source];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function refresh() {
  if (!available.length || !cells) return;
  // Draw without replacement within each pool, even for unusually tall windows.
  const selection = [];
  while (selection.length < cells) selection.push(...shuffled(available));
  for (let i = 0; i < cells; i++) {
    if (selection[i] !== previous[i]) continue;
    const swap = selection.findIndex((value, j) => j !== i && value !== previous[i]
      && selection[i] !== previous[j]);
    if (swap >= 0) [selection[i], selection[swap]] = [selection[swap], selection[i]];
  }
  const fragment = document.createDocumentFragment();
  for (const name of selection.slice(0, cells)) {
    const image = document.createElement('img');
    image.src = new URL(`./assets/flags/${name}`, import.meta.url).href;
    image.alt = '';
    image.width = 513;
    image.height = 342;
    image.draggable = false;
    fragment.append(image);
  }
  // All sources are already decoded. Replace the complete grid in one paint.
  wall.replaceChildren(fragment);
  previous = selection.slice(0, cells);
  wall.dataset.generation = String(Number(wall.dataset.generation || 0) + 1);
}

export function resizeFlagWall(width, height, referenceWidth) {
  const nextColumns = Math.max(1, Math.round(width / referenceWidth));
  const tileWidth = width / nextColumns;
  const tileHeight = tileWidth * 2 / 3;
  const nextRows = Math.ceil(height / tileHeight);
  wall.style.setProperty('--columns', String(nextColumns));
  wall.style.setProperty('--tile-width', `${tileWidth}px`);
  wall.style.setProperty('--tile-height', `${tileHeight}px`);
  if (nextColumns !== columns || nextRows !== rows) {
    columns = nextColumns;
    rows = nextRows;
    cells = columns * rows;
    refresh();
  }
}

function restartTimer() {
  clearInterval(refreshTimer);
  if (!document.hidden) refreshTimer = setInterval(refresh, REFRESH_MS);
}

export async function startFlagWall() {
  const response = await fetch(new URL('./assets/flags.json?v=3x2-1', import.meta.url));
  if (!response.ok) throw new Error(`Flag list: HTTP ${response.status}`);
  const names = await response.json();
  const loaded = await Promise.allSettled(names.map(async (name) => {
    const image = new Image();
    image.src = new URL(`./assets/flags/${name}`, import.meta.url).href;
    await image.decode();
    return name;
  }));
  available = loaded.filter(item => item.status === 'fulfilled').map(item => item.value);
  if (!available.length) throw new Error('No flag SVGs could be loaded.');
  refresh();
  restartTimer();
  document.addEventListener('visibilitychange', restartTimer);
}
