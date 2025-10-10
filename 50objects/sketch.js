//50 objects: (5+5)*5=100

let chainsY = []; 
let chainsX = []; 
let SaturationNHue = [];
let strokecolor;

let dotLayer; 
let frames;

class ShapeChain {
  constructor(ax, ay, kind) {
    this.kind = kind;
    this.ax = ax;
    this.ay = ay;

    if (kind === "rect") {
      this.w = random(50, 70);
      this.h = random(15, 65);
      this.bx = this.ax + this.w;
      this.by = this.ay + this.h;

    } else if (kind === "arc") {
      this.rx = random(30, 80);
      this.ry = random(20, 60);
      const rX = this.rx * 0.5, rY = this.ry * 0.5;
      this.a0 = random(TWO_PI);
      this.a1 = this.a0 + random(PI / 6, PI * 0.9);
      this.cx = this.ax - rX * cos(this.a0);
      this.cy = this.ay - rY * sin(this.a0);
      this.bx = this.cx + rX * cos(this.a1);
      this.by = this.cy + rY * sin(this.a1);

    } else if (kind === "ellipse") {
      this.rx = random(40, 100);
      this.ry = random(30, 80);
      const rX = this.rx * 0.5, rY = this.ry * 0.5;
      this.e0 = random(TWO_PI);
      this.cx = this.ax - rX * cos(this.e0);
      this.cy = this.ay - rY * sin(this.e0);
      const offset = random(PI * 0.4, PI * 1.6);
      this.e1 = this.e0 + offset;
      this.bx = this.cx + rX * cos(this.e1);
      this.by = this.cy + rY * sin(this.e1);

    } else if (kind === "triangle") {
      const offsetX = random(40, 100);
      const offsetY = random(40, 100);
      this.x2 = this.ax + random(-offsetX, offsetX);
      this.y2 = this.ay + random(-offsetY, offsetY);
      this.bx = this.ax + offsetX;
      this.by = this.ay + offsetY;
    }
  }

  show() {
    noFill();
    strokeWeight(1);

    if (this.kind === "rect")       rect(this.ax, this.ay, this.w, this.h)
    
    
    else if (this.kind === "arc")   arc(this.cx, this.cy, this.rx, this.ry, this.a0, this.a1);
    else if (this.kind === "ellipse") ellipse(this.cx, this.cy, this.rx, this.ry);
    else if (this.kind === "triangle") triangle(this.ax, this.ay, this.x2, this.y2, this.bx, this.by);
  }
}

function emitterAnchorAndRadius(s) {
  
  if (s.kind === "rect") {
    return { cx: s.ax + s.w * 0.5, cy: s.ay + s.h * 0.5, r: max(s.w, s.h) * 0.5 };
    
  } else if (s.kind === "arc") {
    return { cx: s.bx, cy: s.by, r: max(s.rx, s.ry) * 0.25 };
    
  } else if (s.kind === "ellipse") {
    return { cx: s.bx, cy: s.by, r: max(s.rx, s.ry) * 0.25 };
    
    
  } else if (s.kind === "triangle") {
    
    return { cx: s.bx, cy: s.by, r: 40 };
  }
  
  return { cx: s.ax, cy: s.ay, r: 30 };
}

function setup() {
 
  SaturationNHue = [40,50,60,70];
  
  frames=0
  //strokecolor=frameCount;
  
  createCanvas(800, 800);
  

  frameRate(12);
  colorMode(HSB, 360, 100, 100);
  
  dotLayer = createGraphics(800, 800);
  dotLayer.colorMode(HSB, 360, 100, 100);
  
  const steps = 5;//5 list for each

  // left
  for (let k = 0; k < steps; k++) {
    const y = k * (height / steps);
    const first = new ShapeChain(0, y, "arc");
    chainsY.push([first]);
  }

  // top 
  for (let k = 0; k < steps; k++) {
    const x = k * (width / steps);
    const first = new ShapeChain(x, 0, "arc");
    chainsX.push([first]);
  }
}

function draw() {
  background(140,100,20);
  
  
  // map(strokecolor,0,width,0,255);
  // stroke(50,strokecolor,strokecolor);
  
  
   // between green and blue
  // let hueVal = map(sin(frameCount * 0.03), -1, 1, 100, 260);
  // stroke(hueVal, random(SaturationNHue),random(SaturationNHue));

  let hueVal = map(sin(frameCount * 0.03), -1, 1, 120, 200);
  let sat = random(SaturationNHue);
  let bri = random(SaturationNHue);
  stroke(hueVal, sat, bri);
  
  dotLayer.stroke(hueVal, sat, bri);
  dotLayer.strokeWeight(1.5);


  const order = ["arc", "rect", "ellipse", "triangle"];

  // left
  for (let chain of chainsX) {
    const last = chain[chain.length - 1];
    const nextKind = order[(order.indexOf(last.kind) + 1) % order.length];
    chain.push(new ShapeChain(last.bx, last.by, nextKind));
    
    
    const { cx, cy, r } = emitterAnchorAndRadius(chain[chain.length - 1]);


    // push();
    // for (let i = 0; i < 10; i++) {    
    //   const px = cx + random(-r, r);
    //   const py = cy + random(-r, r);
    //   point(px, py);
    // }
    // pop();

    //add dots at the end of "this"
    // push();
    // for (let i = 0; i < 10; i++) {    
    //   const px = cx + random(-r, r);
    //   const py = cy + random(-r, r);
    //   point(px, py);
    // }
    // pop();

    for (let i = 0; i < 10; i++) {    
      const px = cx + random(-r, r);
      const py = cy + random(-r, r);
      dotLayer.point(px, py);
    }
    
    if (chain.length > 5) chain.splice(0, chain.length - 5);
  }
  
  // top
  for (let chain of chainsY) {
    const last = chain[chain.length - 1];
    const nextKind = order[(order.indexOf(last.kind) + 1) % order.length];
    chain.push(new ShapeChain(last.bx, last.by, nextKind));
    
    const { cx, cy, r } = emitterAnchorAndRadius(chain[chain.length - 1]);
    
// push();
// for (let i = 0; i < 10; i++) {    
//   // dots per frame per chain
 // strokeWeight(1.5);
    
    
  const px = cx + random(-r*6, r*6);
  const py = cy + random(-r*6, r*6);

 
// dotLayer.strokeWeight(1.5);
// dotLayer.stroke(frameCount*2 % 90, 90, 80); // within dotLayer's HSB(90,100,100)
// dotLayer.point(px, py);
 
// }
// pop();

    for (let i = 0; i < 10; i++) {
      const px2 = cx + random(-r, r);  
      const py2 = cy + random(-r, r);
      dotLayer.strokeWeight(1.5);
      dotLayer.point(px2, py2);
    }
    
    if (chain.length > 5) chain.splice(0, chain.length - 5); 
  }


  // draw all the chain
  for (let chain of chainsY) for (let s of chain) s.show();
  for (let chain of chainsX) for (let s of chain) s.show();
  
  image(dotLayer, 0, 0);
  
}


function mouseClicked() {
  // reset everything
  background(255);
  chainsX = [];
  chainsY = [];
  dotLayer.clear(); 
  
  // rebuild the chains
  const steps = 10;
  for (let k = 0; k < steps; k++) {
    const y = k * (height / steps);
    const firstY = new ShapeChain(0, y, "arc");
    chainsY.push([firstY]);

    const x = k * (width / steps);
    const firstX = new ShapeChain(x, 0, "arc");
    chainsX.push([firstX]);
  }
}