
function loginChk_facility() {

	var id_txt = ''
	var pass_txt = ''

    if (form1.id_txt.value == "" || form1. pass_txt.value == "" ){
         //条件に一致する場合(いずれかが空の場合)
          alert("IDとPASSを入力してください");    //エラーメッセージを出力
          return false;    //送信ボタン本来の動作をキャンセルします
     }else{
		id_txt = form1.id_txt.value;
		pass_txt = form1.pass_txt.value;

			console.log("mounted start!!");
			firebase.auth().signInAnonymously()
			  .then(() => {
				  const db = firebase.firestore();
				 db.collection("facilityData")
					 .where("login_id", "==", id_txt)
					 .where("login_pass", "==", pass_txt)
					 .get()
					.then(querySnapshot => {
 if (!querySnapshot.empty) {
	 // 一致した最初のドキュメントを取得
          const doc = querySnapshot.docs[0];
          const data = doc.data();

    // id　name addressを sessionStorage に保存
	 sessionStorage.setItem('toyosu_manage_facility_id', data.f_id);
	 sessionStorage.setItem('toyosu_manage_facility_name', data.f_name);
	 sessionStorage.setItem('toyosu_manage_facility_address', data.address);
	 
      location.href = "index.html";
    } else {
      alert("IDまたはパスワードが違います");
      location.href = "login.html";
    }
					})
					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("facilityData Get End  !!");
				}
				)
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");

		 

		 
	  	}

}



