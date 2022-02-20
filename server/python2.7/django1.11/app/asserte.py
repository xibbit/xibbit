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

#
# Throw an exception if the assert condition is false.
#
# @param $cond boolean A boolean for the assertion.
# @param $msg The message to use if the assertion fails.
# @throws Exception The assertion failed.
#
# @author DanielWHoward
#
def asserte(cond, msg):
  if not cond:
    raise Exception(msg)

#
# Throw an exception if the event object has too few
# or too many arguments.
#
# @param $event array The event that should be minimal.
# @throws Exception The assertion failed.
#
# @author DanielWHoward
#
def noAsserte(event):
  # check the required properties
  asserte('type' in event, 'missing:type')
  asserte('_id' in event, 'missing:_id')
  asserte('_session' in event, 'missing:_session')
  asserte('_conn' in event, 'missing:_conn')
  # check the "from" property
  keys = len(event)
  if (len(event) == 5) and 'from' in event:
    keys -= 1
  if (len(event) == 5) and 'instance' in event:
    keys -= 1
  if (len(event) == 6) and 'from' in event and 'instance' in event:
    keys -= 2
  if keys != 4:
    # find at least one extra property
    if 'from' in event:
      del event['from']
    if 'instance' in event:
      del event['instance']
    del event['type']
    del event['_id']
    del event['_session']
    del event['_conn']
    keys = event.keys()
    raise Exception('property:'+keys[0])
