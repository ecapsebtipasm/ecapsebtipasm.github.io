window.onload = function () {

  // ---------------------------------------------------------
  // PAGE SWITCHING (INTRO → POEM → CAMERA)
  // ---------------------------------------------------------
  const page1 = document.getElementById("page1");
  const page2 = document.getElementById("page2");
  const container = document.getElementById("container");
  const cam = document.getElementById("cam");

  page1.addEventListener("click", () => {
    page1.style.display = "none";
    page2.style.display = "flex";
  });

  page2.addEventListener("click", () => {
    page2.style.display = "none";
    container.style.display = "block";
    cam.style.display = "block";

    startCameraExperience();
  });


  // ---------------------------------------------------------
  // CAMERA EXPERIENCE
  // ---------------------------------------------------------
  function startCameraExperience() {

    //------------------------------------------------------------
    // ELEMENTS & RESIZE
    //------------------------------------------------------------
    const canvas = document.getElementById("mainCanvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resizeCanvas();

    const visibilityText = document.getElementById("visibility");
    const video = document.getElementById("cam");

    // D-pad buttons
    const btnUp = document.getElementById("btnUp");
    const btnDown = document.getElementById("btnDown");
    const btnLeft = document.getElementById("btnLeft");
    const btnRight = document.getElementById("btnRight");

    //------------------------------------------------------------
    // CAMERA SETUP
    //------------------------------------------------------------
    const CAM_W = 640;
    const CAM_H = 480;

    navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user", width: CAM_W, height: CAM_H }
    }).then(stream => {
      video.srcObject = stream;
    });

    //------------------------------------------------------------
    // THRESHOLD + FPS CONTROL
    //------------------------------------------------------------
    let thresholdPercent = 0.98;

    btnUp.onclick = () =>
      thresholdPercent = Math.min(0.999, thresholdPercent + 0.01);

    btnDown.onclick = () =>
      thresholdPercent = Math.max(0.0, thresholdPercent - 0.01);

    let targetFPS = 30;
    let frameInterval = 1000 / targetFPS;
    let lastFrameTime = 0;

    btnLeft.onclick = () => {
      targetFPS = Math.max(1, targetFPS - 5);
      frameInterval = 1000 / targetFPS;
    };

    btnRight.onclick = () => {
      targetFPS = Math.min(60, targetFPS + 5);
      frameInterval = 1000 / targetFPS;
    };

    //------------------------------------------------------------
    // OFFSCREEN BUFFERS
    //------------------------------------------------------------
    const readCanvas = document.createElement("canvas");
    readCanvas.width = CAM_W;
    readCanvas.height = CAM_H;
    const readCtx = readCanvas.getContext("2d", { willReadFrequently: true });

    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });

    //------------------------------------------------------------
    // FLOATING TEXT PARTICLES
    //------------------------------------------------------------
    let poem =
