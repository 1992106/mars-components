<template>
  <div class="x-list">
    <vxe-grid
      ref="xGrid"
      auto-resize
      border
      show-overflow
      keep-source
      resizable
      stripe
      :scroll-x="getScrollX"
      :scroll-y="getScrollY"
      :height="tableHeight"
      :columns="columns"
      :data="getData.list"
      :loading="getData.loading"
      :merge-cells="mergeCells"
      :edit-config="getEditConfig"
      :edit-rules="editRules"
      :checkbox-config="getCheckboxConfig"
      :tooltip-config="getTooltipConfig"
      @edit-closed="handleEditClosed"
      @checkbox-change="handleCheckboxChange"
      @checkbox-all="handleCheckboxAll"
      @cell-click="handleCellClick"
      @resizable-change="handleResizableChange"
    >
      <template #opts="scope">
        <slot name="opts" v-bind="scope" :command="handleCommand"></slot>
      </template>

      <!--二次搜索-->
      <template #QIcon="{ column: { title, editRender, children } }">
        <i v-if="isQICon(editRender, children)" class="vxe-cell--edit-icon el-icon-edit"></i>
        <span class="vxe-cell--title">{{ title }}</span>
      </template>
      <template
        #QInput="{
          column: {
            params: { filter }
          }
        }"
      >
        <el-input v-model="filters[filter.field]" clearable @change="handleFilter($event, filter.field)"></el-input>
      </template>
      <template
        #QSelect="{
          column: {
            params: { filter }
          }
        }"
      >
        <el-select
          v-model="filters[filter.field]"
          filterable
          clearable
          multiple
          placeholder="请选择"
          @change="handleFilter($event, filter.field)"
        >
          <el-option
            v-for="item in filter.options"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          ></el-option>
        </el-select>
      </template>
      <template
        #QDaterange="{
          column: {
            params: { filter }
          }
        }"
      >
        <el-date-picker
          v-model="filters[filter.field]"
          style="width: 100%"
          type="daterange"
          align="right"
          :picker-options="filter.pickerOptions"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleFilter($event, filter.field)"
        ></el-date-picker>
      </template>
      <template
        #QCascader="{
          column: {
            params: { filter }
          }
        }"
      >
        <el-cascader
          v-model="filters[filter.field]"
          filterable
          clearable
          style="width: 100%"
          :props="filter.props || {}"
          :options="filter.options"
          collapse-tags
          @visible-change="handleCascaderFilter($event, filter.field)"
          @change="handleFilter($event, filter.field)"
        ></el-cascader>
      </template>
    </vxe-grid>
    <el-pagination
      v-if="showPagination"
      :page-size="pagination.limit"
      :page-sizes="[20, 30, 50, 100]"
      :current-page.sync="pagination.page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="getData.total || getData.count"
      @current-change="handlePageChange"
      @size-change="handlePageSizeChange"
    ></el-pagination>
  </div>
