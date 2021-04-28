import { getType, isEmpty } from '@/utils'

const isNull = (val, obj) => {
  if (getType(val) === 'string') {
    val = val?.replace(/undefined|null/g, '')
  }
  if (isEmpty(val)) {
    return '--'
  }
  if (!isEmpty(obj) && getType(obj) === 'object') {
    // 简单数组
    if (getType(val) === 'array') {
      return val.map((v) => obj[v]).join(',') ?? '--'
    }
    return obj[val] ?? '--'
  }
  return val
}

export default { isNull }
