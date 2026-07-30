Vue.createApp({
	template: `
<!-- ==================== パンくず ==================== -->
<div class="breadcrumb-wrap">
  <div class="breadcrumb-in">
    <nav class="breadcrumbs">
      <ol itemscope itemtype="https://schema.org/BreadcrumbList">
        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a itemprop="item" href="index.html">
            <span itemprop="name">トップ</span>
          </a>
          <meta itemprop="position" content="1" />
        </li>

        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a itemprop="item" href="search.html">
            <span itemprop="name">スペースを探す</span>
          </a>
          <meta itemprop="position" content="2" />
        </li>

        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
          <a itemprop="item" href="facility.html">
            <span itemprop="name">{{ facilityArray.f_name }}</span>
          </a>
          <meta itemprop="position" content="3" />
        </li>
      </ol>
    </nav>
  </div>
</div>
<!-- ==================== パンくずここまで ==================== -->


<div class="container cont-inn">
 <div class="main_img">
<img
    v-if="facilityArray.f_image"
    :src="'assets/upload_img/facility/main/' + facilityArray.f_image"
    :alt="facilityArray.f_name"
  >
</div>

  <!-- ==================== カテゴリ表示 ==================== -->
  <div class="cat_wrap">
    <template v-for="group in facilityCategories" :key="group.field">
      <p
        v-for="item in (facilityArray[group.field] || [])"
        :key="item"
      >
        {{ item }}
      </p>
    </template>
  </div>
  <!-- ==================== カテゴリここまで ==================== -->


  <!-- 施設名 -->
  <h1 class="f_name_txt">
    {{ facilityArray.f_name }}
  </h1>

<p class="f_intro_txt"> {{ facilityArray.f_introduction }}</p>

<table class="f_add_tbl">
<tr><th>住所</th><td>{{ facilityArray.address }}</td></tr>
<tr><th>アクセス</th><td>{{ facilityArray.access }}</td></tr>
</table>

</div>


<div class="space_area bg-blue">

	<div class="space_wrap cont-inn">
	  <!-- ==================== スペース一覧 ==================== -->


	  <div class="space-list" v-if="spaces.length">

		<h2 class="space-list-ttl">施設内の利用可能スペース</h2>

<div
  class="space-item"
  v-for="(space, index) in spaces"
  :key="space.s_id"
  @click="moveRequest(space.s_id, space.s_name, facilityArray.f_name)"
>
  <div class="img">
    <img
      :src="space.s_images && space.s_images.length
             ? 'assets/upload_img/facility/space/' + space.s_images[0].name
             : 'assets/upload_img/facility/no-image.svg'"
      :alt="space.s_name"
      class="space-img"
    >
  </div>
  <div class="txt">
    <h3 class="s_name">{{ space.s_name }}</h3>
	<p class="s_price" v-else>
		  {{ Number(space.s_price).toLocaleString() }}
		  <span>{{ space.s_price_unit }}</span>
	</p>

    <p class="s_txt">{{ formattedSpaces[index] }}</p>
  </div>
</div>

		</div>

	  </div>
	  <!-- ==================== スペース一覧ここまで ==================== -->

		<div class="space-map">
		</div>
	</div>
</div>

`,
data() {
  return {
	  //fid:'1770784178924',//テスト用固定
	  fid:'',
	  facilityArray:'',
	  facilityCategories: [],
	  spaces: [],
  }
},
mounted() {
   this.fid = sessionStorage.getItem("toyosu_manage_facility_id");
	  if (!this.fid) {
		location.replace("index.html");
		return;
	  }
	
	axios.get('assets/json/categories.json')
    .then(res => {
      this.facilityCategories = res.data.facility;

      // そのあと Firestore
      this.facilityData();
		this.spaceData();
    })
    .catch(err => console.error("カテゴリJSON読み込み失敗", err));
},
methods: {

  moveRequest(id,sname,fname){
    sessionStorage.setItem('toyosu_manage_facility_name', fname);
    sessionStorage.setItem('toyosu_manage_space_name', sname);
    sessionStorage.setItem('toyosu_manage_space_id', id);
    location.href = "space.html";
  },

  async facilityData() {
    const db = firebase.firestore();
    try {
      const doc = await db.collection("facilityData").doc(this.fid).get();
      if (doc.exists) {
        this.facilityArray = doc.data();
      }
    } catch(err) {
      console.error("施設データ取得エラー", err);
    }
  },

  async spaceData() {
  const db = firebase.firestore();
  try {
    const snapshot = await db.collection("spaceData")
      .where("f_id", "==", this.fid)   // ← ここ修正
      .get();

    this.spaces = snapshot.docs.map(doc => ({
      s_id: doc.id,
      ...doc.data()
    }));

  } catch(err) {
    console.error("spaceData取得エラー", err);
  }
}

},
computed: {
	// 例：全スペースを整形して表示用テキストにする
	  formattedSpaces() {
		return this.spaces.map(space => {
		  if (!space.s_fields) return '';

		  // value が空でないものだけ抽出
		  const nonEmpty = space.s_fields.filter(f => f.value && f.value.trim() !== '');

		  // key:value の形で結合
		  return nonEmpty.map(f => `${f.key}:${f.value}`).join('、 ');
		});
	  }
}
}).mount('#app_facility')
