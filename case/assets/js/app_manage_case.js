Vue.createApp({
	template: `
			<div class="h-bg">
				<h2 class="h-ttl">活用事例　登録一覧</h2>
			</div>

				<div class="manage-bg-g">
					<div class="manage-btn-head sort">
						<div>
							<input type="button" id="new" value="新規追加" @click="movePage_new(appCaseArray.length)" class="new-btn">
						</div>
					</div>
					<table class="manage-table-list">
						<thead>
							<tr class="manage-list-head">
								<th colspan="4">名称</th>
							</tr>
						</thead>
						<tbody>
							<template  v-for="(item, index) in appCaseArray">							
								<tr class="manage-list-item">
										<td data-colname="名称"><a class="ttl-post-link" @click="movePage(item.id,appCaseArray.length)">{{item.name}}</a></td>
										<td class="td-image" data-colname="">
											<div @click="imageUp(item.id,item.name)">
													<img v-if="item.image !== ''" :src="'../../assets/upload_img/case/'+ item.image" :alt="item.name">
													<img class="" v-else :src="'../../assets/upload_img/case/no-image.svg'" alt="no-image">
											</div>
										</td>
										<td class="details"><p @click="detailPage(item.id,item.name)">詳細内容登録</p></td>		
										<td data-colname="削除" class="delete"><p  @click="removeData(item.id,item.name)">削除</p></td>
								</tr>
							</template>
						</tbody>
					</table>
				</div>    

			`,
	data: function () {
		return {
			appCaseArray:[],
		}
		},
	 methods: {
		movePage_new(no) {	 
		 sessionStorage.removeItem("toyosu_manage_case_id");
		 window.location.href = 'post.html';
		},
		movePage(id,no) {
			sessionStorage.setItem('toyosu_manage_case_id', id);
			sessionStorage.setItem('toyosu_manage_case_no', no);		
			location.href = "post.html";
		},
		imageUp(id,name) {
			sessionStorage.setItem('toyosu_manage_case_id', id);
			sessionStorage.setItem('toyosu_manage_case_name', name);
			location.href = "image_post.html";
		},
		detailPage(id,name) {
			sessionStorage.setItem('toyosu_manage_case_id', id);
			sessionStorage.setItem('toyosu_manage_case_name', name);
			location.href = "detail.html";
		},

		 removeData(id,name) {
			var result = window.confirm('『' + name + '』を削除します。');
			if( result ) {
			   const db = firebase.firestore();
				db.collection("caseData").doc(id).delete()
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
			console.log("mounted start!!");
			firebase.auth().signInAnonymously()
			  .then(() => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("caseData Get Start!!");
				  var array = [];
				  db.collection("caseData").get()
					.then(querySnapshot => {
					  console.log("querySnapshot forEach Start!!");
					  querySnapshot.forEach(doc => {
					  array.push(doc.data()); 
					  });
					  console.log("querySnapshot forEach End  !!");
					  this.appCaseArray = array;
					  this.appCaseArray  = this.appCaseArray.sort((a, b) => {return a.order - b.order;});
					})
					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("caseData Get End  !!");
				}
				)
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");
		
    },
	created () { 

		},	
}).mount('#app_manage_case')
