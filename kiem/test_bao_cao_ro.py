# Bản 1.7.1 — báo cáo không báo nhầm, không làm người đọc hiểu sai (8 lỗi thấy ở lần chạy PMS 18/11, trang thử kiem/thu_bao_cao_ro.html):
#  1 đường dẫn API không cắt ở 60 ký tự; mã UUID / số gom về :id; đường dẫn quá dài vẫn ≤ 200 ký tự
#  2 dòng đầu báo cáo không còn «cao N, trung bình N» (chỉ bốn chữ kết luận)
#  3 «ResizeObserver loop…» (cảnh báo trình duyệt) không là lỗi JS; lỗi thật có chữ ResizeObserver vẫn «Sai»
#  4 gom mẫu lỗi ô tìm giữ «0 dòng», không thành «N dòng»; «vẫn ra 7 dòng» là mẫu khác
#  5 lệnh ghi do công cụ bấm nút gửi ngay không mang nguyên tắc «Màn chỉ xem…»
#  6 bo góc: 0px không tính, 50% = tròn hẳn khi quy cách có 9999, chỉ 999px ngoài quy cách; ngưỡng đếm của công cụ là «Cần xem», không «Sai»
#  7 nút chuyển trang khoá là bình thường; nút bước quy trình khoá vẫn «không ghi lý do»
#  8 hai tệp hồ sơ cùng nội dung chỉ liệt kê một lần
# Chạy: python3 -I kiem/test_bao_cao_ro.py   (cần google-chrome)
import json, pathlib, re, socket, subprocess, sys, tempfile, time

GOC = pathlib.Path(__file__).resolve().parent.parent


def chay():
    with tempfile.TemporaryDirectory() as t:
        t = pathlib.Path(t)
        subprocess.run([sys.executable, '-I', str(GOC / 'cong-cu/dong_goi.py'), '--ra', str(t / 'dist.js')], check=True, stdout=subprocess.DEVNULL)
        dist = (t / 'dist.js').read_text(encoding='utf-8').rstrip()
        assert dist.endswith('})();')
        them = ("window.__itaThu = { html: sangHTML, csv: sangCSVMau,"
                " ngoaiQuyCach: (typeof ngoaiQuyCach === 'function' ? ngoaiQuyCach : null),"
                " laNutChuyenTrang: (typeof laNutChuyenTrang === 'function' ? laNutChuyenTrang : null) };\n")
        (t / 'tool.js').write_text(dist[:-len('})();')] + them + '})();\n', encoding='utf-8')
        (t / 'thu.html').write_text((GOC / 'kiem/thu_bao_cao_ro.html').read_text(encoding='utf-8'), encoding='utf-8')
        so = socket.socket(); so.bind(('127.0.0.1', 0)); cong = so.getsockname()[1]; so.close()
        mc = subprocess.Popen([sys.executable, '-I', '-m', 'http.server', str(cong), '--bind', '127.0.0.1', '--directory', str(t)],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        try:
            time.sleep(0.8)
            # thời gian thật (kiem/mo_chrome.mjs): trang gọi ita.napTep → IndexedDB treo ở chế độ thời gian ảo của --dump-dom
            r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/thu.html' % cong, str(t / 'p'), '280'],
                               capture_output=True, text=True, timeout=320)
        finally:
            mc.terminate()
    assert r.returncode == 0 and r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-300:]
    k = json.loads(r.stdout)
    assert not k['error'], k['error']
    return k


k = chay()
mau = k['mau']
api = [m['chi_tiet'] for m in mau if m['loai'] == 'api_loi']
# 1
assert any('/api/v1/meetings/:id/context' in x for x in api), api
assert all('98be928' not in x for x in api), api
dai = [x for x in api if 'nhanh-0' in x]
assert dai and all(len(x) <= 200 and ':id' in x for x in dai), dai
# 2
assert not re.search(r'cao \d+, trung bình \d+', k['html']), 'dòng đầu còn mức cũ'
# 3
js = [m for m in mau if m['loai'] == 'js_loi']
assert not any('loop completed' in m['chi_tiet'] for m in js), js
assert any('ResizeObserver is not defined' in m['chi_tiet'] and m['ket_luan'] == 'Sai' for m in js), js
# 4
on = [m['chi_tiet'] for m in mau if m['loai'] == 'o_nhap']
assert any('0 dòng nhưng không có thông báo trống' in x for x in on), on
assert not any('N dòng nhưng' in x for x in on), on
assert len(set(on)) == len(on) and any('vẫn ra' in x for x in on), on
# 6
assert k['don_vi']['ngoai'] == ['999px'], k['don_vi']
# 7
assert k['don_vi']['chuyen_trang'] == [True, True, True, False, False], k['don_vi']
bq = {}
for b in k['bo_qua']: bq.setdefault(b['chu'], b['ly_do'])
assert 'bình thường' in bq.get('← Trước', '') and 'bình thường' in bq.get('Tiếp theo →', ''), bq
assert 'không ghi lý do' in bq.get('Tiếp theo: Trình ký', ''), bq
# 5 (Task 4)
cg = [m for m in mau if m['loai'] == 'chan_ghi' and m['chi_tiet'].startswith('[công cụ bấm')]
assert cg and all('Màn chỉ xem' not in m['nguyen_tac'] for m in cg), cg
assert 'Sai — lệch quy cách dự án' in k['html'] and 'Cần xem — vượt ngưỡng công cụ' in k['html'], 'khối thiết kế chưa tách'
# 8 (Task 5)
hs = [x for x in k['du_lieu_nap'] if x['bo_doc'] == 'ho-so']
assert len(hs) == 1, hs
print('đạt: đường dẫn đủ (:id) · không mức cũ · bỏ ResizeObserver, giữ lỗi thật · «0 dòng» · bo góc chỉ 999px · nút chuyển trang bình thường · nhãn lệnh ghi do công cụ bấm · tách quy cách / ngưỡng · hồ sơ một lần')
