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
							<span itemprop="name">{{spaceArray.s_name}}の予約</span>
                            <meta itemprop="position" content="4" />
                        </li>
                  </ol>
                </nav>
		 </div>
     </div>
    <!-- ==================== パンくず ここまで ==================== -->

<div  class="cont-inn">
<div id="app_user_calendar">
	<div class="container">

			<div class="left-calendar">
			  <div v-for="month in months" :key="month.key" class="month-block">
				<div class="month-header">{{ month.year }}年 {{ month.month }}月</div>
				<div class="weekdays">
				  <div v-for="day in weekDays" :key="day" class="weekday">{{ day }}</div>
				</div>
				<div class="days-grid">
				<div
				  v-for="date in month.days"
				  :key="date.dateString || 'empty-' + $index"
				  class="day-cell"
				  :class="[
					date.isOtherMonth ? 'otherMonth' : '',
					!date.date ? 'empty-cell' : '',
					date.date ? getStatus(date.date) : '',
					{
					  todayCell: date.date && isToday(date.date),
					  pastCell: date.date && isPast(date.date),
					  sundayCell: date.date && date.date.getDay() === 0,
					  holidayCell: date.date && isHoliday(date.dateString),
					  selectedCell: date.date && selectedDates.includes(date.dateString)  // ←追加
					}
				  ]"
				  @click="date.date && canSelect(date.date) && toggleSelectDate(date.date)"
				>
				  <div class="date-number">{{ date.day }}</div>
				  <div class="status">
					{{ date.date ? statusSymbol(date.date) : '' }}
				  </div>
				</div>
				</div>
			  </div>
			</div>

		<div class="right-panel">
			<div class="top_wrap">
			  <p class="ttl_txt">
				選択日
			  </p>
				<button class="btn_clear btn gray square" @click="clearAllDates" :disabled="selectedDates.length === 0">全てクリア</button>
			</div>

		  <ul class="select_date">
			<li v-for="(range, index) in selectedRanges" :key="index">
			  <span v-html="range.text"></span>
			  <button @click="removeRange(index)">✕</button>
			</li>
		  </ul>
		  <button @click="showModal = true" :disabled="selectedRanges.length === 0" class="send_btn btn green">この日程で次へ</button>
		</div>

<div v-if="showModal" class="modal-overlay">
  <div class="modal">

    <p class="modal_ttl">予約情報入力</p>

    <div class="modal_inner">

      <div class="date">
        <p class="ttl">選択日:</p>
        <p class="data">
          <!-- 画面表示用（HTML保持） -->
          <span v-html="selectedRangesHtml"></span>
        </p>
      </div>

      <div class="input">
<p class="req_wrap"><span class="post-req">*</span> 必須</p>

<p class="data customer-type-wrap">
	<select v-model="reservation.customerType">
		<option value="individual">個人</option>
		<option value="corporation">法人</option>
	</select>

	<input
		v-if="reservation.customerType === 'corporation'"
		type="text"
		class="company-name"
		v-model="reservation.companyName"
		placeholder="法人名"
	>
</p>
        <p class="ttl">名前<span class="post-req">*</span>:</p>
        <p class="data">
          <input type="text" v-model="reservation.name">
        </p>

        <p class="ttl">メールアドレス<span class="post-req">*</span>:</p>
        <p class="data">
          <input type="email" v-model="reservation.email">
        </p>

        <p class="ttl">利用目的:</p>
        <p class="data">
          <input type="text" v-model="reservation.purpose">
        </p>

        <p class="ttl">ご質問・ご要望など:</p>
        <p class="data">
          <textarea rows="3" v-model="reservation.notes"></textarea>
        </p>
      </div>

    </div>
<div class="accept">
  <p>
    <label class="check-btn">
      <input type="checkbox" v-model="reservation.agreeTerms">
<span class="checkmark"></span>
      <a href="terms.html" target="_blank">利用規約</a>に同意する
    </label>
  </p>
  <p>
    <label class="check-btn">
      <input type="checkbox" v-model="reservation.agreePrivacy">
<span class="checkmark"></span>
      <a href="privacy.html" target="_blank">プライバシーポリシー</a>に同意する
    </label>
  </p>
</div>

    <div class="modal-buttons">
      <button
  @click="sendReservation"
  :disabled="isSending || !isFormValid"
  class="send_btn btn green"
>
  {{ isSending ? '送信中...' : '送信' }}
</button>
      <button
  @click="closeModal"
  class="btn_clear btn gray square"
>
  閉じる
</button>

    </div>

  </div>
</div>


	</div>
