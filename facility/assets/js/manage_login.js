
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

		// login_id を内部メールアドレスへマッピングして Firebase Auth で認証
		var email = id_txt + window.AUTH_EMAIL_DOMAIN;

		console.log("login start!!");
		firebase.auth().signInWithEmailAndPassword(email, pass_txt)
			.then(function (cred) {
				var db = firebase.firestore();
				// 自分の施設データを uid で取得。
				// ※ login_id ではなく uid で引く。セキュリティルールが
				//   「自分(uid一致)のドキュメントしか読めない」ため、
				//   クエリ側も uid で絞らないと Firestore に拒否される。
				return db.collection("facilityData")
					.where("uid", "==", cred.user.uid)
					.limit(1)
					.get()
					.then(function (querySnapshot) {
						if (!querySnapshot.empty) {
							var data = querySnapshot.docs[0].data();
							sessionStorage.setItem('toyosu_manage_facility_id', data.f_id);
							sessionStorage.setItem('toyosu_manage_facility_name', data.f_name);
							sessionStorage.setItem('toyosu_manage_facility_address', data.address);
							location.href = "index.html";
						} else {
							// 認証は通ったが施設データが無い（削除済みなど）
							alert("この施設のデータが見つかりません。管理者にお問い合わせください。");
							firebase.auth().signOut();
						}
					});
			})
			.catch(function (error) {
				console.log("login ERROR:", error.code);
				alert("IDまたはパスワードが違います");
			});
	  	}

}
