Vue.createApp({
	template: `
			<div class="h-bg">
				<h2 class="h-ttl">施設　登録一覧</h2>
			</div>

				<div class="manage-bg-g">
					<div class="manage-btn-head sort">
						<div>
							<input type="button" id="new" value="新規追加" @click="movePage_new(appFacilityArray.length)" class="new-btn">
						</div>
					</div>
					<table class="manage-table-list">
						<thead>
							<tr class="manage-list-head">
								<th colspan="4">名称</th>
							</tr>
						</thead>
						<tbody>
							<template  v-for="(item, index) in appFacilityArray">							
								<tr class="manage-list-item">
<td data-colname="名称">{{item.f_name}}</td>
										<!--変更可用<td data-colname="名称"><a class="ttl-post-link" @click="movePage(item.f_id,appFacilityArray.length)">{{item.f_name}}</a></td>-->
<td data-colname="公開" :class="item.f_release ? 'release' : 'delete'"><p @click="releaseCNG(item.f_release,item.f_id)">{{ item.f_release ? "公開中" : "非公開中" }}</p></td>
<td data-colname="削除" class="delete"><p  @click="removeData(item.f_id,item.f_name)">削除</p></td>
								</tr>
							</template>
						</tbody>
					</table>
				</div>    

			`,
	data: function () {
		return {
			appFacilityArray:[],
		}
		},
	 methods: {
		movePage_new(no) {	 
		 sessionStorage.removeItem("toyosu_manage_facility_id");
		 window.location.href = 'post.html';
		},
		movePage(id,no) {
			sessionStorage.setItem('toyosu_manage_facility_id', id);
			sessionStorage.setItem('toyosu_manage_facility_no', no);		
			location.href = "post.html";
		},
		 removeData(id,name) {
			// 施設を削除すると、その施設が登録したスペースとカレンダーも
			// 一緒に消す。以前は facilityData の1件だけを消していたため、
			// spaceData / calendarData が孤児として残り続けていた。
			var result = window.confirm(
				'『' + name + '』を削除します。\n\n' +
				'この施設のスペース・カレンダーもまとめて削除されます。\n' +
				'※ログインアカウント（Firebase Authentication）と\n' +
				'　アップロード済み画像は自動では消えません。'
			);
			if( !result ) { console.log('キャンセルがクリックされました'); return; }

			const db = firebase.firestore();

			// ① この施設のスペースを取得（管理者なので f_id で絞れる）
			db.collection("spaceData").where("f_id", "==", id).get()
			  .then(function (spaceSnap) {
				  const spaceIds = spaceSnap.docs.map(function (d) { return d.data().s_id; })
				                                 .filter(Boolean);
				  // ② それらのスペースに紐づくカレンダーを取得
				  //    s_id は最大10件までしか in 検索できないため分割する
				  const chunks = [];
				  for (let i = 0; i < spaceIds.length; i += 10) { chunks.push(spaceIds.slice(i, i + 10)); }
				  const calQueries = chunks.map(function (c) {
					  return db.collection("calendarData").where("s_id", "in", c).get();
				  });
				  return Promise.all(calQueries).then(function (calSnaps) {
					  return { spaceSnap: spaceSnap, calSnaps: calSnaps };
				  });
			  })
			  .then(function (r) {
				  // ③ まとめて削除（スペース → カレンダー → 施設本体）
				  const batch = db.batch();
				  r.spaceSnap.forEach(function (d) { batch.delete(d.ref); });
				  r.calSnaps.forEach(function (snap) {
					  snap.forEach(function (d) { batch.delete(d.ref); });
				  });
				  batch.delete(db.collection("facilityData").doc(id));
				  return batch.commit();
			  })
			  .then(function () {
				  alert(
					  '施設とその配下データを削除しました。\n\n' +
					  'ログインアカウントは残っています。完全に削除する場合は\n' +
					  'Firebase コンソールの Authentication → Users から削除してください。'
				  );
				  location.href = "index.html";
			  })
			  .catch(function (error) {
				  console.error("削除エラー:", error);
				  alert("削除に失敗しました: " + (error && error.message ? error.message : error));
			  });
		 },
		releaseCNG__only_f(state, fid) {
			  const db = firebase.firestore();
			  const release = state === "on" ? "" : "on";

			  db.collection("facilityData")
				.doc(fid)
				.set(
				  {
					f_release: release
				  },
				  { merge: true }
				)
				.then(() => {
				  console.log("更新成功");
				  const target = this.appFacilityArray.find(item => item.f_id === fid);
				  if (target) {
					target.f_release = release;
				 }
							})
				.catch((error) => {
				  console.error("更新エラー:", error);
				});
			},
		 releaseCNG(state, fid) {
			  const db = firebase.firestore();
			  const release = state === "on" ? "" : "on";

			  db.collection("facilityData")
				.doc(fid)
				.set(
				  {
					f_release: release
				  },
				  { merge: true }
				)
				.then(() => {
				  console.log("更新成功");
				  const target = this.appFacilityArray.find(item => item.f_id === fid);
				  if (target) {
					target.f_release = release;
				 }
				// spaceDataも更新
      return db.collection("spaceData")
        .where("f_id", "==", fid)
        .get();
    })
    .then((querySnapshot) => {
      const promises = [];

      querySnapshot.forEach(doc => {
        promises.push(
          doc.ref.set(
            { s_release: release },
            { merge: true }
          )
        );
      });

      return Promise.all(promises);
    })
    .then(() => {
      console.log("spaceData 更新成功");
    })
    .catch((error) => {
      console.error("更新エラー:", error);
    });
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
			ensureAdmin()
			  .then(() => {
				  console.log("Auth OK!!");
				  const db = firebase.firestore();
				  console.log("facilityData Get Start!!");
				  var array = [];
				  db.collection("facilityData").get()
					.then(querySnapshot => {
					  console.log("querySnapshot forEach Start!!");
					  querySnapshot.forEach(doc => {
					  array.push(doc.data()); 
					  });
					  console.log("querySnapshot forEach End  !!");
					  this.appFacilityArray = array;
					  this.appFacilityArray  = this.appFacilityArray.sort((a, b) => {return a.order - b.order;});
					})
					.catch(function(error) {
					  console.log("querySnapshot ERROR  !!");
				   });
				  console.log("facilityData Get End  !!");
				}
				)
			  .catch(error => console.log(error));
			console.log("auth End  !!");
		 	console.log("mounted End  !!");
		
    },
	created () { 

		},	
}).mount('#app_manage_master')
