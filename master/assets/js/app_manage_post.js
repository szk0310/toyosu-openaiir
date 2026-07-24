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

				db.collection("facilityData").doc(fid).set({
					f_id:fid,
					login_id: l_id,
					login_pass: pass,
					f_name: form1.name.value,
					mail: form1.email.value,
					f_category1:[],
					s_min:null,
					s_max:null,
					f_release:'',
					f_introduction:'',
					f_image:'',
					addess:'',
					access:'',
					url_web:'',
					url_insta:'',
					url_fb:'',
					url_x:'',
					lat:'',
					lng:'',
					f_icon:'',
					f_map:'',
					updated_at:ts
					})
					.then(() => {
						console.log("Document successfully written!");
					post("mail.php", {email:form1.email.value,lid:l_id,pass:pass});	
						//location.href = "index.html";	
					})
					.catch((error) => {
						console.error("Error writing document: ", error);
						
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
		this.facilityId = sessionStorage.toyosu_manage_facility_id;
		if (this.facilityId !== '' && this.facilityId !== null && this.facilityId !== undefined){


			console.log("mounted start!!");
			firebase.auth().signInAnonymously()
			  .then(() => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("facilityData Get Start!!");

				db.collection("facilityData").doc(this.facilityId).get()
					  .then((doc) => {
					  this.facilityName =  doc.data().f_name;
					this.facilityMail =  doc.data().mail;
					})

					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("facilityData Get End  !!");
								
				})
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");
			
		}else{
			this.facilityId = ""
		}



    },
	created () { 

		},	
}).mount('#app_manage_post')
