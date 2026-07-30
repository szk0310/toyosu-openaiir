Vue.createApp({
  template: `
<div class="h-bg release_wrap">
	<h3 class="h-ttl">施設詳細　登録・変更</h3>
<div 
  class="release_btn"
  :class="{ off: !appFacilityData.f_release }"
  @click="releaseCNG(appFacilityData.f_release,fid)"
>
  {{ appFacilityData.f_release ? "公開中" : "非公開中" }}
</div>
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
						<input type="text" id="f_name" name="f_name" v-model="appFacilityData.f_name" class="manage-input">
						<!--<p>※26字以内</p>-->
					</td>
				</tr>
<tr v-for="cat in categories" :key="cat.field">
  <th>{{ cat.name }}</th>
  <td class="check-btn-area">
    <template v-for="item in cat.items" :key="item">
      <input
        type="checkbox"
        :id="cat.field + '_' + item"
        :value="item"
        v-model="selectedCategories[cat.field]"
      >
      <label :for="cat.field + '_' + item">
        {{ item }}
      </label>
    </template>
  </td>
</tr>

<tr>
					<th>広さ<span class="post-req"></span></th>
					<td>
						<input type="text" id="s_min" name="s_min" v-model="appFacilityData.s_min" class="manage-input-no" placeholder="最小">
							〜
						<input type="text" id="s_max" name="s_max" v-model="appFacilityData.s_max" class="manage-input-no" placeholder="最大">
						<span>　m²</span>
						<p>※半角数値</p>
					</td>
				</tr>

				<tr>
					<th>緯度<span class="post-req">*</span></th>
					<td>

						<input type="text" id="lat_input" name="lat" class="manage-input" v-model="appFacilityData.lat">
					</td>
				</tr>

				<tr>
					<th> 経度<span class="post-req">*</span></th>
					<td><input type="text" id="lng_input" name="lng" class="manage-input" v-model="appFacilityData.lng">
					</td>
				</tr>
				<tr>
					<th></th>
					<td>
						<button type="button" onclick="openMap()" class="btn-s">
						  緯度経度を地図から選択
						</button>
					</td>
				</tr>

				<tr>
					<th>紹介テキスト<span class="post-req">*</span></th>
					<td>
<textarea name="f_introduction" rows="8" class="textarea-post" v-model="appFacilityData.f_introduction">
</textarea>
<p>※文字数は350字以内。また改行は1文字にカウントされます。</p></td>
					</td>
				</tr>

				<tr>
					<th>住所<span class="post-req">*</span></th>
					<td>
						<input type="text" id="address" name="address" v-model="appFacilityData.address" class="manage-input">
					</td>
				</tr>
				<tr>
					<th>アクセス<span class="post-req"></span></th>
					<td>
						<input type="text" id="access" name="access" v-model="appFacilityData.access" class="manage-input" placeholder="最寄駅など">
					</td>
				</tr>
				<tr>
					<th>WEB<span class="post-req"></span></th>
					<td>
						<input type="text" id="url_web" name="url_web" v-model="appFacilityData.url_web" class="manage-input" placeholder="http://xxxx.xxx/">
					</td>
				</tr>
				<tr>
					<th>Instagram<span class="post-req"></span></th>
					<td>
						<input type="text" id="url_insta" name="url_insta" v-model="appFacilityData.url_insta" class="manage-input" placeholder="">
					</td>
				</tr>
				<tr>
					<th>Facebook<span class="post-req"></span></th>
					<td>
						<input type="text" id="url_fb" name="url_fb" v-model="appFacilityData.url_fb" class="manage-input" placeholder="">
					</td>
				</tr>
				<tr>
					<th>X<span class="post-req"></span></th>
					<td>
						<input type="text" id="url_x" name="url_x" v-model="appFacilityData.url_x" class="manage-input" placeholder="">
					</td>
				</tr>

			</tbody>
		</table>

		<input type="button" name="save" id="" class="button-save" value="保存" @click="facility_update(fid)">
	</form>
</div>

			`,
  data() {
    return {

      appFacilityData: {},
      fid: '',

      // JSONから生成
      categories: [],

      // field名ごとに選択値を持つ
      selectedCategories: {}

    }
  },

  methods: {

    // ==========================
    // JSON読み込み（facilityのみ）
    // ==========================
    loadCategories() {
      axios.get('../../assets/json/categories.json')
        .then(res => {

          this.categories = res.data.facility || [];

          this.categories.forEach(cat => {
            this.$set
              ? this.$set(this.selectedCategories, cat.field, [])
              : this.selectedCategories[cat.field] = [];
          });

        })
        .catch(err => {
          console.error("カテゴリJSON読み込み失敗", err);
        });
    },

    // ==========================
    // バリデーション
    // ==========================
    validateForm() {

      if (!this.appFacilityData.f_name ||
          !this.appFacilityData.lat ||
          !this.appFacilityData.lng ||
          !this.appFacilityData.f_introduction ||
          !this.appFacilityData.address) {

        alert("必須項目を確認してください");
        return false;
      }

      return true;
    },

    // ==========================
    // 保存（更新）
    // ==========================
		facility_update(id) {

		  if (!this.validateForm()) return;

		  const s_min = this.appFacilityData.s_min
			? Number(this.appFacilityData.s_min)
			: null;

		  const s_max = this.appFacilityData.s_max
			? Number(this.appFacilityData.s_max)
			: null;

		  if (s_min !== null && Number.isNaN(s_min)) {
			alert("広さ（最小）は数値で入力してください");
			return;
		  }

		  if (s_max !== null && Number.isNaN(s_max)) {
			alert("広さ（最大）は数値で入力してください");
			return;
		  }

		  if (s_min !== null && s_max !== null && s_min > s_max) {
			alert("広さの最大は最小以上にしてください");
			return;
		  }

		  const lat = Number(this.appFacilityData.lat);
		  const lng = Number(this.appFacilityData.lng);

		  if (Number.isNaN(lat) || Number.isNaN(lng)) {
			alert("緯度・経度は数値で入力してください");
			return;
		  }

		  const db = firebase.firestore();
		  const ts = firebase.firestore.FieldValue.serverTimestamp();

		  let saveData = {
			f_name: this.appFacilityData.f_name,
			s_min: s_min,
			s_max: s_max,
			lat: lat,
			lng: lng,
			f_introduction: this.appFacilityData.f_introduction,
			address: this.appFacilityData.address,
			access: this.appFacilityData.access,
			url_web: this.appFacilityData.url_web,
			url_insta: this.appFacilityData.url_insta,
			url_fb: this.appFacilityData.url_fb,
			url_x: this.appFacilityData.url_x,
			updated_at: ts
		  };

		  this.categories.forEach(cat => {
			saveData[cat.field] = this.selectedCategories[cat.field] || [];
		  });

		  // ① facilityData 更新
		  db.collection("facilityData").doc(id).set(saveData, { merge: true })
			.then(() => {

			  // ② 自分の spaceData を取得（ルールが所有者限定のため uid で絞る）
			  return db.collection("spaceData")
				.where("uid", "==", firebase.auth().currentUser.uid)
				.get();

			})
			.then(querySnapshot => {

			  const batch = db.batch();

			  querySnapshot.forEach(doc => {
				batch.update(doc.ref, {
				  f_address: this.appFacilityData.address,
				  f_name: this.appFacilityData.f_name,
				  updated_at: ts
				});
			  });

			  return batch.commit();

			})
			.then(() => {
			  location.href = "index.html";
			})
			.catch(error => {
			  console.error("更新エラー:", error);
			});
		},
	  
	  
	  releaseCNG(state,fid){
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
			  this.appFacilityData.f_release = release; // 画面も即反映
			})
			.catch((error) => {
			  console.error("更新エラー:", error);
			});
	  }
  },

  mounted() {

    // ① JSON読み込み
    this.loadCategories();

    const fid = sessionStorage.getItem("toyosu_manage_facility_id");
    this.fid = fid;

    ensureAuth()
      .then((user) => {
        const db = firebase.firestore();
        // uid で絞る（セキュリティルールが所有者限定のため）
        return db.collection("facilityData")
                 .where("uid", "==", user.uid)
                 .limit(1)
                 .get();
      })
      .then(querySnapshot => {

        if (querySnapshot.empty) {
          location.href = "login.html";
          return;
        }

        const data = querySnapshot.docs[0].data();
        this.appFacilityData = { ...data };

        // JSON読込後にカテゴリ値セット
        this.categories.forEach(cat => {
          this.selectedCategories[cat.field] = data[cat.field] || [];
        });

      })
      .catch(error => {
        console.error("読み込みエラー:", error);
      });

  }

}).mount('#app_manage_detail_post');