import Vue from 'vue'

const files = require.context('./', false, /\.js$/)
let directives = {}
files
  .keys()
  .filter((val) => !['./index.js'].includes(val))
  .forEach((key) => {
    directives = Object.assign(directives, files(key).default)
  })

Object.keys(directives).forEach((key) => {
  Vue.directive(key, directives[key])
})
