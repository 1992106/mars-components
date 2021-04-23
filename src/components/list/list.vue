<template>
  <div class="eList">
    <el-table
      ref="eList"
      v-loading="data.loading"
      border
      :data="data.list"
      :height="tableHeight"
      :row-key="getRowKeyOfTarget"
      :highlight-current-row="true"
      empty-text="暂无数据"
      :span-method="spanMethod"
      @selection-change="handleSelectionChange"
      @cell-click="handleCellClick"
      @current-change="handleCurrentChange"
    >
      <!--勾选-->
      <el-table-column
        v-if="!typeColumn.hidden"
        :type="typeColumn.type"
        :fixed="typeColumn.fixed || false"
        :width="typeColumn.width || 30"
        align="center"
        :reserve-selection="true"
        :selectable="handleSelectable"
      ></el-table-column>
      <!--操作-->
      <el-table-column
        v-if="!optsColumn.hidden"
        :fixed="optsColumn.fixed || false"
        :label="optsColumn.label || '操作'"
        :width="optsColumn.width || 60"
        align="center"
      >
        <template slot-scope="scope">
          <slot name="opts" :scope="{ ...scope }" :command="beforeHandleCommand"></slot>
        </template>
      </el-table-column>
      <template v-for="(column, index) in columns">
        <el-table-column
          :key="column + index"
          :fixed="column.fixed"
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          show-overflow-tooltip
        >
          <!--表头-->
          <template slot="header" slot-scope="scope">
            <slot :name="column.header.name" :scope="{ ...scope }"></slot>
          </template>
          <template slot-scope="scope">
            <slot :name="column.prop" :scope="{ ...scope }">
              <template v-if="column.type === 'date'">
                {{ getColumn(scope.row, column.prop) | formatDate('YYYY-MM-DD') }}
              </template>
              <template v-else>
                {{ getColumn(scope.row, column.prop) | isNull }}
              </template>
            </slot>
          </template>
        </el-table-column>
      </template>
    </el-table>
    <el-image-viewer v-if="showViewer" :on-close="closeViewer" :url-list="picList" />
    <el-pagination
      v-if="showPagination"
      :page-size="pagination.limit"
      :page-sizes="[20, 30, 50, 100]"
      :current-page.sync="pagination.page"
      layout="total, sizes, prev, pager, next, jumper"
      :total="data.count"
      style="text-align: right"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    ></el-pagination>
  </div>
</template>
<script>
import ElImageViewer from 'element-ui/packages/image/src/image-viewer.vue'
import { debounce } from 'lodash'

export default {
  components: {
    ElImageViewer
  },
  props: {
    typeColumn: {
      type: Object,
      default: () => ({
        type: 'selection',
        width: 30,
        fixed: false,
        hidden: true,
        selectable: () => {}
      })
    },
    optsColumn: {
      type: Object,
      default: () => ({
        label: '操作',
        width: 60,
        fixed: false,
        hidden: false
      })
    },
    columns: {
      type: Array,
      default: () => []
    },
    data: {
      type: Object,
      default: () => ({
        list: [],
        loading: false,
        count: 0
      })
    },
    showPagination: {
      type: Boolean,
      default: () => true
    },
    pagination: {
      type: Object,
      default: () => ({ limit: 20, page: 1 })
    },
    // 合并单元格
    spanMethod: {
      type: Function,
      default: () => ({ rowspan: 1, colspan: 1 })
    },
    offsetHeight: { type: Number, default: 210 }
  },
  data() {
    return {
      showViewer: false,
      picList: '',
      tableHeight: 300
    }
  },
  computed: {
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
    getRef() {
      return this.$refs['eList']
    },
    beforeHandleCommand(index, row, command) {
      return {
        index,
        row,
        command
      }
    },
    handlePageChange(page) {
      const pagination = {
        ...this.pagination,
        page
      }
      this.$emit('search', pagination)
    },
    handleSizeChange(limit) {
      const pagination = {
        ...this.pagination,
        limit,
        page: 1
      }
      this.$emit('search', pagination)
    },
    getRowKeyOfTarget(row) {
      return row._id
    },
    handleSelectable(row, index) {
      return this.typeColumn?.selectable ? this.typeColumn.selectable(row, index) : () => {}
    },
    handleSelectionChange(val) {
      this.$emit('selection-change', val)
    },
    handleCellClick(row, column, cell, event) {
      this.$emit('cell-click', row, column, cell, event)
    },
    handleCurrentChange(currentRow, oldCurrentRow) {
      this.$emit('current-change', currentRow, oldCurrentRow)
    },
    closeViewer() {
      this.showViewer = false
    }
  }
}
</script>
<style lang="scss" scoped>
.eList {
  .el-pagination {
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
