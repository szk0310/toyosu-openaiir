Vue.createApp({
	template: `
<template v-for="(item, index) in appIdeaArray.slice(0, 3)" :key="index">
<div class="cont-item">
						<p class="item-img">
<img v-if="item.image !== ''"
:src="'assets/upload_img/idea/'+ item.image"
:alt="item.name">

<img v-else
src="assets/upload_img/idea/no-image.svg"
alt="no-image">
</p>

</p>
						<div class="cont-item-inn">
							<h3 class="item-ttl">{{item.name}}</h3>
							<p class="item-txt">{{item.introduction}}</p>
						</div>
					</div>
</div>
</template>
			`,
	data: function () {
		return {
			appIdeaArray:[],
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
				  console.log("ideaData Get Start!!");
				  var array = [];
				  db.collection("ideaData").get()
					.then(querySnapshot => {
					  console.log("querySnapshot forEach Start!!");
					  querySnapshot.forEach(doc => {
					  array.push(doc.data()); 
					  });
					  console.log("querySnapshot forEach End  !!");
					  //this.appIdeaArray = array;
					  //this.appIdeaArray  = this.appIdeaArray.sort((a, b) => {return a.order - b.order;});
					  // シャッフル
						for (let i = array.length - 1; i > 0; i--) {
						  const j = Math.floor(Math.random() * (i + 1));
						  [array[i], array[j]] = [array[j], array[i]];
						}

						this.appIdeaArray = array;
					  sessionStorage.setItem('toyosu_appIdeaArray', JSON.stringify(array));
					})
					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("ideaData Get End  !!");
				}
				)
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");
		
    },
	created () { 

		},	
}).mount('#app_index_idea')
