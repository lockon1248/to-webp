# to-webp

前端小工具：將上傳的圖片轉成 WebP，並提供下載。專案採 Vite + Shoelace，自訂 Web Component（`<image-converter>`）封裝 UI 與邏輯，模板來源在 `src/page/app.html`，邏輯在 `src/components/image-converter.ts`。

線上體驗：https://to-webp-inky.vercel.app/

## 開發
- 安裝：`npm install`
- 開發伺服器：`npm run dev`（Vite，預設 http://localhost:5173）
- 打包：`npm run build`
- 預覽打包結果：`npm run preview`

## 結構簡述
- `index.html`：Vite 入口，掛載 `#app`。
- `src/main.js`：載入 Shoelace、樣式與 `<image-converter>`，將 `app.html` 插入 `#app`。
- `src/page/app.html`：UI 樣板，含上傳卡片與 `sl-dialog` 對話框（自訂按鈕，隱藏預設 close 按鈕）。
- `src/components/image-converter.ts`：Web Component 邏輯；處理選檔、用 Canvas 轉 WebP、建立下載連結，並透過 `sl-dialog` 顯示提示。
- `src/style.css`：全域樣式（含 Shoelace 按鈕色覆寫等）。

## 使用方式
1. 點「選擇圖片」挑檔，檔名會回填並鎖住「下載」按鈕。
2. 點「轉換成 WebP」後，完成即解鎖「下載輸出檔案」按鈕。
3. 如未選檔或轉換失敗，會透過 `sl-dialog` 顯示提示。

## 客製化提示
- 修改對話框：`src/page/app.html` 內的 `sl-dialog`，提示文字由 `image-converter.ts` 的 `showDialog()` 動態填入。
- 覆寫按鈕色：同檔案內的 `<style>` 使用 `::part(base)` 針對 Shoelace 按鈕覆寫。
