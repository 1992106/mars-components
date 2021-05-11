<template>
  <div class="mars-search-bar">
    <el-form ref="searchBar" :inline="true" :model="form" size="mini" @submit.native.prevent @keyup.enter.native="onSubmit">
      <template v-for="field in fields">
        <el-form-item :label="field.label" :prop="field.prop" :key="field.prop">
          <template v-if="field.type === 'select'">
            <el-select v-model="form[field.prop]" filterable clearable :multiple="!!field.multiple" :placeholder="field.placeholder || `请选择${field.label}`">
              <el-option v-for="item in field.options || []" :key="item.value" :label="item.label" :value="item.value"></el-option>
            </el-select>
          </template>
          <template v-else-if="field.type === 'autocomplete'">
            <el-autocomplete
              v-model="form[field.prop]"
              clearable
              :fetch-suggestions="field.fetchSuggestions"
              :placeholder="field.placeholder || `请输入${field.label}`"
            ></el-autocomplete>
          </template>
          <template v-else>
            <el-input v-model="form[field.prop]" :type="field.type || 'text'" :min="field.min" clearable :placeholder="field.placeholder || `请输入${field.label}`"></el-input>
          </template>
        </el-form-item>
      </template>
      <el-form-item>
        <el-button type="primary" @click="onSubmit">搜索</el-button>
      </el-form-item>
      <el-form-item v-if="showOnly" label="只看我负责的" prop="onlyOnStage">
        <el-switch v-model="form.onlyOnStage" @change="onSubmit"></el-switch>
      </el-form-item>
    </el-form>
    <div class="extra-btn">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
export default {
  name: 'MarsSearchBar',
  props: {
    fields: { type: Array, default: () => [] },
    showOnly: { type: Boolean, default: true },
    onlyOnStage: { type: Boolean, default: false },
    delay: { type: Number, default: 500 }
  },
  data() {
    return {
      form: {
        onlyOnStage: false
      }
    }
  },
  computed: {
    defaultValueFields() {
      return this.fields.filter((field) => field?.defaultValue != null)
    }
  },
  watch: {
    defaultValueFields: {
      handler(val) {
        if (val.length) {
          val.forEach((field) => {
            this.form[field.prop] = field?.defaultValue
          })
          // TODO: 延迟在created生命周期之后执行
          this.$nextTick(() => {
            this.onSubmit()
          })
        }
      },
      immediate: true,
      deep: true
    },
    onlyOnStage: {
      handler(val) {
        this.form.onlyOnStage = val
      },
      immediate: true
    }
  },
  created() {
    this.onSubmit = _.debounce(this.onSubmit, this.delay)
  },
  methods: {
    onSubmit() {
      this.fields
        .filter((val) => val?.type === 'number')
        .forEach((field) => {
          let val = this.form[field.prop]
          this.form[field.prop] = val ? +val : undefined
        })
      this.$emit('search', { ...this.form })
    }
  }
}
</script>

<style lang="scss" scoped>
.mars-search-bar {
  display: flex;
  & > .el-form {
    .el-form-item {
      margin-bottom: 10px;
    }
    ::v-deep.el-form-item__content {
      .el-input,
      .el-select {
        width: 120px;
      }
    }
  }
  .extra-btn {
    flex: 1;
    display: inline-flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 10px;
  }
}
</style>
