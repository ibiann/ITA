/* ============================================================= *
 * 6. NẠP CẤU HÌNH MẪU (tuỳ chọn) + KHỞI ĐỘNG                    *
 * ============================================================= */
// Nếu có sẵn window.DQTV_MAC_DINH (file cấu hình mẫu cũ) thì nạp một lần
if (window.DQTV_MAC_DINH) console.info('[dqtv] Thấy DQTV_MAC_DINH — chỉ dùng cho phiên này, không lưu (bản 3.5).');

// Phím tắt Alt+Shift+D bật/tắt bảng (Alt+D bị Chrome giữ để nhảy lên thanh địa chỉ)
if (!window.__dqtvPhimTat) {
  window.__dqtvPhimTat = true;
  addEventListener('keydown', e => { if (e.altKey && e.shiftKey && e.code === 'KeyD') { moBang(); e.preventDefault(); } }, true);
}

// Trang sắp tải lại / rời đi: đánh dấu để phần "finally" không xoá cờ đang chạy (cần nó để chạy tiếp)
addEventListener('pagehide', () => { window.__dqtvDangRoi = true; });
addEventListener('beforeunload', () => { window.__dqtvDangRoi = true; });

// Tệp đóng gói sẵn đặc tả (dqtv-kiem-tra-dacta.js) đặt window.__dqtvDacTaNap trước phần công cụ → nạp luôn
if (window.__dqtvDacTaNap) { try { napDacTaVao.chiBoNho = true; try { localStorage.removeItem('dqtv.dacta.v1'); localStorage.removeItem(KEY_DACTA); } catch (e) {} const ds = napDacTaVao(window.__dqtvDacTaNap, true); console.info('[dqtv] Đã nạp đặc tả đóng gói sẵn: ' + gonMaDT(ds.map(maQT)) + (napDacTaVao.noiLuu === 'bo_nho' ? ' (bộ lớn, chỉ giữ trong trang này: tải lại trang thì dán lại tệp)' : '') + '. Xem đủ: dqtv.xemDacTa(). Bấm "▶ Chạy": cùng một lần chạy vừa kiểm giao diện vừa đối chiếu đặc tả.'); } catch (e) { console.warn('[dqtv] Không nạp được đặc tả đóng gói sẵn: ' + e.message); } delete window.__dqtvDacTaNap; }

