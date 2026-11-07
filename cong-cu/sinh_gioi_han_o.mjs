// Sinh du-an/<dự án>/gioi-han-o.json từ khai báo giới hạn ô của app: ontology.yaml → libs/registry/limits.gen.mjs.
// App ghi trong libs/ui-lens/limits.js: đây là «cùng con số máy chủ ép lúc ghi», và ô nhập mang đúng các con số ấy.
// Chỉ lấy ô chữ và ô số (ký tự đặc biệt, quá dài, quá ngắn, ngoài khoảng). Ô ngày, ô tệp để sau.
// Chạy: node cong-cu/sinh_gioi_han_o.mjs [thư mục app, mặc định ~/dqtv/dqtv-app] [--du-an dqtv]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const GOC = path.resolve(import.meta.dirname, '..');
const arg = process.argv.slice(2);
const duAn = arg.includes('--du-an') ? arg[arg.indexOf('--du-an') + 1] : 'dqtv';
const app = path.resolve(arg.find((x, k) => !x.startsWith('--') && arg[k - 1] !== '--du-an') || path.join(process.env.HOME, 'dqtv/dqtv-app'));
const TEP = 'libs/registry/limits.gen.mjs';
const { VALUE_TYPES, PROPERTY_LIMITS, STEP_LIMITS } = await import(pathToFileURL(path.join(app, TEP)).href);
const git = (...a) => { try { return execFileSync('git', ['-C', app, ...a], { encoding: 'utf8' }).trim(); } catch (x) { return ''; } };

// Mẫu thử cho ô có quy tắc ký tự (pattern). Mỗi mẫu được đối chiếu với chính pattern của app ngay dưới; sai thì dừng.
// `dem`: ký tự nối vào sau mẫu đúng đầu tiên để ra chuỗi hợp lệ dài đúng độ dài tối đa (ca đúng tối đa, quá dài).
const MAU = {
  '^[0-9]+[\\/\\-][^@#]+$': { dem: 'A', dung: ['12/QĐ-BCH', '3531/BCH-TM'], sai: [['12/QĐ@BCH', 'có @'], ['12/QĐ#BCH', 'có #'], ['QĐ-12', 'không bắt đầu bằng chữ số'], ['12 QĐ', 'thiếu / hoặc -']] },
  '^[0-9]{12}$': { dem: '', dung: ['001234567890'], sai: [['00123456789', '11 chữ số'], ['00123456789a', 'có chữ cái'], ['001 23456789', 'có khoảng trắng']] },
  '^[0-9+\\(\\) .\\-]{3,20}$': { dem: '1', dung: ['0912 345 678', '+84 (24) 3825-1234'], sai: [['12', 'dưới 3 ký tự'], ['0912@345678', 'có @'], ['0912abc678', 'có chữ cái']] },
  '^[^@ ]+@[^@ ]+[.][^@ ]+$': { dem: 'a', dung: ['can.bo@dqtv.vn'], sai: [['can bo@dqtv.vn', 'có khoảng trắng'], ['canbo@dqtv', 'thiếu dấu chấm sau @'], ['canbo.dqtv.vn', 'thiếu @']] },
};
// Trình duyệt dịch thuộc tính pattern với cờ v, máy chủ (JSON Schema) với cờ u: mẫu phải cho cùng kết quả ở cả hai.
for (const [p, m] of Object.entries(MAU)) for (const co of ['u', 'v']) {
  const re = new RegExp(p, co);
  for (const v of m.dung) if (!re.test(v)) throw new Error('mẫu đúng không khớp ' + p + ' (' + co + '): ' + v);
  for (const [v] of m.sai) if (re.test(v)) throw new Error('mẫu sai lại khớp ' + p + ' (' + co + '): ' + v);
}

const GIU = ['kind', 'maxLength', 'minLength', 'minimum', 'maximum', 'multipleOf', 'pattern'];
const doc = e => { const [vt, own] = Array.isArray(e) ? e : (e && e.kind ? [null, e] : [e, null]); return { vt, ...(VALUE_TYPES[vt] || {}), ...(own || {}) }; };
const o = {}, patternThieuMau = new Set();
let soNoi = 0;
for (const [bang, loai] of [[PROPERTY_LIMITS, 'thuộc tính'], [STEP_LIMITS, 'tham số bước']])
  for (const [chu, cac] of Object.entries(bang)) for (const [ten, e] of Object.entries(cac)) {
    const r = doc(e);
    if (r.kind !== 'text' && r.kind !== 'number') continue;
    const k = Object.fromEntries(GIU.filter(x => r[x] != null).map(x => [x, r[x]]));
    if (k.pattern && !MAU[k.pattern]) patternThieuMau.add(k.pattern);
    if (k.pattern && MAU[k.pattern] && k.maxLength) {   // chuỗi hợp lệ dài đúng tối đa phải khớp pattern ở cả hai cờ
      const m = MAU[k.pattern], v = (m.dung[0] + m.dem.repeat(k.maxLength)).slice(0, k.maxLength);
      for (const co of ['u', 'v']) if (v.length === k.maxLength && !new RegExp(k.pattern, co).test(v)) throw new Error('chuỗi dài tối đa không khớp ' + k.pattern + ': ' + v);
    }
    const ds = o[ten] || (o[ten] = []);
    let muc = ds.find(x => GIU.every(g => x[g] === k[g]));
    if (!muc) { muc = { ...k, kieu_gia_tri: r.vt || '', noi: [] }; ds.push(muc); }
    muc.noi.push(chu + '.' + ten + (loai === 'tham số bước' ? ' (bước)' : ''));
    soNoi++;
  }

const ra = {
  _nguon: {
    tep: 'dqtv-app/' + TEP,
    ban: git('log', '-1', '--format=%h %cs', '--', TEP),
    nhanh: git('rev-parse', '--abbrev-ref', 'HEAD'),
    ghi_chu: 'Khai báo giới hạn ô của app (ontology.yaml). libs/ui-lens/limits.js: cùng con số máy chủ ép lúc ghi; ô nhập mang maxLength · minLength · min · max · step · pattern theo khai báo này.',
    sinh_luc: new Date().toISOString().slice(0, 19),
  },
  // chuỗi chữ Việt để gõ tới đúng độ dài tối đa; chuỗi ký tự đặc biệt cho ô chữ không khai pattern (app nhận mọi ký tự trong giới hạn độ dài)
  chuoi_mau: 'Dân quân tự vệ Hà Tĩnh ',
  chuoi_dac_biet: 'Ngô Thị Ánh-Nguyệt (Đội 1) \'nháy\' "kép" <b>x</b> &amp; / \\ ; % _ @ # $ ^ * + = ? ~ | [ ] { } 😀',
  mau_pattern: MAU,
  pattern_chua_co_mau: [...patternThieuMau],
  o,
};
const tep = path.join(GOC, 'du-an', duAn, 'gioi-han-o.json');
fs.writeFileSync(tep, JSON.stringify(ra, null, 1));
const nhieu = Object.values(o).filter(x => x.length > 1).length;
console.log('Đã ghi', path.relative(GOC, tep), '—', Object.keys(o).length, 'tên ô (' + soNoi + ' chỗ khai),', nhieu, 'tên có nhiều khai báo khác nhau; bản', ra._nguon.ban);
if (patternThieuMau.size) console.log('pattern chưa có mẫu thử (ca mẫu sẽ ghi CHƯA KIỂM):', [...patternThieuMau]);
