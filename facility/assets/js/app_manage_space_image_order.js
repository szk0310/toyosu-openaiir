const draggable = window['vuedraggable'];

const App = {
    data() {
      return {
		appSpaceImageArray:[],
		sid:'',
	  }
    },
components: {
      draggable: draggable
    },

methods: {
      saveOrder(){
			const db = firebase.firestore();
			const ts = firebase.firestore.FieldValue.serverTimestamp();

db.collection("spaceData").doc(this.sid).update({
    s_images: this.appSpaceImageArray,
	updated_at:ts
  })
  .then(() => {
    console.log("並び順保存完了");
	location.href = "space_image.html";
  });
	  },
	
	

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
		console.log("mounted start!!");
			firebase.auth().signInAnonymously()
			  .then(() => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("spaceData Get Start!!");
				  db.collection("spaceData").where("s_id", "==", sid) .get()
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
  }

  Vue.createApp(App).mount('#app_manage_space_image_order');
