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

from django.db import connections
import mysql.connector
from . import pfapp

hub = None

def main():
  global hub

  sqlite_link = connections['default']

  mysql_link = mysql.connector.connect(user='root', password='mysql',
                                host='127.0.0.1',
                                database='publicfigure')

  from xibbit.xibbithub import XibbitHub
  from xibdb.xibdb import XibDb

  xdb = XibDb({
    'json_column': 'json', # freeform JSON column name
    'sort_column': 'n',    # array index column name
    'mysql': {
      'link': mysql_link
    }
    #'sqlite3': {
    #  'link': sqlite_link
    #}
  })

  xdb.dumpSql = False
  xdb.dryRun = False

  # Public Profile specific object
  sql_prefix = 'pf_'
  pf = pfapp.pfapp(xdb, sql_prefix)

  hub = XibbitHub({
    'mysql': {
      'link': mysql_link,
      'SQL_PREFIX': sql_prefix
    },
    'vars': {
      'pf': pf
    }
  })

  import events.__clock
  hub.on('api', '__clock', events.__clock.handler) # events.__clock[2])
  import events.__receive
  hub.on('api', '__receive', events.__receive.handler) # events.__receive[2])
  import events.__send
  hub.on('api', '__send', events.__send.handler) # events.__send[2])
  import events._instance
  hub.on('api', '_instance', events._instance.handler) # events._instance[2])
  import events.init
  hub.on('api', 'init', events.init.handler) # events.init[2])
  import events.login
  hub.on('api', 'login', events.login.handler) # events.login[2])
  import events.logout
  hub.on('on', 'logout', events.logout.handler) # events.logout[2])
  import events.user_create
  hub.on('api', 'user_create', events.user_create.handler) # events.user_create[2])
  import events.user_profile_mail_update
  hub.on('on', 'user_profile_mail_update', events.user_profile_mail_update.handler) # events.user_profile_mail_update[2])
  import events.user_profile_upload_photo
  hub.on('on', 'user_profile_upload_photo', events.user_profile_upload_photo.handler) # events.user_profile_upload_photo[2])
  import events.user_profile
  hub.on('on', 'user_profile', events.user_profile.handler) # events.user_profile[2])

  hub.start()
