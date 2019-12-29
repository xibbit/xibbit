///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
