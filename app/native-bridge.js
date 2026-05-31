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

  // ป้ายบอกว่าเป็นโหมดเนทีฟ
  function brand(){
    try{
      var b = document.getElementById('exp-go');
      if(b) b.textContent = '⚡ Native Export — รวมและส่งออก';
      var t = document.querySelector('.logo-txt');
      if(t && t.textContent.indexOf('⚡') < 0) t.textContent = t.textContent + ' ⚡';
    }catch(e){}
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', brand);
  else brand();

  console.log('[native] ⚡ Native FFmpeg bridge ทำงาน — tmp:', window.ffNative.tmpDir);
})();
