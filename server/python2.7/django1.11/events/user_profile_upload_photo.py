# -*- coding: utf-8 -*-
# The MIT License (MIT)
#
# xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
#
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
#
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
# @version 2.0.0
# @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
# @license http://opensource.org/licenses/MIT

import sys
import re
from app.asserte import *
# sys.modules['asserte'] = asserte.asserte

#
# Handle user_profile event.  Get this user's
# profile.
#
# @author DanielWHoward
#
desc = ('on', 'user_profile_upload_photo')
def handler(event, vars):
  pf = vars['pf']

  uid = event['_session']['uid']

  # find user in the database
  username = ''
  mes = pf.readRows({
    'table': 'users',
    'where': {
      'uid': uid
  }})
  if (len(mes) == 1):
    username = mes[0]['username']

  perm_fn = 'public/images/' + username + '.png'
  success = False
  with open(perm_fn, 'wb+') as destination:
    for chunk in event['image']['tmp_name'].chunks():
      success = True
      destination.write(chunk)
  if success:
    event['i'] = 'uploaded'
  else:
    event['e'] = 'upload failed'
  return event
  
# sys.modules[__name__] = (desc[0], desc[1], handler)
