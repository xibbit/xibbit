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

from django.shortcuts import render
from django.http import HttpResponse
import time
import datetime
import hashlib
from django.db import connections
import mysql.connector
from app.pwd import *

def index(request):
  sql_prefix = 'pf_'
  sqlite_link = connections['default']
  #sqlite_link.cursor().execute('DROP TABLE `pf_sockets`;')
  #sqlite_link.cursor().execute('DROP TABLE `pf_sockets_events`;')
  #sqlite_link.cursor().execute('DROP TABLE `pf_sockets_sessions`;')
  #sqlite_link.cursor().execute('DROP TABLE `pf_locks`;')
  #sqlite_link.cursor().execute('DROP TABLE `pf_at`;')
  #sqlite_link.cursor().execute('DROP TABLE `pf_users`;')
  #sqlite_link.cursor().execute('DROP TABLE `pf_instances`;')
  html = ''
  html += '<!DOCTYPE html>\n'
  html += '<html>\n'
  html += '<head>\n'
  html += '<meta charset="UTF-8">\n'
  html += '<title>installation</title>\n'
  html += '<style>\n'
  html += '.warn {\n'
  html += '  background-color: yellow;\n'
  html += '}\n'
  html += '.error {\n'
  html += '  background-color: red;\n'
  html += '}\n'
  html += '</style>\n'
  html += '</head>\n'
  html += '<body>\n'
  # get the current time
  now = time.strftime('%Y-%m-%d %H:%M:%S')
  nullDateTime = '1970-01-01 00:00:00'
  daysMap = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
  # connect to the database
  #$link = @mysqli_connect($sql_host, $sql_user, $sql_pass);
  #if (!$link) {
  #  print '<div class="error">'.$sql_host.' mysqli_connect() had a MySQL error ('.mysqli_connect_errno().'): '.mysqli_connect_error().'</div>'."\n";
  #}
  # create the database
  #$q = 'CREATE DATABASE `'.$sql_db.'`';
  #$result = @mysqli_query($link, $q);
  #if (!$result) {
  #  if (mysqli_errno($link) == 1007) {
  #  } else {
  #    print '<div class="error">'.$sql_host.' CREATE DATABASE had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  #  }
  #}
  # select the database
  #$result = mysqli_select_db($link, $sql_db);
  #if (!$result) {
  #  print '<div class="error">'.$sql_host.' mysqli_select_db() had a MySQL error ('.mysqli_errno($link).'): '.mysqli_error($link).'</div>'."\n";
  #}
  #@mysqli_query($link, 'SET NAMES \'utf8\'');

  # create the sockets table
  q = 'CREATE TABLE `'+sql_prefix+'sockets` ( '
  q += '`id` integer PRIMARY KEY autoincrement,'
  q += '`sid` text,'
  q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`props` text);'
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'sockets already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'sockets had a SQLite error: '+errmsg+'</div>\n'

  # create the sockets_events table
  q = 'CREATE TABLE `'+sql_prefix+'sockets_events` ( '
  q += '`id` integer PRIMARY KEY autoincrement,'
  q += '`sid` text,'
  q += '`event` text,'
  q += '`touched` datetime NOT NULL)' # 2014-12-23 06:00:00 (PST)
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'sockets_events already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'sockets_events had a SQLite error: '+errmsg+'</div>\n'

  # create the sockets_sessions table
  q = 'CREATE TABLE `'+sql_prefix+'sockets_sessions` ( '
  q += '`id` integer PRIMARY KEY autoincrement,'
  q += '`socksessid` text,'
  q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`vars` text)'
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'sockets_sessions already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'sockets_sessions had a SQLite error: '+errmsg+'</div>\n'
  # add data to the sockets_sessions table
  q = 'SELECT id FROM '+sql_prefix+'sockets_sessions'
  cursor = sqlite_link.cursor()
  cursor.execute(q)
  if cursor.fetchone() == None:
    values = []
    values.append("0, 'global', '"+now+"', '"+now+"', '{}'")
    #$values = isset($values_sockets_sessions)? $values_sockets_sessions: $values;
    for value in values:
      q = 'INSERT INTO '+sql_prefix+'sockets_sessions VALUES ('+value+')'
      try:
        sqlite_link.cursor().execute(q)
        html += '<div>'+q+'</div>\n'
      except Exception as err:
        errmsg = str(err)
        html += '<div class="error">INSERT INTO: Table '+sql_prefix+'sockets_sessions had a SQLite error: '+errmsg+'</div>\n'
        html += '<div class="error">'+q+'</div>\n'
  else:
    html += '<div class="warn">Table '+sql_prefix+'sockets_sessions already has data!</div>\n'

  # create the locks table
  q = 'CREATE TABLE `'+sql_prefix+'locks` ( '
  q += '`name` TEXT NOT NULL UNIQUE,'
  q += '`created` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`json` text);'
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'locks already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'locks had a SQLite error: '+errmsg+'</div>\n'

  # create the at table
  q = 'CREATE TABLE `'+sql_prefix+'at` ( '
  q += '`id` integer PRIMARY KEY autoincrement,'
  q += '`cmd` text,'
  q += '`executed` datetime,' # 2014-12-23 06:00:00 (PST)
  q += '`dow` text,'
  q += '`elapsed` text);'
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'at already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'at had a SQLite error: '+errmsg+'</div>\n'

  # add data to the at table
  q = 'SELECT id FROM '+sql_prefix+'at'
  cursor = sqlite_link.cursor()
  cursor.execute(q)
  if cursor.fetchone() == None:
    values = []
    values.append("0, '#min hour day mon dow command', '"+now+"', '"+daysMap[datetime.datetime.now().weekday()]+"', ''")
    #$values = isset($values_sockets_sessions)? $values_sockets_sessions: $values;
    for value in values:
      q = 'INSERT INTO '+sql_prefix+'at VALUES ('+value+')'
      try:
        sqlite_link.cursor().execute(q)
        html += '<div>'+q+'</div>\n'
      except Exception as err:
        errmsg = str(err)
        html += '<div class="error">INSERT INTO: Table '+sql_prefix+'at had a SQLite error: '+errmsg+'</div>\n'
        html += '<div class="error">'+q+'</div>\n'
  else:
    html += '<div class="warn">Table '+sql_prefix+'at already has data!</div>\n'

  # create the users table
  q = 'CREATE TABLE `'+sql_prefix+'users` ( '
  q += '`id` integer PRIMARY KEY autoincrement,'
  q += '`uid` integer NOT NULL,'
  q += '`username` text,'
  q += '`email` text,'
  q += '`pwd` text,'
  q += '`created` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`json` text);'
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'users already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'users had a SQLite error: '+errmsg+'</div>\n'
  # add data to the users table
  q = 'SELECT id FROM '+sql_prefix+'users'
  cursor = sqlite_link.cursor()
  cursor.execute(q)
  dataInserted = False
  if cursor.fetchone() == None:
    values = []
    values.append("NULL, 1, 'admin', 'admin@xibbit.github.io', '"+pwd_hash(hashlib.sha256(('admin@xibbit.github.io'+'xibbit.github.io'+'passw0rd').encode('utf-8')).hexdigest())+"', '"+now+"', '"+nullDateTime+"', '"+nullDateTime+"', '{\"roles\":[\"admin\"]}'")
    values.append("NULL, 2, 'user1', 'user1@xibbit.github.io', '"+pwd_hash(hashlib.sha256(('user1@xibbit.github.io'+'xibbit.github.io'+'passw0rd').encode('utf-8')).hexdigest())+"', '"+now+"', '"+nullDateTime+"', '"+nullDateTime+"', '{}'")
    #$values = isset($values_users)? $values_users: $values;
    for value in values:
      q = 'INSERT INTO '+sql_prefix+'users VALUES ('+value+')'
      try:
        sqlite_link.cursor().execute(q)
        html += '<div>'+q+'</div>\n'
      except Exception as err:
        errmsg = str(err)
        html += '<div class="error">INSERT INTO: Table '+sql_prefix+'users had a SQLite error: '+errmsg+'</div>\n'
        html += '<div class="error">'+q+'</div>\n'
  else:
    html += '<div class="warn">Table '+sql_prefix+'users already has data!</div>\n'

  # create the instances table
  q = 'CREATE TABLE `'+sql_prefix+'instances` ( '
  q += '`id` integer PRIMARY KEY autoincrement,'
  q += '`instance` text,'
  q += '`connected` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`touched` datetime NOT NULL,' # 2014-12-23 06:00:00 (PST)
  q += '`sid` text,'
  q += '`uid` integer NOT NULL,'
  q += '`json` text);'
  try:
    sqlite_link.cursor().execute(q)
    html += '<div>'+q+'</div>\n'
  except Exception as err:
    errmsg = str(err)
    if errmsg.endswith(' already exists'):
      html += '<div class="warn">Table '+sql_prefix+'instances already exists!</div>\n'
    else:
      html += '<div class="error">Table '+sql_prefix+'instances had a SQLite error: '+errmsg+'</div>\n'

  html += '  <div>Done.</div>\n'
  html += '</body>\n'
  html += '</html>\n'
  return HttpResponse(html)
