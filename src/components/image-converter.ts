import type SlDialog from '@shoelace-style/shoelace/dist/components/dialog/dialog.js'; // Shoelace 對話框型別
import type SlInput from '@shoelace-style/shoelace/dist/components/input/input.js'; 
import template from '../page/app.html?raw'; // 匯入外部 HTML 樣板為純字串，方便 IDE 補全且與邏輯分離

export class ImageConverter extends HTMLElement { // 定義自訂元素類別，供瀏覽器註冊
    private shadow: ShadowRoot; // 保留 Shadow DOM 參考，便於之後查找節點
    private file: File | null = null; // 暫存已選取的檔案，避免全域變數污染
    constructor() { // constructor 是建構子；元素被建立或解析到標籤時會先執行
        super(); // 必須呼叫父類別建構子，否則 HTMLElement 不會初始化
        this.shadow = this.attachShadow({ mode: 'open' }); // 建立開放式 Shadow DOM，隔離樣式並允許程式碼存取
        const tpl = document.createElement('template'); // 用 <template> 承載靜態 HTML：不會先渲染或執行腳本，避免在主 DOM 閃爍/污染，且可多次 clone 產生元件實例
        tpl.innerHTML = template; // 把匯入的 HTML 字串放入 template 內容，保持標記與邏輯分離
        this.shadow.appendChild(tpl.content.cloneNode(true)); // 將樣板克隆到 Shadow DOM，實際渲染界面
    }

    connectedCallback() {
        const fileInput = this.shadow.querySelector('#fileInput') as HTMLInputElement; // 拿到隱藏的檔案 input，供觸發原生檔案選擇
        const fileName = this.shadow.querySelector('#fileName') as SlInput; // 取得顯示檔名的欄位，回填使用者所選檔名
        const btnSelect = this.shadow.querySelector('#selectFile') as HTMLElement; // 自訂的選檔按鈕，提供美化外觀
        const btnConvert = this.shadow.querySelector('#convertBtn') as HTMLElement; // 轉檔按鈕，使用者觸發 WebP 轉換
        const btnDownload = this.shadow.querySelector('#downloadBtn') as HTMLButtonElement; // 下載按鈕，待轉檔完成後啟用
        const dialog = this.shadow.querySelector('sl-dialog') as SlDialog | null; // Shoelace 對話框
        const dialogMessage = this.shadow.querySelector('#dialogMessage') as HTMLElement | null; // 對話框內訊息
        const closeDialog = this.shadow.querySelector('#closeDialog') as HTMLButtonElement; // 關閉對話框的按鈕
        closeDialog?.addEventListener('click', () => dialog?.hide()); // 點關閉按鈕時隱藏對話框，若未找到 dialog 則略過
        btnSelect.addEventListener('click', () => fileInput.click()); // 代理 click 事件：點自訂按鈕即呼叫原生 file input
        fileInput.addEventListener('change', () => { // 當使用者挑選完檔案時觸發
            if (!fileInput.files?.length) return; // 沒選擇檔案就直接退出，避免後續空值錯誤
            this.file = fileInput.files[0]; // 只取第一個檔案保存，後續轉檔時使用
            fileName.value = this.file.name; // 將檔名顯示在輸入框，回饋給使用者
            btnDownload.disabled = true; // 轉檔前先鎖住下載按鈕，避免下載舊檔或無檔
        });
        btnConvert.addEventListener('click', async () => { // 處理點擊「轉換」的流程
            if (!this.file) { // 若未選檔，跳提示
                this.showDialog(dialog, dialogMessage, '請先選擇一個圖片檔案。');
                return;
            }
            const bitmap = await createImageBitmap(this.file); // 將檔案解碼成 ImageBitmap，加快繪製速度
            const canvas = document.createElement('canvas'); // 建立離屏 canvas，用來繪製與轉換圖片
            canvas.width = bitmap.width; // 設定 canvas 寬度與圖片一致，避免縮放失真
            canvas.height = bitmap.height; // 設定 canvas 高度與圖片一致
            const ctx = canvas.getContext('2d'); // 取得 2D 繪圖上下文
            ctx!.drawImage(bitmap, 0, 0); // 將位圖畫進 canvas，後續才能輸出成其他格式
            const blob = await new Promise<Blob | null>(resolve => // 將畫面壓成 WebP blob，包成 Promise 方便 await
                canvas.toBlob(resolve, 'image/webp', 0.9)
            );
            if (!blob) { // 若瀏覽器未產生 blob（轉檔失敗）就提示
                this.showDialog(dialog, dialogMessage, '轉換失敗，請再試一次或更換檔案。');
                return;
            }
            const url = URL.createObjectURL(blob); // 生成暫時的 blob URL，供下載用
            btnDownload.disabled = false; // 轉檔成功後解鎖下載按鈕
            btnDownload.onclick = () => { // 設定按下下載的具體動作
                const a = document.createElement('a'); // 建立臨時 <a> 下載連結
                a.href = url; // 指向剛生成的 WebP blob URL
                a.download = this.file!.name.replace(/\.\w+$/, '') + '.webp'; // 以原檔名改副檔名為 .webp
                a.click(); // 觸發點擊以啟動下載，之後瀏覽器處理保存
            };
        });
    }

    private showDialog(dialog: SlDialog | null, dialogMessage: HTMLElement | null, message: string) { // 共用顯示對話框：設定訊息並打開
        if (!dialog || !dialogMessage) return; // 若節點缺失就略過，避免例外
        dialogMessage.textContent = message; // 更新提示文字
        dialog.show(); // 呼叫 Shoelace 對話框的 show() 開啟
    }
}

// 註冊自訂元素 <image-converter>。瀏覽器在 DOM 中遇到 <image-converter> 標籤
// 或程式碼呼叫 document.createElement('image-converter') 時，才會自動 new 這個類別。
customElements.define('image-converter', ImageConverter);
