// [bước 16 / bản 1.3] «Nạp thư mục» phải cho ĐÚNG dữ liệu như bản đóng gói: cùng thư mục du-an/<dự án>, hai cách nạp, so ita.duLieu().
// Chạy: node kiem/test_buoc16.mjs <dự án> <tên miền>   (cần jsdom + fake-indexeddb qua NODE_PATH; dựng dist/ trước bằng cong-cu/dong_goi.py)
import { createRequire } from 'module'; import fs from 'fs'; import path from 'path';
// [GĐ 8] trình duyệt chỉ ghi cảnh báo khi một lời hứa bị từ chối mà không ai bắt; Node thì dừng cả tiến trình. Lệnh ITA cố ý làm hỏng (giả lỗi đọc, chặn ghi — lỗi mang cờ __ita) mà app giả lập không bắt thì bỏ qua; lỗi khác vẫn làm test trượt.
process.on('unhandledRejection', e => { if (e && e.__ita) return; console.error(e); process.exit(1); });
const req = createRequire(process.cwd() + '/');
const { JSDOM } = req('jsdom'); const { IDBFactory, IDBKeyRange } = req('fake-indexeddb');
const GOC = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const [, , duAn = 'dqtv', tenMien = 'dqtv.linksafe.vn'] = process.argv;
const ngu = ms => new Promise(r => setTimeout(r, ms));
async function moTrang(tep) {
  const dom = new JSDOM('<!doctype html><body><nav></nav><main></main></body>', { url: 'https://' + tenMien + '/', runScripts: 'outside-only', pretendToBeVisual: true });
  const w = dom.window;
  w.indexedDB = new IDBFactory(); w.IDBKeyRange = IDBKeyRange;
  for (const k of ['Response', 'Blob', 'DecompressionStream', 'TextDecoder', 'TextEncoder']) w[k] = globalThis[k];
  Object.defineProperty(w.HTMLElement.prototype, 'innerText', { get() { return this.textContent; } });
  for (const k of ['log', 'info', 'warn', 'table']) w.console[k] = () => {};
  w.eval(fs.readFileSync(tep, 'utf8'));
  let truoc = '';
  for (let i = 0; i < 240; i++) { await ngu(500); if (!w.ita || !w.ita.duLieu) continue; const s = JSON.stringify(w.ita.duLieu()); if (s === truoc && i > 6) break; truoc = s; }
  return w;
}
const tomTat = ds => Object.fromEntries(ds.map(x => [x.muc, (x.co ? 'có' : 'KHÔNG') + (x.chi_tiet ? ' · ' + x.chi_tiet : '')]));
const tatCaTep = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? tatCaTep(path.join(d, e.name)) : [path.join(d, e.name)]);

const wA = await moTrang(path.join(GOC, 'dist', 'rieng', 'ita-' + duAn + '.js'));
const A = tomTat(wA.ita.duLieu());
const wB = await moTrang(path.join(GOC, 'dist', 'chung', 'ita.js'));
const thuMuc = path.join(GOC, 'du-an', duAn);
const files = tatCaTep(thuMuc).map(p => { const f = new File([fs.readFileSync(p)], path.basename(p)); Object.defineProperty(f, 'webkitRelativePath', { value: duAn + '/' + path.relative(thuMuc, p).split(path.sep).join('/') }); return f; });
const kq = await wB.ita.napTep(files);
for (let i = 0; i < 6; i++) await ngu(300);
const B = tomTat(wB.ita.duLieu());
const sai = [];
console.log('Loại dữ liệu'.padEnd(26) + 'Đóng gói sẵn'.padEnd(34) + 'Nạp thư mục');
for (const k of Object.keys(A)) { const ok = A[k] === B[k]; if (!ok) sai.push(k); console.log((ok ? '  ' : '≠ ') + k.padEnd(24) + String(A[k]).padEnd(34) + B[k]); }
const ly = {}; for (const x of kq.khong_nhan) { const r = x.ly_do.replace(/«[^»]*»/g, '«…»'); ly[r] = (ly[r] || 0) + 1; }
console.log('Nạp thư mục: ' + kq.dung.length + ' tệp dùng, ' + kq.khong_nhan.length + ' tệp không dùng: ' + JSON.stringify(ly));
console.log(sai.length ? 'TRƯỢT: khác nhau ở ' + sai.join(', ') : 'ĐẠT: nạp thư mục cho đúng dữ liệu như bản đóng gói');
process.exit(sai.length ? 1 : 0);
