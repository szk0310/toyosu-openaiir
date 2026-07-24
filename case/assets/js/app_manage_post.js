Vue.createApp({
		template: `
<div class="h-bg">
	<h2 class="h-ttl">活用事例　登録・変更</h2>
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
									<input type="text" id="name" name="name" v-model="caseName" class="manage-input">
									<!--<p>※26字以内</p>-->
								</td>
							</tr>
							<tr>
								<th>サブタイトル<span class="post-req">*</span></th>
								<td>
									<input type="text" id="subttl" name="subttl" v-model="caseSubttl" class="manage-input">
									<!--<p>※26字以内</p>-->
								</td>
							</tr>

							<tr>
								<th>紹介テキスト<span class="post-req">*</span></th>
								<td>
									<textarea name="introduction" rows="8" class="textarea-post" placeholder="350字以内でご記入ください" maxlength="350">{{caseIntro}}</textarea>
								<p>※文字数は350字以内。また改行は1文字にカウントされます。</p></td>
								</td>
							</tr>

<tr>
<th>スペース</th>
<td class="form-select">
<select v-model="selectedSpace" name="selectedSpace" >
  <option value="">スペースを選択</option>
  <option
    v-for="space in appSpaceArray"
    :key="space.s_id"
    :value="space.s_id"
  >
    {{ space.s_name }}（{{ space.s_release === 'on' ? '公開中' : '非公開' }}）：{{ space.f_name }}
  </option>
</select>
</td>
</tr>



						</tbody>
					</table>

				<input type="button" name="save" id="" class="button-save" value="更新" @click="case_update(caseId)" v-if="caseId.length > 0">
				<input type="button" name="save" id="" class="button-save" value="保存" @click="case_save()" v-else>
			</form>
</div>
			`,

	data: function () {
		return {
			caseId:'',
			caseCat: null,
			caseName:'',
			caseSubttl:'',
			caseIntro:'',
			selectedSpace:'',
			 appSpaceArray:[]
		}
		},
    components: {
    },
	 methods: {

	case_save() {
		var id = "";
		var date = new Date();
		var getTime = date.getTime();
		id = id + getTime;
		
		 if (form1.name.value == "" || form1.subttl.value == "" || form1.introduction.value == "" ){
			 //条件に一致する場合(いずれかが空の場合)
			  alert("全て必須項目です");    //エラーメッセージを出力
			  return false;    //送信ボタン本来の動作をキャンセルします
		 }else{
			 var msg = ""
			 var introduction = form1.introduction.value;
			 if (introduction.length > 350) {
				  alert("名称は350文字までです");    //エラーメッセージを出力
				  msg = "error"
					return false;    //送信ボタン本来の動作をキャンセルします
			  }			 
			 

		if (msg != "") {
			return false;    //送信ボタン本来の動作をキャンセルします
		  } else {		 
			  const db = firebase.firestore();
			  const ts = firebase.firestore.FieldValue.serverTimestamp();

				db.collection("caseData").doc(id).set({
					id:id,
					name: form1.name.value,
					subttl: form1.subttl.value,
					introduction:form1.introduction.value,
					detail:'',
					image:'',
					s_id:form1.selectedSpace.value,
					updated_at:ts
					})
					.then(() => {
						console.log("Document successfully written!");
						location.href = "index.html";	
					})
					.catch((error) => {
						console.error("Error writing document: ", error);
						
				});
		  
		  }//else
	 	}//else
		
	 },
		 
	case_update(id) {
		 if (form1.name.value == "" || form1.subttl.value == "" || form1.introduction.value == "" ){
			 //条件に一致する場合(いずれかが空の場合)
			  alert("全て必須項目です");    //エラーメッセージを出力
			  return false;    //送信ボタン本来の動作をキャンセルします
		 }else{
			 var msg = ""
			 var introduction = form1.introduction.value;
			 if (introduction.length > 350) {
				  alert("紹介テキストは350文字までです");    //エラーメッセージを出力
				  msg = "error"
					return false;    //送信ボタン本来の動作をキャンセルします
			  }	


			if (msg != "") {
					return false;    //送信ボタン本来の動作をキャンセルします
			  } else {

				const db = firebase.firestore();
				const ts = firebase.firestore.FieldValue.serverTimestamp();
				var id = id

					db.collection("caseData").doc(id).set({
					name: form1.name.value,
					subttl: form1.subttl.value,
					introduction:form1.introduction.value,
					s_id:form1.selectedSpace.value,
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
		this.caseId = sessionStorage.toyosu_manage_case_id;
		if (this.caseId !== '' && this.caseId !== null && this.caseId !== undefined){


			console.log("mounted start!!");
			ensureAdmin("../master/login.html")
			  .then(() => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("caseData Get Start!!");

				db.collection("caseData").doc(this.caseId).get()
					  .then((doc) => {
					  this.caseName =  doc.data().name;
					this.caseSubttl =  doc.data().subttl;
					  this.caseIntro =  doc.data().introduction;
					  this.selectedSpace = doc.data().s_id || '';
					})

					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("caseData Get End  !!");
								
				})
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");
			
		}else{
			this.caseId = ""
		}

// -------------------------
// spaceData（常に取得）
// -------------------------
  ensureAdmin("../master/login.html")
  .then(() => {
    const db = firebase.firestore();
    console.log("spaceData Get Start!!");
    let array = [];
    db.collection("spaceData").get()
    .then(querySnapshot => {

      querySnapshot.forEach(doc => {
        array.push(doc.data());
      });

      this.appSpaceArray = array;
      this.appSpaceArray = this.appSpaceArray.sort((a,b)=>{
        return a.order - b.order;
      });

    })
    .catch(function(error){
      console.log("spaceData ERROR !!");
    });
  })
  .catch(error => console.log(error));

		
		

    },
	created () { 

		},	
}).mount('#app_manage_post')
