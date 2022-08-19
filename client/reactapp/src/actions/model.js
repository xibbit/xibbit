// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
export const MODEL = 'model/MODEL'

// an action sets the value on a key, like Angular 1.x data-ng-model
export const model = (key, value) => (
  dispatch =>
    dispatch({
      type: MODEL,
      key,
      value
    })
)

// reusable reducer implementation
export const modelApply = (state, action) => {
  // mark the state as changed
  state = {
    ...state
  }
  let props = action.key.split('.')
  const prop = props.pop()
  let obj = props.reduce((obj, key) => {
    // mark each object at each level as changed
    obj[key] = {
      ...obj[key]
    }
    return obj[key]
  }, state)
  // change the value
  obj[prop] = action.value
  return state
}
