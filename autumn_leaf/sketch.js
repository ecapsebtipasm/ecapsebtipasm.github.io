// === Config & Globals ===
const LEAF_COUNT = 30;  
const LEAF_SIZE = 40;  
const MARGIN = 50;            
let palette;

let balls = [];                
let BALL_COUNT = 60;

// global speed controls
let speedScale = 1.0;
const SPEED_STEP = 0.1;
const MIN_SPEED_SCALE = 0.2;
const MAX_SPEED_SCALE = 4.0;

const ACCEL_UP = 1.01;
const DECEL_DOWN = 0.99;
const MIN_SPEED = 0.2;
const MAX_SPEED = 6.0;

// IDs + touch tracking
let nextBallId = 1;
const pairTouchCounts = new Map();
const activeOverlaps = new Set();

// dots that settle into leaf outline
let dotBursts = [];

// cursor swirl force
const SWIRL_RADIUS = 200;      // radius of influence (px)
const PUSH_STRENGTH = 0.6;     // outward acceleration
const SWIRL_STRENGTH = 1.0;    // tangential acceleration
const FORCE_FALLOFF = 1.0;     // 1.0 = linear falloff


let grassLayer; 


function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(RADIANS);
  palette = [
    color(34,139,34),   
    color(46,139,87),  
    color(60,179,113), 
    color(0,128,0),
    color(200,23,40),
    color(188,109,11)
  ];

  // make static grass once
  grassLayer = createGraphics(windowWidth, windowHeight);
  generateGrassBackground();

  drawScene(); 
}

function draw() {
  // background color + static grass
  background(250,220,80);
  image(grassLayer, 0, 0);

  // animate leaves
  for (let b of balls) {
    b.update();
    b.draw();
  }

  // interactions
  handlePairTouches();
  updateAndDrawDotBursts();
  cleanupRemovedBalls();
}

// === Classes ===
class Ball {
  constructor(x, y, vx, vy, r, strokeCol, sw, rot, rotSpeed) {
    this.id = nextBallId++;
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.r = r;              
    this.strokeCol = strokeCol;
    this.sw = sw;
    this.rot = rot;
    this.rotSpeed = rotSpeed;

    this.edgeHits = 0;
    this.toRemove = false;
  }

  update() {
    // swirling push force around the cursor
    applyCursorSwirlForce(this);

    this.x += this.vx * speedScale;
    this.y += this.vy * speedScale;
    this.rot += this.rotSpeed;

    // bounce + edge hit counting
    let bounced = false;
    if (this.x < this.r || this.x > width - this.r) {
      this.vx *= -1;
      this.x = constrain(this.x, this.r, width - this.r);
      bounced = true;
    }
    if (this.y < this.r || this.y > height - this.r) {
      this.vy *= -1;
      this.y = constrain(this.y, this.r, height - this.r);
      bounced = true;
    }
    if (bounced) {
      this.edgeHits++;
      if (this.edgeHits >= 3) {
        // dots settle into THIS leaf’s outline, then remove
        spawnLeafDots(this.x, this.y, this.rot, this.strokeCol);
        this.toRemove = true;
      }
    }

    // accelerate when moving up, decelerate when moving down
    let speed = Math.hypot(this.vx, this.vy);
    if (speed > 0) {
      const factor = (this.vy < 0) ? ACCEL_UP : (this.vy > 0 ? DECEL_DOWN : 1.0);
      speed = constrain(speed * factor, MIN_SPEED, MAX_SPEED);
      const hyp = Math.hypot(this.vx, this.vy);
      const nx = this.vx / hyp;
      const ny = this.vy / hyp;
      this.vx = nx * speed;
      this.vy = ny * speed;
    }
  }

