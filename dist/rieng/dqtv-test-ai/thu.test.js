// node thu.test.js — kiểm phần thuần (danhGia, phanLoaiMan, mangOk, vaiTuTen); KHÔNG kiểm dò DOM/chụp ảnh (cần trang thật hoặc trang giả).
const assert = require('assert'); const { danhGia, phanLoaiMan, mangOk, chuMoiTheo, vaiTuTen, KQ, CAU } = require('./dqtv-ai-thu.js');
const ma = (r, m) => (r.find(x => x.ma === m) || {}).kq;
const ok = { err: null, done: true, status: 200, bytes: 900, ttfb: 800 }, cut = { err: 'TypeError: network error', done: false, status: 200, bytes: 120, ttfb: 500 };
const h409 = { err: null, done: true, status: 409, bytes: 40, ttfb: 120, dau: '{"error":"busy"}' }, h503 = { err: null, done: true, status: 503, bytes: 0, ttfb: 126 };
const dq = CAU.find(c => c.id === 'AI1-DQ-0001'), cu = 'Theo Điều 28 Luật 48/2019/QH14, 15 ngày.';
const tl = (m, extra) => Object.assign({ mang: m, ui: 'tra-loi', traLoi: cu, nhanTruoc: 0, nhanSau: 1 }, extra);

// 1. «mang» chỉ Đạt khi HTTP 2xx + luồng kết thúc không lỗi
assert.equal(ma(danhGia(dq, tl(ok)), 'mang'), KQ.DAT);
for (const m of [h409, h503, cut]) assert.equal(ma(danhGia(dq, tl(m)), 'mang'), KQ.LOI, JSON.stringify(m));
assert(danhGia(dq, tl(h409)).find(x => x.ma === 'mang').nd.includes('HTTP 409'));
assert.equal(mangOk(ok), true); assert.equal(mangOk(h409), false); assert.equal(mangOk(null), true);
// 2. mạng lỗi thì KHÔNG chấm nội dung trên chữ đang có trên màn (ca 17 câu «trích dẫn = Đạt» từ câu trả lời cũ)
for (const m of [h409, h503, cut]) { const r = danhGia(dq, tl(m)); for (const k of ['trich-dan', 'nhan-AI', 'y-chinh']) assert.equal(ma(r, k), undefined, k + ' ' + m.status); }
// 3. màn không có chữ mới thì không phải «trả lời»; có chữ mới hoặc nhãn mới thì mới là «trả lời»
const q = 'Độ tuổi tham gia dân quân là bao nhiêu?';
assert.equal(phanLoaiMan(q, q, 1, 1), 'khong-co-tra-loi-moi');
assert.equal(phanLoaiMan(q + '\nTheo Điều 8…', q, 1, 1), 'tra-loi');
assert.equal(phanLoaiMan(q, q, 1, 2), 'tra-loi');
assert.equal(phanLoaiMan(q + '\nTrợ lý AI đang bận hoặc tạm ngừng', q, 1, 1), 'bận');
let r = danhGia(dq, { mang: ok, ui: 'khong-co-tra-loi-moi', moi: q, nhanTruoc: 1, nhanSau: 1 });
assert.equal(ma(r, 'khong-chu-moi'), KQ.XEM); assert.equal(ma(r, 'trich-dan'), undefined);
// 3b. chữ mới tách bằng so đầu/cuối: tin nhắn mới chèn GIỮA khung (sau nó còn «Gửi») vẫn ra đúng, không kéo theo câu trả lời cũ
assert.equal(chuMoiTheo('Hỏi đáp\nbạn là ai\nTôi là trợ lý. Nội dung do AI tạo\nGửi', 'Hỏi đáp\nbạn là ai\nTôi là trợ lý. Nội dung do AI tạo\ncâu mới\nGửi'), 'câu mới\n');
assert.equal(chuMoiTheo('a\nGửi', 'a\nGửi'), ''); assert.equal(chuMoiTheo('', 'xin chào'), 'xin chào');
// 4. ảnh lỗi 20/11: luồng đứt + màn báo «bận/tạm ngừng»
r = danhGia(CAU[1], { mang: cut, ui: 'bận', moi: 'Trợ lý AI đang bận hoặc tạm ngừng' });
assert.equal(ma(r, 'mang'), KQ.LOI); assert.equal(ma(r, 'trang-thai'), KQ.XEM);
// 5. thời gian: «chữ đầu» chỉ Ghi nhận (1 lượt, không phải P90); chỉ vượt 10 s mới Cần xem; không còn «byte-dau» chấm Đạt
r = danhGia(dq, tl(ok, { tChu: 300 })); assert.equal(ma(r, 'chu-dau'), KQ.GHI); assert.equal(ma(r, 'byte-dau'), undefined);
assert.equal(ma(danhGia(dq, tl(ok, { tChu: 12000 })), 'chu-dau'), KQ.XEM);
// 6. không bắt được mạng thì không kết luận
assert.equal(ma(danhGia(CAU[0], { mang: null, ui: 'tra-loi', traLoi: 'x', nhanTruoc: 0, nhanSau: 1 }), 'mang'), KQ.CHUA);
// 7. nội dung theo BA
assert.equal(ma(danhGia(dq, tl(ok, { traLoi: 'Năm đầu 15 ngày.' })), 'trich-dan'), KQ.SAI);
r = danhGia(dq, tl(ok)); assert.equal(ma(r, 'trich-dan'), KQ.DAT); assert.equal(ma(r, 'can-cu-48/2019/QH14'), undefined);
assert.equal(ma(danhGia(CAU.find(c => c.hv === 'refuse'), tl(ok, { traLoi: 'Xin lỗi' })), 'hanh-vi'), KQ.XEM);
assert.equal(ma(danhGia(dq, tl(ok, { traLoi: cu + ' tối đa undefined ngày' })), 'chu-loi-may'), KQ.SAI);
// 8. lượt giữa của câu nhiều lượt: chấm mạng + nhãn + chữ lỗi, chưa chấm nội dung BA
r = danhGia(dq, tl(ok, { traLoi: 'Hỏi lại một câu' }), false); assert.equal(ma(r, 'mang'), KQ.DAT); assert.equal(ma(r, 'trich-dan'), undefined); assert.equal(ma(r, 'y-chinh'), undefined);
assert.equal(ma(danhGia(dq, tl(h409), false), 'mang'), KQ.LOI);
// 9. vai đoán từ tên tài khoản (chữ trong ảnh 20/11) — chỉ là suy ra
assert.equal(vaiTuTen('Trợ lý Quân lực Xã Đức Thịnh, tỉnh Hà Tĩnh'), 'commune'); assert.equal(vaiTuTen('Cục Dân quân tự vệ · Bộ Tổng Tham mưu'), 'central'); assert.equal(vaiTuTen('Nhân viên Văn thư'), '');
// 10. bộ câu
assert.deepEqual(CAU.slice(0, 2).map(c => c.id), ['ANH-1', 'ANH-2']);
assert(CAU.slice(2).every(c => c.id.startsWith('AI1-') && c.p && c.hv));
assert(CAU.some(c => c.tiep && c.tiep.length), 'phải có câu nhiều lượt');
const dem = {}; CAU.slice(2).forEach(c => dem[c.p] = (dem[c.p] || 0) + 1); console.log('theo vai', JSON.stringify(dem));
console.log('OK', CAU.length, 'câu');
