/**
 * 获取对象tag
 * @param value
 * @returns {string}
 */
export const getTag = (value) => {
  return Object.prototype.toString.call(value)
}

/**
 * 获取对象类型
 * @param value
 * @returns {string}
 */
export const getType = (value) => {
  return getTag(value).slice(8, -1).toLowerCase()
}

/**
 * 是否为空
 * @param value
 * @returns {boolean}
 */
export const isEmpty = (value) => {
  if (value == null) {
    return true
  }
  if (Array.isArray(value) || typeof value === 'string' || value instanceof String) {
    return value.length === 0
  }
  if (value instanceof Map || value instanceof Set) {
    return value.size === 0
  }
  if (getTag(value) === '[object Object]') {
    return Object.keys(value).length === 0
  }
  return false
}

/**
 * 填充对象
 * @param target
 * @param source
 * @returns {{}}
 */
export function polyfill(target = {}, source = {}) {
  const obj = {}
  Object.keys(target).forEach((key) => {
    if (getType(target[key]) === 'object') {
      if (!isEmpty(source[key])) {
        obj[key] = polyfill(target[key], source[key])
      } else {
        obj[key] = target[key]
      }
    } else {
      obj[key] = isEmpty(source[key]) ? target[key] : source[key]
    }
  })
  return obj
}

/**
 * 实现数字的千分符处理（金额）4舍5入
 * @param str
 * @param length
 * @returns {string|number}
 */
export function millimeter(str, length = 4) {
  if (isNaN(str)) return 0
  return str.toString().replace(/(\d+)(\.\d*)?/, (content, $1, $2) => {
    let decimal = $2 ? (+$2).toFixed(length) : '0'
    if (decimal >= 1) {
      $1 = +$1 + 1
      decimal--
    }
    const integer = $1.toString().replace(/\d{1,3}(?=(\d{3})+$)/g, (content) => content + ',')
    if (+decimal > 0) {
      return integer + (decimal + '').slice(1)
    } else {
      return integer
    }
  })
}
