#!/usr/bin/env bash
# [bước 14 / bản 1.1] dựng bản thử từ kiem/thu-14/ rồi chạy 4 tình huống trên app giả lập. Cần node + jsdom (NODE_PATH).
set -e
GOC="$(cd "$(dirname "$0")/.." && pwd)"; T="$(mktemp -d)"
trap 'rm -rf "$GOC/du-an/_thu14" "$T"' EXIT
mkdir -p "$GOC/du-an/_thu14" && cp "$GOC"/kiem/thu-14/*.json "$GOC/du-an/_thu14/"
python3 -I "$GOC/cong-cu/dong_goi.py" --du-an _thu14 --ra "$T/thu.js" >/dev/null
python3 -I "$GOC/cong-cu/dong_goi.py" --ra "$T/chung.js" >/dev/null
if [ -d "$GOC/node_modules/jsdom" ]; then cd "$GOC"; else cd "$(dirname "${NODE_PATH:-$GOC/node_modules}")" 2>/dev/null || true; fi   # [GĐ 8] ưu tiên jsdom của repo (npm install), không có thì theo NODE_PATH
loi=0
for m in day-du matphien cauhinh; do node "$GOC/kiem/test_buoc14.mjs" "$T/thu.js" $m || loi=1; done
for m in thuan thuan-khong; do node "$GOC/kiem/test_buoc14.mjs" "$T/chung.js" $m || loi=1; done
exit $loi
