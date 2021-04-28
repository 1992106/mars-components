import dayjs from 'dayjs'

const formatDate = (val, type = 'YYYY-MM-DD HH:mm:ss') => {
  if (!val) {
    return '--'
  }
  // 时间戳
  if (/^[0-9]{13}$/.test(val)) {
    val = +val
  }
  return dayjs(new Date(val)).format(type)
}

export default { formatDate }