`Light /līt/ (n./adj.)
It always eats first. It eats the name off the thing and leaves the thing blinking.
Then, inevitably, that mouth stands and talk like a child who never
learned sorry.
All the entities are spoken by it, only part of it would be remembered
by its tongue. Lighten this or that, you put the subject after the verb, not
the object. It breaks nouns into ash, and forget its purpose. Then the
unspeakable remembers, like light doesn’t say and never said anything.
It doesn’t say but said open.
It doesn’t fall but enters.`;

    let chars = [];
    let cursor = { x: canvas.width / 2, y: canvas.height / 2 };

    document.body.onmousemove = (e) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
    };

    function initTextParticles() {
      chars = [];
      let startX = canvas.width * 0.1;
      let startY = canvas.height * 0.2;

      let lines = poem.split("\n");
      let cy = startY;

      for (let line of lines) {
        let cx = startX;
        for (let c of line) {
          chars.push({
            char: c,
            x: cx + Math.random()*20 - 10,
            y: cy + Math.random()*20 - 10,
            vx: (Math.random()*2 - 1) * 0.5,
            vy: (Math.random()*2 - 1) * 0.5
          });
          cx += 14;
        }
        cy += 26;
      }
    }

    initTextParticles();

    window.onresize = () => {
      resizeCanvas();
      maskCanvas.width = canvas.width;
      maskCanvas.height = canvas.height;
      initTextParticles();
    };


    //------------------------------------------------------------
    // TEXT ORBIT PHYSICS
    //------------------------------------------------------------
    function updateTextParticles() {
      let orbitRadius = 140;
      let repelStrength = 0.4;
      let orbitForce = 0.03;

      for (let p of chars) {
        let dx = p.x - cursor.x;
        let dy = p.y - cursor.y;
        let dist = Math.sqrt(dx*dx + dy*dy) + 0.001;

        let repel = Math.max(0, orbitRadius - dist);
        p.vx += (dx/dist) * repel * repelStrength * 0.02;
        p.vy += (dy/dist) * repel * repelStrength * 0.02;

        // Orbit tangential force
        p.vx += (-dy/dist) * orbitForce;
        p.vy += (dx/dist) * orbitForce;

        p.x += p.vx;
        p.y += p.vy;

        p.vx *= 0.96;
        p.vy *= 0.96;
      }
    }


    //------------------------------------------------------------
    // DRAW TEXT MASK
    //------------------------------------------------------------
    function drawTextMask() {
      maskCtx.fillStyle = "black";
      maskCtx.fillRect(0, 0, canvas.width, canvas.height);

      maskCtx.fillStyle = "white";
      maskCtx.font = "20px sans-serif";

      for (let p of chars) {
        maskCtx.fillText(p.char, p.x, p.y);
      }
    }


    //------------------------------------------------------------
    // MAIN LOOP
    //------------------------------------------------------------
    function loop(timestamp) {
      requestAnimationFrame(loop);

      if (timestamp - lastFrameTime < frameInterval) return;
      lastFrameTime = timestamp;

      if (!video.videoWidth) return;

      updateTextParticles();
      drawTextMask();

      readCtx.drawImage(video, 0, 0, CAM_W, CAM_H);
      let frame = readCtx.getImageData(0, 0, CAM_W, CAM_H);
      let pix = frame.data;

      let N = CAM_W * CAM_H;
      let brights = new Array(N);

      for (let i = 0; i < N; i++) {
        brights[i] =
          0.299 * pix[i*4] +
          0.587 * pix[i*4+1] +
          0.114 * pix[i*4+2];
      }

      let threshold = brights.slice().sort((a,b)=>a-b)[
        Math.floor(thresholdPercent * N)
      ];

      visibilityText.textContent =
        `visibility: ${Math.floor((threshold/255)*100)}%`;

      let maskData = maskCtx.getImageData(0, 0, canvas.width, canvas.height).data;

      let out = ctx.createImageData(canvas.width, canvas.height);
      let outPix = out.data;


      //------------------------------------------------------------
      // PERFECT "COVER" SCALING — FIXED MAPPING (NO STRETCH)
      //------------------------------------------------------------
      let camAspect = CAM_W / CAM_H;
      let screenAspect = canvas.width / canvas.height;

      let scale, offsetX = 0, offsetY = 0;

      if (screenAspect > camAspect) {
        scale = canvas.width / CAM_W;
        offsetY = (canvas.height - CAM_H * scale) / 2;
      } else {
        scale = canvas.height / CAM_H;
        offsetX = (canvas.width - CAM_W * scale) / 2;
      }


      //------------------------------------------------------------
      // APPLY REVEAL EFFECT WITH CORRECT PIXEL MAPPING
      //------------------------------------------------------------
      for (let y = 0; y < CAM_H; y++) {
        for (let x = 0; x < CAM_W; x++) {

          let i = x + y * CAM_W;
          if (brights[i] < threshold) continue;

          let base = i * 4;
          let r = pix[base];
          let g = pix[base+1];
          let b = pix[base+2];

          // FIXED PIXEL MAPPING (NO STRETCH)
          let sx = Math.floor(x * scale + offsetX);
          let sy = Math.floor(y * scale + offsetY);

          if (sx < 0 || sx >= canvas.width || sy < 0 || sy >= canvas.height) continue;

          let idx = (sx + sy * canvas.width) * 4;
          let inText = maskData[idx] > 127;

          if (inText) {
            outPix[idx]   = 255 - r;
            outPix[idx+1] = 255 - g;
            outPix[idx+2] = 255 - b;
            outPix[idx+3] = 255;
          } else {
            outPix[idx]   = r;
            outPix[idx+1] = g;
            outPix[idx+2] = b;
            outPix[idx+3] = 255;
          }
        }
      }

      ctx.putImageData(out, 0, 0);


      //------------------------------------------------------------
      // DRAW FLOATING TEXT IN WHITE (VISIBLE)
      //------------------------------------------------------------
      ctx.fillStyle = "white";
      ctx.font = "20px sans-serif";
      for (let p of chars) {
        ctx.fillText(p.char, p.x, p.y);
      }
    }

    loop();
  }
};