</template>
<script>
import { debounce } from 'lodash'
import { polyfill } from '@/utils'
export default {
  name: 'XList',
  components: {},
  props: {
    // 自定义列
    columns: { type: Array, default: () => [] },
    // 表格数据
    data: Object,
    // 页码
    showPagination: { type: Boolean, default: () => true },
    pagination: { type: Object, default: () => ({ limit: 20, page: 1 }) },
    // 勾选项
    selectedValue: { type: Array, default: () => [] },
    // 合并单元格
    mergeCells: { type: Array, default: () => [] },
    // 编辑配置
    editConfig: Object,
    editRules: { type: Object, default: () => ({}) },
    // 横向虚拟滚动配置
    scrollX: Object,
    // 纵向虚拟滚动配置
    scrollY: Object,
    // 复选框配置项
    checkboxConfig: Object,
    // tooltip 配置项
    tooltipConfig: Object,
    // 表格除外的高度
    offsetHeight: { type: Number, default: 260 },
    // 本地Storage名称（拖拽列时需要本地储存）
    storageName: String
  },
  data() {
    return {
      defaultData: { list: [], total: 0, loading: false },
      defaultScrollX: { enabled: false },
      defaultScrollY: { enabled: false },
      defaultEditConfig: { trigger: 'click', mode: 'cell', icon: 'el-icon-edit' },
      defaultCheckboxConfig: { highlight: true, checkMethod: () => true },
      defaultTooltipConfig: { showAll: true },
      tableHeight: 300,
      filters: {}
    }
  },
  computed: {
    getData({ defaultData, data }) {
      return polyfill(defaultData, data)
    },
    getScrollX({ defaultScrollX, scrollX }) {
      return polyfill(defaultScrollX, scrollX)
    },
    getScrollY({ defaultScrollY, scrollY }) {
      return polyfill(defaultScrollY, scrollY)
    },
    getEditConfig({ defaultEditConfig, editConfig }) {
      return polyfill(defaultEditConfig, editConfig)
    },
    getCheckboxConfig({ defaultCheckboxConfig, checkboxConfig }) {
      return polyfill(defaultCheckboxConfig, checkboxConfig)
    },
    getTooltipConfig({ defaultTooltipConfig, tooltipConfig }) {
      return polyfill(defaultTooltipConfig, tooltipConfig)
    },
    isQICon() {
      return (editRender, children) =>
        (editRender && editRender.enabled) ||
        (children && children.length && children[0].editRender && children[0].editRender.enabled)
    }
  },
  created() {},
  mounted() {
    this.onResize()
    window.addEventListener('resize', debounce(this.onResize, 200))
    this.$once('hook:beforeDestroy', () => {
      window.removeEventListener('resize', this.onResize)
    })
  },
  methods: {
    // 监听视窗大小改变
    onResize() {
      this.$nextTick(() => {
        const clientHeight = document.body.clientHeight - this.offsetHeight
        this.tableHeight = clientHeight < 300 ? 300 : clientHeight
      })
    },
    // 操作项
    handleCommand(index, row, command) {
      return {
        index,
        row,
        command
      }
    },
    // 页码
    handlePageChange(page) {
      const pagination = {
        ...this.pagination,
        page
      }
      this.$emit('update:pagination', pagination)
      this.$emit('search')
    },
    // 页数
    handlePageSizeChange(limit) {
      const pagination = {
        ...this.pagination,
        page: 1,
        limit
      }
      this.$emit('update:pagination', pagination)
      this.$emit('search')
    },
    // 编辑
    handleEditClosed({ row, rowIndex, $rowIndex, column, columnIndex, $columnIndex }) {
      let xGrid = this.$refs.xGrid
      let field = column.property
      // 判断单元格值是否被修改
      if (xGrid.isUpdateByRow(row, field)) {
        this.$emit('edit-closed', { row, rowIndex, $rowIndex, column, columnIndex, $columnIndex })
      }
    },
    // 勾选
    handleCheckboxChange({
      records,
      reserves,
      indeterminates,
      checked,
      row,
      rowIndex,
      $rowIndex,
      column,
      columnIndex,
      $columnIndex,
      $event
    }) {
      this.$emit('update:selected-value', records)
      this.$emit('checkbox-change', {
        records,
        reserves,
        indeterminates,
        checked,
        row,
        rowIndex,
        $rowIndex,
        column,
        columnIndex,
        $columnIndex,
        $event
      })
    },
    // 全选
    handleCheckboxAll({ records, reserves, indeterminates, checked, $event }) {
      this.$emit('update:selectValue', this.$refs.xGrid.getCheckboxRecords())
      this.$emit('checkbox-all', { records, reserves, indeterminates, checked, $event })
    },
    // 单元格点击事件
    handleCellClick({ row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, $event }) {
      this.$emit('cell-click', { row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, $event })
    },
    // 表头级联二次搜索
    handleCascaderFilter($event, field) {
      if (!$event) {
        this.$nextTick(() => {
          this.handleFilter(this.filters[field], field)
        })
      }
    },
    // 表头二次搜索
    handleFilter($event, filed) {
      const filters = { ...this.filters, [filed]: $event }
      this.filters = Object.assign({}, this.filters, filters)
      this.$emit('search', this.filters)
    },
    // 拖拽列
    handleResizableChange({ column }) {
      const xGrid = this.$refs.xGrid
      if (xGrid) {
        column.width = column.renderWidth
        column.resizeWidth = 0 // 拖拽后要清理  这个字段优先级高于renderWidth
        xGrid.refreshColumn()
        localStorage.setItem(this.storageName, JSON.stringify(xGrid.getColumns()))
      }
    }
  }
}
</script>
<style lang="scss" scoped>
.x-list {
  ::v-deep {
    .vxe-table .vxe-table--body {
      font-size: 12px;
    }
    .el-button--mini {
      padding: 2px 6px;
      font-size: 12px;
    }
    .vxe-header--column .vxe-cell--edit-icon {
      //color: $font-orange;
    }
  }
  .el-pagination {
    text-align: right;
    margin: 8px;
  }
}
</style>
