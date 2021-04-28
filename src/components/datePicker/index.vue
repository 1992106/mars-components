<template>
  <div class="date-picker">
    <div class="date-tab">
      <span v-for="item in dateTypeOptions" :key="item.value" :class="{ active: dateType === item.value }" @click="dateToggle(item.value)">
        {{ item.label }}
      </span>
    </div>
    <template v-if="dateType === 'year'">
      <el-date-picker key="year" v-model="year" type="year" :size="size" placeholder="选择年" @change="handChange($event)"></el-date-picker>
    </template>
    <template v-if="dateType === 'month'">
      <el-date-picker
        key="month"
        v-model="monthRange"
        type="monthrange"
        :size="size"
        range-separator="至"
        start-placeholder="开始月份"
        end-placeholder="结束月份"
        @change="handChange($event)"
      ></el-date-picker>
    </template>
    <template v-if="dateType === 'day'">
      <el-date-picker
        key="day"
        v-model="dayRange"
        type="daterange"
        :size="size"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        @change="handChange($event)"
      ></el-date-picker>
    </template>
  </div>
</template>
<script>
export default {
  name: 'DatePicker',
  model: {
    prop: 'value',
    event: 'change'
  },
  props: {
    type: {
      type: String,
      default: () => 'day'
    },
    value: {
      type: Array,
      default: function () {
        return []
      }
    },
    now: {
      type: Boolean,
      default: () => false
    },
    size: {
      type: String,
      default: () => 'small'
    }
  },
  data() {
    return {
      dateTypeOptions: [
        {
          value: 'year',
          label: '年'
        },
        {
          value: 'month',
          label: '月'
        },
        {
          value: 'day',
          label: '日'
        }
      ],
      dateType: 'day',
      year: '',
      yearRange: [],
      monthRange: [],
      dayRange: []
    }
  },
  watch: {
    type: {
      handler(val) {
        if (val) {
          this.dateType = val
        }
      },
      immediate: true
    },
    value: {
      handler(val) {
        this.year = ''
        this.yearRange = []
        this.monthRange = []
        this.dayRange = []
        if (!val) val = []
        switch (this.dateType) {
          case 'day':
            this.dayRange = val
            break
          case 'month':
            this.monthRange = val
            break
          case 'year':
            this.year = val[0]
            this.yearRange = val
            break
        }
      },
      immediate: true
    }
  },
  mounted() {
    this.initNow()
  },
  methods: {
    handChange(dateRange) {
      this.$emit('change', dateRange)
      this.emitDate(dateRange)
    },
    emitDate(dateRange) {
      switch (this.dateType) {
        case 'day':
          dateRange = dateRange ? this.formatDay(dateRange[1], dateRange[0]) : []
          break
        case 'month':
          dateRange = dateRange ? this.formatMonth(dateRange[1], dateRange[0]) : []
          break
        case 'year':
          dateRange = dateRange ? this.formatYear(dateRange) : []
          break
      }
      this.$emit(
        'update:date',
        (dateRange || []).map((val) => val.toUTCString())
      )
    },
    dateToggle(type) {
      this.dateType = type
      this.year = ''
      this.yearRange = []
      this.monthRange = []
      this.dayRange = []
      if (this.now) {
        this.initNow()
      } else {
        this.handChange()
      }
    },
    initNow() {
      if (!this.now) return
      let dateRange = []
      switch (this.dateType) {
        case 'day':
          dateRange = this.formatDay()
          this.dayRange = dateRange
          break
        case 'month':
          dateRange = this.formatMonth()
          this.monthRange = dateRange
          break
        case 'year':
          dateRange = this.formatYear()
          this.year = dateRange[1]
          this.yearRange = dateRange
          break
      }
      this.$emit('change', dateRange)
      this.$emit(
        'update:date',
        dateRange.map((val) => val.toUTCString())
      )
    },
    formatDay(to, from) {
      from = from ? new Date(from) : new Date()
      from = new Date(from.getFullYear(), from.getMonth(), from.getDate())
      to = to ? new Date(to) : new Date()
      to = new Date(new Date(to.getFullYear(), to.getMonth(), to.getDate()).setHours(23, 59, 59, 0))
      return [from, to]
    },
    formatMonth(to, from) {
      to = to ? new Date(to) : new Date()
      from = from ? new Date(from) : new Date()
      from = new Date(from.getFullYear(), from.getMonth(), 1)
      to = new Date(to.getFullYear(), to.getMonth() + 1, 0)
      return [from, to]
    },
    formatYear(to) {
      to = to ? new Date(to) : new Date()
      let toYear = to.getFullYear()
      const from = new Date(`${toYear}`)
      to = new Date(new Date(`${toYear + 1}`).getTime() - 24 * 60 * 60 * 1000)
      return [from, to]
    }
  }
}
</script>

<style lang="scss" scoped>
.date {
  &-tab {
    display: inline-flex;
    align-items: center;
    border: 1px solid $base-border-color;
    border-radius: 3px;
    padding: 0 10px;
    margin-right: 10px;
    cursor: pointer;
    & > span {
      display: inline-block;
      padding: 0 10px;
      &.active {
        color: $base-color-blue;
      }
    }
  }
  &-picker {
    display: flex;
    position: relative;
    .el-date-editor--monthrange {
      width: 350px;
    }
  }
}
</style>
