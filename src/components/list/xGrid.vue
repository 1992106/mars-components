<template>
  <div class="mars-grid">
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
      :row-class-name="rowClassName"
      :cell-class-name="cellClassName"
      :row-style="rowStyle"
      :cellStyle="cellStyle"
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
        <el-input
          v-model="filters[filter.field]"
          clearable
          size="mini"
          :type="filter.type || 'text'"
          @change="handleFilter($event, filter)"
          @clear="handleClear(filter)"
        ></el-input>
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
          size="mini"
          :multiple="filter.multiple || true"
          placeholder="请选择"
          @visible-change="handleVisibleChange($event, filter)"
          @remove-tag="handleRemoveTag($event, filter)"
          @clear="handleClear(filter)"
        >
          <el-option v-for="item in filter.options" :key="item.value" :value="item.value" :label="item.label"></el-option>
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
          size="mini"
          :picker-options="filter.pickerOptions || pickerOptions"
          unlink-panels
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleFilter($event, filter)"
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
          size="mini"
          style="width: 100%"
          :props="filter.props || {}"
          :options="filter.options"
          collapse-tags
          @visible-change="handleVisibleChange($event, filter)"
          @remove-tag="handleRemoveTag($event, filter)"
          @change="handleCascaderClear($event, filter)"
        ></el-cascader>
      </template>
    </vxe-grid>
    <el-pagination
      v-if="showPagination"
      :page-size="pagination.limit"
      :page-sizes="pageSizes"
      :current-page.sync="pagination.page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="getData.total || getData.count"
      @current-change="handlePageChange"
      @size-change="handlePageSizeChange"
    ></el-pagination>
  </div>
</template>
<script>
import _ from 'lodash'
import { polyfill } from '@/utils'

export default {
  name: 'MarsGrid',
  props: {
    // 自定义列
    columns: { type: Array, default: () => [] },
    // 表格数据
    data: Object,
    // 页码
    showPagination: { type: Boolean, default: true },
    pagination: { type: Object, default: () => ({ limit: 20, page: 1 }) },
    pageSizes: { type: Array, default: () => [20, 30, 50, 100] },
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
    // 给行附加 className
    rowClassName: [String, Function],
    // 给单元格附加 className
    cellClassName: [String, Function],
    // 给单元格附加样式
    cellStyle: [Object, Function],
    // 给行附加样式
    rowStyle: [Object, Function],
    // 表格除外的高度
    offsetHeight: { type: Number, default: 268 },
    // 本地Storage名称（拖拽列时需要本地储存）
    storageName: String
  },
  data() {
    return {
      defaultData: { list: [], total: 0, loading: false },
      defaultScrollX: { enabled: false },
      defaultScrollY: { enabled: false },
      defaultEditConfig: { trigger: 'click', mode: 'cell', showStatus: true, icon: 'el-icon-edit' },
      defaultCheckboxConfig: { highlight: true, checkMethod: () => true },
      defaultTooltipConfig: { showAll: true },
      tableHeight: 300,
      filters: {},
      pickerOptions: {
        shortcuts: [
          {
            text: '最近一周',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近一个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
              picker.$emit('pick', [start, end])
            }
          },
          {
            text: '最近三个月',
            onClick(picker) {
              const end = new Date()
              const start = new Date()
              start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
              picker.$emit('pick', [start, end])
            }
          }
        ]
      }
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
      return (editRender, children) => (editRender && editRender.enabled) || (children && children.length && children[0].editRender && children[0].editRender.enabled)
    }
  },
  mounted() {
    this.onResize()
    window.addEventListener('resize', _.debounce(this.onResize, 200))
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
        this.$emit('edit-closed', { row, field, rowIndex, $rowIndex, column, columnIndex, $columnIndex })
      }
    },
    // 勾选
    handleCheckboxChange({ records, reserves, indeterminates, checked, row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, $event }) {
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
      this.$emit('update:selected-value', this.$refs.xGrid.getCheckboxRecords())
      this.$emit('checkbox-all', { records, reserves, indeterminates, checked, $event })
    },
    // 单元格点击事件
    handleCellClick({ row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, $event }) {
      this.$emit('cell-click', { row, rowIndex, $rowIndex, column, columnIndex, $columnIndex, $event })
    },
    // 表头二次搜索-点击清空按钮时触发 (TODO: 级联没有清空事件，所以用change事件模拟)
    handleCascaderClear($event, item) {
      if (Array.isArray($event) && $event.length === 0) {
        this.$nextTick(() => {
          this.handleFilter(this.filters[item.field], item)
        })
      }
    },
    // 表头二次搜索-点击清空按钮时触发
    handleClear(item) {
      this.$nextTick(() => {
        this.handleFilter(this.filters[item.field], item)
      })
    },
    // 表头二次搜索-在多选模式下，移除Tag时触发
    handleRemoveTag($event, item) {
      if ($event) {
        this.$nextTick(() => {
          this.handleFilter(this.filters[item.field], item)
        })
      }
    },
    // 表头二次搜索-下拉框出现/隐藏时触发
    handleVisibleChange($event, item) {
      if (!$event) {
        this.$nextTick(() => {
          this.handleFilter(this.filters[item.field], item)
        })
      }
    },
    // 表头二次搜索
    handleFilter($event, item) {
      let value = $event
      if (item.type === 'number') value = $event ? +$event : undefined
      const filters = { ...this.filters, [item.field]: value }
      this.filters = Object.assign({}, this.filters, filters)
      this.$emit('filter', this.filters)
    },
    // 拖拽列
    handleResizableChange({ column }) {
      const xGrid = this.$refs.xGrid
      if (this.storageName && xGrid) {
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
.mars-grid {
  ::v-deep {
    .vxe-table .vxe-table--body {
      font-size: 12px;
    }
    .el-button--mini {
      padding: 2px 6px;
      font-size: 12px;
    }
    // 二次搜索和编辑一起使用时，需要隐藏多余的编辑图标
    .customSearch > .vxe-cell > .vxe-cell--edit-icon.el-icon-edit {
      display: none;
    }
    .vxe-header--column .vxe-cell--edit-icon {
      color: #ffa940;
    }
  }
  .el-pagination {
    text-align: right;
    margin: 8px;
  }
}
</style>
