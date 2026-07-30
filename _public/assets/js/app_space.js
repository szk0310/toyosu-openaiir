Vue.createApp({
	template: `
	<!-- ==================== パンくず ここから ==================== -->
     <div class="breadcrumb-wrap">
		<div class="breadcrumb-in">
                <nav class="breadcrumbs">
                    <ol itemscope itemtype="https://schema.org/BreadcrumbList">
                        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
                            <a itemprop="item" href="index.html"><span itemprop="name">トップ</span></a>
                            <meta itemprop="position" content="1" />
                        </li>
                        <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
							<a itemprop="item" href="search.html"><span itemprop="name">スペースを探す</span></a>
                            <meta itemprop="position" content="2" />
                        </li>
                         <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
							<a itemprop="item" href="facility.html"><span itemprop="name">{{spaceArray.f_name}}</span></a>
                            <meta itemprop="position" content="3" />
                        </li>
                         <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
							<span itemprop="name">{{spaceArray.s_name}}</span>
                            <meta itemprop="position" content="4" />
                        </li>
                  </ol>
                </nav>
		 </div>
     </div>
    <!-- ==================== パンくず ここまで ==================== -->

<div class="container cont-inn">

<div class="left-Column">
	<h1 class="s_name_txt"><span>{{spaceArray.f_name}}</span><br>{{spaceArray.s_name}}</h1>


	<div class="img-wrap" v-if="images && images.length > 0">
	  <img :src="mainImageUrl" alt="メイン画像">

	  <div class="thumbnail-container" v-if="images && images.length > 1">
		<button 
		  v-if="images.length > visibleCount" 
		  class="prev-btn" 
		  @click="scrollPrev"
		  :disabled="!canScrollPrev"
		>◀</button>

		<div class="thumbnails" :style="{ transform: 'translateX(' + scrollX + ')' }">
		  <p v-for="(img, index) in images" :key="index">
			<img 
			  :src="thumbnailUrl(img.name)"
			  :class="{ active: img === mainImage }"
			  @click="setMainImage(index)">
		  </p>
		</div>

		<button 
		  v-if="images.length > visibleCount" 
		  class="next-btn" 
		  @click="scrollNext"
		  :disabled="!canScrollNext"
		>▶</button>
	  </div>
	</div>

	<div class="space-info">
			<h2 class="info_ttl_txt">このスペースについて</h2>
	<p>{{spaceArray.s_introduction}}</p>
	  </div>


	<div class="space-info" v-if="hasFieldValues">
	  <h2 class="info_ttl_txt">詳細情報</h2>

	  <div class="field-list">
		<p v-for="(item, index) in validFields" :key="index">
		 <span class="field-ttl"> {{ item.key }}：</span><span class="field-txt">{{ item.value }}</span>
		</p>
	  </div>
	</div>

</div>

<div class="right-Column">
	<div class="request_wrap">
		<p class="request_ttl"><span>予約・</span><span>お問い合わせ</span></p>
		<p class="price_txt" v-if="spaceArray.s_price_txt">
		  {{ spaceArray.s_price_txt }}
		</p>

		<p class="price_txt" v-else>
		  {{ Number(spaceArray.s_price).toLocaleString() }}
		  <span>{{ spaceArray.s_price_unit }}</span>
		</p>
		<button class="space_request btn green round" @click="moveRequest(spaceArray.s_id,spaceArray.s_name,spaceArray.f_name)"><span>このスペースを</span><span>予約する</span></button>
	</div>
</div>

</div>


<div class="case_idea_area cont-inn" v-if="caseArray.length || ideaArray.length">

  <!-- 活用事例 -->
  <div class="item-wrap case" v-if="caseArray.length">
    <h3 class="area_ttl">活用事例</h3>

    <div
      class="item"
      v-for="caseItem in caseArray"
      :key="caseItem.id"
    >
      <div class="img-wrap">
        <img :src="caseItem.image 
          ? 'assets/upload_img/case/' + caseItem.image 
          : 'assets/upload_img/case/no-image.svg'" alt="">
      </div>
      <div class="txt-wrap">
        <h4 class="name">{{ caseItem.name }}</h4>
        <p class="introduction">{{ caseItem.introduction }}</p>
      </div>
    </div>
  </div>

  <!-- 活用アイディア -->
  <div class="item-wrap idea" v-if="ideaArray.length">
    <h3 class="area_ttl">活用アイディア</h3>

    <div
      class="item"
      v-for="ideaItem in ideaArray"
      :key="ideaItem.id"
    >
      <div class="img-wrap">
        <img :src="ideaItem.image 
          ? 'assets/upload_img/idea/' + ideaItem.image 
          : 'assets/upload_img/idea/no-image.svg'" alt="">
      </div>
      <div class="txt-wrap">
        <h4 class="name">{{ ideaItem.name }}</h4>
        <p class="introduction">{{ ideaItem.introduction }}</p>
      </div>
    </div>
  </div>

</div>
`,
data() {
  return {
	  sid:'',
    images: [],           // s_images 配列
    mainImage: null,      // メイン表示画像
    scrollIndex: 0,       // 左端サムネイルインデックス
    visibleCount: 3,      // 表示サムネイル枚数
	  spaceArray:'',
	  caseArray: [],
	  ideaArray: [],
  }
},
mounted() {
   this.sid = sessionStorage.getItem("toyosu_manage_space_id");
  if (!this.sid) {
    location.replace("index.html");
    return;
  }
	
	this.fetchSpaceData();
},
methods: {
	moveRequest(id,sname,fname){
		 sessionStorage.setItem('toyosu_manage_facility_name', fname);
 		 sessionStorage.setItem('toyosu_manage_space_name', sname);
		 sessionStorage.setItem('toyosu_manage_space_id', id);
	location.href = "request.html";
},
async fetchSpaceData() {
  const db = firebase.firestore();

  try {

    // ------------------------
    // spaceData（既存）
    // ------------------------
    const doc = await db.collection("spaceData").doc(this.sid).get();

    if (doc.exists) {
      const data = doc.data();
      this.images = data.s_images || [];
      if (this.images.length) this.mainImage = this.images[0];
      this.spaceArray = doc.data();
    }

    // ------------------------
    // caseData 取得
    // ------------------------
    const caseSnap = await db.collection("caseData")
      .where("s_id", "==", this.sid)
      .get();

    this.caseArray = [];

    caseSnap.forEach(doc => {
      this.caseArray.push({
        id: doc.id,
        ...doc.data()
      });
    });


    // ------------------------
    // ideaData 取得
    // ------------------------
    const ideaSnap = await db.collection("ideaData")
      .where("s_id", "==", this.sid)
      .get();

    this.ideaArray = [];

    ideaSnap.forEach(doc => {
      this.ideaArray.push({
        id: doc.id,
        ...doc.data()
      });
    });

  } catch(err) {
    console.error("スペースデータ取得エラー", err);
  }
},
  thumbnailUrl(name) {
    return `assets/upload_img/facility/space/${name}`;
  },
  setMainImage(index) {
    this.mainImage = this.images[index];
  },
  scrollPrev() {
    if (this.scrollIndex > 0) this.scrollIndex--;
  },
  scrollNext() {
    if (this.scrollIndex < this.images.length - this.visibleCount) this.scrollIndex++;
  }
},
computed: {
	// 空でない項目だけ返す
  validFields() {
    if (!this.spaceArray || !Array.isArray(this.spaceArray.s_fields)) {
      return [];
    }
    return this.spaceArray.s_fields.filter(item =>
      item &&
      typeof item.value === "string" &&
      item.value.trim() !== ''
    );
  },
  // 詳細情報を表示するかどうか
  hasFieldValues() {
    return this.validFields.length > 0;
  },
	
  mainImageUrl() {
    return this.mainImage ? this.thumbnailUrl(this.mainImage.name) : '';
  },
  scrollX() {
    if (!this.images.length) return '0%';
    const movePercent = 100 / this.visibleCount; // 1枚分の横幅
    return -(movePercent * this.scrollIndex) + '%';
  },
  canScrollPrev() {
    return this.scrollIndex > 0;
  },
  canScrollNext() {
    return this.scrollIndex < this.images.length - this.visibleCount;
  }
}
}).mount('#app_space')
