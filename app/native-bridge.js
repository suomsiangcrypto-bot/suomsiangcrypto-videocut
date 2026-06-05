// ═══════════════════════════════════════════════════════
// NATIVE BRIDGE — ทำให้ export วิ่งผ่าน FFmpeg เนทีฟของเครื่อง
//   • ไม่ต้องโหลด ffmpeg-core.wasm (24MB) → เปิดเร็ว ส่งออกเร็วแรง
//   • ใช้โค้ด export เดิมทั้งหมด 100% เพียงสลับ _ffmpegLib ไปเป็นสะพานเนทีฟ
//   * โหลดไฟล์นี้ "หลัง" editor.js เสมอ (override loadFFmpeg)
// ═══════════════════════════════════════════════════════
(function(){
  function _bootNative(){
  window.IS_NATIVE = true;

  // ── self-test: ยืนยันว่า ffmpeg เนทีฟใช้งานได้จริงตอนเปิดแอป ──
  window._ffProbe = null;
  if(window.ffNative.probe){
    window.ffNative.probe().then(function(r){
      window._ffProbe = r;
      if(r && r.ok){
        console.log('[native] ✅ ffmpeg OK:', r.version, '| path:', r.path);
      } else {
        console.error('[native] ❌ ffmpeg ใช้ไม่ได้:', r && r.error, '| path:', r && r.path);
        try{ if(typeof showToast==='function') showToast('❌ หาไฟล์ ffmpeg ไม่เจอ/รันไม่ได้ — ส่งออกจะไม่ทำงาน'); }catch(e){}
      }
    });
  }

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
    window._lastSavedPath = dest;
    // เปิดโฟลเดอร์ Videos ให้เห็นไฟล์ทันที (ไฮไลต์ไฟล์ที่เพิ่งบันทึก)
    try{ if(dest && window.ffNative.showInFolder) window.ffNative.showInFolder(dest); }catch(e){}
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
      // ปุ่มส่งออกเป็นปุ่มเขียวถาวรในตัว HTML แล้ว (exp-go) — ไม่ต้องสร้าง/สลับปุ่มอีก
    }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brand);
  else brand();

  console.log('[native] ⚡ Native FFmpeg bridge ทำงาน — tmp:', window.ffNative.tmpDir);
  } // end _bootNative

  // ── ลองตรวจ ffNative ซ้ำจนเจอ (กันกรณี preload มาช้า → ปุ่มไม่เขียว/ส่งออกพัง) ──
  if(window.ffNative){ _bootNative(); }
  else {
    console.warn('[native] ffNative ยังไม่มา — รอแล้วลองใหม่ (สูงสุด ~5 วิ)...');
    var _bt=0, _biv=setInterval(function(){
      _bt++;
      if(window.ffNative){ clearInterval(_biv); _bootNative(); }
      else if(_bt>=33){ clearInterval(_biv); console.warn('[native] หมดเวลา — ไม่พบ ffNative (รันแบบเบราว์เซอร์)'); }
    }, 150);
  }
})();
