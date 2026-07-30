Vue.createApp({
		template: `
<div class="h-bg">
	<h2 class="h-ttl">マスター　登録・変更</h2>
</div>

<div class="manage-bg">
<form name="form1">
					<table class="manage-table req">
						<tr><th></th><td class="txt-r"><span class="post-req">*</span>必須</td></tr>
					</table>
					<table class="manage-table">
						<tbody>
							<tr>
								<th>名称<span class="post-req">*</span></th>
								<td>
									<input type="text" id="name" name="name" v-model="facilityName" class="manage-input">
									<!--<p>※26字以内</p>-->
								</td>
							</tr>
							<tr>
								<th>メールアドレス<span class="post-req">*</span></th>
								<td>
									<input type="email" id="email" name="email" v-model="facilityMail" class="manage-input">
								</td>
							</tr>

						</tbody>
					</table>

				<input type="button" name="save" id="" class="button-save" value="更新" @click="facility_update(facilityId)" v-if="facilityId.length > 0">
				<input type="button" name="save" id="" class="button-save" value="保存" @click="facility_save()" v-else>
			</form>
</div>
			`,

	data: function () {
		return {
			facilityId:'',
			facilityName:'',
			facilityMail:'',
		}
		},
    components: {
    },
	 methods: {

	facility_save() {
		// ログインpassを生成
//		var l = 8;
//		var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
//		var cl = c.length;
//		var pass = "";
//		for(var i=0; i<l; i++){
//		  pass += c[Math.floor(Math.random()*cl)];
//
//	}		
// ログインID passを生成　共通文字
var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
var cl = c.length;

// 乱数取得（httpsならcrypto、httpならMath.random）
function getRandomInt(max) {
  if (window.crypto && crypto.getRandomValues) {
    var array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] % max;
  } else {
    return Math.floor(Math.random() * max);
  }
}

// ===== ログインpass（8桁） =====
var passLength = 8;
var pass = "";

for (var i = 0; i < passLength; i++) {
  pass += c[getRandomInt(cl)];
}

// ===== ログインID（10桁） =====
var idLength = 10;
var l_id = "";

for (var i = 0; i < idLength; i++) {
  l_id += c[getRandomInt(cl)];
}
		
		
		var fid = "";
		var date = new Date();
		var getTime = date.getTime();
		fid = fid + getTime;
		
		 if (form1.name.value == "" || form1.email.value == "" ){
			 //条件に一致する場合(いずれかが空の場合)
			  alert("全て必須項目です");    //エラーメッセージを出力
			  return false;    //送信ボタン本来の動作をキャンセルします
		 }else{
			var msg = ""
　　　　	var mail = form1.email.value;
		  var reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
		  if (!reg.test(mail)) {
			  alert("メールアドレスを正しく入力してください");    //エラーメッセージを出力
			  msg = "error"
          		return false;    //送信ボタン本来の動作をキャンセルします
		  }			 

		if (msg != "") {
			return false;    //送信ボタン本来の動作をキャンセルします
		  } else {
			  const db = firebase.firestore();
			  const ts = firebase.firestore.FieldValue.serverTimestamp();
			  const contactMail = form1.email.value;
			  const facilityName = form1.name.value;

			  // login_id を内部メールアドレスにマッピングして Firebase Auth に登録。
			  // 二次アプリを使い、管理者(master)のログインセッションを壊さずにユーザー作成する。
			  const authEmail = l_id + window.AUTH_EMAIL_DOMAIN;
			  const secondaryApp =
				(firebase.apps || []).filter(function (a) { return a.name === "Secondary"; })[0] ||
				firebase.initializeApp(firebase.app().options, "Secondary");

			  secondaryApp.auth().createUserWithEmailAndPassword(authEmail, pass)
				.then(function (cred) {
					const uid = cred.user.uid;
					// 二次アプリはユーザー作成専用。すぐサインアウトして管理者セッションに影響させない。
					secondaryApp.auth().signOut();

					// 施設データを保存（login_pass は保存しない / uid を保存してルールの所有者判定に使う）
					return db.collection("facilityData").doc(fid).set({
						f_id: fid,
						uid: uid,
						login_id: l_id,
						f_name: facilityName,
						mail: contactMail,
						f_category1: [],
						s_min: null,
						s_max: null,
						f_release: '',
						f_introduction: '',
						f_image: '',
						addess: '',
						access: '',
						url_web: '',
						url_insta: '',
						url_fb: '',
						url_x: '',
						lat: '',
						lng: '',
						f_icon: '',
						f_map: '',
						updated_at: ts
					});
				})
				.then(function () {
					console.log("Document successfully written!");
					// ID/PASS をメール通知。
					// mail.php はサーバー側(_auth.php)で管理者かどうかを検証するため、
					// Firebase の IDトークンを一緒に送る必要がある。
					return firebase.auth().currentUser.getIdToken(true)
						.then(function (idToken) {
							post("mail.php", { email: contactMail, lid: l_id, pass: pass, idToken: idToken });
						});
				})
				.catch(function (error) {
					console.error("登録エラー: ", error);
					if (error && error.code === "auth/email-already-in-use") {
						alert("このIDは既に使用されています。もう一度お試しください。");
					} else {
						alert("登録に失敗しました: " + (error && error.message ? error.message : error));
					}
				});
		  }//else
	 	}//else
		
	 },
		 
	facility_update(id) {
		 if (form1.name.value == "" || form1.email.value == "" ){
			 //条件に一致する場合(いずれかが空の場合)
			  alert("全て必須項目です");    //エラーメッセージを出力
			  return false;    //送信ボタン本来の動作をキャンセルします
		 }else{
			var msg = ""
　　　　	var mail = form1.email.value;
		  var reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
		  if (!reg.test(mail)) {
			  alert("メールアドレスを正しく入力してください");    //エラーメッセージを出力
			  msg = "error"
          		return false;    //送信ボタン本来の動作をキャンセルします
		  }			 



			if (msg != "") {
					return false;    //送信ボタン本来の動作をキャンセルします
			  } else {

				const db = firebase.firestore();
				const ts = firebase.firestore.FieldValue.serverTimestamp();
				var id = id

				db.collection("facilityData").doc(id).set({
					f_name: form1.name.value,
					mail: form1.email.value,
					updated_at:ts
						}, {merge: true})
						.then(() => {

						console.log("Document successfully written!");
							location.href = "index.html";	
						})
						.catch((error) => {
							console.error("Error writing document: ", error);
						});
			  }//else	
		  }//else

  	}
},
computed: {
		cDate: function(ddata) {
		  // 関数の返り値に別の関数を定義し、別の関数内で引数を受け取ってあげる
		  return function(ddata) {
			  var ts = ddata;
				var d = new Date( ts * 1000 );
				var year  = d.getFullYear();
				var month = d.getMonth() + 1;
				var day  = d.getDate();
				return year + '/' + month + '/' + day;
			  
		  }
    	}
  },
	

	mounted(){
		const self = this;
		withAdmin(function (user, db) {
			self.facilityId = sessionStorage.toyosu_manage_facility_id;
			if (self.facilityId !== '' && self.facilityId !== null && self.facilityId !== undefined) {
				db.collection("facilityData").doc(self.facilityId).get()
					.then(function (doc) {
						self.facilityName = doc.data().f_name;
						self.facilityMail = doc.data().mail;
					})
					.catch(function (error) {
						console.log("facilityData Get ERROR!!", error);
					});
			} else {
				self.facilityId = "";
			}
		});
    },
	created () { 

		},	
}).mount('#app_manage_post')
