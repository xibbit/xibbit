///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import app from './app'

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  app
})

export default createRootReducer
