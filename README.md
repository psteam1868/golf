# Golf Game PWA v3

本版本解决 GitHub Pages 调用 Google Apps Script 时的 CORS / NetworkError：PWA 使用 JSONP 与 Apps Script 通讯。

## 部署
1. 先按 `APPS_SCRIPT_JSONP_PATCH.txt` 修改 Apps Script 的 `doGet(e)`。
2. 保存并部署 Web App 新版本；正式 `/exec` 地址可以保持原地址。
3. 将本目录中的 `index.html`、`app.js`、`style.css`、`manifest.json`、`service-worker.js` 和 `icons/` 上传到 GitHub Pages 仓库根目录。
4. 等 GitHub Pages 更新后，强制刷新一次浏览器。

## 已接入
- Google COURSES 永久数据库
- 球场列表
- 新增球场
- 创建比赛时绑定 course_id
- 比赛页面显示 18 洞 Par / SI
- JSONP 跨域通讯

不要删除现有 COURSES 数据。
