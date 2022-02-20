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

#
# Handle __receive event.  Change event queue to
# use instances instead of usernames.
#
# @author DanielWHoward
#
desc = ('api', '__receive')
def handler(event, vars):
  pf = vars['pf']
  useInstances = 'useInstances' in vars and vars['useInstances']

  # assume that this event does not need special handling
  event['e'] = 'unimplemented'

  if useInstances:
    if not '_session' in event or not 'instance_id' in event['_session']:
      print('__receive did not get _session.instance')

    instance = event['_session']['instance_id']
    event['eventQueue'] = []
    # get the events from the events table
    events = pf.readRows({
      'table': 'sockets_events',
      'where': {
        'sid': instance
    }})
    # this is intentionally not ACID; the client will handle dups
    for evtVal in events:
      evt = evtVal['event'];
      # delete the event from the events table
      pf.deleteRow({
        'table': 'sockets_events',
        'where': {
          'id': evtVal['id']
      }})
      event['eventQueue'].append(evt)
    del event['e']
  return event

# sys.modules[__name__] = (desc[0], desc[1], handler)
