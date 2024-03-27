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
import time
from app.asserte import *
from app.pwd import *
# sys.modules['asserte'] = asserte.asserte

#
# Handle user_create event.  Create a new user.
#
# @author DanielWHoward
#
desc = ('api', 'user_create')
def handler(event, vars):
  pf = vars['pf']

  asserte('username' in event, 'missing:username')
  asserte(isinstance(event['username'], str), 'typeof:username')
  asserte(not event['username'] in pf.usernamesNotAllowed, 'invalid:username')
  asserte(re.search(r'^[a-z][a-z0-9]{2,11}$', event['username']) != None, 'regexp:username')
  asserte('email' in event, 'missing:email')
  asserte(isinstance(event['email'], str), 'invalid:email')
  asserte(re.search(r'^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$', event['email']) != None, 'regexp:email')
  asserte('pwd' in event, 'missing:pwd')
  asserte(isinstance(event['pwd'], str), 'typeof:pwd')

  username = event['username']
  email = event['email']
  hashedPwd = pwd_hash(event['pwd'])

  now = time.strftime('%Y-%m-%d %H:%M:%S')
  nullDateTime = '1970-01-01 00:00:00'
  # see if the user is already in the database
  me = pf.readOneRow({
    'table': 'users',
    'where': {
      'or': 'or',
      'username': username,
      'email': email
  }})
  # insert the user into the database
  if me == None:
    # insert the user
    user = pf.insertRow({
      'table': 'users',
      'values': {
         'id': 0,
         'uid': 0,
         'username': username,
         'email': email,
         'pwd': hashedPwd,
         'created': now,
         'connected': nullDateTime,
         'touched': nullDateTime
    }})
    id = user['id']
    uid = user['id']
    # update the uid
    values = {
      'uid': uid
    }
    pf.updateRow({
      'table': 'users',
      'values': values,
      'where': {
        'id': id
    }})
    del event['pwd']
    event['i'] = 'created'
  else:
    del event['pwd']
    event['i'] = 'already exists'
  return event

# sys.modules[__name__] = (desc[0], desc[1], handler)
