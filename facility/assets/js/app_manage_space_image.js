Vue.createApp({
	template: `
			<div class="h-bg">
				<h2 class="h-ttl">画像 登録一覧</h2>
			</div>

				<div class="manage-bg-g">

<div class="manage-btn-head image">
						<div>
							<a class="new-btn" href="space_image_post.html">追加</a>
						</div>
						<div>
							<a class="new-btn" href="space_image_order.html" v-show="appSpaceImageArray.length > 1">並べ替え</a>
						</div>
					</div>

					<table class="manage-image-list">
 						<template  v-for="(item, index) in appSpaceImageArray">							
						<tr class="manage-image-list-item">
								<td data-colname="image">
									<img :src="'../../assets/upload_img/facility/space/'+ item.name" :alt="'image'+ (index+1)">
									<p class="delete" @click="removeData(item.id,item.name,)">削除</p>
								</td>
						</tr>
						</template>
					</table>
				</div>    

			`,
	data: function () {
		return {
			appSpaceImageArray:{},
			sid:'',
		}
		},
	 methods: {
		movePage_new(no) {	 
		 sessionStorage.removeItem("toyosu_manage_space_id");
		 window.location.href = 'space_post.html';
		},
		movePage(id) {
			location.href = "space_post.html";
		},
		 
		 removeData(id,name) {
			var result = window.confirm('『' + name + '』を削除します。');
			if( result ) {
			  // ① idが一致しないものだけ残す
			  this.appSpaceImageArray = this.appSpaceImageArray.filter(img => img.id !== id);
			  // ② DBに丸ごと保存
				const db = firebase.firestore();
			  db.collection("spaceData").doc(this.sid).update({
				s_images: this.appSpaceImageArray
			  })
			  .then(() => {
				console.log("削除完了");
			  });	
				
			}else {
				console.log('キャンセルがクリックされました');
			}
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
		this.sid = sessionStorage.toyosu_manage_space_id;
		 console.log(this.sid);
			console.log("mounted start!!");
			ensureAuth()
			  .then((user) => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("spaceData Get Start!!");
				  // uid でも絞る（ルールが所有者限定のため、s_id だけでは拒否される）
				  db.collection("spaceData").where("s_id", "==", sid).where("uid", "==", user.uid) .get()
					.then(querySnapshot => {
					  console.log("querySnapshot forEach Start!!");
					  querySnapshot.forEach(doc => {
						  const data = doc.data();
						  this.appSpaceImageArray =  data.s_images || [];
					  });
					  console.log("querySnapshot forEach End  !!");
					  
					})
					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("spaceData Get End  !!");
				}
				)
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");
		
    },
	created () { 

		},	
}).mount('#app_manage_space_image')
