///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
import { sha256 } from 'js-sha256'

const encrypt = (email, pwd) => {
  const hash = sha256.create();
  hash.update(email+'xibbit.github.io'+pwd);
  return hash.hex();
}

const Pwd = {
  encrypt
}

export default Pwd
