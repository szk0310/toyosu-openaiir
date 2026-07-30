Vue.createApp({
  template: `
<div class="h-bg release_wrap">
	<h3 class="h-ttl">スペース　登録・変更</h3>
<div 
  class="release_btn"
v-if="spaceId"
  :class="{ off: !appSpaceData.s_release }"
  @click="releaseCNG(appSpaceData.s_release,spaceId)"
>
  {{ appSpaceData.s_release ? "公開中" : "非公開中" }}
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
					<th>スペース名<span class="post-req">*</span></th>
					<td>
						<input type="text" id="s_name" name="s_name" v-model="appSpaceData.s_name" class="manage-input">
						<!--<p>※26字以内</p>-->
					</td>
				</tr>
				<tr>
					<th>紹介テキスト<span class="post-req">*</span></th>
					<td>
					<textarea name="s_introduction" rows="8" class="textarea-post" v-model="appSpaceData.s_introduction">
					</textarea>
					<p>※文字数は350字以内。また改行は1文字にカウントされます。</p></td>
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
					<th>利用可能時間<span class="post-req">*</span></th>
					<td>
						<input type="text" id="s_time" name="s_time" v-model="appSpaceData.s_time" class="manage-input" placeholder="HH:MM〜HH:MM">
					</td>
				</tr>
				<tr>
					<th>価格(単位）<span class="post-req">*</span></th>
					<td>
						 <input type="text" id="s_price" name="s_price" v-model="appSpaceData.s_price" class="manage-input-no" placeholder="5000" >
							<p class="form-select s">
								<select name="s_price_unit" id="s_price_unit" v-model="appSpaceData.s_price_unit">
									<option value="">単位なし</option>
										<option value="〜">〜</option>
										<option value="円">円</option>
										<option value="円〜">円〜</option>
										<option value="円／日">円／日</option>
										<option value="円／日〜">円／日〜</option>
										<option value="円／1h">円／1h</option>
										<option value="円／1h〜">円／1h〜</option>
								</select>
							</p>
 <p>※半角数字（カンマ不要）</p>
<br>
<p>価格をテキストで表示する場合は入力してください</p>
<input
  type="text"
  id="s_price_txt"
  name="s_price_txt"
  v-model="appSpaceData.s_price_txt"
  class="manage-input"
  placeholder="応相談 / 無料"
>

					</td>
				</tr>

				<tr>
					<th>定休日<span class="post-req"></span></th>
					<td class="check-btn-area">
					  <template v-for="item in weekdayItems" :key="item.value">
  <input
    type="checkbox"
    :id="'weekday_' + item.value"
    :value="item.value"
    v-model="weekdaySelected"
  >
  <label :for="'weekday_' + item.value">
    {{ item.label }}
  </label>
</template>
					</td>
				</tr>

<tr>
<th>その他詳細</th>
<td>

<div v-for="(field, index) in fields" :key="index" class="field_item">
  <!-- 項目名 -->
  <input
    v-model="field.key"
    placeholder="項目名"
 class="manage-input-no"
  >：

  <!-- 値 -->
  <input
    v-model="field.value"
    placeholder="値"
class="manage-input"
  >

  <!-- 削除ボタン -->
<div class="del_btn">
<p class="field_del" @click="removeField(index)">
  この項目を削除
</p>
</div>
</div>


<button type="button" @click="addField">
  ＋項目追加
</button>


</td>
</tr>
			</tbody>
		</table>

				<input type="button" name="save" id="" class="button-save" value="更新" @click="space_update(spaceId)" v-if="spaceId.length > 0">
				<input type="button" name="save" id="" class="button-save" value="保存" @click="space_save()" v-else>

	</form>
</div>
			`,
data() {
    return {
      appSpaceData: {},
		appSpaceData: {
      s_price_unit: ""
    },
      spaceId: '',
      facilityId: '',
      facilityName: '',
      facilityAdd: '',

      // JSONから生成される
      categories: [],

      // 選択値をfield名で管理
      selectedCategories: {},

      weekdayItems: [
        { value: 0, label: '日' },
        { value: 1, label: '月' },
        { value: 2, label: '火' },
        { value: 3, label: '水' },
        { value: 4, label: '木' },
        { value: 5, label: '金' },
        { value: 6, label: '土' }
      ],
      weekdaySelected: [],

      fields: [
        { key: "広さ", value: "" },
        { key: "地面", value: "" },
        { key: "収容人数", value: "" },
        { key: "搬入・搬出", value: "" },
        { key: "利用可能な設備", value: "" },
        { key: "注意事項", value: "" },
      ]
    }
  },

  methods: {

    // ==========================
    // JSON読み込み
    // ==========================
    loadCategories() {
      axios.get('../../assets/json/categories.json')
        .then(res => {

          // spaceのみ使用
          this.categories = res.data.space || [];

          // field名ごとに選択配列を生成
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

    validateForm() {
      if (!this.appSpaceData.s_name ||
          !this.appSpaceData.s_introduction ||
          !this.appSpaceData.s_time ||
          !this.appSpaceData.s_price) {
        alert("必須項目を確認してください");
        return false;
      }
	// 数字のみチェック
  if (!/^[0-9]+$/.test(this.appSpaceData.s_price)) {
    alert("価格は数字のみで入力してください（カンマなし）");
    return false;
  }
      return true;
    },

    addField() {
      this.fields.push({ key: "", value: "" });
    },

    removeField(index) {
      this.fields.splice(index, 1);
    },

    // ==========================
    // 保存
    // ==========================
    space_save() {

      if (!this.validateForm()) return;

      const sid = Date.now().toString();
      const db = firebase.firestore();
      const ts = firebase.firestore.FieldValue.serverTimestamp();

      let saveData = {
        s_id: sid,
        f_id: this.facilityId,
        // uid は所有者判定に必須。これが無いとルールに拒否され保存できない。
        uid: firebase.auth().currentUser.uid,
        f_name: this.facilityName,
		f_address: this.facilityAdd,
        s_name: this.appSpaceData.s_name,
        s_introduction: this.appSpaceData.s_introduction,
        s_time: this.appSpaceData.s_time,
        s_price: Number(this.appSpaceData.s_price),
		  s_price_unit:this.appSpaceData.s_price_unit,
		  s_price_txt: this.appSpaceData.s_price_txt || "",
        s_fields: this.fields,
        s_closed: this.weekdaySelected,
        s_images: [],
		s_release:'',
        updated_at: ts
      };

      // カテゴリを動的追加
      this.categories.forEach(cat => {
        saveData[cat.field] = this.selectedCategories[cat.field] || [];
      });

      db.collection("spaceData").doc(sid).set(saveData)
        .then(() => {
          location.href = "space_index.html";
        })
        .catch(error => {
          console.error("保存エラー:", error);
        });
    },

    // ==========================
    // 更新
    // ==========================
    space_update(id) {

      if (!this.validateForm()) return;

      const db = firebase.firestore();
      const ts = firebase.firestore.FieldValue.serverTimestamp();

      let updateData = {
        s_name: this.appSpaceData.s_name,
        s_introduction: this.appSpaceData.s_introduction,
        s_time: this.appSpaceData.s_time,
        s_price: Number(this.appSpaceData.s_price),
		  s_price_unit:this.appSpaceData.s_price_unit,
		  s_price_txt: this.appSpaceData.s_price_txt || "",
		  s_fields: this.fields,
        s_closed: this.weekdaySelected,
        updated_at: ts
      };

      this.categories.forEach(cat => {
        updateData[cat.field] = this.selectedCategories[cat.field] || [];
      });

      db.collection("spaceData").doc(id).set(updateData, { merge: true })
        .then(() => {
          location.href = "space_index.html";
        })
        .catch(error => {
          console.error("更新エラー:", error);
        });
    },
	  
	  
	  releaseCNG(state,sid){
		   const db = firebase.firestore();
		  const release = state === "on" ? "" : "on";
		    db.collection("spaceData")
			.doc(sid)
			.set(
			  {
				s_release: release
			  },
			  { merge: true }
			)
			.then(() => {
			  console.log("更新成功");
			  this.appSpaceData.s_release = release; // 画面も即反映
			})
			.catch((error) => {
			  console.error("更新エラー:", error);
			});
	  }

  },

  mounted() {

    // ① カテゴリ読込
    this.loadCategories();

    // ② 施設情報
    this.facilityId = sessionStorage.getItem("toyosu_manage_facility_id");
    this.facilityName = sessionStorage.getItem("toyosu_manage_facility_name");
    this.facilityAdd = sessionStorage.getItem("toyosu_manage_facility_address");
	  
    const sid = sessionStorage.getItem("toyosu_manage_space_id");
    if (!sid) return;

    this.spaceId = sid;

    ensureAuth()
      .then(() => {
        const db = firebase.firestore();
        return db.collection("spaceData").doc(sid).get();
      })
      .then(doc => {

        if (!doc.exists) {
          location.href = "login.html";
          return;
        }

        const data = doc.data();
        this.appSpaceData = { ...data };
        this.weekdaySelected = data.s_closed || [];
        this.fields = data.s_fields || [];

        // JSON読込後にカテゴリ値セット
        this.categories.forEach(cat => {
          this.selectedCategories[cat.field] = data[cat.field] || [];
        });

      })
      .catch(error => {
        console.error("読み込みエラー:", error);
      });
  }

}).mount('#app_manage_space_post');