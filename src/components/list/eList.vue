<template>
  <div class="e-list">
    <el-table
      ref="eList"
      v-loading="getData.loading"
      border
      :data="getData.list"
      :height="tableHeight"
      :row-key="getRowKey"
      :highlight-current-row="true"
      :span-method="spanMethod"
      empty-text="暂无数据"
      @selection-change="handleSelectionChange"
      @select-all="handleSelectAll"
      @cell-click="handleCellClick"
      @current-change="handleCurrentChange"
    >
      <template v-for="(column, index) in getMergeColumns">
        <el-table-column
          v-if="column.visible"
          :key="column + index"
          v-bind="column"
          :formatter="getFormatter(column.formatter)"
          show-overflow-tooltip
        >
          <!--表头-->
          <template v-if="column.header">
            <template slot="header" slot-scope="scope">
              <slot :name="column.header.name" :scope="{ ...scope }"></slot>
            </template>
          </template>
          <!--内容-->
          <template v-if="!column.formatter">
            <template slot-scope="scope">
              <slot :name="column.prop" :scope="{ ...scope }" v-bind="getCommand(column.type)">
                <template v-if="column.type === 'date'">
                  {{ getColumn(scope.row, column.prop) | formatDate('YYYY-MM-DD') }}
                </template>
                <template v-if="column.type === 'image'">
                  <el-image
                    lazy
                    :src="getColumn(scope.row, column.prop)"
                    :preview-src-list="[getColumn(scope.row, column.prop)]"
                  ></el-image>
                </template>
                <template v-else>
                  {{ getColumn(scope.row, column.prop) | isNull }}
                </template>
              </slot>
            </template>
          </template>
        </el-table-column>
      </template>
    </el-table>
    <el-pagination
      v-if="showPagination"
      :page-size="pagination.limit"
      :page-sizes="[20, 30, 50, 100]"
      :current-page.sync="pagination.page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="data.total"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    ></el-pagination>
  </div>
</template>
<script>
import { debounce } from 'lodash'
import { polyfill } from '@/utils'

export default {
  name: 'EList',
  components: {},
  props: {
    // 自定义列
    columns: { type: Array, default: () => [] },
    // 表格数据
    data: Object,
    // 页码
    showPagination: { type: Boolean, default: true },
    pagination: { type: Object, default: () => ({ limit: 20, page: 1 }) },
    // 勾选项
    selectedValue: { type: Array, default: () => [] },
    // 合并单元格
    spanMethod: Function,
    // 表格除外的高度
    offsetHeight: { type: Number, default: 210 }
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
        if (['selection', 'expand', 'index'].includes(column.type)) newColumn = polyfill(defaultTypeColumn, column)
        if (column.type === 'opts') newColumn = polyfill(defaultOptsColumn, column)
        newColumn.props = newColumn.props || column.type
        mergeColumns.push(newColumn)
      })
      return mergeColumns
    },
    getCommand() {
      return (type) => (type && type === 'opts' ? { command: this.handleCommand } : {})
    },
    getColumn() {
      return (row, str) => {
        if (!str) return ''
        const arr = (str || '').split('.')
        let item,
          obj = row
        while ((item = arr.shift()) && obj) {
          obj = obj[item]
        }
        return obj
      }
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
      const clientHeight = document.body.clientHeight - this.offsetHeight
      this.tableHeight = clientHeight < 300 ? 300 : clientHeight
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
    // 行的唯一key
    getRowKey(row) {
      return row._id
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
.e-list {
  ::v-deep .el-pagination {
    text-align: right;
    margin-top: 5px;

    .el-input__inner {
      height: 24px;
      line-height: 24px;
      font-size: 11px;
      border-radius: 5px;
    }
  }
}
</style>
