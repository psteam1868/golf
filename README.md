# Golf Game PWA v2

本版本已把球场资料从浏览器 localStorage 改为 Google Apps Script + Google Sheet `COURSES`。

功能：
- 创建比赛时必须选择永久球场
- 球场名称 + 18洞 Par + SI 从 Google 数据库读取
- 新增球场直接写入 `COURSES`
- 不提供普通用户删除球场
- 比赛创建时保存 `course_id`
- 比赛进入后按 `course_id` 读取球场并显示每洞 Par / SI
- 保留原来的创建/加入比赛、成绩、UP、自动刷新、PWA 安装

部署前：
1. 按 `APPS_SCRIPT_COURSE_MATCH_PATCH.txt` 修改 Apps Script。
2. 重新部署 Web App（Deploy > Manage deployments > Edit > New version）。
3. 用新的 Web App URL 替换 index.html 中的 GOLF_API_URL（如果 URL 没变则无需替换）。
4. 发布 PWA。
