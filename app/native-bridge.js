// ═══════════════════════════════════════════════════════
// NATIVE BRIDGE — ทำให้ export วิ่งผ่าน FFmpeg เนทีฟของเครื่อง
//   • ไม่ต้องโหลด ffmpeg-core.wasm (24MB) → เปิดเร็ว ส่งออกเร็วแรง
//   • ใช้โค้ด export เดิมทั้งหมด 100% เพียงสลับ _ffmpegLib ไปเป็นสะพานเนทีฟ
//   * โหลดไฟล์นี้ "หลัง" editor.js เสมอ (override loadFFmpeg)
// ═══════════════════════════════════════════════════════
(function(){
  if(!window.ffNative){
    console.warn('[native] ไม่พบสะพานเนทีฟ (window.ffNative) — รันแบบเบราว์เซอร์ปกติ');
    return;
  }
  window.IS_NATIVE = true;

  // shim ที่หน้าตาเหมือน _ffmpegLib ของ ffmpeg.wasm v0.11
  var shim = {
    isNative: true,
    FS: function(op, name, data){
      if(op === 'writeFile'){ window.ffNative.writeFile(name, data); return; }
      if(op === 'readFile'){ return window.ffNative.readFile(name); }   // คืน Uint8Array (มี .buffer)
      if(op === 'unlink'){ window.ffNative.unlink(name); return; }
      throw new Error('FS op ไม่รองรับ: ' + op);
    },
    run: function(){
      var args = [].slice.call(arguments).map(function(a){ return String(a); });
      return window.ffNative.run(args);
    },
    setProgress: function(fn){ window._ffNativeProgress = fn; }
  };

  // แทนที่ loadFFmpeg — ไม่โหลด wasm แล้ว ใช้เนทีฟทันที
  window.loadFFmpeg = async function(){
    window._ffmpegLib = shim;
    try{ window.ffmpeg = { _v11: true }; }catch(e){}
    var ov  = document.getElementById('ff-ov');
    var msg = document.getElementById('ff-msg');
    var bar = document.getElementById('ff-pct-bar');
    var pct = document.getElementById('ff-pct-txt');
    if(ov)  ov.classList.add('show');
    if(msg) msg.textContent = '⚡ ใช้ FFmpeg เนทีฟ (เร็วแรง) — พร้อมส่งออก';
    if(bar) bar.style.width = '100%';
    if(pct) pct.textContent = '100%';
    setTimeout(function(){ if(ov) ov.classList.remove('show'); }, 500);
    if(typeof showToast === 'function') showToast('⚡ Native FFmpeg พร้อม — ส่งออกเร็วแรง!');
    return true;
  };

  // บันทึกไฟล์ผลลัพธ์แบบเนทีฟ (เรียกจาก finalize ใน editor.js)
  window._nativeFinalize = async function(finalBuf, fname){
    if(!window.ffNative || !window.ffNative.saveOutput) return null;
    var u8 = new Uint8Array(finalBuf);
    var tmpName = '__out_' + Date.now() + '_' + String(fname).replace(/[^\w.\-]/g,'_');
    window.ffNative.writeFile(tmpName, u8);
    var dest = window.ffNative.saveOutput(tmpName, fname);
    try{ window.ffNative.unlink(tmpName); }catch(e){}
    return dest;
  };

  // ป้ายบอกว่าเป็นโหมดเนทีฟ + ซ่อนคำเตือน localhost (โหมดเนทีฟไม่ต้องใช้) + ปุ่ม Native Export
  function brand(){
    try{
      // ซ่อนคำเตือน file:// → ส่งออกไม่ได้ (ไม่เกี่ยวกับโหมดเนทีฟ)
      var lw = document.getElementById('localhost-warn');
      if(lw){ lw.style.display = 'none'; }

      var t = document.querySelector('.logo-txt');
      if(t && t.textContent.indexOf('⚡') < 0) t.textContent = t.textContent + ' ⚡';

      // เพิ่มปุ่มเขียว "⚡ Native Export" ในกล่องส่งออก (ถ้ายังไม่มี)
      var go = document.getElementById('exp-go');
      if(go && !document.getElementById('exp-native')){
        var nb = document.createElement('button');
        nb.id = 'exp-native';
        nb.className = 'em-btn';
        nb.textContent = '⚡ Native Export';
        nb.style.cssText = 'background:#22c55e;color:#04210f;border:none;font-weight:800;padding:8px 18px;border-radius:7px;cursor:pointer;font-size:13px;';
        nb.title = 'รวมและส่งออกด้วย FFmpeg เนทีฟ แล้วบันทึกลงโฟลเดอร์ Videos อัตโนมัติ';
        nb.addEventListener('click', function(){
          if(go.disabled) return;
          go.click();   // ใช้ขั้นตอนส่งออกเดิมทั้งหมด → finalize จะบันทึกแบบเนทีฟให้เอง
        });
        go.parentNode.appendChild(nb);
      }
    }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brand);
  else brand();

  console.log('[native] ⚡ Native FFmpeg bridge ทำงาน — tmp:', window.ffNative.tmpDir);
})();
