# Fake Flag

白底全屏的 3D 视频旗帜。包含金属旗杆、圆球杆头，以及从 Blender 导出的阵风、卷折、下垂动画。没有地面、环境背景或页面文字。

在 VS Code 中打开本文件夹，右键 `index.html` → **Open with Live Server**。不要用 `file://` 直接打开，浏览器会拦截模型加载。

所有依赖均在本地，无需 npm、构建工具或外部 CDN。可直接作为 GitHub Pages 的 `/fake_flag/` 静态目录部署。

- `index.html`：网页入口
- `main.js`：模型导入、视频材质、白底灯光与响应式取景
- `assets/flag.glb`：Blender 导出的真实 3D 模型和 10 秒循环动画
- `assets/fake_flags.mp4`：视频旗面
- `vendor/`：Three.js 0.170.0 和 MIT 许可证

动作完整周期包含首尾重合的 0/10 秒姿态；播放在 10 秒前回绕，不重复终点。网页使用视频媒体时钟驱动模型，避免视频和动作逐渐错位。浏览器禁止自动播放时会出现“点击播放”，正常播放后页面只保留旗帜。