// Dán lại lần nữa: gỡ bảng cũ để không bị hai bảng
// 3.5: bản Tampermonkey nạp ở document-start → chờ trang có thân rồi mới vẽ bảng / chạy tiếp
function khoiDong() {
const cu = document.getElementById('dqtv-panel-host'); if (cu) cu.remove();
// 3.31: kiểm gói và lá chắn trước khi vẽ bảng
{ const g = kiemGoi(window.__dqtvDuAn, window.__dqtvDanhMucTC), l = loiTuKiem(); if (g) console.warn('[dqtv] ' + g + ': phần ma trận v7 tắt, luật giao diện vẫn chạy.');
  console[l ? 'warn' : 'info']('[dqtv] Lá chắn tự kiểm: ' + (l ? 'KHÔNG ĐẠT, khoá Chạy — ' + l : 'ĐẠT')); }
moBang();
try { let n = 0, c = 0; for (let j = 0; j < localStorage.length; j++) { const k = localStorage.key(j); if (k && KHOA_CU.test(k)) { n++; c += (localStorage.getItem(k) || '').length; } } if (n) console.warn('[dqtv] Còn ' + n + ' khóa lưu của bản cũ (~' + Math.round(c / 1024) + ' nghìn ký tự) chiếm chỗ trình duyệt. Xuất báo cáo cũ nếu cần rồi gõ dqtv.donBoNho() để xoá.'); } catch (e) {}
console.info('[dqtv] Đã nạp bản ' + PHIEN_BAN + ' (' + (window.__dqtvNguon === 'userscript' ? 'Tampermonkey' + (window.__dqtvFetchGoc && window.__dqtvCongSom ? ', có cổng chặn từ đầu trang' : '') : 'dán Console') + '; lá chắn ' + (typeof LC !== 'undefined' && LC && LC.som ? 'có từ đầu trang' : 'cài lúc dán') + '). Bảng ở góc phải trên (Alt+Shift+D để ẩn/hiện). Hoặc gõ dqtv.chay()');
// Trang tự tải lại giữa lúc đang chạy (ứng dụng chuyển trang cứng, hết phiên…) → chờ trang vẽ xong rồi chạy tiếp
// Chỉ chạy tiếp khi ĐÚNG tài khoản đã bắt đầu lần chạy; đổi tài khoản thì không tự chạy.
async function chayTiepSauTaiLai(choRaTruoc) {
  // gọi sau khi mất phiên ngay trong trang: chờ ứng dụng đẩy về trang đăng nhập trước (tối đa 20 giây)
  if (choRaTruoc) for (let i = 0; i < 40 && taiKhoan(); i++) await new Promise(r => setTimeout(r, 500));
  const nhaLaChan = () => { if (!CO.dangChay && LC) LC.quyetDinh = null; };
  let run = null; try { run = doChuoi(localStorage.getItem(KEY_RUN) || 'null'); } catch (e) {}
  if (!run) { nhaLaChan(); if (window.DQTV_AUTORUN) dqtv.chay(); return; }
  if (Date.now() - run.ts > 6 * 3600e3) { try { localStorage.removeItem(KEY_RUN); } catch (e) {} { nhaLaChan(); return; } }   // cờ quá cũ
  // chờ ứng dụng vẽ xong: có menu và nhận ra tài khoản (tối đa 30 giây)
  for (let i = 0; i < 60; i++) { if (taiKhoan() && document.querySelectorAll('nav a, aside a, [class*=sidebar] a').length >= 3) break; await new Promise(r => setTimeout(r, 500)); }
  TK = taiKhoan();
  // Đang ở trang đăng nhập (bị đẩy ra vì mất phiên): GIỮ cờ, báo lý do, chờ người dùng đăng nhập lại
  if (!TK) {
    const cuoi = docNK().slice(-3).map(x => x.t + ' ' + x.loai + ': ' + x.nd).join(' → ');
    CO.tienDo = '⚠ Lần chạy của "' + run.tk + '" bị ngắt (trang về đăng nhập). Thao tác cuối: ' + (cuoi || '(không rõ)') + '. Đăng nhập lại cùng tài khoản để chạy tiếp.';
    capNhatBang(); console.warn('[dqtv] ' + CO.tienDo);
    // ứng dụng một trang: đăng nhập xong không tải lại trang → tự kiểm tra lại mỗi 3 giây
    for (let i = 0; i < 600 && !taiKhoan(); i++) await new Promise(r => setTimeout(r, 3000));
    TK = taiKhoan(); if (!TK) { nhaLaChan(); return; }
    for (let i = 0; i < 20 && document.querySelectorAll('nav a, aside a, [class*=sidebar] a').length < 3; i++) await new Promise(r => setTimeout(r, 500));
  }
  if (TK !== run.tk) {
    console.info('[dqtv] Có lần chạy dở của tài khoản khác ("' + run.tk + '") — không tự chạy tiếp. Bấm Chạy để chạy cho tài khoản hiện tại.');
    try { localStorage.removeItem(KEY_RUN); } catch (e) {}
    { nhaLaChan(); return; }
  }
  let ck = null; try { ck = doChuoi(localStorage.getItem(ckptKey()) || 'null'); } catch (e) {}
  if (!ck) { try { localStorage.removeItem(KEY_RUN); } catch (e) {} { nhaLaChan(); return; } }
  // chống lặp vô hạn: cùng một mục mà trang tải lại 3 lần liền thì bỏ mục đó, ghi lý do vào báo cáo
  const moc = ck.xong.length + '|' + (ck.dang || '');
  const lan = run.moc === moc ? (run.lan || 0) + 1 : 1;
  if (lan >= 3 && ck.dang) {
    ck.xong.push(ck.dang); ck.boQuaDoTaiLai = (ck.boQuaDoTaiLai || []).concat(ck.dang); ck.dang = '';
    try { localStorage.setItem(ckptKey(), hoaChuoi(ck)); } catch (e) {}
    console.warn('[dqtv] Trang tự tải lại 3 lần ở mục "' + ck.xong[ck.xong.length - 1] + '" — bỏ mục này, chạy tiếp mục sau.');
    CO.lanTiep = 0;
  } else CO.lanTiep = lan;
  CO.mocTiep = moc;
  // 3.5: chỉ TỰ chạy tiếp khi lá chắn có từ đầu trang (bản Tampermonkey); dán Console thì hiện nút để người bấm
  if (!(LC && LC.som)) { nhaLaChan(); CO.tienDo = 'Có lượt chạy dở của "' + TK + '" — bấm Chạy để chạy tiếp.'; capNhatBang(); console.info('[dqtv] ' + CO.tienDo); return; }
  console.info('[dqtv] Trang vừa tải lại giữa lúc chạy — tự chạy tiếp cho tài khoản "' + TK + '" (lần ' + (CO.lanTiep || 1) + ').');
  await dqtv.chay(run.over);
}
window.__dqtvChoDangNhap = chayTiepSauTaiLai;
chayTiepSauTaiLai(false);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', khoiDong, { once: true }); else khoiDong();

})();
