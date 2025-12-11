// ====================
//  Image Setup
// ====================

const totalImages = 10;
let currentIndex = 1;

const viewer = document.getElementById("viewer");

// 创建 cursor 图片
const cursorImage = document.createElement("img");
cursorImage.className = "cursor-img";
document.body.appendChild(cursorImage);

// 初始化画面
updateScene(currentIndex);

// ====================
//  点击切换到下一个 A 图
// ====================
viewer.addEventListener("click", () => {
    currentIndex++;
    if (currentIndex > totalImages) currentIndex = 1;
    updateScene(currentIndex);
});

// ====================
//  鼠标移动更新 B 图位置
// ====================
document.addEventListener("mousemove", (e) => {
    cursorImage.style.left = e.pageX + "px";
    cursorImage.style.top = e.pageY + "px";
});

// ====================
//  更新场景（A 背景 + B_cursor）
// ====================
function updateScene(index) {

    // 更新背景
    viewer.style.backgroundImage = `url('footage/${index}_A.png')`;

    // 如果是第 7 号 → 使用默认鼠标
    if (index === 7) {
        cursorImage.style.display = "none";      // 隐藏自定义 cursor
        viewer.style.cursor = "default";         // 恢复默认箭头
        return;
    }

    // 其他编号 → 使用 B 图作为鼠标
    viewer.style.cursor = "none";                // 隐藏默认鼠标
    cursorImage.src = `footage/${index}_B.png`;  // 设置 cursor 图片
    cursorImage.style.display = "block";         // 显示 cursor
}