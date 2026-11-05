/* ============================================================= *
 * 5. BẢNG ĐIỀU KHIỂN (Shadow DOM) + CÁC LỆNH dqtv.*             *
 * ============================================================= */
let host, root;
function moBang() {
  if (host) { host.style.display = host.style.display === 'none' ? 'block' : 'none'; return; }
  host = document.createElement('div'); host.id = 'dqtv-panel-host';
  // "all:initial" phải đứng TRƯỚC, nếu đứng sau sẽ xoá position/top/right/z-index → bảng nằm ngoài màn hình
  host.style.cssText = 'all:initial;position:fixed;top:12px;right:12px;z-index:2147483647;display:block';
  (document.documentElement || document.body).appendChild(host);
  root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
  <style>
    :host{all:initial}
    .w{font:13px/1.4 system-ui,Segoe UI,Arial;width:360px;max-height:80vh;display:flex;flex-direction:column;
        background:#fff;color:#1a1a1a;border:1px solid #ccc;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,.2);overflow:hidden}
    .h{display:flex;align-items:center;gap:6px;padding:8px 10px;background:#0b3d66;color:#fff;cursor:move}
    .h b{flex:1;font-size:13px}
    .h button{background:transparent;border:0;color:#fff;cursor:pointer;font-size:14px}
    .tabs{display:flex;border-bottom:1px solid #ddd}
    .tabs button{flex:1;padding:7px;border:0;background:#f4f4f4;cursor:pointer;font:inherit}
    .tabs button.on{background:#fff;font-weight:600;box-shadow:inset 0 -2px 0 #0b3d66}
    .body{padding:10px;overflow:auto}
    .r{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}
    button.b{padding:6px 10px;border:1px solid #0b3d66;background:#0b3d66;color:#fff;border-radius:5px;cursor:pointer;font:inherit}
    button.g{padding:6px 10px;border:1px solid #bbb;background:#fff;color:#1a1a1a;border-radius:5px;cursor:pointer;font:inherit}
    button:disabled{opacity:.45;cursor:default}
    textarea{width:100%;height:150px;font:12px/1.4 ui-monospace,Consolas,monospace;border:1px solid #ccc;border-radius:5px;padding:6px;box-sizing:border-box}
    .prog{font-size:12px;color:#444;margin:6px 0;min-height:18px}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th,td{border:1px solid #e3e3e3;padding:4px 5px;text-align:left;vertical-align:top}
    tr.cao td{background:#fdecea}tr.tb td{background:#fff6e5}tr.row{cursor:pointer}tr.row:hover td{background:#eef5ff}
    .muted{color:#777;font-size:12px}
    .pill{display:inline-block;padding:1px 6px;border-radius:9px;font-size:11px}
    .pill.cao{background:#c62828;color:#fff}.pill.tb{background:#e08600;color:#fff}.pill.thap{background:#777;color:#fff}
    select,input{font:inherit;padding:4px;border:1px solid #ccc;border-radius:4px}
  </style>
  <div class="w">
    <div class="h" id="h"><b>DQTV · kiểm giao diện v3</b><button id="min" title="Thu gọn (Alt+Shift+D)">▁</button></div>
    <div class="tabs">
      <button data-t="run" class="on">Chạy</button>
      <button data-t="cfg">Cấu hình</button>
      <button data-t="res">Kết quả</button>
    </div>
    <div class="body" id="body"></div>
  </div>`;
  // kéo thả
  (function keo() {
    const h = root.getElementById('h'); let sx, sy, ox, oy, on = false;
    h.addEventListener('mousedown', e => { if (e.target.tagName === 'BUTTON') return; on = true; sx = e.clientX; sy = e.clientY; const r = host.getBoundingClientRect(); ox = r.left; oy = r.top; host.style.left = ox + 'px'; host.style.top = oy + 'px'; host.style.right = 'auto'; e.preventDefault(); });
    addEventListener('mousemove', e => { if (!on) return; host.style.left = (ox + e.clientX - sx) + 'px'; host.style.top = (oy + e.clientY - sy) + 'px'; });
    addEventListener('mouseup', () => on = false);
  })();
  root.getElementById('min').onclick = () => host.style.display = 'none';
  root.querySelectorAll('.tabs button').forEach(b => b.onclick = () => { root.querySelectorAll('.tabs button').forEach(x => x.classList.remove('on')); b.classList.add('on'); veThe(b.dataset.t); });
  veThe('run');
}

function el(html) { const d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }
function esc(s) { return cheChuoi(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

function veThe(t) {
  const body = root.getElementById('body'); body.innerHTML = '';
  if (t === 'run') {
    body.appendChild(el(`<div>
      <div class="r">
        <button class="b" id="r-chay">▶ Chạy</button><button class="g" id="r-tham">🔍 Thăm dò</button>
        <button class="g" id="r-tam">⏸ Tạm dừng</button>
        <button class="g" id="r-dung">■ Dừng</button>
        <button class="g" id="r-loi">↻ Chạy lại mục lỗi</button>
        <button class="g" id="r-tay" title="Tự mở form / hồ sơ / hộp thoại rồi bấm để quét trường của nó">⌖ Quét màn này</button>
        <button class="g" id="r-dau" title="Bỏ điểm dừng của tài khoản này, chạy lại toàn bộ">⟲ Chạy lại từ đầu</button>
        <button class="g" id="r-nk" title="Tải nhật ký các thao tác gần nhất (giữ qua tải lại trang)">☰ Nhật ký</button>
        <button class="g" id="r-nap" title="Chọn tệp quy trình / UC / TC để đối chiếu. Tệp công cụ không nhận ra sẽ được báo, không dùng">⇪ Nạp tệp</button>
        <button class="g" id="r-napthu" title="Chọn cả một thư mục; công cụ đọc từng tệp bên trong">⇪ Nạp thư mục</button>
      </div>
      <div class="r"><label>Bộ cấu hình:
        <select id="r-hoso"><option value="">(đang dùng)</option><option value="nhanh">nhanh</option><option value="day-du">đầy đủ</option><option value="bao-mat">bảo mật</option><option value="kiem-ke-truong">chỉ kiểm kê trường</option></select></label>
      </div>
      <div class="prog" id="r-prog">Chưa chạy.</div>
      <div class="muted" id="r-note"></div>
    </div>`));
    root.getElementById('r-chay').onclick = () => { const h = root.getElementById('r-hoso').value; if (h) dqtv.hoSo(h); dqtv.chay(); };
    root.getElementById('r-tham').onclick = async () => {   // 3.6
      const rows = await dqtv.thamDo(); if (!rows) return;
      let box = root.getElementById('r-thamdo'); if (!box) { box = document.createElement('div'); box.id = 'r-thamdo'; root.getElementById('r-tham').closest('div').parentElement.appendChild(box); }
      box.innerHTML = '<table><thead><tr><th></th><th>Mục</th><th>Công cụ nhận ra</th></tr></thead><tbody>' + rows.map(r => '<tr><td>' + esc(r['']) + '</td><td>' + esc(r.muc) + '</td><td>' + esc(r.ket_qua) + (r.goi_y ? '<div class="muted">' + esc(r.goi_y) + '</div>' : '') + '</td></tr>').join('') + '</tbody></table>';
    };
    root.getElementById('r-tam').onclick = () => { if (CO.tamDung) { dqtv.tiep(); root.getElementById('r-tam').textContent = '⏸ Tạm dừng'; } else { dqtv.tamDung(); root.getElementById('r-tam').textContent = '▶ Tiếp'; } };
    root.getElementById('r-dung').onclick = () => dqtv.dung();
    root.getElementById('r-loi').onclick = () => dqtv.chayLaiLoi();
    root.getElementById('r-nk').onclick = () => { const ds = docNK(); taiTep('dqtv-nhat-ky-' + slugTK() + '-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.csv', '\ufeffgiờ,tài khoản,loại,nội dung,url\n' + ds.map(x => [x.t, x.tk, x.loai, x.nd, x.url].map(v => '"' + String(v || '').replace(/"/g, '""') + '"').join(',')).join('\n'), 'text/csv'); dqtv.nhatKy(); };
    root.getElementById('r-nap').onclick = () => dqtv.nap();
    root.getElementById('r-napthu').onclick = () => dqtv.napThuMuc();
    root.getElementById('r-dau').onclick = () => { const h = root.getElementById('r-hoso').value; if (h) dqtv.hoSo(h); dqtv.chayLaiTuDau(); };
    root.getElementById('r-tay').onclick = async () => { const n = root.getElementById('r-note'); n.textContent = 'Đang quét màn này…'; const ds = await dqtv.quetManNay(); n.textContent = 'Quét tay: ' + (ds ? ds.length : 0) + ' trường. Gom được ' + docTay().length + ' trường. Xuất: dqtv.xuat("truong-tay")'; };
    // gợi ý tiếp tục nếu có điểm dừng
    TK = taiKhoan();
    let note = 'Tài khoản: ' + (TK || '(không nhận ra)') + '.';
    try { const c = localStorage.getItem(ckptKey()); if (c) { const ck = doChuoi(c); if (ck.origin === location.origin && ck.tk === TK) note += ' Có điểm dừng lúc ' + new Date(ck.ts).toLocaleString('vi-VN') + ' (' + ck.xong.length + ' mục đã xong): bấm Chạy để tiếp, hoặc "Chạy lại từ đầu".'; } } catch (e) {}
    root.getElementById('r-note').textContent = note;
  }
  if (t === 'cfg') {
    const cur = cfgHienTai();
    const show = Object.fromEntries(Object.keys(KIEU).map(k => [k, cur[k]]));
    body.appendChild(el(`<div>
      <div class="muted">Sửa trực tiếp (cú pháp JS, dùng được /regex/). Bấm Áp dụng để lưu.</div>
      <textarea id="c-txt"></textarea>
      <div class="r">
        <button class="b" id="c-ap">Áp dụng &amp; lưu</button>
        <button class="g" id="c-lai">Về mặc định</button>
        <button class="g" id="c-xuat">Xuất</button>
        <button class="g" id="c-nhap">Nhập</button>
      </div>
      <div class="muted" id="c-msg"></div>
    </div>`));
    root.getElementById('c-txt').value = jsLiteral(show);
    root.getElementById('c-ap').onclick = () => {
      try { const o = new Function('return (' + root.getElementById('c-txt').value + ')')(); const err = []; for (const k in o) { const e = kiemKieu(k, o[k]); if (e) err.push(e); } if (err.length) { root.getElementById('c-msg').textContent = '⚠ ' + err.join('; '); return; } dqtv.dat(o); root.getElementById('c-msg').textContent = '✔ Đã lưu.'; } catch (e) { root.getElementById('c-msg').textContent = '⚠ Sai cú pháp: ' + e.message; }
    };
    root.getElementById('c-lai').onclick = () => { dqtv.datLai(); veThe('cfg'); };
    root.getElementById('c-xuat').onclick = () => { root.getElementById('c-txt').value = dqtv.xuatCauHinh(); root.getElementById('c-msg').textContent = 'Đã đưa cấu hình ra ô trên, copy để chuyển máy.'; };
    root.getElementById('c-nhap').onclick = () => { try { dqtv.nhapCauHinh(root.getElementById('c-txt').value); root.getElementById('c-msg').textContent = '✔ Đã nhập.'; veThe('cfg'); } catch (e) { root.getElementById('c-msg').textContent = '⚠ ' + e.message; } };
  }
  if (t === 'res') {
    let kq; try { kq = doChuoi(localStorage.getItem(KEY_LAST) || 'null'); } catch (e) {}
    kq = (window.__DQTV_AUDIT && window.__DQTV_AUDIT.ketQua) || kq;
    if (!kq) { body.appendChild(el('<div class="muted">Chưa có kết quả.</div>')); return; }
    const head = el(`<div>
      <div class="r muted">${esc(kq.luc)} · ${kq.so_man_da_kiem} màn · cao ${kq.man_cao}, TB ${kq.man_trung_binh} · ô lỗi ${kq.o_nhap_co_loi}</div>
      <div class="r muted">Kiểm kê: ${kq.so_truong || 0} trường · ${kq.truong_co_loi || 0} trường có lỗi · ${kq.so_form_da_mo || 0} form đã mở${(kq.thieu_truong_so_voi_mong_doi || []).length ? ' · <b style="color:#c62828">thiếu ' + kq.thieu_truong_so_voi_mong_doi.length + ' trường</b>' : ''}</div>
      <div class="r">
        <label>Lọc: <select id="f-muc"><option value="">tất cả</option><option value="cao">cao</option><option value="trung bình">trung bình</option><option value="thấp">thấp</option><option value="__truong">trường có lỗi</option><option value="__thieu">thiếu trường</option><option value="__mau">theo mẫu lỗi</option><option value="__ds">thiết kế &amp; ngôn từ</option></select></label>
      </div>
      <div class="r">
        <button class="g" id="x-json">JSON</button><button class="g" id="x-csv">CSV</button><button class="g" id="x-html">HTML</button><button class="g" id="x-mau">Mẫu lỗi (CSV)</button><button class="b" id="x-truong">Danh mục trường (CSV)</button>
      </div></div>`);
    body.appendChild(head);
    const wrap = el('<div id="res-tbl"></div>'); body.appendChild(wrap);
    const render = () => {
      const f = root.getElementById('f-muc').value;
      if (f === '__mau' || f === '__ds') {   // 3.6
        if (f === '__ds') { wrap.innerHTML = htmlThietKe(kq) || '<div class="muted">Không có dữ liệu (bản chạy cũ hoặc đã tắt).</div>'; return; }
        const ml = kq.mau_loi || []; wrap.innerHTML = ml.length ? '' : '<div class="muted">Không có mục khớp.</div>'; if (!ml.length) return;
        const tb3 = el('<table><thead><tr><th>Mức</th><th>Mẫu lỗi</th><th>Số màn</th></tr></thead><tbody></tbody></table>');
        ml.forEach(m => tb3.querySelector('tbody').appendChild(el(`<tr><td>${esc(m.muc_do)}</td><td><b>${esc(m.loai)}</b>${m.chi_tiet ? ' — ' + esc(m.chi_tiet) : ''}<div class="muted">${esc(m.nguyen_tac)}${m.can_xac_nhan ? ' · cần xác nhận: ' + esc(m.can_xac_nhan) : ''}</div><div class="muted">vd: ${esc((m.vi_du_man || []).join(' · '))}</div></td><td>${esc(m.so_man)}</td></tr>`)));
        wrap.appendChild(tb3); return;
      }
      if (f === '__truong' || f === '__thieu') {
        const ds = f === '__truong'
          ? (kq.danh_muc_truong || []).filter(x => x.loi).slice(0, 300).map(x => [x.man, (x.vung ? x.vung + ' · ' : '') + (x.nhan || '(không nhãn)') + ' [' + x.loai + ']', x.loi])
          : (kq.thieu_truong_so_voi_mong_doi || []).map(x => [x.man, x.truong, 'không thấy trên giao diện (' + x.so_truong_da_thay_o_man + ' trường đã thấy ở màn)']);
        wrap.innerHTML = ds.length ? '' : '<div class="muted">Không có mục khớp.</div>';
        if (!ds.length) return;
        const tb2 = el('<table><thead><tr><th>Màn</th><th>Trường</th><th>Vấn đề</th></tr></thead><tbody></tbody></table>');
        ds.forEach(d => tb2.querySelector('tbody').appendChild(el(`<tr><td>${esc(d[0])}</td><td>${esc(d[1])}</td><td>${esc(d[2])}</td></tr>`)));
        wrap.appendChild(tb2); return;
      }
      const rows = (kq.van_de || []).filter(r => !f || r.muc_do === f);
      wrap.innerHTML = rows.length ? '' : '<div class="muted">Không có mục khớp.</div>';
      if (!rows.length) return;
      const tb = el('<table><thead><tr><th>Màn</th><th>Mức</th><th>Vấn đề</th></tr></thead><tbody></tbody></table>');
      const body2 = tb.querySelector('tbody');
      rows.forEach(r => {
        const cls = r.muc_do === 'cao' ? 'cao' : r.muc_do === 'trung bình' ? 'tb' : '';
        const pill = r.muc_do === 'cao' ? 'cao' : r.muc_do === 'trung bình' ? 'tb' : 'thap';
        const van = [r.api_loi && 'API: ' + r.api_loi, r.js_loi && 'JS: ' + r.js_loi, r.quy_trinh_loi && 'Quy trình: ' + r.quy_trinh_loi, r.rong_nhung_api_loi, r.o_khong_nhan && 'Ô không nhãn: ' + r.o_khong_nhan, r.tieu_de_bi_cat && 'Tiêu đề cắt: ' + r.tieu_de_bi_cat, r.nghi_ngo_so_lech && 'Nghi số lệch: ' + r.nghi_ngo_so_lech,
          r.du_lieu_nhay_cam && 'Dữ liệu nhạy cảm: ' + r.du_lieu_nhay_cam, r.ma_enum_lo && 'Mã lộ ra: ' + r.ma_enum_lo, r.cat_chu_khong_tooltip && 'Chữ cắt không tooltip: ' + r.cat_chu_khong_tooltip,
          r.chuoi_dai_khong_ngat && 'Chuỗi dài không ngắt: ' + r.chuoi_dai_khong_ngat, r.dinh_dang_ngay_tron && 'Ngày trộn: ' + r.dinh_dang_ngay_tron, r.dinh_dang_so_tron && 'Số trộn: ' + r.dinh_dang_so_tron,
          r.tieu_de_lech_menu && 'Tiêu đề lệch menu: ' + r.tieu_de_lech_menu, r.nut_chinh_nhieu && 'Nhiều nút chính: ' + r.nut_chinh_nhieu, r.can_xac_nhan && 'Cần xác nhận: ' + r.can_xac_nhan].filter(Boolean).map(esc).join('<br>');   // 3.5: escape dữ liệu lấy từ trang
        const tr = el(`<tr class="row ${cls}"><td>${esc(r.tab)}</td><td><span class="pill ${pill}">${esc(r.muc_do)}</span></td><td>${van}</td></tr>`);
        tr.onclick = () => dqtv.moMan(r.url, r.tab);
        body2.appendChild(tr);
      });
      wrap.appendChild(tb);
    };
    root.getElementById('f-muc').onchange = render;
    root.getElementById('x-json').onclick = () => dqtv.xuat('json');
    root.getElementById('x-csv').onclick = () => dqtv.xuat('csv');
    root.getElementById('x-html').onclick = () => dqtv.xuat('html');
    root.getElementById('x-mau').onclick = () => dqtv.xuat('mau');
    root.getElementById('x-truong').onclick = () => dqtv.xuat('truong');
    render();
  }
}

function capNhatBang() {
  if (!root) return;
  const p = root.getElementById('r-prog'); if (p) p.textContent = CO.dangChay ? ('Đang: ' + CO.tienDo) : (CO.tienDo || 'Xong.');
  const onRes = root.querySelector('.tabs button[data-t=res].on'); if (onRes) veThe('res');
}

// In đối tượng JS có kèm /regex/ cho dễ đọc
function jsLiteral(o, ind = '') {
  if (o instanceof RegExp) return o.toString();
  if (o === null) return 'null';
  if (Array.isArray(o)) { if (!o.length) return '[]'; return '[\n' + o.map(v => ind + '  ' + jsLiteral(v, ind + '  ')).join(',\n') + '\n' + ind + ']'; }
  if (typeof o === 'object') { const ks = Object.keys(o); if (!ks.length) return '{}'; return '{\n' + ks.map(k => ind + '  ' + k + ': ' + jsLiteral(o[k], ind + '  ')).join(',\n') + '\n' + ind + '}'; }
  return JSON.stringify(o);
}

// Tải tệp
function taiTep(ten, noiDung, kieu) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([noiDung], { type: kieu })); a.download = ten;
  (document.body || document.documentElement).appendChild(a); a.click(); a.remove();
}
function sangCSV(kq) {
  const rows = kq.van_de || []; const cols = ['tab', 'url', 'muc_do', 'can_cu', 'du_lieu_nhay_cam', 'api_loi', 'js_loi', 'quy_trinh_loi', 'quy_trinh_trang_thai', 'rong_nhung_api_loi', 'o_khong_nhan', 'tieu_de_bi_cat', 'chu_la', 'phan_tram_vo_ly', 'so_dong_vuot_tong', 'van_dang_tai', 'tran_ngang', 'chan_ghi', 'nghi_ngo_so_lech',
    'ma_enum_lo', 'cat_chu_khong_tooltip', 'chuoi_dai_khong_ngat', 'dinh_dang_ngay_tron', 'dinh_dang_so_tron', 'tieu_de_lech_menu', 'nut_chinh_nhieu', 'can_xac_nhan'];
  const q = v => '"' + cheChuoi(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '\ufeff' + cols.join(',') + '\n' + rows.map(r => cols.map(c => q(r[c])).join(',')).join('\n');
}
// Danh mục trường → CSV (mở bằng Excel, đối chiếu với đặc tả / Phụ lục)
const COT_TRUONG = [['goc', 'Mục menu'], ['man', 'Màn'], ['vung', 'Vùng'], ['nhan', 'Nhãn trường'], ['loai', 'Kiểu'], ['bat_buoc', 'Bắt buộc'],
  ['so_lua_chon', 'Số lựa chọn'], ['lua_chon', 'Các lựa chọn'], ['gia_tri', 'Giá trị đang hiện'], ['nguon_nhan', 'Nguồn nhãn'], ['ten_ma', 'name/id'], ['loi', 'Lỗi'], ['ghi_chu', 'Ghi chú']];
function sangCSVTruong(ds) {
  const q = v => '"' + cheChuoi(v == null ? '' : v).replace(/"/g, '""') + '"';
  return '﻿' + COT_TRUONG.map(c => q(c[1])).join(',') + '\n' + (ds || []).map(r => COT_TRUONG.map(c => q(r[c[0]])).join(',')).join('\n');
}