  draw() {
    push();
    translate(this.x, this.y);
    rotate(this.rot);
    stroke(this.strokeCol);
    strokeWeight(this.sw);
    noFill();

    const s = LEAF_SIZE / 40; 
    arc(20 * s, 20 * s, 40 * s, 40 * s, PI, PI + HALF_PI);
    arc(0, 0,        40 * s, 40 * s, TWO_PI, HALF_PI);
    pop();
  }
}

// random 1px dots → settle into leaf outline
class DotBurst {
  constructor(cx, cy, rotation, col, numDots = 150) {
    this.cx = cx;
    this.cy = cy;
    this.rotation = rotation;
    this.col = col;
    this.numDots = numDots;
    this.done = false;

    const s = LEAF_SIZE / 40;

    // sample the SHORT, positive sweep for each arc
    const arc1 = sampleArcShort(20 * s, 20 * s, 20 * s, PI, PI + HALF_PI, floor(numDots * 0.5));
    const arc2 = sampleArcShort(0, 0,       20 * s, TWO_PI, HALF_PI,      ceil(numDots * 0.5));
    const pts = arc1.concat(arc2);

    // rotate + translate into world space
    this.targets = pts.map(p => {
      const rx =  p.x * cos(this.rotation) - p.y * sin(this.rotation);
      const ry =  p.x * sin(this.rotation) + p.y * cos(this.rotation);
      return createVector(this.cx + rx, this.cy + ry);
    });

    // initial scatter around the leaf
    const scatterRadius = 60 * s;
    this.pos = this.targets.map(() => {
      const ang = random(TWO_PI);
      const rad = random(scatterRadius * 0.3, scatterRadius);
      return createVector(this.cx + cos(ang) * rad, this.cy + sin(ang) * rad);
    });

    this.ease = 0.12;
    this.arrivedCount = 0;
  }

  updateAndDraw() {
    strokeWeight(1);
    for (let i = 0; i < this.pos.length; i++) {
      const p = this.pos[i];
      const t = this.targets[i];
      const dx = t.x - p.x;
      const dy = t.y - p.y;
      p.x += dx * this.ease;
      p.y += dy * this.ease;

      const d2 = dx*dx + dy*dy;
      if (d2 < 1.0) this.arrivedCount++;

      const closeness = constrain(1.0 - sqrt(d2) / 50.0, 0, 1);
      const a = 60 + closeness * 195;
      stroke(red(this.col), green(this.col), blue(this.col), a);
      point(p.x, p.y);
    }

    if (this.arrivedCount > this.pos.length * 0.9) this.done = true;
    this.arrivedCount = 0;
  }
}

// === Interaction & helpers ===
// Pair-touch logic (NEW: threshold = 2; spawn a new leaf at the 2nd collision)
// No leaves are removed here.
function handlePairTouches() {
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const a = balls[i], b = balls[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distSq = dx * dx + dy * dy;
      const touchDist = a.r + b.r;
      const touching = distSq <= touchDist * touchDist;

      const key = pairKey(a.id, b.id);
      const wasTouching = activeOverlaps.has(key);

      if (touching && !wasTouching) {
        const prev = pairTouchCounts.get(key) || 0;
        const now = prev + 1;
        pairTouchCounts.set(key, now);
        activeOverlaps.add(key);

    
        if (now >= 3) {
          const cx = (a.x + b.x) / 2;
          const cy = (a.y + b.y) / 2;
          spawnNewLeafAt(cx, cy);
          pairTouchCounts.set(key, 0); // reset so they need 2 more collisions for another spawn
        }
      } else if (!touching && wasTouching) {
        activeOverlaps.delete(key);
      }
    }
  }
}

function pairKey(idA, idB) {
  return (idA < idB) ? `${idA}-${idB}` : `${idB}-${idA}`;
}

