const canvas = document.getElementById("poemCanvas");
const ctx = canvas.getContext("2d");

let frames = 0;
let clicks = 0;

const nouns = [
  "soul","snow","mountain","dream","life","water","fire","dust","lust",
  "rose","stream","pillow","moon","hero","heroine","wind","clown","goddess",
  "innocence","heaven","playground","Lovelace","flare","world","day",
  "liberty","sapiens","you","me","trainstation","clock","moral","humanity",
  "fault","failure","echo","veil","mist","ember","abyss","nihilism","petal",
  "pentiment","reverie","spirit","gaze","eclipse","shimmer","meadow",
  "horizon","solace","whimsy","tempest","hush","radiance","altitude",
  "home","ash","enigma","harmony","tide","sanctuary","echoes",
  "consequence","pole","irrelevance"
];

const verbs = [
  "flows","shines","whispers","dances","grows","thinks","eats","runs",
  "slides","gyrates","melts","demolishes","exists","survives","renews",
  "constructs","tears","laughs","flutters","quivers","caress","drifts",
  "godlike","mutilated","eternal","loved","believed","whisper"
];

const adjectives = [
  "bright","calm","silent","mystic","gentle","vast","minimal",
  "gloomy","splender","sudden","long"
];

const prepositions = [
  "above","beneath","around","through","across","throughout","below","upon"
];

const articles = ["the","a","most","your","my","their"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function drawBackground() {
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

drawBackground();

canvas.addEventListener("mousedown", (e) => {
  clicks++;
  frames++;

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  drawBackground();

  // Timestamp
  ctx.fillStyle = "black";
  ctx.font = "italic 16px 'EB Garamond'";
  ctx.fillText(`00:${frames}`, 20, 20);

  // Poem
  ctx.font = "italic 20px 'EB Garamond'";

  const line1 = `${rand(articles)} ${rand(adjectives)} ${rand(nouns)}`;
  const line2 = `that ${rand(verbs)} ${rand(prepositions)} ${rand(articles)} ${rand(nouns)}`;
  const line3 = `${rand(adjectives)} ${rand(nouns)} ${rand(verbs)}`;
  const line4 = `    ${rand(nouns)} ${rand(verbs)}`;

  ctx.fillText(line1, mouseX, mouseY);
  ctx.fillText(line2, mouseX, mouseY + 40);
  ctx.fillText(line3, mouseX, mouseY + 80);
  ctx.fillText(line4, mouseX, mouseY + 160);

  // Click counter
  ctx.fillText(clicks.toString(), mouseX - 40, mouseY);

  // Graphic block
  const x = canvas.width - 150;
  const y = canvas.height - 150;

  ctx.fillStyle = "rgba(240,240,255,0.8)";
  ctx.fillRect(x - 10, y - 10, 150, 150);

  const c1 = randomColor();
  const c2 = randomColor();

  for (let i = 0; i < 100; i++) {
    ctx.strokeStyle = lerpColor(c1, c2, i / 100);
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + 100);
    ctx.stroke();
  }

  // Symbols
  ctx.fillStyle = "black";
  ctx.font = "italic 14px 'EB Garamond'";
  ctx.fillText("{<>[]}", x + random(10, 50), y + random(10, 50));

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x + random(40, 70), y + random(40, 70), 10, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeRect(x + random(20, 60), y + random(20, 60), 20, 20);
  ctx.beginPath();
  ctx.moveTo(x + random(10, 80), y + random(10, 80));
  ctx.lineTo(x + random(10, 80), y + random(10, 80));
  ctx.stroke();

  ctx.font = "italic 12px 'EB Garamond'";
  ctx.fillText(
    `ID: ${randomInt(1000,9999)}-${randomChar()}${randomChar()}`,
    x + 10,
    y + 90
  );
});

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(random(min, max));
}

function randomChar() {
  return String.fromCharCode(randomInt(65, 90));
}

function randomColor() {
  return {
    r: randomInt(100, 255),
    g: randomInt(100, 255),
    b: randomInt(100, 255)
  };
}

function lerpColor(c1, c2, t) {
  const r = Math.floor(c1.r + (c2.r - c1.r) * t);
  const g = Math.floor(c1.g + (c2.g - c1.g) * t);
  const b = Math.floor(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}