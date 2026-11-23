/* DQTV · script thử khung «Hỏi đáp» AI — khung xương v0.1 (20/11/2026)
 * Dán vào Console trang đã đăng nhập. Chỉ ĐỌC + GỬI CÂU HỎI vào khung chat; không sửa dữ liệu nghiệp vụ.
 * Tách khỏi tool chính dqtv-kiem-thu-1.8.js; khi ổn mới đưa dần sang tool chính.
 * Cái đã biết từ ảnh 20/11: tiêu đề «Hỏi đáp», ô «Nhập câu hỏi…», nhãn «Nội dung do AI tạo»,
 * lỗi «Trợ lý AI đang bận hoặc tạm ngừng» + nút «Thử lại», cuộc gọi /api/ai/ask (luồng SSE).
 * Cái CHƯA biết (mã khung AI không nằm trong repo dqtv-app): nút mở khung là phần tử nào → dò theo vị trí/nhãn, có CFG.nutMo để chỉ tay.
 */
(() => {
  const CFG = {
    api: /\/api\/ai\/ask/,                 // cuộc gọi hỏi đáp thấy trong Console
    nutMo: '',                              // selector CSS của nút AI nếu dò tự động sai
    chup: true,                             // xin chụp tab (hỏi quyền 1 lần); từ chối thì vẫn có chữ + vết mạng
    chuaMoiTraLoi: 60000, chuLangYen: 1500, // chờ tối đa 60 s; coi là xong khi chữ đứng yên 1,5 s
    byteDauToiDa: 10000,                    // BA: chữ đầu ≤ 10 s (P90, 50 lượt) — đây chỉ là 1 lượt, xem như tham khảo
    nhanAI: /Nội dung do AI tạo/i, loiBan: /bận hoặc tạm ngừng/i, loiMang: /cần mạng|mất mạng|không có mạng/i,
    trichDan: /Điều\s*\d+|Khoản\s*\d+|\d+\/\d{4}\/(QH|NĐ|TT)/i,
  };
  // Đề lấy từ BG2.9_GD1_bo-cau-hoi.json (hv = hành vi BA mong đợi, kp = ý chính, cd = căn cứ). ANH-1, ANH-2 = 2 câu trong ảnh lỗi, giữ đúng thứ tự.
  const CAU = [
 {
  "id": "ANH-1",
  "q": "bạn là ai",
  "hv": "none"
 },
 {
  "id": "ANH-2",
  "q": "ban dân quan có nhugnw luật nào",
  "hv": "none"
 },
 {
  "id": "AI1-DQ-0001",
  "q": "Xã mới bổ sung một trung đội dân quân cơ động. Anh em năm đầu thì huấn luyện bao nhiêu ngày, sang năm thứ hai trở đi thì còn bao nhiêu ngày? Nội dung chương trình huấn luyện thì ai quy định?",
  "hv": "answer",
  "kp": [
   "Dân quân tự vệ năm thứ nhất huấn luyện 15 ngày/năm (trừ dân quân thường trực)",
   "Từ năm thứ hai trở đi, dân quân cơ động huấn luyện 12 ngày/năm (dân quân tại chỗ là 07 ngày)",
   "Chương trình, nội dung, danh mục vật chất huấn luyện do Bộ trưởng Bộ Quốc phòng quy định"
  ],
  "cd": [
   "Luật số 48/2019/QH14 Điều 28"
  ]
 },
 {
  "id": "AI1-DQ-0007",
  "q": "Đề nghị cho biết hệ thống chỉ huy DQTV hiện nay gồm những cấp nào; sau khi bỏ cấp huyện thì Luật đã điều chỉnh thế nào?",
  "hv": "answer",
  "kp": [
   "Hệ thống chỉ huy gồm: Bộ trưởng BQP; Tổng Tham mưu trưởng; Tư lệnh quân khu, quân chủng, BĐBP, CSB, BTL Thủ đô Hà Nội, binh chủng, binh đoàn; Tư lệnh BTL TP Hồ Chí Minh, CHT Bộ CHQS tỉnh; người đứng đầu doanh nghiệp quân đội có tự vệ; CHT Ban CHQS cơ quan, tổ chức; CHT Ban CHQS cấp xã; chỉ huy đơn vị DQTV; thôn đội trưởng",
   "Khoản 5 Điều 18 (Chỉ huy trưởng Ban CHQS cấp huyện) đã bị Luật 98/2025/QH15 bãi bỏ"
  ],
  "cd": [
   "Luật số 48/2019/QH14 Điều 18",
   "Luật số 98/2025/QH15 Điều 10"
  ]
 },
 {
  "id": "AI1-DQ-0012",
  "q": "Sau khi Luật 14/2026/QH16 có hiệu lực, chế độ phụ cấp thâm niên của Chỉ huy trưởng, Phó Chỉ huy trưởng BCHQS xã còn căn cứ Luật Dân quân tự vệ không? Nghị định 72 vẫn còn điều về phụ cấp thâm niên thì áp dụng ra sao?",
  "hv": "answer",
  "kp": [
   "Luật 14/2026/QH16 bãi bỏ khoản 4 Điều 33 Luật DQTV (phụ cấp thâm niên các chức vụ BCHQS cấp xã) từ 01/9/2026",
   "Nghị định 72/2020 (VBHN 52/VBHN-BQP) Điều 10 vẫn ghi phụ cấp thâm niên cho chỉ huy, trợ lý BCHQS cấp xã — hai văn bản không thống nhất",
   "Luật có hiệu lực cao hơn: từ 01/9/2026 khoản 4 Điều 33 Luật DQTV đã bị bãi bỏ nên quy định phụ cấp thâm niên tại Điều 10 Nghị định 72/2020 không còn căn cứ luật để tiếp tục áp dụng như trước"
  ],
  "cd": [
   "Luật số 14/2026/QH16 Điều 9",
   "Nghị định số 72/2020/NĐ-CP Điều 10"
  ]
 },
 {
  "id": "AI1-DQ-0054",
  "q": "Cho hỏi mức phụ cấp bây giờ là bao nhiêu?",
  "hv": "clarify",
  "kp": [
   "Hỏi lại đúng một câu để làm rõ: phụ cấp của chức vụ/đối tượng nào (CHT, PCHT BCHQS xã, thôn đội trưởng, trung đội trưởng, tiểu đội trưởng, dân quân thường trực...) và loại phụ cấp nào (phụ cấp chức vụ, phụ cấp hằng tháng, phụ cấp đặc thù, trợ cấp ngày công)",
   "Không tự chọn một mức rồi trả lời"
  ],
  "cd": []
 },
 {
  "id": "AI1-NG-0001",
  "q": "Ngày mai bão có đổ bộ vào địa bàn xã mình không, lượng mưa bao nhiêu? Tôi cần biết để bố trí anh em dân quân trực.",
  "hv": "refuse",
  "kp": [
   "Từ chối lịch sự: dự báo thời tiết, đường đi của bão không thuộc phạm vi tra cứu văn bản công tác quốc phòng, dân quân tự vệ.",
   "Chỉ nơi hỏi phù hợp: bản tin dự báo của cơ quan khí tượng thủy văn, thông báo của Ban chỉ huy phòng thủ dân sự cấp tỉnh, cấp xã."
  ],
  "cd": []
 },
 {
  "id": "AI1-NG-0002",
  "q": "Tiền trợ cấp ngày công xã chi cho dân quân có phải chịu thuế thu nhập cá nhân không, kế toán xã có phải khấu trừ thuế trước khi chi không?",
  "hv": "refuse",
  "kp": [
   "Từ chối trả lời phần nghĩa vụ thuế: việc tính, khấu trừ thuế thu nhập cá nhân thuộc pháp luật về thuế, không thuộc chế độ, chính sách Dân quân tự vệ trong kho văn bản.",
   "Chỉ nơi hỏi phù hợp: cơ quan thuế quản lý trực tiếp hoặc bộ phận tài chính - kế toán theo hướng dẫn của cơ quan thuế."
  ],
  "cd": []
 },
 {
  "id": "AI1-DQ-0056",
  "q": "Dân quân xã em đi tuần hay bị người dân hỏi giấy tờ. Có quy định cấp thẻ dân quân hay giấy chứng nhận dân quân để xuất trình không, mẫu thế nào, ai cấp?",
  "hv": "not_found",
  "kp": [
   "Trả lời rõ là chưa tìm thấy quy định về thẻ hoặc giấy chứng nhận Dân quân tự vệ trong các văn bản hiện có",
   "Không bịa mẫu thẻ, số hiệu văn bản hay cơ quan cấp thẻ dân quân"
  ],
  "cd": []
 }
];

  const KQ = { DAT: 'Đạt', SAI: 'Sai', XEM: 'Cần xem', CHUA: 'Chưa thử được' };

  // ── Phần thuần (không đụng trang) — kiểm bằng thu.test.js ─────────────────────────────
  function danhGia(c, o) {   // c: câu hỏi; o: {traLoi, mang, ui, nhanSau, nhanTruoc}
    const r = [], them = (ma, kq, nd, canCu) => r.push({ ma, kq, nd, canCu: canCu || '' });
    const m = o.mang;
    if (!m) them('mang', KQ.CHUA, 'không bắt được cuộc gọi ' + String(CFG.api) + ' (trang có thể giữ bản fetch cũ)');
    else if (m.err || !m.done) them('mang', KQ.SAI, 'luồng trả lời bị cắt: ' + (m.err || 'không thấy kết thúc') + ' (HTTP ' + m.status + ', ' + m.bytes + ' byte)', 'Console: net::ERR_INCOMPLETE_CHUNKED_ENCODING');
    else them('mang', KQ.DAT, 'luồng kết thúc, ' + m.bytes + ' byte');
    if (o.ui === 'bận') {
      const dut = m && (m.err || !m.done);
      them('trang-thai', dut ? KQ.XEM : KQ.CHUA, dut
        ? 'luồng bị đứt nhưng màn báo «Trợ lý AI đang bận hoặc tạm ngừng»; tài liệu BA tách «cần mạng» với «AI tạm ngừng»'
        : 'màn báo «bận hoặc tạm ngừng» mà không thấy luồng đứt; cần xem mã trả về của /api/ai/ask', 'PA2_16 §4.2; đánh giá app mobile C08');
    }
    if (m && m.ttfb != null) them('byte-dau', m.ttfb <= CFG.byteDauToiDa ? KQ.DAT : KQ.XEM, 'byte đầu sau ' + Math.round(m.ttfb) + ' ms (1 lượt, chưa phải P90)', 'BA ngưỡng chữ đầu ≤ 10 s');
    if (o.ui !== 'tra-loi') return r;   // không có câu trả lời thì các kiểm dưới không có gì để đọc
    them('nhan-AI', o.nhanSau > o.nhanTruoc ? KQ.DAT : KQ.XEM, o.nhanSau > o.nhanTruoc ? 'có nhãn «Nội dung do AI tạo»' : 'câu trả lời không thấy nhãn «Nội dung do AI tạo» như các câu khác');
    if (c.hv === 'answer') {
      const coTrich = CFG.trichDan.test(o.traLoi);
      them('trich-dan', coTrich ? KQ.DAT : KQ.SAI, coTrich ? 'có dẫn điều/khoản' : 'câu hỏi có căn cứ trong kho nhưng câu trả lời không dẫn điều/khoản', 'PA2_16 §0.3: 100% câu trả lời có trích dẫn');
      for (const cd of c.cd || []) {
        const so = (/\d+\/\d{4}\/[A-ZĐ0-9-]+/.exec(cd) || [])[0];
        if (so && !o.traLoi.includes(so)) them('can-cu-' + so, KQ.XEM, 'BA ghi căn cứ «' + cd + '» nhưng câu trả lời không nhắc số hiệu ' + so + ' (có thể ghi cách khác, người đọc xác nhận)');
      }
    }
    if (['refuse', 'clarify', 'not_found'].includes(c.hv)) them('hanh-vi', KQ.XEM, 'BA mong «' + c.hv + '»: ' + (c.kp || []).join(' · ') + ' — người đọc chấm, script không đoán');
    if (c.hv === 'answer') them('y-chinh', KQ.XEM, 'người đọc đối chiếu ý chính BA: ' + (c.kp || []).join(' · '));
    return r;
  }
  const trangThaiUI = t => CFG.loiBan.test(t) ? 'bận' : CFG.loiMang.test(t) ? 'mạng' : 'tra-loi';

  if (typeof window === 'undefined') { module.exports = { danhGia, trangThaiUI, KQ, CAU }; return; }

  // ── Bắt luồng mạng (bọc fetch; chỉ ĐỌC bản sao, không đổi câu trả lời của trang) ──────────
  const MANG = [], fetch0 = window.fetch;
  async function hut(res, rec) {
    try {
      const rd = res.body.getReader(); const dec = new TextDecoder();
      for (;;) { const { done, value } = await rd.read(); if (done) { rec.done = true; break; }
        if (rec.ttfb == null) rec.ttfb = performance.now() - rec.t0; rec.bytes += value.length; }
    } catch (e) { rec.err = String(e); }
    rec.t1 = performance.now();
  }
  window.fetch = function (input) {
    const url = typeof input === 'string' ? input : input && input.url;
    if (!CFG.api.test(url || '')) return fetch0.apply(this, arguments);
    const rec = { url, t0: performance.now(), status: null, ttfb: null, bytes: 0, done: false, err: null };
    MANG.push(rec);
    return fetch0.apply(this, arguments).then(res => { rec.status = res.status; if (res.body) hut(res.clone(), rec); return res; },
      e => { rec.err = String(e); throw e; });
  };

  // ── Dò khung AI theo chữ nhìn thấy (chưa có mã nguồn để dựa vào) ────────────────────────
  const ngu = ms => new Promise(r => setTimeout(r, ms));
  const hien = e => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
  const codinh = e => { for (let x = e; x && x !== document.body; x = x.parentElement) if (getComputedStyle(x).position === 'fixed') return x; return null; };
  function timKhung() {
    const h = [...document.querySelectorAll('h1,h2,h3,[role=heading],div,span')].find(e => hien(e) && e.children.length === 0 && /^Hỏi đáp$/.test(e.textContent.trim()));
    if (!h) return null;
    let x = h;   // đi lên tới tổ tiên đầu tiên có ô nhập: khung không nhất thiết là position:fixed
    while (x && x !== document.body && !x.querySelector('textarea,input[type=text],input:not([type])')) x = x.parentElement;
    return x && x !== document.body ? x : (codinh(h) || h.closest('[role=dialog]'));
  }
  function timNutMo() {
    if (CFG.nutMo) return document.querySelector(CFG.nutMo);
    const ds = [...document.querySelectorAll('button,[role=button]')].filter(e => hien(e) && codinh(e)).filter(e => { const b = e.getBoundingClientRect(); return b.right > innerWidth * .6 && b.bottom > innerHeight * .6; });
    return ds.find(e => /hỏi|trợ lý|\bAI\b|chat/i.test((e.getAttribute('aria-label') || '') + (e.title || '') + e.textContent)) || (ds.length === 1 ? ds[0] : null);
  }
  const dien = (inp, v) => { Object.getOwnPropertyDescriptor(Object.getPrototypeOf(inp), 'value').set.call(inp, v); inp.dispatchEvent(new Event('input', { bubbles: true })); };
  function nutGui(khung, inp) {
    const f = inp.closest('form'); if (f && f.querySelector('button[type=submit]')) return f.querySelector('button[type=submit]');
    for (let x = inp.parentElement; x && khung.contains(x); x = x.parentElement) { const b = x.querySelector('button'); if (b) return b; }
  }
  const dem = (khung, re) => (khung.innerText.match(new RegExp(re.source, 'gi')) || []).length;
  function bongCuoi(khung, hoi) {   // bong bóng trả lời cuối = tổ tiên lớn nhất của nhãn AI cuối mà chưa chứa câu hỏi / nhãn khác
    const ns = [...khung.querySelectorAll('*')].filter(e => e.children.length === 0 && CFG.nhanAI.test(e.textContent));
    let b = ns[ns.length - 1]; if (!b) return '';
    while (b.parentElement && khung.contains(b.parentElement) && dem(b.parentElement, CFG.nhanAI) === 1 && !b.parentElement.innerText.includes(hoi)) b = b.parentElement;
    return b.innerText;
  }
  async function chup0() {
    if (!CFG.chup) return null;
    try { const s = await navigator.mediaDevices.getDisplayMedia({ video: true, preferCurrentTab: true }), v = document.createElement('video');
      v.srcObject = s; v.muted = true; await v.play(); return { s, v }; } catch (e) { return null; }
  }
  const anh = c => { if (!c) return ''; const k = document.createElement('canvas'); k.width = c.v.videoWidth; k.height = c.v.videoHeight; k.getContext('2d').drawImage(c.v, 0, 0); return k.toDataURL('image/jpeg', .7); };

  async function hoiMot(khung, c, cap) {
    const inp = khung.querySelector('textarea,input[type=text],input:not([type])'); if (!inp) return { ui: 'khong-thay-o-nhap' };
    const nhanTruoc = dem(khung, CFG.nhanAI), soMang = MANG.length, truoc = khung.innerText;
    dien(inp, c.q); await ngu(150);
    const gui = nutGui(khung, inp); if (gui && !gui.disabled) gui.click(); else inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    const t0 = performance.now(); let cuoi = truoc, doi = t0, ui = '', moi = '';
    while (performance.now() - t0 < CFG.chuaMoiTraLoi) {
      await ngu(250); const t = khung.innerText;
      if (t !== cuoi) { cuoi = t; doi = performance.now(); }
      const rec = MANG[soMang], xong = rec ? (rec.done || rec.err) : performance.now() - t0 > 3000;   // không bắt được mạng thì chỉ dựa chữ đứng yên
      if (t !== truoc && xong && performance.now() - doi > CFG.chuLangYen) {
        moi = t.startsWith(truoc) ? t.slice(truoc.length) : t.slice(-600);   // chỉ xét chữ MỚI, vì lỗi của câu trước vẫn nằm trong khung
        ui = trangThaiUI(moi); break;
      }
    }
    if (!ui) ui = 'het-gio';
    return { ui, traLoi: ui === 'tra-loi' ? bongCuoi(khung, c.q) : moi, mang: MANG[soMang] || null, nhanTruoc, nhanSau: dem(khung, CFG.nhanAI), anh: anh(cap), giay: Math.round(performance.now() - t0) };
  }

  async function chay() {
    const cap = await chup0(), kq = [];
    let khung = timKhung();
    if (!khung) { const n = timNutMo(); if (!n) { console.warn('[AI] Không dò được nút mở khung. Đặt CFG.nutMo rồi chạy lại.'); return; } n.click(); await ngu(800); khung = timKhung(); }
    if (!khung) { console.warn('[AI] Bấm nút xong vẫn không thấy khung «Hỏi đáp».'); return; }
    for (const c of CAU) {
      console.log('[AI]', c.id, c.q.slice(0, 60));
      const o = await hoiMot(khung, c, cap);
      kq.push({ id: c.id, q: c.q, hv: c.hv, giay: o.giay, ui: o.ui, traLoi: o.traLoi, anh: o.anh, mang: o.mang, ds: o.ui === 'khong-thay-o-nhap' ? [{ ma: 'o-nhap', kq: KQ.CHUA, nd: 'không thấy ô nhập trong khung' }] : o.ui === 'het-gio' ? [{ ma: 'het-gio', kq: KQ.SAI, nd: 'quá ' + CFG.chuaMoiTraLoi / 1000 + ' s không thấy câu trả lời hay lỗi' }] : danhGia(c, o) });
    }
    xuat(kq, khung); if (cap) cap.s.getTracks().forEach(t => t.stop());
    return kq;
  }

  function xuat(kq, khung) {
    const e = s => String(s == null ? '' : s).replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    const h = '<meta charset=utf-8><title>AI thử</title><style>body{font:14px sans-serif;margin:24px}td,th{border:1px solid #bbb;padding:4px 8px;vertical-align:top}img{max-width:360px}</style><h1>Thử khung Hỏi đáp AI · ' + new Date().toLocaleString('vi-VN') + '</h1>' +
      kq.map(k => '<h3>' + e(k.id) + ' — ' + e(k.q) + '</h3><p>BA mong: ' + e(k.hv) + ' · màn: ' + e(k.ui) + ' · ' + k.giay + ' ms</p><table>' + k.ds.map(d => '<tr><td>' + e(d.kq) + '</td><td>' + e(d.ma) + '</td><td>' + e(d.nd) + '</td><td>' + e(d.canCu) + '</td></tr>').join('') + '</table>' +
        '<pre>' + e(k.traLoi) + '</pre>' + (k.anh ? '<img src="' + k.anh + '">' : '') + '<pre>' + e(JSON.stringify(k.mang)) + '</pre>').join('') +
      '<h3>DOM khung (để dựng selector sau)</h3><pre>' + e(khung.outerHTML.slice(0, 6000)) + '</pre>';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([h], { type: 'text/html' })); a.download = 'ai-thu-' + Date.now() + '.html'; a.click();
  }

  window.__aiThu = { chay, CFG, MANG, huy: () => { window.fetch = fetch0; } };
  console.log('[AI] Sẵn sàng. Chạy: await __aiThu.chay()   ·   Gỡ bọc mạng: __aiThu.huy()');
})();
