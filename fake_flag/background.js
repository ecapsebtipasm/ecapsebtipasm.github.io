import { createFlagPool } from './random-pool.js';
const wall = document.querySelector('#flag-wall');
const REFRESH_MS = 2000;
let available = [];
let pool;
let cells = 0;
let columns = 0;
let rows = 0;
let refreshTimer;

function refresh() {
  if (!available.length || !cells) return;
  const selection = pool.take(cells);
  const fragment = document.createDocumentFragment();
  for (const name of selection.slice(0, cells)) {
    const image = document.createElement('img');
    image.src = new URL(`./assets/flags/${name}?v=deck-3`, import.meta.url).href;
    image.alt = '';
    image.width = 513;
    image.height = 342;
    image.draggable = false;
    fragment.append(image);
  }
  // All sources are already decoded. Replace the complete grid in one paint.
  wall.replaceChildren(fragment);
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
  const response = await fetch(new URL('./assets/flags.json?v=deck-3', import.meta.url));
  if (!response.ok) throw new Error(`Flag list: HTTP ${response.status}`);
  const names = await response.json();
  const loaded = await Promise.allSettled(names.map(async (name) => {
    const image = new Image();
    image.src = new URL(`./assets/flags/${name}?v=deck-3`, import.meta.url).href;
    await image.decode();
    return name;
  }));
  available = loaded.filter(item => item.status === 'fulfilled').map(item => item.value);
  wall.dataset.poolSize = String(available.length);
  wall.dataset.sourceCount = String(names.length);
  if (!available.length) throw new Error('No flag SVGs could be loaded.');
  pool = createFlagPool(available);
  const failed = names.filter((_, i) => loaded[i].status === 'rejected');
  if (failed.length) throw new Error(`Failed to load ${failed.length} of ${names.length} flags: ${failed.join(', ')}`);
  refresh();
  restartTimer();
  document.addEventListener('visibilitychange', restartTimer);
}
