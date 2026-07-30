Vue.createApp({
	template: `
<template v-for="(item, index) in appPickupArray.slice(0, 3)" :key="index">
	<div class="cont-item">

<div>
		<p class="item-img">
			<img
			  :src="item.s_images?.[0]?.name
				? 'assets/upload_img/facility/space/' + item.s_images[0].name
				: 'assets/upload_img/facility/no-image.svg'"
			  :alt="item.s_name"
			/>
		</p>

		<div class="cont-item-inn">

			<h3 class="item-ttl">{{item.s_name}}</h3>
			<p class="item-txt">{{item.s_introduction}}</p>

			<!-- ▼ カテゴリ表示 -->
			<div v-if="categories.space">
				<template v-for="cat in categories.space" :key="cat.field">

					<div class="tag-wrap"
						 v-if="item[cat.field] && item[cat.field].length">

						<p class="tag-ttl">{{ cat.name }}：</p>

						<div class="rag-item">
							<p class="tag"
							   v-for="(tag, i) in item[cat.field]"
							   :key="i">
								{{ tag }}
							</p>
						</div>

					</div>

				</template>
			</div>

				<!--<div class="tag-wrap">
					<p class="tag-ttl" v-if="categories.space && categories.space[0]">
						{{ categories.space[0].name }}：
					</p>
					<div class="rag-item">
						<p class="tag" v-for="(tag, i) in item.s_category1" :key="i">
							{{ tag }}
						</p>
					</div>
				</div>-->
		</div>
</div>
<div class="btn-wrap">
<button class="space_detail btn green round arrow" @click="moveSpace(item.s_id,item.s_name,item.f_name,item.f_id)"><span>詳細を見る</span></button>
</div>

	</div>

</template>
	`,

	data: function () {
		return {
			appPickupArray: [],
			categories: {}
		}
	},

	methods: {
		// ▼ categories.json基準で整形
		filterCategories(item) {
			if (!this.categories.space) return item;

			// ▼ 有効なfield一覧
			const validFields = this.categories.space.map(c => c.field);

			// ▼ 不要フィールド削除
			Object.keys(item).forEach(key => {
				if (key.startsWith('s_category') && !validFields.includes(key)) {
					delete item[key];
				}
			});

			// ▼ 各fieldごとに値フィルタ
			this.categories.space.forEach(cat => {
				const field = cat.field;
				const validItems = cat.items;

				if (item[field] && Array.isArray(item[field])) {
					item[field] = item[field].filter(v => validItems.includes(v));
				}
			});

			return item;
		},
		moveSpace(id,sname,fname,fid){
			sessionStorage.setItem('toyosu_manage_facility_name', fname);
			sessionStorage.setItem('toyosu_manage_facility_id', fid);
			sessionStorage.setItem('toyosu_manage_space_name', sname);
			sessionStorage.setItem('toyosu_manage_space_id', id);
			location.href = "space.html";
		},

	},

	computed: {
		cDate: function () {
			return function (ddata) {
				var ts = ddata;
				var d = new Date(ts * 1000);
				var year = d.getFullYear();
				var month = d.getMonth() + 1;
				var day = d.getDate();
				return year + '/' + month + '/' + day;
			}
		}
	},

	mounted() {
		console.log("mounted start!!");

		// ▼ fetchでcategories読み込み＋認証
		Promise.all([
			fetch('assets/json/categories.json').then(res => res.json()),
			Promise.resolve()/*匿名ログイン廃止(2026-07-30)*/
		])
		.then(([catRes]) => {

			console.log("categories loaded");
			this.categories = catRes;

			console.log("Auth OK!!");

			const db = firebase.firestore();
			console.log("spaceData Get Start!!");

			let array = [];

			db.collection("spaceData")
				.where("s_release", "==", "on")
				.get()
				.then(querySnapshot => {

					console.log("querySnapshot forEach Start!!");

					querySnapshot.forEach(doc => {
						let data = doc.data();

						// ▼ カテゴリ整理（削除＋フィルタ）
						data = this.filterCategories(data);

						array.push(data);
					});

				// ▼ ランダムシャッフル
				for (let i = array.length - 1; i > 0; i--) {
					const j = Math.floor(Math.random() * (i + 1));
					[array[i], array[j]] = [array[j], array[i]];
				}

					console.log("querySnapshot forEach End!!");

					this.appPickupArray = array;
				})
				.catch(function (error) {
					console.log("querySnapshot ERROR!!", error);
				});

			console.log("spaceData Get End!!");
		})
		.catch(error => console.log("INIT ERROR", error));

		console.log("mounted End!!");
	},

	created() {}
}).mount('#app_index_pickup');