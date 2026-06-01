// ───────────────────────────────────────────────
// PRELOAD — เปิด API เนทีฟให้ renderer เรียก FFmpeg ของเครื่อง
//   ทำงานใน process ที่มี Node (fs / child_process) แต่ renderer แยก context
// ───────────────────────────────────────────────
const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// path ของไบนารี ffmpeg (มาจาก ffmpeg-static) — แก้ path เมื่อถูกแพ็กใน asar
let ffmpegPath = require('ffmpeg-static');
if (ffmpegPath && ffmpegPath.includes('app.asar')) {
  ffmpegPath = ffmpegPath.replace('app.asar', 'app.asar.unpacked');
}

// โฟลเดอร์ทำงานชั่วคราว (ลบทิ้งเมื่อปิดโปรแกรม)
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'suomsiang-'));
function cleanup(){ try{ fs.rmSync(tmpDir, { recursive: true, force: true }); }catch(e){} }
process.on('exit', cleanup);

contextBridge.exposeInMainWorld('ffNative', {
  tmpDir: tmpDir,
  ffmpegPath: ffmpegPath,

  // เขียน/อ่าน/ลบไฟล์ในโฟลเดอร์ชั่วคราว (sync — เข้ากันได้กับโค้ด export เดิม)
  writeFile: function(name, u8){
    fs.writeFileSync(path.join(tmpDir, name), Buffer.from(u8));
  },
  readFile: function(name){
    return new Uint8Array(fs.readFileSync(path.join(tmpDir, name)));
  },
  unlink: function(name){
    try{ fs.unlinkSync(path.join(tmpDir, name)); }catch(e){}
  },

  // รัน ffmpeg เนทีฟ (cwd = tmpDir → ชื่อไฟล์ relative ใช้ได้เหมือน wasm FS)
  run: function(args){
    return new Promise(function(resolve, reject){
      if(!ffmpegPath){ reject(new Error('ไม่พบไบนารี ffmpeg (ffmpeg-static)')); return; }
      const p = spawn(ffmpegPath, args, { cwd: tmpDir });
      let err = '';
      p.stderr.on('data', function(d){ err += d.toString(); if(err.length > 24000) err = err.slice(-24000); });
      p.on('error', function(e){ reject(e); });
      p.on('close', function(code){
        if(code === 0) resolve({ code: 0 });
        else reject(new Error('ffmpeg exited with code ' + code + '\n' + err.slice(-700)));
      });
    });
  },

  // บันทึกไฟล์ผลลัพธ์ลงโฟลเดอร์ Videos ของผู้ใช้ แล้วคืน path เต็ม
  saveOutput: function(srcName, outFileName){
    var dir = path.join(os.homedir(), 'Videos');
    try{ if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
    catch(e){ dir = os.homedir(); }
    var safe = String(outFileName || 'suomsiang_output.mp4').replace(/[\\/:*?"<>|]/g, '_');
    var dest = path.join(dir, safe);
    // กันชื่อซ้ำ: ถ้ามีอยู่แล้ว เติม (1), (2), ...
    if(fs.existsSync(dest)){
      var ext = path.extname(safe), base = path.basename(safe, ext), i = 1;
      do { dest = path.join(dir, base + ' (' + i + ')' + ext); i++; } while(fs.existsSync(dest));
    }
    fs.copyFileSync(path.join(tmpDir, srcName), dest);
    return dest;
  }
});
