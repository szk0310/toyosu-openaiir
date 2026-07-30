Vue.createApp({
	template: `
			<div class="h-bg">
				<h2 class="h-ttl">スペース　登録一覧</h2>
			</div>

				<div class="manage-bg-g">
					<div class="manage-btn-head sort">
						<div>
							<input type="button" id="new" value="新規追加" @click="movePage_new(appSpaceArray.length)" class="new-btn">
						</div>
					</div>
					<table class="manage-table-list">
						<thead>
							<tr class="manage-list-head">
								<th colspan="4">名称
</th>
							</tr>
						</thead>
						<tbody>
							<template  v-for="(item, index) in appSpaceArray">
								<tr class="manage-list-item">

										<td data-colname="名称"><a class="ttl-post-link" @click="movePage(item.s_id)">{{item.s_name}}</a>
<span> [{{ item.s_release ? "公開" : "非公開" }}]</span>
</td>
										<td class="details"><p @click="moveImagePage(item.s_id,item.s_name)">画像管理</p></td>	
										<td class="details"><p @click="moveCalPage(item.s_id,item.s_name)">カレンダー</p></td>
<td data-colname="削除" class="delete"><p  @click="removeData(item.s_id,item.s_name)">削除</p></td>
								</tr>
							</template>
						</tbody>
					</table>
				</div>    

			`,
	data: function () {
		return {
			appSpaceArray:{},
			fid:'',
		}
		},
	 methods: {
		movePage_new(id) {
			sessionStorage.removeItem("toyosu_manage_space_id");
			location.href = "space_post.html";
		},
		movePage(id) {
			sessionStorage.setItem('toyosu_manage_space_id', id);	
			location.href = "space_post.html";
		},
		moveCalPage(id,name) {
			sessionStorage.setItem('toyosu_manage_space_id', id);	
			sessionStorage.setItem('toyosu_manage_space_name', name);	
			location.href = "space_calender.html";
		},

		moveImagePage(id,name) {
			sessionStorage.setItem('toyosu_manage_space_id', id);	
			sessionStorage.setItem('toyosu_manage_space_name', name);	
			location.href = "space_image.html";
		},
		 
		 removeData(id,name) {
			var result = window.confirm('『' + name + '』を削除します。');
			if( result ) {
			   const db = firebase.firestore();
				db.collection("spaceData").doc(id).delete()
				   .then(()=> {
						 location.href = "index.html";
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
		this.fid = sessionStorage.toyosu_manage_facility_id;
		 console.log(this.fid);
			console.log("mounted start!!");
			ensureAuth()
			  .then((user) => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("spaceData Get Start!!");
				  var array = [];
				  // uid で絞る（セキュリティルールが所有者限定のため）
				  db.collection("spaceData").where("uid", "==", user.uid) .get()
					.then(querySnapshot => {
					  console.log("querySnapshot forEach Start!!");
					  querySnapshot.forEach(doc => {
					  array.push(doc.data()); 
					  });
					  console.log("querySnapshot forEach End  !!");
					  this.appSpaceArray = array;
					  this.appSpaceArray  = this.appSpaceArray.sort((a, b) => {return a.order - b.order;});
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
}).mount('#app_manage_space')
