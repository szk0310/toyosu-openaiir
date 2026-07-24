Vue.createApp({
		template: `
<div class="h-bg">
	<h2 class="h-ttl">詳細　登録・変更</h2>
</div>
<form name="form1">

				<div class="manage-bg">
					<div class="rich-wrap" id="ttt"><div id="quill-editor" style="height: 600px;"><p v-html=this.detail></p></div></div></div>
				<input type="button" name="save" id="" class="button-save" value="保存" @click="detail_save(caseId)" >
</form>

			`,
	data: function () {
		return {
			caseId:'',
			detail:'',
		}
		},
    components: {

    },
	 methods: {
		 detail_save(id) {
		
			var intro = "";
			//intro = quill.root.innerHTML;
			var q = document.getElementById('quill-editor');
			intro = q.firstElementChild;
			intro =intro.innerHTML

			var msg = ""		 

			if (msg !== "") {
				return false;    //送信ボタン本来の動作をキャンセルします
			  } else {
				  const db = firebase.firestore();
				  const ts = firebase.firestore.FieldValue.serverTimestamp();
					db.collection("caseData").doc(id).set({
						detail: intro,
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
	 	}
  	},
	computed: {
		cDate: function(ddata) {
		  // 関数の返り値に別の関数を定義し、別の関数内で引数を受け取ってあげる
		  return function(ddata) {
			 if( ddata == ''){
				var today = new Date();
				today.setDate(today.getDate());
				 var d = today
			 }else{
				 var ts = ddata;
				var d = new Date( ts * 1000 );
			}
				var year  = d.getFullYear();
				var month = d.getMonth() + 1;
			   var month =("0"+(d.getMonth() + 1)).slice(-2);
				var day  =  ("0"+d.getDate()).slice(-2);
			 
				return year + '-' + month + '-' + day;
		  }
    	}
  },

	mounted(){
		if (sessionStorage.toyosu_manage_case_id) {
		  this.caseId = sessionStorage.toyosu_manage_case_id;
		}else{
			location.href = "index.html";
		}
		
			console.log("mounted start!!");
			firebase.auth().signInAnonymously()
			  .then(() => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("caseData Get Start!!");
				  var array = [];

				db.collection("caseData").doc(this.caseId).get()
					  .then((doc) => {
					  this.detail =  doc.data().detail;
						this.$nextTick(function() {
					 	var quill = QuillEditorMake("quill-editor")	

					});
				  
					})
					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("caseData Get End  !!");
								
				})
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");


    },

	created () { 

		},	
}).mount('#app_manage_detail_post')
