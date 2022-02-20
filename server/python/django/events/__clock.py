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
import datetime

#
# Handle __clock event.  Remove saved instances if
# they have not been heard from in a while.
#
# @author DanielWHoward
#
desc = ('api', '__clock')
def handler(event, vars):
  hub = vars['hub']

  # use seconds since epoch instead of datetime string to demo how this is done
  now = int(datetime.datetime.now().timestamp())
  globalVars = event['globalVars']

  # $timediff = 'start';
  # if (isset($globalVars['lastTime'])) {
  #   $timediff = microtime(true) - $globalVars['lastTime'];
  # }
  # $globalVars['lastTime'] = microtime(true);
  # $hub->send(array(
  #   'to'=>'all',
  #   'type'=>'notify_clock',
  #   'timediff'=>is_float($timediff)? round($timediff * 1000): $timediff
  # ));

  # $disconnect_seconds = 2 * 60;
  # # impersonate other users to keep code clean
  # $username = null;
  # if (isset($hub->session['_username'])) {
  #   $username = $hub->session['_username'];
  # }
  # $hub->impersonate = true;
  # # read users from database that should be disconnected
  # $usernames = $hub->getDisconnectedUsers($disconnect_seconds);
  # for ($u=0; $u < count($usernames); ++$u) {
  #   $hub->session['_username'] = $usernames[$u];
  #   $hub->trigger(array(
  #     'type'=>'logout',
  #     'from'=>$hub->session['_username'],
  #     'to'=>$hub->session['_username']
  #   ));
  # }
  # # turn off impersonation
  # if ($username === null) {
  #   if (isset($hub->session['_username'])) {
  #     unset($hub->session['_username']);
  #   }
  # } else {
  #   $hub->session['_username'] = $username;
  # }
  # $hub->impersonate = false;

  if not 'lastRandomEventTime' in globalVars or (now > globalVars['lastRandomEventTime'] + 10):
    globalVars['lastRandomEventTime'] = now
    if 'numRandom' in globalVars:
      globalVars['numRandom'] += 1
    else:
      globalVars['numRandom'] = 1

    if not 'lastRandomEventIndex' in globalVars:
      globalVars['lastRandomEventIndex'] = 0
    globalVars['lastRandomEventIndex'] = (globalVars['lastRandomEventIndex'] + 1) % 4
    eventIndex = globalVars['lastRandomEventIndex']

    randomUsers = [
      ['admin', 1],
      ['user1', 2]
    ]
    randomTypes = [
      'notify_laughs',
      'notify_jumps'
    ]
    randomUser = randomUsers[eventIndex % 2][0];
    randomType = randomTypes[int(eventIndex/2)];
    hub.send({
      'type': randomType,
      'to': 'all',
      'from': randomUser
    })

    # delete all instances that are too old
    hub.deleteExpired('instances', 2 * 60)
    # delete all events sent to instances that no longer exist
    hub.deleteOrphans('sockets_events', 'sid', 'instances', 'instance')

  return event

# sys.modules[__name__] = (desc[0], desc[1], handler)