// Spawn a leaf near a spot (kept, used elsewhere if needed)
function spawnNewLeafNear(x, y) {
  const px = constrain(x + random(-20, 20), MARGIN, width - MARGIN);
  const py = constrain(y + random(-20, 20), MARGIN, height - MARGIN);

  const speed = random(1.0, 2.2);
  const angle = random(TWO_PI);
  const vx = cos(angle) * speed;
  const vy = sin(angle) * speed;

  const r = LEAF_SIZE * 0.9;
  const strokeCol = random(palette);
  const sw = random(1.2, 2.6);
  const rot = random(TWO_PI);
  const rotSpeed = random(-0.02, 0.02);

  const ball = new Ball(px, py, vx, vy, r, strokeCol, sw, rot, rotSpeed);
  balls.push(ball);
  return ball;
}

// NEW: Spawn a leaf exactly at (x, y) (clamped to margins), used for collision spawn
function spawnNewLeafAt(x, y) {
  const px = constrain(x, MARGIN, width - MARGIN);
  const py = constrain(y, MARGIN, height - MARGIN);

  const speed = random(1.0, 2.2);
  const angle = random(TWO_PI);
  const vx = cos(angle) * speed;
  const vy = sin(angle) * speed;

  const r = LEAF_SIZE * 0.9;
  const strokeCol = random(palette);
  const sw = random(1.2, 2.6);
  const rot = random(TWO_PI);
  const rotSpeed = random(-0.02, 0.02);

  const ball = new Ball(px, py, vx, vy, r, strokeCol, sw, rot, rotSpeed);
  balls.push(ball);
  return ball;
}

function cleanupRemovedBalls() {
  if (balls.some(b => b.toRemove)) {
    const removedIds = new Set(balls.filter(b => b.toRemove).map(b => b.id));
    balls = balls.filter(b => !b.toRemove);
    for (let key of Array.from(pairTouchCounts.keys())) {
      const [a, b] = key.split('-').map(Number);
      if (removedIds.has(a) || removedIds.has(b)) {
        pairTouchCounts.delete(key);
        activeOverlaps.delete(key);
      }
    }
  }
}

// swirl force around cursor
function applyCursorSwirlForce(ball) {
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;

  const dx = ball.x - mouseX;
  const dy = ball.y - mouseY;
  const d = Math.hypot(dx, dy);
  if (d === 0 || d > SWIRL_RADIUS) return;

  const nx = dx / d;
  const ny = dy / d;

  // tangential CCW
  const tx = -ny;
  const ty =  nx;

  const t = 1 - d / SWIRL_RADIUS;
  const falloff = Math.pow(t, FORCE_FALLOFF);

  const ax = nx * (PUSH_STRENGTH * falloff) + tx * (SWIRL_STRENGTH * falloff);
  const ay = ny * (PUSH_STRENGTH * falloff) + ty * (SWIRL_STRENGTH * falloff);

  ball.vx += ax;
  ball.vy += ay;
}

// sample the arc using the short, positive sweep
function sampleArcShort(cx, cy, r, a0, a1, k) {
  const pts = [];
  a0 = (a0 % TWO_PI + TWO_PI) % TWO_PI;
  a1 = (a1 % TWO_PI + TWO_PI) % TWO_PI;
  let d = a1 - a0;
  if (d < 0) d += TWO_PI;
  for (let i = 0; i < k; i++) {
    const t = k === 1 ? 0 : i / (k - 1);
    const a = a0 + d * t;
    pts.push({ x: cx + r * cos(a), y: cy + r * sin(a) });
  }
  return pts;
}

function spawnLeafDots(x, y, rot, col) {
  dotBursts.push(new DotBurst(x, y, rot, col));
}

function updateAndDrawDotBursts() {
  for (let b of dotBursts) b.updateAndDraw();
  dotBursts = dotBursts.filter(b => !b.done);
}

