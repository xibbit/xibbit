///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
export const SIGNIN = 'app/SIGNIN'

// an action sets the value on a key, like Angular 1.x data-ng-model
export const signIn = (signedIn) => (
  dispatch =>
    dispatch({
      type: SIGNIN,
      signedIn
    })
)

// reusable reducer implementation
export const signInApply = (state, action) => {
  // mark the state as changed
  state = {
    ...state,
    loggedIn: action.signedIn
  }
  return state
}
