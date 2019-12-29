///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { combineReducers } from 'redux'
import app from './app'

const createRootReducer = () => combineReducers({
  app
})

export default createRootReducer
