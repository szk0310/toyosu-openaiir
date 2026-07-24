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

		<input type="button" name="save" id="" class="button-save" value="登録" @click="facility_update(fid,appFacilityData.login_pass)">
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
    facility_update(id,pass) {
      if (form1.email.value == "" || form1.pass.value == "" || form1.pass_new.value == "" || form1.pass_new_conf.value == "" ){
        //条件に一致する場合(いずれかが空の場合)
        alert("全て必須項目です"); //エラーメッセージを出力
        return false; //送信ボタン本来の動作をキャンセルします
      } else {
        const msg = ""

　　　　	var mail = form1.email.value;
		  var reg = /^[A-Za-z0-9]{1}[A-Za-z0-9_.-]*@{1}[A-Za-z0-9_.-]{1,}.[A-Za-z0-9]{1,}$/;
		  if (!reg.test(mail)) {
			  alert("メールアドレスを正しく入力してください");    //エラーメッセージを出力
			  msg = "error"
          		return false;    //送信ボタン本来の動作をキャンセルします
		  }
		  var pass_input = form1.pass.value;
		  if (pass_input !== pass) {
				alert("パスワードが違います");
			  msg = "error"
          		return false;    //送信ボタン本来の動作をキャンセルします
		}
		  
		 var pass_n = form1.pass_new.value;
		  var pass_n_conf = form1.pass_new_conf.value;

		  var reg = /^[A-Za-z0-9]+$/;
		  if (!reg.test(pass_n)) {
			  alert("新しいパスワードは英数のみです");    //エラーメッセージを出力
			  msg = "error"
          		return false;    //送信ボタン本来の動作をキャンセルします
		  }	
		  if (!reg.test(pass_n_conf)) {
				alert("確認用パスワードは英数字のみです");
				msg = "error";
				return false;
			}
		if (pass_n !== pass_n_conf) {
				alert("新しいパスワードと確認用パスワードが一致しません");
				msg = "error";
				return false;
		}


        if (msg != "") {
          return false; //送信ボタン本来の動作をキャンセルします
        } else {

          const db = firebase.firestore();
          const ts = firebase.firestore.FieldValue.serverTimestamp();
          var id = id

          db.collection("facilityData").doc(id).set({
				mail: form1.email.value,
				login_pass: form1.pass_new_conf.value,
              updated_at: ts
            }, {
              merge: true
            })
            .then(() => {

              console.log("Document successfully written!");
              location.href = "index.html";
            })
            .catch((error) => {
              console.error("Error writing document: ", error);
            });
        } //else	
      } //else

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
    const fid = sessionStorage.getItem("toyosu_manage_facility_id");
    console.log("mounted start!!");
    firebase.auth().signInAnonymously()
      .then(() => {
        console.log("Auth OK!!");
        const db = firebase.firestore();
        console.log("facilityData Get Start!!");

        db.collection("facilityData")
          .where("f_id", "==", fid)
          .limit(1)
          .get()
          .then(querySnapshot => {
            if (querySnapshot.empty) {
              // f_id が無い → 未ログイン扱い
              location.href = "login.html";
              return;
            }
            // ここで1件取得
            const data = querySnapshot.docs[0].data();
            //this.appFacilityData = data;
			Object.assign(this.appFacilityData, data);
            this.fid = fid;
            console.log("facilityData Get OK!!", data);
          })
          .catch(error => {
            console.log("querySnapshot ERROR!!", error);
          });
        console.log("facilityData Get End!!");
      })
      .catch(error => console.log("auth ERROR!!", error));
    console.log("mounted End!!");
  },
  created() {

  },
}).mount('#app_manage_idpass_post')