import { createFlagPool } from './random-pool.js';

const wall = document.querySelector('#flag-wall');
const REFRESH_MS = 2000;
const images = new Map();
let pool;
let layout;
let timer;
let context;
let generation = 0;

function measure() {
  // Measure the actual fixed layer, not the potentially different layout viewport
  // reported by iOS / WeChat while their browser bars expand or collapse.
  const bounds = wall.getBoundingClientRect();
  const width = bounds.width;
  const height = bounds.height;
  if (!width || !height) return null;
  const viewHeight = Math.max(6.8, 5.6 / (width / height));
  const referenceWidth = 3.35 * height / viewHeight;
  const columns = Math.max(1, Math.round(width / referenceWidth));
  const tileHeight = width / columns * 2 / 3;
  const rows = Math.ceil(height / tileHeight);
  return { width, height, columns, rows, count: columns * rows };
}

function draw() {
  if (!pool) return;
  layout = measure();
  if (!layout) return;
  const { width, height, columns, rows, count } = layout;
  const selection = pool.take(count);
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const pixelWidth = Math.ceil(width * ratio);
  const pixelHeight = Math.ceil(height * ratio);
  if (wall.width !== pixelWidth) wall.width = pixelWidth;
  if (wall.height !== pixelHeight) wall.height = pixelHeight;
  context ||= wall.getContext('2d');
  if (!context) throw new Error('The flag background canvas is unavailable.');
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.fillStyle = '#fff';
  context.fillRect(0, 0, pixelWidth, pixelHeight);
  // One synchronous paint updates EVERY tile. Keep decoded image objects alive;
  // no fresh image requests or empty DOM image slots appear during a refresh.
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const left = Math.floor(col * pixelWidth / columns);
      const right = Math.ceil((col + 1) * pixelWidth / columns);
      const top = Math.floor(row * pixelWidth / columns * 2 / 3);
      const bottom = Math.ceil((row + 1) * pixelWidth / columns * 2 / 3);
      context.drawImage(images.get(selection[row * columns + col]),
        left, top, right - left, bottom - top);
    }
  }
  // The CN fallback is ONLY for loading, never a permanent layer behind tiles.
  wall.classList.add('is-ready');
  wall.dataset.generation = String(++generation);
  wall.dataset.flags = JSON.stringify(selection);
  wall.dataset.columns = String(columns);
  wall.dataset.rows = String(rows);
  wall.dataset.cellCount = String(count);
}

function checkSize() {
  const next = measure();
  if (next && (!layout || next.width !== layout.width || next.height !== layout.height)) draw();
}

function restartTimer() {
  clearInterval(timer);
  if (!document.hidden) timer = setInterval(draw, REFRESH_MS);
}

export async function startFlagWall() {
  const response = await fetch(new URL('./assets/flags.json?v=mobile-canvas-4', import.meta.url));
  if (!response.ok) throw new Error(`Flag list: HTTP ${response.status}`);
  const names = await response.json();
  const loaded = await Promise.allSettled(names.map(async name => {
    const image = new Image();
    image.src = new URL(`./assets/flags/${name}?v=deck-3`, import.meta.url).href;
    await image.decode();
    images.set(name, image);
  }));
  wall.dataset.poolSize = String(images.size);
  wall.dataset.sourceCount = String(names.length);
  const failed = names.filter((_, i) => loaded[i].status === 'rejected');
  if (failed.length) throw new Error(`Failed to load ${failed.length} flags: ${failed.join(', ')}`);
  pool = createFlagPool(names);
  draw();
  restartTimer();
  new ResizeObserver(checkSize).observe(wall);
  window.addEventListener('resize', checkSize);
  window.addEventListener('orientationchange', checkSize);
  window.visualViewport?.addEventListener('resize', checkSize);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { checkSize(); draw(); }
    restartTimer();
  });
}
