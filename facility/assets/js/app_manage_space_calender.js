Vue.createApp({
	template: `
<div id="app_manage_space_calender">
  <div class="h-bg">
    <h2 class="h-ttl">カレンダー登録　<span class="closed_txt">定休日：[{{ closedDayText }}]</span></h2>
  </div>

  <div class="manage-bg-g">
    <div class="calendar">

      <!-- 月ヘッダー -->
      <div class="calendar-header">
		<div class="move_month">
				<button 
				  @click="prevMonth"
				  :disabled="isCurrentMonth"
				  :class="{ disabledArrow: isCurrentMonth }"
				>◀</button>

				<span>{{ displayYear }}年 {{ displayMonth }}月</span>

				<button 
				  @click="nextMonth"
				  :disabled="isOverOneYear"
				  :class="{ disabledArrow: isOverOneYear }"
				>▶</button>
		</div>
		<div class="move_current">
				<button 
				  @click="goToday" 
				  class="today-btn"
				  :disabled="isCurrentMonth"
				  :class="{ disabledBtn: isCurrentMonth }"
				>
			   今月に戻る
				</button>
		</div>
      </div>


      <!-- 曜日 -->
      <div class="calendar-week">
        <div v-for="day in weekDays" :key="day" class="week-day">
          {{ day }}
        </div>
      </div>

      <!-- 日付グリッド -->
      <div class="calendar-grid">
		<div
			v-for="(date, index) in calendarDays"
			:key="date.dateString || 'empty-' + index"
			class="calendar-cell"
			  :class="[
				date.date ? getStatus(date.date) : '',
				{
				  todayCell: date.date && isToday(date.date),
				  pastCell: date.date && isPast(date.date),
				  sundayCell: date.date && date.date.getDay() === 0,
				  holidayCell: date.date && isHoliday(date.dateString),
				  otherMonth: date.isOtherMonth
				}
			  ]"
			  @click="date.date && !date.isOtherMonth && !isPast(date.date) && selectDate(date.date)"
			>
			  <div class="date-number">{{ date.day }}</div>
			  <div class="status">
				{{ date.date ? statusSymbol(date.date) : '' }}
			  </div>
		</div>
      </div>

      <div class="calendar-save">
<div class="reset_month">
        <button 
          :disabled="!isDirty" 
          @click="resetMonth"
          :class="{ disabledBtn: !isDirty }"
        >元に戻す</button>
</div>
<div class="save_month">
        <button
          :disabled="!isDirty" 
          @click="saveMonth"
class="button-save"
          :class="{ disabledBtn: !isDirty }"
        >この月を保存</button>
</div>

      </div>

    </div>
  </div>
</div>
`,
data() {
    return {
      currentDate: new Date(),
      weekDays: ["月","火","水","木","金","土","日"],
      calendarDays: [],
      statusMap: {},          // 現在月のステータス
      originalStatusMap: {},  // ロード時の状態を保持
      monthCache: {},         // 月単位キャッシュ
      isDirty: false,         // 未保存フラグ
      sid: '',
      s_closed: [],          // 定休日（Firestore から取得）
		holidays: {} 
    }
  },
  methods: {
generateCalendar() {
  const year = this.currentDate.getFullYear()
  const month = this.currentDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const prevLastDay = new Date(year, month, 0)

  const days = []

  let startWeekday = firstDay.getDay()
  startWeekday = (startWeekday + 6) % 7

  for (let i = startWeekday; i > 0; i--) {
    const date = new Date(year, month - 1, prevLastDay.getDate() - i + 1)
    days.push({
      date,
      day: date.getDate(),
      dateString: this.formatDate(date),
      isOtherMonth: true
    })
  }

  for (let i = 1; i <= lastDay.getDate(); i++) {
    const date = new Date(year, month, i)
    days.push({
      date,
      day: i,
      dateString: this.formatDate(date),
      isOtherMonth: false
    })
  }

  const totalCells = 42
  const remaining = totalCells - days.length

  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i)
    days.push({
      date,
      day: i,
      dateString: this.formatDate(date),
      isOtherMonth: true
    })
  }

  this.calendarDays = days
},
	  async fetchCalendarData(year, month) {
      const db = firebase.firestore()
      const docId = `${this.sid}_${year}_${month}`

      try {
        const doc = await db.collection("calendarData").doc(docId).get()
        if (doc.exists) {
          return doc.data().statusMap || {}
        } else {
          return null
        }
      } catch(err) {
        console.error("calendarData 読み込みエラー", err)
        return null
      }
    },
	  
	 async fetchHolidays(year) {
		try {
		  const res = await fetch(`https://holidays-jp.github.io/api/v1/${year}/date.json`)
		  const data = await res.json()
		  this.holidays = data
			console.log("holidays:", this.holidays)
		} catch (err) {
		  console.error("祝日取得エラー", err)
		}
	  },
	  
    async loadMonth(year, month) {
		await this.fetchHolidays(year)
      const key = `${year}-${String(month + 1).padStart(2,'0')}`

      if (this.monthCache[key]) {
        this.statusMap = {...this.monthCache[key]}
        this.originalStatusMap = {...this.monthCache[key]}
        this.isDirty = false
      } else {
        // 保存済みがあれば読み込む
        const savedMap = await this.fetchCalendarData(year, month + 1)

        const map = {}
        const lastDay = new Date(year, month + 1, 0).getDate()
        for (let i = 1; i <= lastDay; i++) {
          const date = new Date(year, month, i)
          const dateStr = this.formatDate(date)

          if (savedMap && savedMap[dateStr]) {
            map[dateStr] = savedMap[dateStr] // 保存済みを優先
          } else if (this.s_closed.includes(date.getDay())) {
            map[dateStr] = "status-closed"  // 定休日
          } else {
            map[dateStr] = "status-available"
          }
        }

        this.statusMap = {...map}
        this.originalStatusMap = {...map}
        this.monthCache[key] = {...map}
        this.isDirty = false
      }

      this.generateCalendar()
    },

    prevMonth() {
      if (this.isDirty && !confirm("未保存の変更は破棄されます。移動しますか？")) return
      const today = new Date()
      const year = this.currentDate.getFullYear()
      const month = this.currentDate.getMonth()
      if (year === today.getFullYear() && month === today.getMonth()) return
      this.currentDate = new Date(year, month - 1, 1)
      this.loadMonth(this.currentDate.getFullYear(), this.currentDate.getMonth())
    },

    nextMonth() {
      if (this.isDirty && !confirm("未保存の変更は破棄されます。移動しますか？")) return
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1)
      this.loadMonth(this.currentDate.getFullYear(), this.currentDate.getMonth())
    },

    goToday() {
      if (this.isDirty && !confirm("未保存の変更は破棄されます。移動しますか？")) return
      const today = new Date()
      this.currentDate = new Date(today.getFullYear(), today.getMonth(), 1)
      this.loadMonth(this.currentDate.getFullYear(), this.currentDate.getMonth())
    },

    formatDate(date) {
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2,'0')
      const d = String(date.getDate()).padStart(2,'0')
      return `${y}-${m}-${d}`
    },

    selectDate(date) {
      const key = this.formatDate(date)
      const current = this.statusMap[key] || "status-available"
      let next = "status-available"
      if (current === "status-available") next = "status-limited"
      else if (current === "status-limited") next = "status-closed"
      else if (current === "status-closed") next = "status-available"
      this.statusMap[key] = next
      this.isDirty = true
    },

    getStatus(date) {
      const key = this.formatDate(date)
      return this.statusMap[key] || "status-available"
    },
	  
	isHoliday(dateString) {
	  return !!this.holidays[dateString]
	},

    statusSymbol(date) {
      const status = this.getStatus(date)
      if (status === "status-available") return "◯"
      if (status === "status-limited") return "△"
      if (status === "status-closed") return "×"
      return ""
    },

    isToday(day) {
      const today = new Date()
      return day.getFullYear() === today.getFullYear() &&
             day.getMonth() === today.getMonth() &&
             day.getDate() === today.getDate()
    },

    isPast(date) {
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      return date < todayStart
    },

    async saveMonth() {
      const key = `${this.displayYear}-${String(this.displayMonth).padStart(2,'0')}`
      const db = firebase.firestore()
      const docId = `${this.sid}_${this.displayYear}_${this.displayMonth}`

      try {
        await db.collection("calendarData").doc(docId).set({
          statusMap: this.statusMap,
          s_id: this.sid,
          // uid は所有者判定に必須。これが無いとルールに拒否され保存できない。
          uid: firebase.auth().currentUser.uid
        })
        this.monthCache[key] = {...this.statusMap}
        this.originalStatusMap = {...this.statusMap}
        this.isDirty = false
        alert("保存しました")
      } catch(err) {
        console.error("calendarData 保存エラー", err)
        alert("保存に失敗しました")
      }
    },

    resetMonth() {
      this.statusMap = {...this.originalStatusMap}
      this.isDirty = false
    },

    fetchSpaceData() {
      const sid = this.sid
      const db = firebase.firestore()
      ensureAuth()
        .then((user) => {
          // uid でも絞る（ルールが所有者限定のため、s_id だけでは拒否される）
          db.collection("spaceData").where("s_id", "==", sid).where("uid", "==", user.uid).get()
            .then(querySnapshot => {
              querySnapshot.forEach(doc => {
                const data = doc.data()
                this.s_closed = data.s_closed || []
              })
              // 定休日取得後に今月ロード
              this.loadMonth(this.currentDate.getFullYear(), this.currentDate.getMonth())
            })
            .catch(err => console.log("spaceData ERROR", err))
        })
        .catch(err => console.log("Auth ERROR", err))
    }
  },

  computed: {
    displayYear() { return this.currentDate.getFullYear() },
    displayMonth() { return this.currentDate.getMonth() + 1 },
    isCurrentMonth() {
      const today = new Date()
      return this.currentDate.getFullYear() === today.getFullYear() &&
             this.currentDate.getMonth() === today.getMonth()
    },
    isOverOneYear() {
      const today = new Date()
      const limit = new Date(today.getFullYear() + 1, today.getMonth(), 1)
      return this.currentDate.getFullYear() === limit.getFullYear() &&
             this.currentDate.getMonth() === limit.getMonth()
    },
closedDayText() {
    return this.s_closed
      .map(i => this.weekDays[i-1])
      .join("・");
  }
  },

mounted() {
   this.sid = sessionStorage.toyosu_manage_space_id;
  this.fetchSpaceData();
}

}).mount('#app_manage_space_calender')