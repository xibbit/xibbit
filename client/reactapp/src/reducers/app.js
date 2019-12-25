///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { modelApply } from '../actions/model'
import { SIGNIN, signInApply } from '../actions/signin'

export const MODEL = 'app/MODEL'

//an action sets the value on a key, like Angular 1.x data-ng-model
export const model = (key, value) => (
  dispatch =>
    dispatch({
      type: MODEL,
      key,
      value
    })
  )

const initialState = {
  loggedIn: false
}

const appReducer = (state = initialState, action) => {
  switch (action.type) {
    case SIGNIN:
      return signInApply(state, action)
    case MODEL:
      return modelApply(state, action)
    default:
      return state
  }
};

export default appReducer;