</div>
</div>
`,
data() {
    return {
      //sid: '1770822764174',  // テスト用固定ID
		sid:'',
      weekDays: ["月","火","水","木","金","土","日"],
      months: [],
      statusMap: {},       // Firestore calendarData
      holidays: {},        // 祝日
      s_closed: [],        // 定休日 [0=日,1=月,...]
      selectedDates: [],
      selectedRanges: [],
      showModal: false,
      reservation: {
		  customerType: 'individual',
		  companyName: '',
      name: '',
      email: '',
      purpose: '',
      notes: '',
      agreeTerms: false,   // 利用規約に同意
      agreePrivacy: false  // プライバシーポリシーに同意
    },
    isSending: false,
    spaceArray: ''
    }
  },

  mounted() {
	this.sid = sessionStorage.getItem("toyosu_manage_space_id");
  if (!this.sid) {
    location.replace("index.html");
    return;
  }

    this.initCalendar()
  },

  methods: {

    // 初期化: 祝日 → 定休日取得 → Firestore取得 → カレンダー生成
    async initCalendar() {
      const year = new Date().getFullYear()
      await this.fetchHolidays(year)
      await this.fetchSpaceData()
      await this.fetchCalendarFromFirestore(year)
    },

    // 祝日取得
    async fetchHolidays(year) {
      try {
        const res = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`)
        const data = await res.json()
        this.holidays = data
      } catch(err) {
        console.error("祝日取得エラー", err)
      }
    },

    // 定休日取得
    async fetchSpaceData() {
      const db = firebase.firestore()
      try {
        const doc = await db.collection("spaceData").doc(this.sid).get()
        if (doc.exists) {
          const data = doc.data()
          this.s_closed = data.s_closed || []
			this.spaceArray = data
        }
      } catch(err) {
        console.error("spaceData取得エラー", err)
      }
    },

    // Firestore calendarData取得
    async fetchCalendarFromFirestore(year) {
      const db = firebase.firestore()
      try {
        // 今月単位で取得
        for (let m = 0; m < 12; m++) {
          const docId = `${this.sid}_${year}_${m+1}`
          const doc = await db.collection("calendarData").doc(docId).get()
          if (doc.exists) {
            Object.assign(this.statusMap, doc.data().statusMap || {})
          }
        }
      } catch(err) {
        console.error("calendarData取得エラー", err)
      }
      this.generateYearCalendar()
    },

    // カレンダー生成
    generateYearCalendar() {
      const today = new Date()
      const startMonth = today.getMonth()
      const startYear = today.getFullYear()

      this.months = []

      for (let i = 0; i < 12; i++) {
        const m = (startMonth + i) % 12
        const y = startYear + Math.floor((startMonth + i) / 12)

        const firstDay = new Date(y, m, 1)
        const lastDay = new Date(y, m + 1, 0)

        const days = []

        // 月曜始まりで1日の曜日位置に空セルを追加
        const startWeekday = (firstDay.getDay() + 6) % 7
        for (let s = 0; s < startWeekday; s++) {
          days.push({ date: null, day: "", dateString: "", isOtherMonth: true })
        }

        // 当月の日付
        for (let d = 1; d <= lastDay.getDate(); d++) {
          const date = new Date(y, m, d)
          const ds = this.formatDate(date)

          // Firestore statusMapがあれば優先
          let status = this.statusMap[ds]
          if (!status) {
            // 定休日判定
            if (this.s_closed.includes(date.getDay())) {
              status = "status-closed"
            } else {
              status = "status-available"
            }
            this.statusMap[ds] = status
          }

          days.push({
            date,
            day: d,
            dateString: ds,
            isOtherMonth: false
          })
        }

        this.months.push({
          year: y,
          month: m + 1,
          key: `${y}-${m+1}`,
          days
        })
      }
    },

    formatDate(date) {
      const y = date.getFullYear()
      const m = String(date.getMonth()+1).padStart(2,'0')
      const d = String(date.getDate()).padStart(2,'0')
      return `${y}-${m}-${d}`
    },

    getStatus(date) {
      const ds = this.formatDate(date)
      return this.statusMap[ds] || 'status-available'
    },

    statusSymbol(date) {
      const status = this.getStatus(date)
      if (status === "status-available") return "◯"
      if (status === "status-limited") return "△"
      if (status === "status-closed") return "×"
      return ""
    },

    isHoliday(dateString) {
      return !!this.holidays[dateString]
    },

    isToday(date) {
      const today = new Date()
      return date.getFullYear()===today.getFullYear() &&
             date.getMonth()===today.getMonth() &&
             date.getDate()===today.getDate()
    },

