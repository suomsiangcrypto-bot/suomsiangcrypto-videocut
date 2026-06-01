# สุ่มเสียง VIDEOCUT ⚡ — Desktop App (Electron + Native FFmpeg)

โปรแกรมตัดต่อวิดีโอเวอร์ชันเดสก์ท็อป ทำงานเหมือนเวอร์ชัน Extension ทุกอย่าง 100%
แต่ **ส่งออกด้วย FFmpeg เนทีฟของเครื่อง** → เปิดเร็ว เล่นไม่สะดุด ส่งออกเร็วแรง
(ไม่ต้องโหลด ffmpeg-core.wasm 24MB อีกต่อไป)

---

## 🚀 วิธีรัน (โหมดพัฒนา)

ต้องมี **Node.js 18+** ติดตั้งก่อน (https://nodejs.org)

```bash
cd SUOMSIANG_VIDEOCUT_ELECTRON
npm install            # ติดตั้ง electron + ffmpeg-static (โหลดไบนารี ffmpeg ของ OS อัตโนมัติ)
npm start              # เปิดโปรแกรม
```

> ครั้งแรก `npm install` จะดาวน์โหลด Electron (~100MB) และไบนารี FFmpeg ให้เอง

---

## 📦 วิธีสร้างตัวติดตั้ง (Installer)

สร้างไฟล์ติดตั้งสำหรับ **ระบบปฏิบัติการที่กำลังใช้อยู่** (สำคัญ: ต้อง build บน OS ปลายทาง
เพราะ ffmpeg-static จะฝังไบนารีของ OS นั้น)

```bash
npm run dist          # สร้างตามระบบที่ใช้อยู่
# หรือเจาะจง:
npm run dist:win      # Windows  → .exe (NSIS installer)   [build บน Windows]
npm run dist:mac      # macOS    → .dmg                    [build บน macOS]
npm run dist:linux    # Linux    → .AppImage               [build บน Linux]
```

ไฟล์ผลลัพธ์อยู่ในโฟลเดอร์ `dist/`

---

## 🧩 โครงสร้าง

```
SUOMSIANG_VIDEOCUT_ELECTRON/
├── main.js              # Electron main process (เปิดหน้าต่าง + ตั้งไอคอน)
├── preload.js           # สะพานเนทีฟ: fs (sync) + spawn ffmpeg-static
├── package.json         # ค่า build + dependencies
├── build/
│   ├── icon.png         # 512×512 (ใช้สร้างไอคอนทุกขนาด)
│   ├── icon256.png      # 256×256  ← ไอคอน 256 ตามที่ขอ
│   └── icon.ico         # ไอคอน Windows (รวม 256)
└── app/                 # ตัวโปรแกรม (renderer) — โค้ดเดิมทั้งหมด
    ├── editor.html
    ├── editor.js
    ├── native-bridge.js # สลับ export ให้วิ่งผ่าน FFmpeg เนทีฟ (โหลดหลัง editor.js)
    ├── ffmpeg.min.js / ffmpeg-core.js  (เก็บไว้เผื่อ fallback — ไม่ได้ใช้ในโหมดเนทีฟ)
    └── icons/
```

---

## ⚡ Native Export ทำงานยังไง

`native-bridge.js` แทนที่ฟังก์ชัน `loadFFmpeg()` เดิม แล้วชี้ `_ffmpegLib` ไปยังสะพานเนทีฟ
(`window.ffNative`) ที่ preload เปิดไว้ — โดย **โค้ดส่งออกเดิมทั้งหมดไม่ถูกแก้แม้แต่บรรทัดเดียว**:

- `_ffmpegLib.FS('writeFile'/'readFile'/'unlink')` → อ่าน/เขียนไฟล์จริงในโฟลเดอร์ชั่วคราว (เร็วมาก)
- `_ffmpegLib.run(args)` → `spawn` ไบนารี ffmpeg ของเครื่อง (เร็วกว่า wasm หลายเท่า)

ผลลัพธ์: ตัด/รวม/ใส่เอฟเฟกต์รอยต่อ/คลื่นเสียง/ตัวหนังสือ/โลโก้ — เหมือนเดิมทุกอย่าง
แต่เร็วขึ้นมากและไม่กินแรมเบราว์เซอร์

---

## หมายเหตุ
- ถ้าเปิดด้วยเบราว์เซอร์ธรรมดา (ไม่มี `window.ffNative`) โปรแกรมจะกลับไปใช้ FFmpeg.wasm ตามเดิมอัตโนมัติ
- โปรเจกต์/งานที่บันทึกไว้ (autosave) เก็บในเครื่องผ่าน localStorage + IndexedDB เหมือนเวอร์ชันเดิม

---

## 🤖 สร้าง .exe อัตโนมัติด้วย GitHub Actions (ไม่ต้องมีเครื่อง Windows)

โปรเจกต์นี้มี workflow `.github/workflows/build-win.yml` ที่จะ build .exe บน Windows runner ของ GitHub ให้เอง

### ขั้นตอน
1. สร้าง repo ใหม่บน GitHub (เช่น `suomsiang-videocut`)
2. อัป (push) โค้ดทั้งโฟลเดอร์นี้ขึ้นไป:
   ```bash
   cd SUOMSIANG_VIDEOCUT_ELECTRON
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/<ชื่อคุณ>/suomsiang-videocut.git
   git push -u origin main
   ```
3. GitHub จะรัน Action ให้อัตโนมัติ (ดูที่แท็บ **Actions**)
   - หรือกดเอง: แท็บ **Actions → Build Windows EXE → Run workflow**
4. เมื่อเสร็จ (~5–10 นาที) เข้าไปที่ run นั้น เลื่อนลงล่างสุดหัวข้อ **Artifacts**
   → ดาวน์โหลด **SUOMSIANG-VIDEOCUT-Windows-exe** (ข้างในมีไฟล์ติดตั้ง `.exe`)

### อยากให้ออกเป็น Release ถาวร (ลิงก์ดาวน์โหลดสวย ๆ)
สร้าง tag เวอร์ชันแล้ว push:
```bash
git tag v1.0.0
git push origin v1.0.0
```
Action จะ build แล้ว **แนบ .exe เข้า Releases** ให้อัตโนมัติ (แชร์ลิงก์ให้คนอื่นโหลดได้เลย)

### หมายเหตุ
- ไม่ต้องตั้งค่า secret อะไรเพิ่ม — ใช้ `GITHUB_TOKEN` ที่มีให้อยู่แล้ว
- installer เป็นแบบ **ไม่เซ็นโค้ด** (unsigned) — ตอนเปิดครั้งแรก Windows SmartScreen อาจเตือน
  ให้กด "More info → Run anyway" (ปกติของแอปที่ไม่ได้ซื้อใบเซ็น)
- ถ้าจะให้ build ทั้ง Windows/Mac/Linux พร้อมกัน บอกได้ ผมเพิ่ม matrix ให้
