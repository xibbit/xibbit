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
# Handle user_profile_mail_update event.  Change
# this user's mailing address and other values.
#
# @author DanielWHoward
#
desc = ('api', 'user_profile_mail_update')
def handler(event, vars):
  pf = vars['pf']

  asserte('user' in event, 'missing:user')
  asserte(isinstance(event['user'], dict), 'typeof:user')

  # get the current user
  uid = event['_session']['uid']
  asserte(isinstance(uid, int), 'current user not found')
  asserte(uid > 0, 'current user not found')
  me = pf.readOneRow({
    'table': 'users',
    'where': {
      'uid': uid
  }})
  asserte(me != None, 'current user not found')
  # remove all uneditable fields
  readonly = [
    'id',
    'roles',
    'json',
    'n',
    'password'
  ]
  for key in readonly:
    if key in event['user']:
      del event['user'][key]
  # update the profile
  pf.updateRow({
    'table': 'users',
    'values': event['user'],
    'where': {
      'uid': uid
  }})
  # info: profile updated
  event['i'] = 'profile updated'
  return event
  
# sys.modules[__name__] = (desc[0], desc[1], handler)
