# Kiểm bước 13c/13d (kiểu app openslides) và 13e (quy cách giao diện dự án; gói du-an/pms nhận đúng bộ đọc). Chạy: python3 -I kiem/test_buoc13d.py
# Máy chủ thử 127.0.0.1 giả hai điểm của OpenSlides mà tool đọc: POST /system/auth/who-am-i/ (trả mã phiên, userId 38 trong JWT)
# và GET /system/autoupdate?single=1&k=… (trả đúng các khoá được hỏi). Dữ liệu là MẪU THỬ, cùng hình với lab 07/11 (cuộc họp 87, nhóm Chủ tọa).
# Bản thử = dist/ita.js + một dòng xuất sangHTML ra window.__itaThu. Trang kiem/thu_buoc13d.html chạy ở /87/agenda (thời gian thật, kiem/mo_chrome.mjs).
import base64, http.server, json, pathlib, subprocess, tempfile, threading, urllib.parse

GOC = pathlib.Path(__file__).resolve().parent.parent
dist = (GOC / 'dist/ita.js').read_text(encoding='utf-8')
assert dist.rstrip().endswith('})();')
THU = dist.rstrip()[:-len('})();')] + 'window.__itaThu = { html: sangHTML };\n})();\n'
TRANG = (GOC / 'kiem/thu_buoc13d.html').read_text(encoding='utf-8')
b64 = lambda o: base64.urlsafe_b64encode(json.dumps(o).encode()).decode().rstrip('=')
JWT = 'bearer ' + b64({'alg': 'HS256'}) + '.' + b64({'sessionId': 'x', 'userId': 38}) + '.ky'
DL = {'user/38/username': 'ita.chutoa', 'user/38/meeting_user_ids': [404], 'meeting_user/404/meeting_id': 87, 'meeting_user/404/group_ids': [353],
      'group/353/name': 'Chủ tọa', 'group/353/permissions': ['agenda_item.can_manage', 'motion.can_manage_polls', 'projector.can_manage'],
      'meeting/87/admin_group_id': 350}
GHI = []   # mọi lời gọi máy chủ thử nhận được


class MayChu(http.server.BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def gui(self, ma, than, kieu='application/json', them=()):
        b = than.encode()
        self.send_response(ma); self.send_header('Content-Type', kieu); self.send_header('Content-Length', str(len(b)))
        for k, v in them:
            self.send_header(k, v)
        self.end_headers(); self.wfile.write(b)

    def do_GET(self):
        u = urllib.parse.urlparse(self.path); GHI.append('GET ' + u.path)
        if u.path == '/tool.js':
            return self.gui(200, THU, 'application/javascript')
        if u.path.startswith('/87/'):
            return self.gui(200, TRANG, 'text/html; charset=utf-8')
        if u.path == '/system/autoupdate':
            q = urllib.parse.parse_qs(u.query)
            if self.headers.get('authentication') != JWT:
                return self.gui(200, '{}\n')
            return self.gui(200, json.dumps({k: DL[k] for k in q['k'][0].split(',') if k in DL}) + '\n')
        self.gui(404, '{}')

    def do_POST(self):
        GHI.append('POST ' + self.path)
        if self.path == '/system/auth/who-am-i/':
            return self.gui(200, '{"success": true}', them=[('authentication', JWT)])
        self.gui(501, '{}')


with tempfile.TemporaryDirectory() as t:
    mc = http.server.ThreadingHTTPServer(('127.0.0.1', 0), MayChu)
    threading.Thread(target=mc.serve_forever, daemon=True).start()
    try:
        r = subprocess.run(['node', str(GOC / 'kiem/mo_chrome.mjs'), 'http://127.0.0.1:%d/87/agenda' % mc.server_address[1], str(pathlib.Path(t) / 'p'), '150'],
                           capture_output=True, text=True, timeout=200)
    finally:
        mc.shutdown()
assert r.returncode == 0 and r.stdout, 'Chrome không trả kết quả: ' + r.stderr[-300:]
k = json.loads(r.stdout)
print(json.dumps(k, ensure_ascii=False, indent=1))
assert k['loi_js'] == 'không' and 'loi_trang_thu' not in k, (k['loi_js'], k.get('loi_trang_thu'))
assert k['chan'] == {'who_am_i': 'ok', 'action': 'block', 'presenter': 'block'}, k['chan']
print('đạt: hồ sơ openslides — chỉ who-am-i được POST; lệnh ghi /system/action/handle_request bị chặn')
kq = k['ket_qua']
assert kq['tai_khoan'] == 'ITA Chủ tọa', kq['tai_khoan']
assert kq['quyen_may_chu'] == {'ten_dang_nhap': 'ita.chutoa', 'cap_to_chuc': '', 'cuoc_hop': 87,
                               'nhom': [{'id': 353, 'ten': 'Chủ tọa', 'quyen': DL['group/353/permissions'], 'quan_tri': False}]}, kq['quyen_may_chu']
assert kq['so_buoc_may'] == 0 and k['html_co_may_chu'], kq
assert 'POST /system/auth/who-am-i/' in GHI and not any(x.startswith('POST /system/action') for x in GHI), GHI
print('đạt: tên tài khoản đọc theo chon_tai_khoan của hồ sơ; đầu lần chạy đọc được nhóm + quyền của tài khoản trong cuộc họp 87 (who-am-i + autoupdate); báo cáo có dòng «Máy chủ»')
tk = k['thiet_ke']
assert tk['can_cu'] == 'quy cách dự án — QUY CÁCH MẪU' and tk['luoi'] == 2 and sorted(tk['nap']) == ['ho-so', 'quy-cach'], tk
assert any('cỡ chữ ngoài quy cách (12, 14, 16, 32): ' in v and '13px' in v.split(': ', 1)[1].split(' · ') for v in tk['vuot']), tk['vuot']
print('đạt: nạp quy-cach.json → phần thiết kế dùng ngưỡng của dự án, căn cứ «quy cách dự án», chỉ ra cỡ chữ 13px ngoài quy cách')
# gói thật du-an/pms: hai tệp đúng khuôn mà bộ đọc ho-so, quy-cach nhận ra (bo-doc/05-ho-so.js, bo-doc/06-quy-cach.js)
hs = json.loads((GOC / 'du-an/pms/ho-so.json').read_text(encoding='utf-8'))
qc = json.loads((GOC / 'du-an/pms/quy-cach.json').read_text(encoding='utf-8'))
assert isinstance(hs['ten'], str) and hs['ten_mien'] == 'pms.lab.linksafe.vn' and hs['kieu_app'] == 'openslides', hs
assert hs['post_cho_qua'] == ['/system/auth/login', '/system/auth/who-am-i', '/system/presenter/handle_request'], hs['post_cho_qua']
assert {t['dang_nhap'] for t in hs['tai_khoan']} == {'ita.thuky', 'ita.chutoa', 'ita.daibieu', 'ita.khongnhom', 'ita.qttochuc', 'ita.qluyban'}
assert qc['loai'] == 'quy-cach-giao-dien' and qc['co_chu_px'] == [12, 14, 16, 18, 20, 24]
print('đạt: du-an/pms có ho-so.json (openslides, 3 đường POST được cho qua, 6 tài khoản ita.*) và quy-cach.json đúng khuôn')
