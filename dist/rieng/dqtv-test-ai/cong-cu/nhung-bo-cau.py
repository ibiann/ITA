"""Nhúng bộ câu BA (BG2.9) vào dqtv-ai-thu.js.

Chạy lại mỗi khi BA sửa bộ câu:
    python3 cong-cu/nhung-bo-cau.py du-lieu/BG2.9_GD1_bo-cau-hoi.json dqtv-ai-thu.js

Lấy câu của khung hỏi đáp WEB: AI-1 (chung + trong hồ sơ) và AI-4 (trừ vai di động).
Giữ đủ trường chấm: ý chính, điều cấm, căn cứ (văn bản, Điều, Khoản), nhóm, độ khó,
ngày tham chiếu, ghi chú từng lượt, dữ liệu giả lập. Không cắt ý chính.
"""
import json
import re
import sys

src, dst = sys.argv[1], sys.argv[2]
data = json.load(open(src, encoding='utf-8'))
ngay_mac_dinh = data.get('date', '')

out = []
for x in data['items']:
    if x['fn'] not in ('AI-1', 'AI-4'):
        continue
    if x['persona'] == 'mobile_member':
        continue
    e = x['expect']
    it = {
        'id': x['id'], 'fn': x['fn'], 'dm': x['domain'], 'p': x['persona'],
        'g': x['groups'], 'k': x['difficulty'], 'qt': x['qtype'],
        'hv': e['behavior'],
        't': [{'q': t['q'], **({'n': t['expectNote']} if t.get('expectNote') else {})} for t in x['turns']],
        'kp': e['keyPoints'], 'cam': e['forbidden'],
        'cd': [{'doc': c['doc'], 'art': c.get('article', ''), 'cl': c.get('clause', '')} for c in e['citations']],
    }
    if x['mode'] == 'in_record':
        it['hs'] = 1
    if x['refDate'] and x['refDate'] != ngay_mac_dinh:
        it['rd'] = x['refDate']
    if x.get('n4'):
        it['n4'] = 1
    if x.get('fixture'):
        it['fx'] = x['fixture'][:400]
    out.append(it)

js = json.dumps(out, ensure_ascii=False, separators=(',', ':'))
s = open(dst, encoding='utf-8').read()
moi, n = re.subn(r'/\*BO_CAU\*/.*?/\*HET_BO_CAU\*/', lambda m: '/*BO_CAU*/' + js + '/*HET_BO_CAU*/', s, flags=re.S)
if n != 1:
    sys.exit('Không thấy cặp dấu /*BO_CAU*/ … /*HET_BO_CAU*/ trong ' + dst)
moi = re.sub(r"const BO_CAU_PHIEN_BAN = '[^']*'", "const BO_CAU_PHIEN_BAN = '%s · %s'" % (data.get('schema', ''), ngay_mac_dinh), moi)
open(dst, 'w', encoding='utf-8').write(moi)
from collections import Counter
print('Đã nhúng', len(out), 'câu ·', dict(Counter((i['fn'], i['p']) for i in out)), '·', len(js) // 1024, 'KB')
