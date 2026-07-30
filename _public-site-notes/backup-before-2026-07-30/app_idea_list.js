Vue.createApp({

template: `
<div class="category-wrap">
<p class="category-btn" :class="{ active: activeCategory === '' }" @click="activeCategory = ''">すべて</p>
<p class="category-btn" :class="{ active: activeCategory === 'マルシェ' }" @click="activeCategory = 'マルシェ'">マルシェ</p>
<p class="category-btn" :class="{ active: activeCategory === 'フード' }" @click="activeCategory = 'フード'">フード</p>
<p class="category-btn" :class="{ active: activeCategory === 'ファミリー' }" @click="activeCategory = 'ファミリー'">ファミリー</p>
<p class="category-btn" :class="{ active: activeCategory === 'フィットネス' }" @click="activeCategory = 'フィットネス'">フィットネス</p>
</div>

<div class="cont-wrap shadow round col3">

<div
v-for="(item,index) in appIdeaArray"
:key="index"
class="cont-item"
v-show="!activeCategory || item.category === activeCategory"
>

<p class="item-img">
<img v-if="item.image !== ''"
:src="'assets/upload_img/idea/'+ item.image"
:alt="item.name">

<img v-else
src="assets/upload_img/idea/no-image.svg"
alt="no-image">
</p>

<div class="cont-item-inn">

<div class="item-cat">
<span>{{item.category}}</span>
</div>

<h3 class="item-ttl">{{item.name}}</h3>

<p class="item-txt">
{{item.introduction}}
</p>

<div class="item-space" v-if="getSpace(item.s_id)">
<p class="item-space-ttl">開催場所：</p>
<p class="item-space-name">
<template v-if="getSpace(item.s_id).s_release === 'on'">
<a href="#"
@click.prevent="goSpace(getSpace(item.s_id))">
<span>{{ getSpace(item.s_id).f_name }}　</span><span>{{ getSpace(item.s_id).s_name }}</span>
</a>
</template>
<template v-else>
<span>{{ getSpace(item.s_id).f_name }}　</span><span>{{ getSpace(item.s_id).s_name }}</span>
</template>
</p>
</div>


</div>
</div>

</div>
`,

data(){
return{
appIdeaArray:[],
appSpaceArray:[],
activeCategory:''
}
},

methods:{

getSpace(sid){
return this.appSpaceArray.find(s=>s.s_id===sid)
},

goSpace(space){

sessionStorage.setItem('toyosu_manage_facility_name', space.f_name)
sessionStorage.setItem('toyosu_manage_space_name', space.s_name)
sessionStorage.setItem('toyosu_manage_space_id', space.s_id)

location.href="space.html"

}

},

mounted(){

const saved=sessionStorage.getItem('toyosu_appIdeaArray')

if(!saved){
window.location.href='index.html'
return
}

this.appIdeaArray=JSON.parse(saved)

//spaceData get
firebase.auth().signInAnonymously()
.then(()=>{
const db=firebase.firestore()
db.collection("spaceData").get()
.then(snapshot=>{
let array=[]
snapshot.forEach(doc=>{
const data=doc.data()
data.s_id=doc.id
array.push(data)
})
this.appSpaceArray=array
})
})

}

}).mount('#app_idea_list')