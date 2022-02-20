# -*- coding: utf-8 -*-
# The MIT License (MIT)
#
# xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
# @version 1.5.3
# @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
# @license http://opensource.org/licenses/MIT

import sys
import re
from app.asserte import *
# sys.modules['asserte'] = asserte.asserte

#
# Handle logout event.  Sign out a user.
#
# @author DanielWHoward
#
desc = ('on', 'logout')
def handler(event, vars):
  hub = vars['hub']
  pf = vars['pf']

  noAsserte(event)

  uid = event['_session']['uid']
  instance = event['_session']['instance_id']

  # find user in the database
  username = ''
  mes = pf.readRows({
    'table': 'users',
    'where': {
      'uid': uid
  }})
  if (len(mes) == 1):
    username = mes[0]['username']

  # broadcast this instance logged out
  hub.send({
   'type': 'notify_logout',
   'to': 'all',
   'from': username
  })
  # logout this instance
  event = hub.connect(event, username, False)
  # remove UID from the instance
  row = pf.readOneRow({
    'table': 'instances',
    'where': {
      'instance': instance
  }})
  if row != None:
    values = {
      'uid': 0
    }
    if row['sid'] == username:
      values['sid'] = ''
    pf.updateRow({
      'table': 'instances',
      'values': values,
      'where': {
        'instance': instance
    }})
  # remove UID and user info from the session
  del event['_session']['uid']
  del event['_session']['user']
  event['i'] = 'logged out'

  return event

# sys.modules[__name__] = (desc[0], desc[1], handler)
