// 管理者(master / idea / case)ログイン
// 管理者アカウントは Firebase コンソールで作成し、admins/{uid} に登録しておくこと。
function loginChk_master() {

	if (form1.email_txt.value == "" || form1.pass_txt.value == "") {
		alert("メールアドレスとパスワードを入力してください");
		return false;
	}

	var email = form1.email_txt.value;
	var pass = form1.pass_txt.value;

	firebase.auth().signInWithEmailAndPassword(email, pass)
		.then(function (cred) {
			// admins/{uid} が存在する場合のみ管理者として許可
			return firebase.firestore().collection("admins").doc(cred.user.uid).get()
				.then(function (doc) {
					if (doc.exists) {
						location.href = "index.html";
					} else {
						alert("管理者権限がありません");
						firebase.auth().signOut();
					}
				});
		})
		.catch(function (error) {
			console.log("login ERROR:", error.code);
			alert("メールアドレスまたはパスワードが違います");
		});
}
