// Kiểm bước 7a–7c trên DỮ LIỆU THẬT: tài liệu quy trình trong du-an/dqtv/quy-trinh/ và tc_all.csv của v7.
// Chạy: node kiem/test_buoc7.mjs [đường dẫn tc_all.csv]   (mặc định ~/Downloads/MaTran_UC_TC_DQTV_02112026_v7/tc_all.csv)
// Nạp bo-doc/*.js vào một vùng riêng (như trong trình duyệt: BO_DOC, GHEP là mảng chung) rồi gọi thẳng bộ đọc.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const GOC = path.resolve(import.meta.dirname, '..');
const CSV = process.argv[2] || path.join(process.env.HOME, 'Downloads/MaTran_UC_TC_DQTV_02112026_v7/tc_all.csv');
const ctx = { BO_DOC: [], GHEP: [], console };
vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(GOC, 'bo-doc')).sort()) vm.runInContext(fs.readFileSync(path.join(GOC, 'bo-doc', f), 'utf8'), ctx, { filename: f });
const bd = ten => ctx.BO_DOC.find(b => b.ten === ten);

// 7a: tài liệu quy trình — số bước / chặng / vai đọc ra phải khớp dòng tóm tắt máy sinh của chính tài liệu
const tep = [];
const di = d => { for (const x of fs.readdirSync(d, { withFileTypes: true })) x.isDirectory() ? di(path.join(d, x.name)) : tep.push(path.join(d, x.name)); };
di(path.join(GOC, 'du-an/dqtv/quy-trinh'));
const tl = [], khongNhan = [], lech = [];
for (const f of tep) {
  const chu = fs.readFileSync(f, 'utf8'), ten = path.basename(f);
  if (!bd('quy-trinh-md').nhan(ten, chu)) { khongNhan.push(ten); continue; }
  const d = bd('quy-trinh-md').doc(ten, chu).quy_trinh_tl[0];
  if (d.buoc.length !== d.tom_tat.buoc || d.chang.length !== d.tom_tat.chang || new Set(d.vai.map(v => v.ma).filter(v => v !== '—')).size !== d.tom_tat.vai)   // một vai có thể nhiều dòng (kèm điều kiện); tóm tắt đếm vai khác nhau, không đếm «—» (bước không ghi vai)
    lech.push(ten + ': đọc ' + [d.buoc.length, d.chang.length, new Set(d.vai.map(v => v.ma).filter(v => v !== '—')).size] + ' / tóm tắt ' + [d.tom_tat.buoc, d.tom_tat.chang, d.tom_tat.vai]);
  tl.push(d);
}
console.log('7a: nhận', tl.length, 'tài liệu; không nhận', khongNhan.length, ':', khongNhan.sort().join(', '));
if (lech.length) console.log('   lệch tóm tắt:', lech);
assert.equal(tl.length, 119);
assert.ok(khongNhan.every(x => /^(00-tong-the|khoi-)/.test(x)), 'không nhận nhầm: ' + khongNhan);
assert.deepEqual(lech, [], 'số bước / chặng / vai đọc ra khác tóm tắt máy sinh');
assert.ok(tl.every(d => d.buoc.every(b => b.ten && b.ai !== undefined && b.dong > 0)));
console.log('đạt: 119 tài liệu, số bước / chặng / vai khớp tóm tắt máy sinh của từng tài liệu');

// 7b: tc_all.csv
const t0 = Date.now(), chuCSV = fs.readFileSync(CSV, 'utf8');
assert.ok(bd('v7-tc-csv').nhan('tc_all.csv', chuCSV));
const rows = bd('v7-tc-csv').doc('tc_all.csv', chuCSV).tc_v7;
console.log('7b: đọc', rows.length, 'dòng,', Object.keys(rows[0]).length, 'cột trong', Date.now() - t0, 'ms');
assert.equal(rows.length, 44124);
assert.equal(Object.keys(rows[0]).length, 40);
assert.equal(new Set(rows.map(r => r['Mã TC'])).size, 44124);
assert.equal(rows[0]['Mã TC'], '1.B1.API_SAI_VAI');
console.log('đạt: 44.124 dòng, 40 cột, mã TC không trùng');

// 7c: ghép
const ra = ctx.GHEP[0]({ quy_trinh_tl: tl, tc_v7: rows });
const dem = {}; for (const t of ra.tc) { const k = !t.khong_chay ? 'chạy' : t.khong_chay.replace(/«[^»]*»/g, '«…»').replace(/ \(.*$|: .*$/, '').replace(/ dòng \d+.*/, ''); dem[k] = (dem[k] || 0) + 1; }
console.log('7c: TC M1 6 loại:', ra.tc.length, '| bảng:', ra.dac_ta.length); console.log('   ', dem);
fs.writeFileSync(path.join(process.env.TMPDIR || '/tmp', 'ita-ghep-dem.json'), JSON.stringify(dem));
assert.ok(ra.dac_ta.every(d => d.dinh_danh.ma_ben_b && Array.isArray(d.buoc) && d.buoc.every(b => b.ma && b.nut)));
assert.ok(ra.tc.every(t => t.khong_chay || t.can_cu), 'TC được chạy mà thiếu căn cứ');
const t1 = ra.tc.find(t => t.ma === '1.B1.DUNG');
assert.equal(t1.khong_chay, undefined); assert.match(t1.can_cu, /^qt-1\.md dòng \d+ \(mục 7, bước «Ghi nhận nhiệm vụ được giao»\)$/);
const b1 = ra.dac_ta.find(d => d.dinh_danh.ma_ben_b === '1').buoc.find(b => b.ma === 'B1');
assert.equal(JSON.stringify(b1.vai), JSON.stringify(['Chỉ huy trưởng Ban CHQS xã']));   // mảng từ vùng vm khác loại Array, so theo nội dung assert.equal(b1.xac_nhan, 'form');
console.log('đạt: mỗi TC được chạy có căn cứ tài liệu; 1.B1.DUNG → qt-1.md bước «Ghi nhận nhiệm vụ được giao», vai Chỉ huy trưởng Ban CHQS xã');
