<template>
  <div class="mars-list">
    <el-table
      ref="xList"
      v-loading="getData.loading"
      border
      :data="getData.list"
      :height="tableHeight"
      :row-key="rowKey"
      :span-method="spanMethod"
      :row-class-name="rowClassName"
      :cell-class-name="cellClassName"
      :row-style="rowStyle"
      :cellStyle="cellStyle"
      highlight-current-row
      empty-text="暂无数据"
      @selection-change="handleSelectionChange"
      @select-all="handleSelectAll"
      @cell-click="handleCellClick"
      @current-change="handleCurrentChange"
    >
      <template v-for="(column, index) in getMergeColumns">
        <el-table-column :key="column + index" v-bind="column" :formatter="getFormatter(column.formatter)" show-overflow-tooltip>
          <!--表头-->
          <template v-if="column.header" slot="header">
            <slot :name="getHeaderName(column)"></slot>
          </template>
          <!--内容-->
          <template v-if="!column.formatter" slot-scope="scope">
            <slot :name="column.prop" v-bind="scope" :command="getCommand(column)">
              <!--<template v-if="column.type === 'image'">
                  <el-image
                    lazy
                    :src="getColumn(scope.row, column)"
                    :preview-src-list="[getColumn(scope.row, column)]"
                  ></el-image>
                </template>-->
              <template v-if="column.type === 'date'">
                {{ getColumn(scope.row, column) | formatDate('YYYY-MM-DD') }}
              </template>
              <template v-else>
                {{ getColumn(scope.row, column) | isNull }}
              </template>
            </slot>
          </template>
        </el-table-column>
      </template>
    </el-table>
    <el-pagination
      v-if="showPagination"
      :page-size="pagination.limit"
      :page-sizes="pageSizes"
      :current-page.sync="pagination.page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="getData.total || getData.count"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    ></el-pagination>
  </div>
</template>
<script>
import _ from 'lodash'
import { polyfill } from '@/utils'

export default {
  name: 'MarsList',
  props: {
    // 自定义列
    columns: { type: Array, default: () => [] },
    // 表格数据
    data: Object,
    // 页码
    showPagination: { type: Boolean, default: true },
    pagination: { type: Object, default: () => ({ limit: 20, page: 1 }) },
    pageSizes: { type: Array, default: () => [20, 30, 50, 100] },
    // 行数据的Key
    rowKey: [String, Function],
    // 勾选项
    selectedValue: { type: Array, default: () => [] },
    // 合并单元格
    spanMethod: Function,
    // 给行附加 className
    rowClassName: [String, Function],
    // 给单元格附加 className
    cellClassName: [String, Function],
    // 给单元格附加样式
    cellStyle: [Object, Function],
    // 给行附加样式
    rowStyle: [Object, Function],
    // 表格除外的高度
    offsetHeight: { type: Number, default: 265 }
  },
  data() {
    return {
      defaultData: { list: [], total: 0, loading: false },
      defaultTypeColumn: {
        type: 'selection', //（勾选selection、展开expand、索引index）
        visible: false,
        width: 30,
        fixed: false,
        'reserve-selection': true,
        selectable: Function.prototype
      },
      defaultOptsColumn: { label: '操作', type: 'opts', visible: true, width: 60, fixed: false },
      tableHeight: 300,
      filters: {}
    }
  },
  computed: {
    getData({ defaultData, data }) {
      return polyfill(defaultData, data)
    },
    getMergeColumns({ columns, defaultTypeColumn, defaultOptsColumn }) {
      let mergeColumns = []
      columns.forEach((column) => {
        let newColumn = column
        newColumn.visible = true
        if (['selection', 'expand', 'index'].includes(column?.type)) newColumn = polyfill(defaultTypeColumn, column)
        if (column?.type === 'opts') newColumn = polyfill(defaultOptsColumn, column)
        newColumn.prop = newColumn?.prop || column?.type
        mergeColumns.push(newColumn)
      })
      return mergeColumns.filter((val) => val?.visible)
    },
    getHeaderName() {
      return (column) => {
        if (typeof column?.header === 'boolean') return 'header-' + column.prop
        return column?.header
      }
    },
    getCommand() {
      return (column) => {
        return column?.type === 'opts' ? this.handleCommand : null
      }
    },
    getColumn() {
      return (row, column) => {
        if (!column.prop) return ''
        const arr = (column.prop || '').split('.')
        let item,
          obj = row
        while ((item = arr.shift()) && obj) {
          obj = obj[item]
        }
        return obj
      }
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
    getFormatter(params) {
      if (Array.isArray(params)) {
        let [fn, ...rest] = params
        return (row, column, cellValue) => fn({ row, column, cellValue }, ...rest)
      } else if (params instanceof Function) {
        return (row, column, cellValue) => params({ row, column, cellValue })
      }
      return null
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
    handleSizeChange(limit) {
      const pagination = {
        ...this.pagination,
        limit,
        page: 1
      }
      this.$emit('update:pagination', pagination)
      this.$emit('search')
    },
    // 勾选
    handleSelectionChange(selection) {
      this.$emit('update:selected-value', selection)
      this.$emit('selection-change', selection)
    },
    // 全选
    handleSelectAll(selection) {
      this.$emit('update:selected-value', selection)
      this.$emit('select-all', selection)
    },
    handleCellClick(row, column, cell, event) {
      this.$emit('cell-click', row, column, cell, event)
    },
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.$emit('current-change', currentRow, oldCurrentRow)
    }
  }
}
</script>
<style lang="scss" scoped>
.mars-list {
  .el-pagination {
    text-align: right;
    margin-top: 5px;
  }
}
</style>
