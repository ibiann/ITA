# Nút tải báo cáo không được để app «cướp» cú bấm link (Grafana: nghe click ở document, link có «://» thì
# window.location.href = href → trang nhảy sang blob:, không tải về). Link tải không gắn vào trang thì cú bấm không tới document.
# Chạy: python3 -I kiem/test_tai_tep.py   (cần google-chrome)
import html, json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent
TRANG = """<!doctype html><meta charset="utf-8"><body>
  <script>window.__cuop = [];
    // không tải thật (Chrome ẩn treo khi tải): link nằm trong trang thì phát cú bấm như thật; link không gắn vào trang thì cú bấm không tới document
    HTMLAnchorElement.prototype.click = function () { if (this.isConnected) this.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); };
    document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('a[href]'); if (a) { e.preventDefault(); window.__cuop.push(a.getAttribute('href').slice(0, 5)); } });</script>
  <script src="/tool.js"></script>
  <script>addEventListener('load', () => { let error = ''; try { window.__itaThu.tai('thu.html', '<p>x</p>', 'text/html'); } catch (e) { error = e.message; }
    setTimeout(() => document.body.setAttribute('data-kq', JSON.stringify({ error, cuop: window.__cuop })), 300); });</script>
</body>"""
with tempfile.TemporaryDirectory() as t:
    t = pathlib.Path(t)
    subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
    dist = (t / 'dist.js').read_text(encoding='utf-8').rstrip(); assert dist.endswith('})();')
    (t / 'tool.js').write_text(dist[:-len('})();')] + 'window.__itaThu = { tai: taiTep };\n})();\n', encoding='utf-8')
    (t / 'thu.html').write_text(TRANG, encoding='utf-8')
    so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
    mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(0.8)
        r = subprocess.run(['google-chrome', '--headless=new', '--no-sandbox', '--disable-gpu', '--dump-dom', '--virtual-time-budget=5000',
                            'http://127.0.0.1:%d/thu.html' % cong], capture_output=True, text=True, timeout=120)
    finally:
        mc.terminate()
m = re.search(r'<body[^>]*\bdata-kq="([^"]*)"', r.stdout); assert m, r.stdout[-500:]
k = json.loads(html.unescape(m.group(1)))
assert not k['error'], k['error']
assert not k['cuop'], 'app bắt được cú bấm link tải: %s' % k['cuop']
print('đạt: link tải không gắn vào trang → app nghe click ở document không bắt được')
