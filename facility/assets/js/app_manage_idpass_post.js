Vue.createApp({
  template: `
<div class="h-bg">
	<h3 class="h-ttl">メール(ID)・パスワード　変更</h3>
</div>

<div class="manage-bg">
	<form name="form1">
		<table class="manage-table req">
			<tr><th></th><td class="txt-r"><span class="post-req">*</span>必須</td></tr>
		</table>
		<table class="manage-table">
			<tbody>
				<tr>
					<th>E-mail<span class="post-req">*</span></th>
					<td>
						<input type="text" id="email" name="email" v-model="appFacilityData.mail" class="manage-input">
					</td>
				</tr>
				<tr>
					<th>現パスワード<span class="post-req">*</span></th>
					<td>
						<!--<input type="text" id="pass" name="pass" class="manage-input" v-model="appFacilityData.login_pass">-->
						<input type="text" id="pass" name="pass" class="manage-input">
					</td>
				</tr>
				<tr>
					<th>新パスワード<span class="post-req">*</span></th>
					<td>
						<input type="text" id="pass_new" name="pass_new" class="manage-input">
					</td>
				</tr>
				<tr>
					<th>新パスワード確認<span class="post-req">*</span></th>
					<td>
						<input type="text" id="pass_new_conf" name="pass_new_conf" class="manage-input">
					</td>
				</tr>

			</tbody>
		</table>

		<input type="button" name="save" id="" class="button-save" value="登録" @click="facility_update()">
	</form>
</div>

			`,
  data: function () {
    return {

      appFacilityData: {},
      fid: '',
    }
  },
  methods: {
    facility_update() {
      if (form1.email.value == "" || form1.pass.value == "" || form1.pass_new.value == "" || form1.pass_new_conf.value == "" ){
        //条件に一致する場合(いずれかが空の場合)
        alert("全て必須項目です"); //エラーメッセージを出力
        return false; //送信ボタン本来の動作をキャンセルします
      }

      var mail = form1.email.value;
      var reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
      if (!reg.test(mail)) {
        alert("メールアドレスを正しく入力してください");
        return false;
      }

      var cur_pass = form1.pass.value;
      var pass_n = form1.pass_new.value;
      var pass_n_conf = form1.pass_new_conf.value;

      var regPass = /^[A-Za-z0-9]+$/;
      if (!regPass.test(pass_n)) {
        alert("新しいパスワードは英数のみです");
        return false;
      }
      if (!regPass.test(pass_n_conf)) {
        alert("確認用パスワードは英数字のみです");
        return false;
      }
      if (pass_n !== pass_n_conf) {
        alert("新しいパスワードと確認用パスワードが一致しません");
        return false;
      }

      var self = this;
      var user = firebase.auth().currentUser;
      if (!user) {
        alert("セッションが切れました。再度ログインしてください。");
        location.href = "login.html";
        return false;
      }

      // 現パスワードで再認証 → Firebase Auth のパスワード更新 → 連絡用メール(mail)を更新
      var cred = firebase.auth.EmailAuthProvider.credential(user.email, cur_pass);
      user.reauthenticateWithCredential(cred)
        .then(function () {
          return user.updatePassword(pass_n);
        })
        .then(function () {
          var db = firebase.firestore();
          var ts = firebase.firestore.FieldValue.serverTimestamp();
          return db.collection("facilityData").doc(self.fid).set({
            mail: form1.email.value,
            updated_at: ts
          }, { merge: true });
        })
        .then(function () {
          alert("パスワードを変更しました");
          location.href = "index.html";
        })
        .catch(function (error) {
          console.error("パスワード変更エラー:", error);
          if (error && (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential")) {
            alert("現パスワードが違います");
          } else {
            alert("変更に失敗しました: " + (error && error.message ? error.message : error));
          }
        });
    }

  },
  computed: {
    cDate: function (ddata) {
      // 関数の返り値に別の関数を定義し、別の関数内で引数を受け取ってあげる
      return function (ddata) {
        var ts = ddata;
        var d = new Date(ts * 1000);
        var year = d.getFullYear();
        var month = d.getMonth() + 1;
        var day = d.getDate();
        return year + '/' + month + '/' + day;

      }
    }
  },

  mounted() {
    const self = this;
    const fid = sessionStorage.getItem("toyosu_manage_facility_id");
    withAuth(function (user, db) {
      // uid で絞る（セキュリティルールが所有者限定のため）
      db.collection("facilityData")
        .where("uid", "==", user.uid)
        .limit(1)
        .get()
        .then(function (querySnapshot) {
          if (querySnapshot.empty) {
            // f_id が無い → 未ログイン扱い
            location.href = "login.html";
            return;
          }
          const data = querySnapshot.docs[0].data();
          Object.assign(self.appFacilityData, data);
          self.fid = fid;
          console.log("facilityData Get OK!!", data);
        })
        .catch(function (error) {
          console.log("querySnapshot ERROR!!", error);
        });
    });
  },
  created() {

  },
}).mount('#app_manage_idpass_post')