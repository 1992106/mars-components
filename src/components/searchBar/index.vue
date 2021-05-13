<template>
  <div class="mars-search-bar">
    <template v-if="fields && fields.length">
      <el-form ref="searchBar" :inline="true" :model="form" size="mini" @submit.native.prevent @keyup.enter.native="handleSubmit">
        <template v-for="field in fields">
          <el-form-item :label="field.label" :prop="field.prop" :key="field.prop">
            <template v-if="field.type === 'select'">
              <el-select
                v-model.trim="form[field.prop]"
                filterable
                clearable
                :multiple="!!field.multiple"
                :placeholder="field.placeholder || `请选择${field.label}`"
                @change="$forceUpdate()"
              >
                <el-option v-for="item in field.options || []" :key="item.value" :label="item.label" :value="item.value"></el-option>
              </el-select>
            </template>
            <template v-else-if="field.type === 'cascader'">
              <el-cascader
                v-model.trim="form[field.prop]"
                :options="field.options || []"
                filterable
                clearable
                collapse-tags
                :props="field.props"
                :placeholder="field.placeholder || `请选择${field.label}`"
                @change="$forceUpdate()"
              ></el-cascader>
            </template>
            <template v-else-if="field.type === 'autocomplete'">
              <el-autocomplete
                v-model.trim="form[field.prop]"
                clearable
                :fetch-suggestions="field.fetchSuggestions"
                :placeholder="field.placeholder || `请输入${field.label}`"
              ></el-autocomplete>
            </template>
            <template v-else>
              <el-input
                v-model.trim="form[field.prop]"
                :type="field.type || 'text'"
                :min="field.min"
                clearable
                :placeholder="field.placeholder || `请输入${field.label}`"
              ></el-input>
            </template>
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" @click="handleSubmit">搜索</el-button>
          <el-button type="default" @click="handleRest">重置</el-button>
        </el-form-item>
        <el-form-item v-if="showOnly" label="只看我负责的" prop="onlyOnStage">
          <el-switch v-model="form.onlyOnStage" @change="handleSubmit"></el-switch>
        </el-form-item>
      </el-form>
    </template>
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
      },
      restForm: {}
    }
  },
  watch: {
    onlyOnStage: {
      handler(val) {
        this.form.onlyOnStage = val
      },
      immediate: true
    }
  },
  created() {
    this.handleSubmit = _.debounce(this.handleSubmit, this.delay)
    this.initSubmit()
  },
  mounted() {
    this.restForm = _.cloneDeep(this.form)
  },
  methods: {
    initSubmit() {
      let defaultValueFields = this.fields.filter((field) => field?.defaultValue != null)
      if (defaultValueFields.length) {
        defaultValueFields.forEach((field) => {
          this.form[field.prop] = field.defaultValue
        })
        this.handleSubmit()
      }
      console.log(this.form, defaultValueFields, 333)
    },
    handleSubmit() {
      this.fields
        .filter((val) => val?.type === 'number')
        .forEach((field) => {
          let val = this.form[field.prop]
          this.form[field.prop] = val ? +val : undefined
        })
      this.$emit('search', { ...this.form })
    },
    handleRest() {
      this.form = _.cloneDeep(this.restForm)
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
