///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { render } from 'inferno';
import { Provider } from 'inferno-redux'
import { BrowserRouter } from 'inferno-router';
import configureStore from './store'
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const store = configureStore(/* provide initial state if any */)

render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
