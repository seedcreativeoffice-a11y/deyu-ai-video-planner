# AI 影像創作引導室

一個給初學者使用的繁體中文互動式 AI 影像企劃工具。

這個工具聚焦在大學、科系與學校單位的招生／形象影片企劃。使用者可以貼上科系介紹、招生文案，或上傳 PDF／Word／文字檔，透過逐步問題整理出可製作的影片企劃、分鏡腳本，以及每顆鏡頭可複製使用的圖像與影片提示詞。

## 目前功能

- SaaS 工具型首頁與成果預覽
- AI 生圖、生影片常見問題前導頁
- 學校、科系、影片主題、溝通對象、溝通目標逐步引導
- 支援貼文字，也提供 PDF／Word／文字檔基本讀取入口
- 規則推薦產出企劃摘要、分鏡腳本、剪輯與交付前檢查
- 每顆鏡頭都有圖像提示詞與影片提示詞的一鍵複製
- 複製後顯示「已複製」回饋
- 交付前檢查清單可勾選
- 使用 `localStorage` 在本機自動保存進度

## 目前限制

- 第一版尚未串接 AI API，內容由本地規則推薦產生
- PDF／Word 解析為基本文字讀取，掃描檔或複雜格式建議改貼文字
- 尚未提供會員、雲端專案、多版本比較或正式檔案匯出

## 本機執行正式網頁版

```bash
npm install
npx vite --host 127.0.0.1 web
```

開啟：

```text
http://127.0.0.1:5173/
```

## 建置

```bash
npx vite build web --base /deyu-ai-video-planner/ --outDir ../dist --emptyOutDir
```

## GitHub Pages 部署

專案已包含 GitHub Actions workflow：

```text
.github/workflows/deploy-pages.yml
```

推送到 `master` 或 `main` 後，GitHub Actions 會自動建置並部署到 GitHub Pages。

部署完成後，公開網址是：

```text
https://seedcreativeoffice-a11y.github.io/deyu-ai-video-planner/
```
