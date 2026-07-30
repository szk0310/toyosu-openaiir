Vue.createApp({
	template: `
<template v-for="(item, index) in appCaseArray" :key="index">
<div class="cont-item flex">
	<div class="cont-item-inn img">
		<p class="item-img round">

			<img v-if="item.image !== ''" :src="'assets/upload_img/case/'+ item.image" :alt="item.name">
			<img class="" v-else :src="'assets/upload_img/case/no-image.svg'" alt="no-image">
		</p>
						</div>
						<div class="cont-item-inn txt">
							<h3 class="item-ttl">{{item.name}}</h3>
							<p class="item-lead">{{item.subttl}}</p>
							<p class="item-txt">{{item.introduction}}</p>
						</div>
					</div>
</template>
			`,
	data: function () {
		return {
			appCaseArray:[],
		}
		},
	 methods: {
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
			Promise.resolve()/*匿名ログイン廃止(2026-07-30)*/
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
					  sessionStorage.setItem('toyosu_appCaseArray', JSON.stringify(array));
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
}).mount('#app_case_list')
