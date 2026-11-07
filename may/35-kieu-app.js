/* ============================================================= *
 * 3b. KIỂU APP (bước 13c, 13d) — phần khác nhau theo CÁCH APP     *
 * CHẠY, hồ sơ dự án chọn bằng một dòng "kieu_app". Ma trận chấm   *
 * (căn cứ × quan sát, mắt xích) không đổi theo kiểu app.          *
 *  - rest-buoc (DQTV): máy chủ trả danh sách bước {action, label,  *
 *    allowed} trong phản hồi GET → BUOC_MAY (ghiBuocMay, lõi kiểm). *
 *  - openslides (PMS): dữ liệu đi qua luồng nền (SharedWorker),     *
 *    tool không nghe được; đầu lần chạy tự đọc nhóm + quyền của    *
 *    tài khoản trong cuộc họp đang mở: who-am-i (POST, phải có     *
 *    trong post_cho_qua của hồ sơ) + autoupdate (GET, chỉ đọc).    *
 * ============================================================= */
const kieuApp = () => DU_AN.kieu_app || '';

async function docQuyenOpenSlides() {
  const r = await fetch('/system/auth/who-am-i/', { method: 'POST', credentials: 'include' });
  const tok = r.headers.get('authentication');
  if (!r.ok || !tok) return { loi: 'who-am-i không trả mã phiên (HTTP ' + r.status + ')' };
  const p = tok.split(' ').pop().split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const uid = JSON.parse(atob(p + '='.repeat((4 - p.length % 4) % 4))).userId;
  const doc = async k => JSON.parse(((await (await fetch('/system/autoupdate?single=1&k=' + k.join(','), { headers: { authentication: tok }, credentials: 'include' })).text()).split('\n')[0]) || '{}');
  const u = await doc([`user/${uid}/username`, `user/${uid}/organization_management_level`, `user/${uid}/meeting_user_ids`]);
  const m = location.pathname.match(/^\/(\d+)(?:\/|$)/);
  const kq = { ten_dang_nhap: u[`user/${uid}/username`] || '', cap_to_chuc: u[`user/${uid}/organization_management_level`] || '', cuoc_hop: m ? +m[1] : null, nhom: [] };
  const mus = u[`user/${uid}/meeting_user_ids`] || [];
  if (!kq.cuoc_hop || !mus.length) return kq;
  const mu = await doc(mus.flatMap(i => [`meeting_user/${i}/meeting_id`, `meeting_user/${i}/group_ids`]));
  const gs = mus.filter(i => mu[`meeting_user/${i}/meeting_id`] === kq.cuoc_hop).flatMap(i => mu[`meeting_user/${i}/group_ids`] || []);
  if (!gs.length) return kq;
  const g = await doc([...gs.flatMap(x => [`group/${x}/name`, `group/${x}/permissions`]), `meeting/${kq.cuoc_hop}/admin_group_id`]);
  kq.nhom = gs.map(x => ({ id: x, ten: g[`group/${x}/name`] || '', quyen: g[`group/${x}/permissions`] || [], quan_tri: x === g[`meeting/${kq.cuoc_hop}/admin_group_id`] }));
  return kq;
}

// Đọc quyền theo kiểu app, đầu mỗi lần chạy. Kiểu không hỗ trợ → null. Lỗi → { loi } (báo cáo ghi lý do, không dừng lần chạy).
async function docQuyenMayChu() {
  if (kieuApp() !== 'openslides') return null;
  try { return await docQuyenOpenSlides(); } catch (e) { return { loi: e.message }; }
}

// Một dòng cho báo cáo HTML
const moTaQuyen = q => !q ? '' : q.loi ? 'không đọc được quyền từ máy chủ: ' + q.loi
  : q.ten_dang_nhap + (q.cap_to_chuc ? ' · cấp tổ chức ' + q.cap_to_chuc : '') + (q.cuoc_hop ? ' · cuộc họp ' + q.cuoc_hop + ' · nhóm ' + (q.nhom.map(n => n.ten + (n.quan_tri ? ' (quản trị: mọi quyền)' : ' (' + n.quyen.length + ' quyền)')).join(', ') || 'không thuộc nhóm nào') : ' · không ở trong cuộc họp');
