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

#
# Handle _instance event.  Save instance so
# events can be broadcast to it later.
#
# @author DanielWHoward
#
desc = ('api', '_instance')
def handler(event, vars):
  hub = vars['hub']
  # pf = vars['pf']
  useInstances = 'useInstances' in vars and vars['useInstances']

  if useInstances:
    now = date('Y-m-d H:i:s', time())
    localSid = _REQUEST['sid'] if 'sid' in _REQUEST else ''
    uid = event['_session']['uid'] if 'uid' in event['_session'] else 0
    instance = event['instance_id']
    # see if the instance already exists
    row = pf.readOneRow({
      'table': 'instances',
      'where': {
        'instance': instance
    }})
    # save the instance
    if row == None:
      # this is a brand new instance/user
      values = {
        'id': 0,
        'sid': localSid,
        'uid': uid,
        'instance': instance,
        'connected': now,
        'touched': now
      }
      event['_session']['instance_id'] = instance
      pf.insertRow({
        'table': 'instances',
        'values': values
      })
      hub.send({
        'type': 'notify_instance',
        'to': 'all'
      })
    else:
      # if the browser page is reloaded, a new socket is
      #  created with an existing instance
      values = {
        'uid': uid,
        'instance': instance,
        'touched': now
      }
      if localSid != '':
        values['sid'] = localSid
      pf.updateRow({
        'table': 'instances',
        'values': values,
        'where': {
          'instance': event['_session']['instance_id']
      }})
  return event

# sys.modules[__name__] = (desc[0], desc[1], handler)
