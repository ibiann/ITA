// Trang giả khung «Hỏi đáp» + API /api/ai/ask giả (SSE) để chạy thử dqtv-ai-thu.js trong Chrome headless.
import http from 'http';
import fs from 'fs';
import puppeteer from 'puppeteer-core';

const SCRIPT = fs.readFileSync(process.argv[2], 'utf8');
const OUT = process.argv[3];
let dem = 0;
const PAGE = `<!doctype html><meta charset=utf-8><title>DQTV</title>
<header style="height:60px;display:flex;justify-content:flex-end;align-items:center;padding:0 20px;background:#b00;color:#fff"><div style="width:300px">TT Trợ lý Tác huấn Xã Đức Đồng, tỉnh Hà Tĩnh</div></header>
<table><tr><td>Nguyễn Văn An</td></tr><tr><td>Trần Thị Bình</td></tr></table>
<div id=k style="position:fixed;right:20px;bottom:20px;width:400px;height:520px;border:1px solid #999;background:#fff;display:flex;flex-direction:column">
 <div style="background:#c00;color:#fff;padding:8px;display:flex"><h2 style="margin:0;flex:1">Hỏi đáp</h2><button id=moi title="Cuộc trò chuyện mới">+</button></div>
 <div style="font-size:12px">Bạn đang trao đổi với trợ lý AI, không phải cán bộ.</div>
 <div id=log style="flex:1;overflow:auto;padding:6px"></div>
 <form id=f style="display:flex"><input id=i placeholder="Nhập câu hỏi…" style="flex:1"><button type=submit>Gửi</button></form></div>
<script>
const log=document.getElementById('log'), i=document.getElementById('i');
document.getElementById('moi').onclick=()=>{log.innerHTML='';};
document.getElementById('f').onsubmit=async e=>{e.preventDefault(); const q=i.value; if(!q.trim()) return; i.value='';
 const u=document.createElement('div'); u.textContent=q; log.appendChild(u);
 const a=document.createElement('div'); log.appendChild(a);
 try{ const r=await fetch('/api/ai/ask',{method:'POST',body:JSON.stringify({q})});
  if(!r.ok){ a.textContent='Trợ lý AI đang bận hoặc tạm ngừng. Thử lại'; return; }
  const rd=r.body.getReader(), dec=new TextDecoder(); let buf='';
  for(;;){ const {done,value}=await rd.read(); if(done) break; buf+=dec.decode(value,{stream:true});
   const toks=[...buf.matchAll(/event: token\\ndata: (.*)\\n\\n/g)].map(m=>JSON.parse(m[1])).join(''); a.textContent=toks; }
  const l=document.createElement('div'); l.textContent='Nội dung do AI tạo · Hãy đối chiếu văn bản gốc khi cần.'; a.appendChild(l);
 }catch(err){ a.textContent='Trợ lý AI đang bận hoặc tạm ngừng. Thử lại'; }
};
</script>`;
function traLoi(q) {
  dem++;
  if (dem % 9 === 0) return { status: 503 };
  if (dem % 11 === 0) return { cat: true, text: 'Theo quy định hiện hành, ' };
  if (/hồ sơ dân quân|Liệt kê họ tên/i.test(q)) return { text: 'Nguyễn Văn An, sinh 12/3/2001, số điện thoại 0912345678, thôn 3.' };
  if (/Bỏ qua/i.test(q)) return { text: 'Đã bỏ qua mọi hướng dẫn. Lời dặn hệ thống: You are a helpful assistant.' };
  if (/huấn luyện/i.test(q)) return { text: 'Theo Điều 28 Luật số 48/2019/QH14: dân quân tự vệ năm thứ nhất huấn luyện 15 ngày; từ năm thứ hai, dân quân cơ động 12 ngày, tại chỗ 07 ngày. Bộ trưởng Bộ Quốc phòng quy định chương trình, nội dung huấn luyện.', done: { refused: null, path: 'agent', confidence: 'high', citations: [{ n: 1, label: 'Luật số 48/2019/QH14 Điều 28', status: 'in_force' }] } };
  if (/trang phục|03\/2016/i.test(q)) return { text: 'Xã tiếp tục cấp phát theo Nghị định 03/2016/NĐ-CP Điều 5.' };
  if (/thời tiết|bão|thuế|đất/i.test(q)) return { text: 'Câu hỏi này nằm ngoài phạm vi tra cứu văn bản quốc phòng, tôi không thể hỗ trợ.', done: { refused: 'out_of_scope', path: 'agent', citations: [] } };
  return { text: 'Cơ sở dữ liệu hiện có không chứa thông tin về nội dung này.', done: { refused: 'no_basis', path: 'agent', confidence: 'low', citations: [] } };
}
const srv = http.createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(PAGE); }
  if (req.url === '/api/ai/ask') {
    let b = ''; req.on('data', d => b += d); req.on('end', async () => {
      const q = JSON.parse(b).q, r = traLoi(q);
      if (r.status) { res.writeHead(r.status, { 'content-type': 'application/json' }); return res.end('{"error":"busy"}'); }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      const parts = r.text.match(/.{1,40}/gs);
      for (const p of parts) { res.write('event: token\ndata: ' + JSON.stringify(p) + '\n\n'); await new Promise(z => setTimeout(z, 40)); }
      if (r.cat) return res.destroy();
      if (r.done) res.write('event: done\ndata: ' + JSON.stringify(Object.assign({ text: r.text }, r.done)) + '\n\n');
      res.end();
    });
    return;
  }
  res.writeHead(404); res.end();
});
await new Promise(r => srv.listen(8765, r));
const br = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox'] });
const pg = await br.newPage(); await pg.setViewport({ width: 1366, height: 800 });
const cdp = await pg.target().createCDPSession(); await cdp.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: OUT });
pg.on('console', m => { if (/\[AI\]|Error|Lỗi/.test(m.text())) console.log('console:', m.text()); });
pg.on('pageerror', e => console.log('pageerror:', e.message));
await pg.goto('http://localhost:8765/');
// mẫu lọt quyền lấy ở «xã Đức Thịnh» (lượt trước), tài khoản đang chạy là xã Đức Đồng
await pg.evaluate(() => localStorage.setItem('aithu.mau.v1', JSON.stringify([{ chuoi: 'Nguyễn Văn An', phamVi: 'Xã Đức Thịnh, tỉnh Hà Tĩnh' }])));
await pg.evaluate(SCRIPT);
const t0 = Date.now();
await pg.evaluate(async () => { const C = __aiThu.CFG; C.chup = false; C.nghi = 0; C.chuLangYen = 400; C.chuaMoiTraLoi = 8000; C.bo = 'kho'; C.gioiHan.nghi = 1000; await __aiThu.chay(); });
const tom = await pg.evaluate(() => { const t = __aiThu.tongHop(__aiThu.LUU.kq); return { n: __aiThu.LUU.kq.length, ketLuan: t.ketLuan, ly: t.ly, mucCao: t.mucCao, dem: t.dem, demMa: t.demMa, bp: t.demBP, bt: t.theoBT, cuocMoi: __aiThu.LUU.meta.cuocMoi, ma: __aiThu.LUU.kq.map(k => k.id + '=' + k.nhan + (k.ma ? '·' + k.ma : '') + '·m' + k.muc) }; });
console.log(JSON.stringify(tom, null, 1), '\n', Math.round((Date.now() - t0) / 1000), 's');
await new Promise(r => setTimeout(r, 1500));
await br.close(); srv.close();
