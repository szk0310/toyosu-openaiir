// ページ表示時に即チェック
const fid = sessionStorage.getItem("toyosu_manage_facility_id");
const f_name = sessionStorage.getItem("toyosu_manage_facility_name");
const ttl_txt = f_name + '　管理';
document.getElementById("facility_name").textContent = ttl_txt;


if (!fid) {
  // 未ログイン扱い
  location.href = "login.html";
}