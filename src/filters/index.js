import Vue from 'vue'

const files = require.context('./', false, /\.js$/)
let filters = {}
files
  .keys()
  .filter((val) => !['./index.js'].includes(val))
  .forEach((key) => {
    filters = Object.assign(filters, files(key).default)
  })

Object.keys(filters).forEach((key) => {
  Vue.filter(key, filters[key])
})
