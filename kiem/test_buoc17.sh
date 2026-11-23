#!/usr/bin/env bash
# [bước 17 / bản 1.4] dựng bản chung (dist/chung/ita.js) vào thư mục tạm rồi chạy 3 tình huống app không có menu trái. Cần node + jsdom (NODE_PATH).
set -e
GOC="$(cd "$(dirname "$0")/.." && pwd)"; T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT
python3 -I "$GOC/cong-cu/dong_goi.py" --ra "$T/chung.js" >/dev/null
if [ -d "$GOC/node_modules/jsdom" ]; then cd "$GOC"; else cd "$(dirname "${NODE_PATH:-$GOC/node_modules}")" 2>/dev/null || true; fi   # [GĐ 8] ưu tiên jsdom của repo (npm install), không có thì theo NODE_PATH
loi=0
for m in tren lien-ket khong; do node "$GOC/kiem/test_buoc17.mjs" "$T/chung.js" $m || loi=1; done
exit $loi
