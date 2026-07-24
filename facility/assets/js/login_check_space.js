// ページ表示時に即チェック
const fid = sessionStorage.getItem("toyosu_manage_facility_id");
const sid = sessionStorage.getItem("toyosu_manage_space_id");

const f_name = sessionStorage.getItem("toyosu_manage_facility_name");
const s_name = sessionStorage.getItem("toyosu_manage_space_name");

const ttl_txt = f_name + ':' + s_name + '　管理';
document.getElementById("facility_name").textContent = ttl_txt;



if (!fid) {
  location.replace("login.html");
}else if (!sid) {
  location.replace("index.html");
}