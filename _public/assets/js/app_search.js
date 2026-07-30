Vue.createApp({
	template: `
<div class="filters">
	  <!-- 日付入力 -->
	<div class="date_wrap">
		<p class="filter-ttl">利用日</p>
		<label>
			開始：
		<input type="date"
       v-model="startDate"
       :min="today"
       :class="{ emptyDate: !startDate }">
		  </label>
		  <label>
			終了：
			<input type="date"
				   v-model="endDate"
				   :min="startDate || today"
       :class="{ emptyDate: !endDate }">
		  </label>

<button 
  type="button" 
  @click="clearDates" 
  class="btn_clear btn gray square"
  :disabled="!startDate && !endDate"
>
  クリア
</button>
	</div>


<!-- 価格入力 -->
<div class="price_wrap">
  <p class="filter-ttl">価格</p>
<label>
      <span>¥</span>
    <input
      type="text"
      inputmode="numeric"
      v-model="priceMin"
      @input="priceMin = priceMin.replace(/[^0-9]/g,'')"
      @change="onPriceChange"
      placeholder="下限"
class="price"
    >
  </label>
 <span>〜</span>
  <label>
    <span>¥</span>
    <input
      type="text"
      inputmode="numeric"
      v-model="priceMax"
      @input="priceMax = priceMax.replace(/[^0-9]/g,'')"
      @change="onPriceChange"
      placeholder="上限"
class="price"
    >
  </label>

  <!-- クリアボタン -->
  <button
    type="button"
    class="btn_clear btn gray square"
    @click="clearPrice"
    :disabled="!priceMin && !priceMax"
  >
    クリア
  </button>
</div>

	  <!-- カテゴリ（JSONから自動生成） -->
	  <div v-for="group in spaceCategories" :key="group.field">
		<div class="cat_wrap">
			<p class="filter-ttl">{{ group.name }}</p>
<div>
			<label v-for="item in group.items" :key="item" class="check-btn">
			  <input type="checkbox"
					 :value="item"
					 v-model="selectedCategories[group.field]">
	<span class="checkmark"></span>
			  {{ item }}
			</label>
</div>
		</div>
	  </div>

</div>


<div class="spaces">
		<div class="top_wrap">
		  <h1 class="search_ttl">豊洲エリアのスペース一覧</h1>
			<p class="search_num"> {{ filteredSpaces.length }}件のスペースが見つかりました</p>
		</div>

	<div v-for="space in filteredSpaces"
			   :key="space.s_id"
			   class="space_wrap">

			<div class="space_img">
			<img
			  :src="space.s_images?.[0]?.name
				? 'assets/upload_img/facility/space/' + space.s_images[0].name
				: 'assets/upload_img/facility/no-image.svg'"
			  :alt="space.s_images?.[0]?.name
				? space.s_name 
				: 'No image available'"
			>
			</div>
			<div class="space_txt">
				<h2 class="name_txt">{{ space.f_name }}<br class="sp">{{ space.s_name }}</h2>
				<p class="add_txt"> {{ space.f_address }}</p>

				<!--<p>定休日:
				{{
				  !space.s_closed || space.s_closed.length === 0
					? 'なし'
					: space.s_closed.map(d => ['日','月','火','水','木','金','土'][Number(d)]).join(', ')
				}}
				</p>-->

		<!--<div  class="cat_wrap">
				<template v-for="group in spaceCategories" :key="group.field">
				  <p
					v-for="item in (space[group.field] || [])"
					:key="item"
				  >
					{{ item }}
				  </p>
				</template>
		</div>-->
		<div class="cat_wrap">
		  <template v-for="group in spaceCategories" :key="group.field">
			<p
			  v-for="item in getValidCategories(space, group)"
			  :key="item"
			>
			  {{ item }}
			</p>
		  </template>
		</div>

		<div class="bottom_wrap">
					<!--<p class="price_txt">{{ space.s_price }}</p>-->

		<p class="price_txt" v-if="space.s_price_txt">
		  {{ space.s_price_txt }}
		</p>

		<p class="price_txt" v-else>
		  {{ Number(space.s_price).toLocaleString() }}
		  <span>{{ space.s_price_unit }}</span>
		</p>

		<button class="space_detail btn green round" @click="moveSpace(space.s_id,space.s_name,space.f_name,space.f_id)">詳細を見る</button>
		</div>
			</div>
	</div><!--space_wrap end-->

</div>
			`,
data() {
    return {
      today: new Date().toISOString().split('T')[0],

      spaces: [],
      calendarData: [],
      filteredSpaces: [],

      startDate: '',
      endDate: '',

    priceMin: '',
    priceMax: '',

      spaceCategories: [],
      selectedCategories: {}
    }
  },

  mounted() {

    // --- カテゴリJSON読み込み ---
    axios.get('assets/json/categories.json')
      .then(res => {

        this.spaceCategories = res.data.space;

        // 各カテゴリごとに空配列を用意
        this.spaceCategories.forEach(group => {
          this.selectedCategories[group.field] = [];
        });

      })
      .catch(err => console.error("カテゴリJSON読み込み失敗", err));


    Promise.resolve()/*匿名ログイン廃止(2026-07-30)*/
      .then(() => {

        const db = firebase.firestore();

        db.collection("spaceData").where("s_release", "==", "on").get().then(snapshot => {
          this.spaces = snapshot.docs.map(doc => ({
            s_id: doc.id,
            ...doc.data()
          }));
          this.filteredSpaces = this.spaces;
        });

        db.collection("calendarData").get().then(snapshot => {
          this.calendarData = snapshot.docs.map(doc => ({
            space_id: doc.id,
            ...doc.data()
          }));
        });

      });

  },

  watch: {

    startDate(newVal) {
      if (!newVal) return;
      if (!this.endDate) this.endDate = newVal;
      if (this.endDate < newVal) this.endDate = newVal;
      this.filterSpaces();
    },

    endDate(newVal) {
      if (!newVal) return;
      if (!this.startDate) this.startDate = newVal;
      if (newVal < this.startDate) this.startDate = newVal;
      this.filterSpaces();
    },

 // priceMin() {
//    this.filterSpaces();
//  },
//
//  priceMax() {
//    this.filterSpaces();
//  },

    selectedCategories: {
      handler() {
        this.filterSpaces();
      },
      deep: true
    }

  },

  methods: {
	  getValidCategories(space, group) {
  const rawValues = space[group.field];

  const spaceValues = Array.isArray(rawValues)
    ? rawValues
    : rawValues
      ? [rawValues]
      : [];

  // group.items に存在するものだけ返す
  return spaceValues.filter(val => group.items.includes(val));
},
moveSpace(id,sname,fname,fid){
		 sessionStorage.setItem('toyosu_manage_facility_name', fname);
	sessionStorage.setItem('toyosu_manage_facility_id', fid);
 		 sessionStorage.setItem('toyosu_manage_space_name', sname);
		 sessionStorage.setItem('toyosu_manage_space_id', id);
	location.href = "space.html";

},
    clearDates() {
      this.startDate = '';
      this.endDate = '';
      this.filterSpaces();
    },
	clearPrice() {
	  this.priceMin = '';
	  this.priceMax = '';
	  this.filterSpaces();
	},
	  
onPriceChange() {
    if (this.priceMin && this.priceMax && Number(this.priceMin) > Number(this.priceMax)) {
      [this.priceMin, this.priceMax] = [this.priceMax, this.priceMin];
    }
    this.filterSpaces();
  },
	  
    filterSpaces() {

      this.filteredSpaces = this.spaces.filter(space => {

        // --- カテゴリ判定 ---
const categoryMatch = this.spaceCategories.every(group => {

  const selected = this.selectedCategories[group.field];

  if (!selected || selected.length === 0) {
    return true;
  }

  const rawValues = space[group.field];

  const spaceValues = Array.isArray(rawValues)
    ? rawValues
    : rawValues
      ? [rawValues]
      : [];

  return selected.every(val => spaceValues.includes(val));

});
		  
   // --- 価格判定 ---
let priceMatch = true;

const price = Number(space.s_price);

if (this.priceMin !== '' && price < this.priceMin) {
  priceMatch = false;
}

if (this.priceMax !== '' && price > this.priceMax) {
  priceMatch = false;
}
		  
		  // --- 日付判定 ---
        let dateMatch = true;

        if (this.startDate && this.endDate) {

          const start = new Date(this.startDate + "T00:00:00");
          const end   = new Date(this.endDate + "T00:00:00");

          const days = [];
          let current = new Date(start);

          while (current <= end) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
          }

          const cal = this.calendarData.find(c => c.space_id === space.s_id);

          dateMatch = days.every(d => {

            const dateStr =
              d.getFullYear() + "-" +
              String(d.getMonth() + 1).padStart(2, '0') + "-" +
              String(d.getDate()).padStart(2, '0');

            if (cal && cal.available) {
              return cal.available.includes(dateStr);
            } else {
              return !space.s_closed.includes(d.getDay());
            }

          });
        }

        //return categoryMatch && dateMatch;
		  return categoryMatch && dateMatch && priceMatch;

      });

    }

  }

}).mount('#app_search');
