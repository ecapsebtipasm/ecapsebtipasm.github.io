const totalImages = 10;
let currentIndex = 1;

const viewer = document.getElementById("viewer");

// Create the custom cursor image
const cursorImage = document.createElement("img");
cursorImage.className = "cursor-img";
document.body.appendChild(cursorImage);

// Initialize first scene
updateScene(currentIndex);

// Click → next image
viewer.addEventListener("click", () => {
    currentIndex++;
    if (currentIndex > totalImages) currentIndex = 1;
    updateScene(currentIndex);
});

// Mouse movement → move cursor image
document.addEventListener("mousemove", (e) => {
    cursorImage.style.left = e.pageX + "px";
    cursorImage.style.top = e.pageY + "px";
});

// Update background and cursor
function updateScene(index) {

    // Update background
    viewer.style.backgroundImage = `url('footage/${index}_A.PNG')`;

    // Scene 7 uses default cursor
    if (index === 7) {
        cursorImage.style.display = "none";
        viewer.style.cursor = "default";
        return;
    }

    // All other scenes use custom PNG cursor
    viewer.style.cursor = "none";
    cursorImage.src = `footage/${index}_B.PNG`;
    cursorImage.style.display = "block";
}