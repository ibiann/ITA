# Kiểm bước 2 «giả lỗi đọc dữ liệu»: ITA làm hỏng lệnh đọc dữ liệu riêng của từng màn (như mất mạng) rồi mở lại màn.
#  - Màn A báo «Không thể tải dữ liệu» khi lỗi        → ĐẠT
#  - Màn B nuốt lỗi, hiện «Không có dữ liệu»          → SAI (hiện trống khi tải thất bại), mẫu lỗi kết luận «Sai»
#  - Màn C quay «Đang tải…» mãi                       → SAI (treo)
#  - Màn D dùng dữ liệu đã nhớ, không đọc lại         → CHƯA THỬ
#  - đường dùng chung /api/me.json (gọi ở mọi màn) không bị làm hỏng; lỗi giả không thành «API lỗi», không thành «màn sập»
# Chạy: python3 -I kiem/test_gia_loi_doc.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = r"""<!doctype html><meta charset="utf-8">
<body>
  <nav class="navigation" style="position:fixed;left:0;top:0;width:180px;height:900px">
    <a href="/m/a">Màn A</a><a href="/m/b">Màn B</a><a href="/m/c">Màn C</a><a href="/m/d">Màn D</a></nav>
  <main style="margin-left:200px"><h1></h1><div id="nd"></div></main>
  <script>
    const NHO = {}, nd = () => document.getElementById('nd');
    const LOI = {
      a: () => { nd().innerHTML = '<p role="alert">Không thể tải dữ liệu. Vui lòng thử lại.</p>'; },
      b: () => { nd().innerHTML = '<p>Không có dữ liệu</p>'; },
      c: () => { nd().innerHTML = '<div aria-busy="true">Đang tải…</div>'; },
      d: () => { nd().innerHTML = '<p>Không có dữ liệu</p>'; },
    };
    function ve(x) {
      document.querySelector('h1').textContent = 'Màn ' + x.toUpperCase();
      nd().innerHTML = '<div aria-busy="true">Đang tải…</div>';
      fetch('/api/me.json').then(r => r.json()).catch(() => {});
      if (x === 'd' && NHO.d) { nd().innerHTML = '<table><tbody>' + NHO.d.map(r => '<tr><td>' + r + '</td></tr>').join('') + '</tbody></table>'; return; }
      fetch('/data/' + x + '.json').then(r => r.json()).then(j => { NHO[x] = j;
        nd().innerHTML = '<table><tbody>' + j.map(r => '<tr><td>' + r + '</td></tr>').join('') + '</tbody></table>'; }).catch(LOI[x]);
    }
    document.addEventListener('click', e => { const a = e.target.closest('a[href]'); if (!a) return; e.preventDefault();
      history.pushState(null, '', a.getAttribute('href')); ve(a.getAttribute('href').split('/').pop()); }, true);
    history.replaceState(null, '', '/m/a'); ve('a');
  </script>
  <script>window.__itaHoSo = {"ten": "thử", "ten_mien": "127.0.0.1", "post_cho_qua": []}</script>
  <script src="/tool.js"></script>
  <script>
    addEventListener('load', () => setTimeout(async () => {
      let error = '', kq = null;
      try { kq = await ita.chay({ kiemNgonTu: false, kiemThietKe: false, kiemKeTruong: false, thuOTim: false, moHoSoDau: false, tuTaiBaoCao: false, kiemTroNang: false }); } catch (e) { error = e.message; }
      document.body.setAttribute('data-kq', JSON.stringify({ error, gld: kq && kq.gia_loi_doc, mau: kq ? kq.mau_loi : [], van_de: kq ? kq.van_de : [],
        sap: kq ? kq.man_sap : [], html: kq ? window.__itaThu.html(kq) : '' }));
    }, 300));
  </script>
</body>"""

with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8').rstrip()
    assert dist.endswith('})();')
    (t / 'tool.js').write_text(dist[:-len('})();')] + 'window.__itaThu = { html: sangHTML };\n})();\n', encoding='utf-8')
    (t / 'thu.html').write_text(TRANG, encoding='utf-8')
    for d, x in [('data', 'a'), ('data', 'b'), ('data', 'c'), ('data', 'd')]:
        (t / d).mkdir(exist_ok=True); (t / d / (x + '.json')).write_text(json.dumps(['dòng 1 ' + x, 'dòng 2 ' + x]), encoding='utf-8')
    (t / 'api').mkdir(); (t / 'api' / 'me.json').write_text('{"ten": "tôi"}', encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                          stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom',
                            '--virtual-time-budget=180000', 'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=300)
    finally:
        mc.terminate()

m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout)
assert m, 'Chrome chưa ghi kết quả: ' + r.stdout[-800:]
k = json.loads(html.unescape(m.group(1)))
assert not k['error'], k['error']
g = {x['man']: x for x in k['gld']}
print(json.dumps(g, ensure_ascii=False, indent=1))
assert g['Màn A']['kq'] == 'ĐẠT' and 'Không thể tải' in g['Màn A']['quan_sat'], g['Màn A']
assert g['Màn B']['kq'] == 'SAI' and 'trống' in g['Màn B']['quan_sat'], g['Màn B']
assert g['Màn C']['kq'] == 'SAI' and 'treo' in g['Màn C']['quan_sat'], g['Màn C']
assert g['Màn D']['kq'] == 'CHƯA THỬ' and 'không đọc lại' in g['Màn D']['quan_sat'], g['Màn D']
assert all('/api/me.json' not in x['quan_sat'] for x in k['gld']), 'đường dùng chung bị làm hỏng'
assert not any(v.get('api_loi') for v in k['van_de']), 'lỗi giả bị tính là API lỗi: ' + str(k['van_de'])
assert not k['sap'], 'lỗi giả bị coi là màn sập: ' + str(k['sap'])
mau = [x for x in k['mau'] if x['loai'] == 'gia_loi_doc']
assert mau and all(x['ket_luan'] == 'Sai' for x in mau) and {x['chi_tiet'] or '' for x in mau}, mau
assert 'Trạng thái lỗi — giả tải dữ liệu thất bại (4 màn)' in k['html'], 'HTML thiếu mục trạng thái lỗi'
print('đạt: A báo lỗi → ĐẠT · B hiện trống → SAI · C treo → SAI · D dùng dữ liệu nhớ → CHƯA THỬ · /api/me.json không bị hỏng · không thành API lỗi / màn sập')
