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
from app.pwd import *
# sys.modules['asserte'] = asserte.asserte

#
# Handle login event. Sign in a user.
#
# @author DanielWHoward
#
desc = ('api', 'login')
def handler(event, vars):
  hub = vars['hub']
  pf = vars['pf']

  asserte('to' in event, 'missing:to')
  asserte(isinstance(event['to'], unicode), 'typeof:to')
  asserte(re.search(ur'^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$', event['to']) != None, 'regexp:to')
  asserte('pwd' in event, 'missing:pwd')
  asserte(isinstance(event['pwd'], unicode), 'typeof:pwd')
  to = event['to']
  passwd = event['pwd']

  # save the password but remove it from the event
  del event['pwd']
  event['loggedIn'] = False
  verified = True
  if verified:
    # find user in the database
    me = pf.readOneRow({
      'table': 'users',
      'where': {
        'email': to
    }})
    if me == None:
      # if there is no user, force the password code to run
      #  with fake data so the user cannot guess usernames
      #  based on timing
      me = {
        'pwd': '$5$9f9b9bc83f164e1f1f392499e2561f05940c1d6c47bcad69e3bd311e620ab9d5$ee2334e03ba30379fb09cd1df0d4088ea8a853411062be0f83925ccdd2037aaf'
      }
    # compare but do not allow user to guess hash string based on timing
    verified = pwd_verify(passwd, me['pwd'])
    if isinstance(verified, str):
      upgradedPwd = verified
      pf.updateRow({
        'table': 'users',
        'values': {
          'pwd': upgradedPwd},
        'where': {
          'id': me['id']
      }})
      verified = True
    if verified:
      # find user in the database
      me = pf.readRows({
        'table': 'users',
        'where': {
          'uid': me['uid']
      }})
      if (len(me) == 1) and (me[0]['username'] == 'user'):
        event['i'] = 'collect:username'
      me = me[len(me)-1]
      # connect to this user
      event['username'] = me['username']
      event = hub.connect(event, me['username'], True)
      # add UID and user to the session variables
      event['_session']['uid'] = me['id']
      event['_session']['user'] = me
      # return user info
      event['me'] = {
        'username': me['username'],
        'roles': me['roles'] if 'roles' in me else []
      }
      event['loggedIn'] = True
      # update the instance with UID
      row = pf.readOneRow({
        'table': 'instances',
        'where': {
          'instance': event['_session']['instance_id']
      }})
      if row != None:
        values = {
          'uid': event['_session']['uid']
        }
        pf.updateRow({
          'table': 'instances',
          'values': values,
          'where': {
            'instance': event['_session']['instance_id']
        }})
      hub.send({
        'type': 'notify_login',
        'to': 'all',
        'from': me['username']
      })
      # info: user logged in
      if not 'i' in event:
        event['i'] = 'logged in'
    else:
      # error: user not found or wrong password
      event['e'] = 'unauthenticated'
  else:
    # error: user not found or wrong password
    event['e'] = 'unauthenticated'
  return event

# sys.modules[__name__] = (desc[0], desc[1], handler)
