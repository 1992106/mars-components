let findEle = (parent, type) => {
  return parent.tagName.toLowerCase() === type ? parent : parent.querySelector(type)
}

// const trigger = (el, type) => {
//   const e = document.createEvent('HTMLEvents')
//   e.initEvent(type, true, true)
//   el.dispatchEvent(e)
// }

const number = {
  bind(el) {
    let $input = findEle(el, 'input')
    $input.setAttribute('type', 'number')
    el.$input = $input
    $input.handle = function () {
      let val = $input.value
      if (val === '' || val == null) {
        $input.value = null
      } else {
        $input.value = Number(val)
      }

      // trigger($input, 'input')
      $input.dispatchEvent(new Event('input'))
    }

    $input.addEventListener('keyup', $input.handle)
  },
  unbind: function (el) {
    el.$input.removeEventListener('keyup', el.$input.handle)
  }
}

export default { number }