// === Scene setup ===
function drawScene() {
  background(245);

  BALL_COUNT = floor(random(8, 31));
  balls = [];

  for (let i = 0; i < BALL_COUNT; i++) {
    const x = random(MARGIN, width - MARGIN);
    const y = random(MARGIN, height - MARGIN);

    const speed = random(1.0, 2.5);
    const angle = random(TWO_PI);
    const vx = cos(angle) * speed;
    const vy = sin(angle) * speed;

    const r = LEAF_SIZE * 0.9;

    const strokeCol = random(palette);
    const sw = random(1.2, 2.6);
    const rot = random(TWO_PI);
    const rotSpeed = random(-0.02, 0.02);

    balls.push(new Ball(x, y, vx, vy, r, strokeCol, sw, rot, rotSpeed));
  }

  for (let b of balls) b.draw();
}

// === Input & resize ===
function keyPressed() {
  if (key === 'r' || key === 'R') {
    // Re-randomize the static grass too
    generateGrassBackground();
    clear();
    drawScene(); 
  } else if (key === 's' || key === 'S') {
    saveCanvas('random-leaves', 'png'); 
  } else if (key === 'f' || key === 'F') {
    speedScale = constrain(speedScale + SPEED_STEP, MIN_SPEED_SCALE, MAX_SPEED_SCALE);
  } else if (key === 'g' || key === 'G') {
    speedScale = constrain(speedScale - SPEED_STEP, MIN_SPEED_SCALE, MAX_SPEED_SCALE);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  grassLayer = createGraphics(windowWidth, windowHeight);
  generateGrassBackground(); // rebuild static grass to fit new size
}

// === Static Grass Background ===
function generateGrassBackground() {
  const g = grassLayer;
  g.clear(); // keep transparent so main background shows through

  // yellowish / muddy ochres & olive greens (low saturation)
  const cols = [
    g.color(198, 178, 64, 140),   // ochre
    g.color(176, 162, 60, 110),   // muted yellow
    g.color(160, 149, 58, 120),   // khaki
    g.color(130, 120, 54, 120),   // olive-brown
    g.color(110, 104, 62, 90)     // muddy olive
  ];

  // --- Twice the original density ---
  const area = g.width * g.height;

  // Blades (x2 density)
  const bladeCount = floor(area / 1250); // was / 2500
  g.noFill();

  for (let i = 0; i < bladeCount; i++) {
    const c = random(cols);
    g.stroke(c);
    g.strokeWeight(random(0.6, 1.8));

    // Start mostly in the lower half
    let x = random(-20, g.width + 20);
    let y = random(g.height * 0.55, g.height + 10);

    // slight left/right slant, drift upward with noise
    const steps = floor(random(8, 20));
    let angle = -HALF_PI + random(-0.45, 0.45);
    let stepLen = random(3, 7);

    g.beginShape();
    for (let s = 0; s < steps; s++) {
      const n = noise(x * 0.01, y * 0.01, s * 0.05);
      const jitter = map(n, 0, 1, -0.35, 0.35);
      angle += jitter * 0.15;

      x += cos(angle) * stepLen;
      y += sin(angle) * stepLen;

      // little sideways wander (wind)
      x += random(-0.6, 0.6);

      g.vertex(x, y);
    }
    g.endShape();
  }

  const scuffs = floor((g.width / 90) * 2); 
  for (let i = 0; i < scuffs; i++) {
    g.stroke(105, 96, 60, 70); 
    g.strokeWeight(random(1, 3));
    let y = random(g.height * 0.8, g.height * 0.98);
    let x = random(-30, g.width - 50);
    const len = random(40, 160);
    g.beginShape();
    for (let k = 0; k < 6; k++) {
      g.vertex(x, y + random(-1.5, 1.5));
      x += len / 6.0 + random(-2, 2);
    }
    g.endShape();
  }

  // Light speckle for muddy texture (x2 density)
  const speckles = floor(area / 4000); // was / 8000
  g.strokeWeight(1);
  g.stroke(120, 110, 70, 60);
  for (let i = 0; i < speckles; i++) {
    const sx = random(g.width);
    const sy = random(g.height * 0.6, g.height);
    g.point(sx, sy);
  }
}