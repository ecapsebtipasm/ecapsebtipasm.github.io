let cam;
let accumulatedImage;
let substituteLayer;
let textMask;
let revealLayer;

let currentThreshold = 0;

let snapshotInterval = 20;
let lastSnapshot = 0;

function setup() {
  let cnv = createCanvas(1280, 960);
  cnv.parent("canvas-container");

  cam = createCapture(VIDEO);
  cam.size(640, 480);
  cam.hide();

  accumulatedImage = createGraphics(width, height);
  substituteLayer = createGraphics(width, height);
  textMask = createGraphics(width, height);
  revealLayer = createGraphics(width, height);

  drawTextMask();
  background(0);
}

function draw() {
  image(accumulatedImage, 0, 0);
  image(substituteLayer, 0, 0);
  image(revealLayer, 0, 0);

  if (millis() - lastSnapshot > snapshotInterval) {
    processFrame();
    lastSnapshot = millis();
  }

  let percent = floor((currentThreshold / 255) * 100);
  document.getElementById("visibility").innerText = "visibility: " + percent + "%";
}

function processFrame() {
  cam.loadPixels();
  if (cam.pixels.length === 0) return;

  let w = cam.width;
  let h = cam.height;

  let brightnessValues = new Array(w * h);

  for (let i = 0; i < cam.pixels.length; i += 4) {
    let b = brightness(color(cam.pixels[i], cam.pixels[i+1], cam.pixels[i+2]));
    brightnessValues[i / 4] = b;
  }

  let sorted = brightnessValues.slice().sort((a,b) => a - b);
  currentThreshold = sorted[floor(0.98 * sorted.length)];

  accumulatedImage.noStroke();
  substituteLayer.noStroke();

  accumulatedImage.beginDraw();
  substituteLayer.beginDraw();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let i = x + y * w;

      if (brightnessValues[i] >= currentThreshold) {
        let idx = i * 4;
        let r = cam.pixels[idx];
        let g = cam.pixels[idx + 1];
        let b = cam.pixels[idx + 2];

        let bigX = x * 2;
        let bigY = y * 2;

        let maskC = textMask.get(bigX, bigY);
        let inText = brightness(maskC) > 127;

        if (inText) {
          let sub = substituteColor(color(r, g, b));
          substituteLayer.fill(sub);
          substituteLayer.rect(bigX, bigY, 2, 2);

          revealLayer.beginDraw();
          revealLayer.noStroke();
          revealLayer.fill(red(sub), green(sub), blue(sub), 10);
          revealLayer.rect(bigX, bigY, 2, 2);
          revealLayer.endDraw();
        } else {
          accumulatedImage.fill(r, g, b);
          accumulatedImage.rect(bigX, bigY, 2, 2);
        }
      }
    }
  }

  accumulatedImage.endDraw();
  substituteLayer.endDraw();
}

function substituteColor(c) {
  return color(255 - red(c), 255 - green(c), 255 - blue(c));
}

function drawTextMask() {
  textMask.beginDraw();
  textMask.background(0);
  textMask.fill(255);
  textMask.textSize(16);
  textMask.textAlign(LEFT, TOP);
  textMask.text(
    "Light /līt/ (n./adj.)\n" +
    "It always eats first. It eats the name off the thing and leaves the thing blinking.\n" +
    "Then, inevitably, that mouth stands and talk like a child who never\n" +
    "learned sorry.\n" +
    "All the entities are spoken by it, only part of it would be remembered\n" +
    "by its tongue. Lighten this or that, you put the subject after the verb, not\n" +
    "the object. It breaks nouns into ash, and forget its purpose. Then the\n" +
    "unspeakable remembers, like light doesn’t say and never said anything.\n" +
    "It doesn’t say but said open.\n" +
    "It doesn’t fall but enters.",
    40,
    200,
    width - 80
  );
  textMask.endDraw();
}