//    isPast(date) {
//      const today = new Date()
//      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
//      return date < start
//    },
	  isPast(date) {
  const today = new Date()

  // 今日を含めて7日後から予約可能
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 7
  )

  return date < start
},

    canSelect(date) {
      if (this.isPast(date)) return false
      const status = this.getStatus(date)
      return status === 'status-available' || status === 'status-limited'
    },

    toggleSelectDate(date) {
      const ds = this.formatDate(date)
      const idx = this.selectedDates.indexOf(ds)
      if (idx >= 0) this.selectedDates.splice(idx,1)
      else this.selectedDates.push(ds)
      this.selectedDates.sort()
      this.updateRanges()
    },

	updateRanges() {
  const sorted = this.selectedDates.slice().sort()
  const ranges = []
  let start = null
  let prev = null

  sorted.forEach(d => {
    if (!start) start = d
    if (prev) {
      const pd = new Date(prev)
      const cd = new Date(d)
      const diff = Math.round((cd - pd)/(1000*60*60*24))
      if (diff > 1) {
        const dayCount = Math.round((new Date(prev) - new Date(start))/(1000*60*60*24)) + 1
        const text = start === prev 
          ? `${start} <span class="day-count">[1日間]</span>` 
          : `${start}〜${prev} <span class="day-count">[${dayCount}日間]</span>`
        ranges.push({ text, start, end: prev })
        start = d
      }
    }
    prev = d
  })

  if (start) {
    const dayCount = Math.round((new Date(prev) - new Date(start))/(1000*60*60*24)) + 1
    const text = start === prev 
      ? `${start} <span class="day-count">[1日間]</span>` 
      : `${start}〜${prev} <span class="day-count">[${dayCount}日間]</span>`
    ranges.push({ text, start, end: prev })
  }

  this.selectedRanges = ranges
},

    removeRange(index) {
      const range = this.selectedRanges[index]
      this.selectedDates = this.selectedDates.filter(d => d < range.start || d > range.end)
      this.selectedDates.sort()
      this.updateRanges()
    },

async sendReservation() {

  // 送信確認
  const ok = window.confirm("送信してよろしいですか？\n記載メールアドレスに確認メールが送信されます。");
  if (!ok) return;  // キャンセルなら中断

  if (!this.reservation.name || !this.reservation.email) {
    alert("名前とメールアドレスは必須です");
    return;
  }

  // メール形式チェック追加
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.reservation.email)) {
    alert("正しいメールアドレスを入力してください");
    return;
  }

  if (this.selectedRanges.length === 0) {
    alert("日付を選択してください");
    return;
  }

  this.isSending = true;

  try {
    const response = await fetch("request_send.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sid: this.sid,
        space_name: this.spaceArray.s_name,
        facility_name: this.spaceArray.f_name,
        customerType: this.reservation.customerType,
        companyName: this.reservation.companyName,
        name: this.reservation.name,
        email: this.reservation.email,
        purpose: this.reservation.purpose,
        notes: this.reservation.notes,
        dates: this.selectedRangesText
      })
    });

    const result = await response.json();

    if (result.success) {
      alert("送信しました");
      window.location.href = "search.html";

      this.reservation = {
        customerType: '',
        companyName: '',
        name: '',
        email: '',
        purpose: '',
        notes: '',
        agreeTerms: false,
        agreePrivacy: false
      };

      this.selectedDates = [];
      this.selectedRanges = [];
      this.showModal = false;

    } else {
      alert("送信に失敗しました");
    }

  } catch (e) {
    alert("通信エラーが発生しました");
    console.error(e);
  }

  this.isSending = false;
},
	  
  	clearAllDates() {
    this.selectedDates = []
    this.selectedRanges = []
  },
	  
	closeModal() {
	  this.showModal = false;               // モーダルを閉じる
	  this.reservation.agreeTerms = false;  // 利用規約チェックリセット
	  this.reservation.agreePrivacy = false; // プライバシーポリシーチェックリセット
	}

	  
	  
  },

  computed: {
	// 画面表示用（HTML付き）
	  selectedRangesHtml() {
		return this.selectedRanges.map(r => r.text).join('<br>')
	  },

	  // メール送信用（タグなし改行）
	  selectedRangesText() {
		return this.selectedRanges.map(r => {
		  return r.text.replace(/<[^>]*>/g, '')
		}).join('\n')
	  },
	isFormValid() {
	  const name = this.reservation.name?.trim();
	  const email = this.reservation.email?.trim();
	  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	  // 利用規約・プライバシーポリシーも必須
	  const agreeTerms = this.reservation.agreeTerms;
	  const agreePrivacy = this.reservation.agreePrivacy;

	  return name && email && emailRegex.test(email) && agreeTerms && agreePrivacy;
	}
  }

}).mount('#app_request')
