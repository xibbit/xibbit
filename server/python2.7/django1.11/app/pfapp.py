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

import re
from . import array

#
# Convenience class to make xibdb more convenient.
# @author DanielWHoward
#
class pfapp(object):

  #
  # Create an object.
  #
  # @param $xibdb object A XibDb object.
  # @param $sql_prefix string A prefix for database tables.
  #
  # @author DanielWHoward
  #
  def __init__(self, xibdb, sql_prefix):
    self.xibdb = xibdb
    self.sql_prefix = sql_prefix
    self.usernamesNotAllowed = [
      'user'
    ]

  #
  # Return true if debugging.
  #
  # @return boolean True if debugging on.
  #
  # @author DanielWHoward
  #
  def debugging(self):
    return self.xibdb.dumpSql

  #
  # Toggle debugging on/off.
  #
  # @param $on boolean True to dump SQL.
  #
  # @author DanielWHoward
  #
  def debug(self, on=True):
    self.xibdb.dumpSql = on

  #
  # Prepend database table names to an array as appropriate.
  #
  # @param $a array A database query array.
  # @return array A revised database query array.
  #
  # @author DanielWHoward
  #
  def addTableSpecifiers(self, a):
    keywords = ['AND', 'OR']
    if isinstance(a, str) and (re.search(ur'^[A-Za-z0-9]+\\.[A-Za-z0-9]+$', a) != None) and not a.upper() in keywords:
      a = self.sql_prefix+a
    elif isinstance(a, list) or isinstance(a, dict): # both
      b = []
      if array.has_numeric_keys(a):
        for value in a:
          b.append(self.addTableSpecifiers(value))
      else:
        b = {}
        for key, value in a.items():
          if key.upper() == 'TABLE':
            if isinstance(value, str):
              b[key] = self.sql_prefix+value
            else:
              b[key] = []
              for table in value:
                b[key].append(self.sql_prefix+table)
          elif key.upper() == 'ON':
            b[key] = {}
            for k, v in value.items():
              b[key][self.sql_prefix+k] = self.addTableSpecifiers(v)
          else:
            b[self.addTableSpecifiers(key)] = self.addTableSpecifiers(value)
      a = b
    return a

  #
  # Get JSON table rows from the database.
  #
  # If there is no sort column, the rows are in arbitrary
  # order.
  #
  # This method supports multiple JOINs.
  #
  # @param $table array A database query array.
  #
  # @author DanielWHoward
  #
  def readRows(self, querySpec):
    querySpec = self.addTableSpecifiers(querySpec)
    return self.xibdb.readRowsNative(querySpec)

  #
  # Get one JSON table row from the database.
  #
  # If there is no sort column, the rows are in arbitrary
  # order.
  #
  # @param $table string A database table.
  # @param $where string A WHERE clause.
  # @return object A JSON object.
  #
  # @author DanielWHoward
  #
  def readOneRow(self, querySpec):
    rows = self.readRows(querySpec)
    return rows[0] if len(rows) >= 1 else None

  #
  # Get a JSON table description from the database.
  #
  # It does not return "sort" and "json" columns, if any.
  #
  # @param $table string A database table.
  # @return string A string containing a JSON object with columns and default values.
  #
  # @author DanielWHoward
  #
  def readDesc(self, table):
    if isinstance(table, dict): # is_map
      args = array_merge({
      }, table)
      table = args['table']
    table = self.sql_prefix+table
    return json_decode(self.xibdb.readDesc(table), True)

  #
  # Insert a row of JSON into a database table.
  #
  # If there is no sort column, it inserts the row, anyway.
  #
  # @param $table string A database table.
  # @param $values object A JSON object.
  # @param $index int The place to insert the row before; -1 means the end.
  # @param $where string A WHERE clause.
  # @return object A JSON object with updated autoincrement fields.
  #
  # @author DanielWHoward
  #
  def insertRow(self, querySpec):
    querySpec = self.addTableSpecifiers(querySpec)
    return self.xibdb.insertRowNative(querySpec)

  #
  # Delete a row of JSON from a database table.
  #
  # If there is no sort column, it deletes the first row.
  #
  # @param $table string A database table.
  # @param $index mixed The row to delete (int) or JSON data to select the row (string).
  # @param $where string A WHERE clause.
  #
  # @author DanielWHoward
  #
  def deleteRow(self, querySpec):
    querySpec = self.addTableSpecifiers(querySpec)
    return self.xibdb.deleteRowNative(querySpec)

  #
  # Update a row of JSON in a database table.
  #
  # If there is no sort column, it updates the first row.
  #
  # @param $table string A database table.
  # @param $index mixed The row to update (int) or JSON data to select the row (string).
  # @param $values mixed A JSON string (string) or JSON array (array).
  # @param $where string A WHERE clause.
  #
  # @author DanielWHoward
  #
  def updateRow(self, querySpec):
    querySpec = self.addTableSpecifiers(querySpec)
    return self.xibdb.updateRowNative(querySpec)

  #
  # Reorder a row of JSON in a database table.
  #
  # If there is no sort column, it does nothing.
  #
  # @param $table string A database table.
  # @param $where string A WHERE clause.
  # @param $m int The row to move.
  # @param $n int The row to move to.
  #
  # @author DanielWHoward
  #
  def moveRow(self, querySpec):
    querySpec = self.addTableSpecifiers(querySpec)
    return self.xibdb.moveRowNative(querySpec)

  #
  # Flexible mysql_query() function.
  # 
  # @param $query string The query to execute.
  # @return string The mysql_query() return value.
  #
  # @author DanielWHoward
  #
  def mysql_query(self, query):
    if self.debugging():
      print(query)
    return self.xibdb.mysql_query(query)
 
  #
  # Flexible mysql_fetch_assoc() function.
  #
  # @param $result String The result to fetch.
  # @return The mysql_fetch_assoc() return value.
  #
  # @author DanielWHoward
  #
  def mysql_fetch_assoc(self, result):
    return self.xibdb.mysql_fetch_assoc(result)

  #
  # Flexible mysql_free_result() function.
  #
  # @param $result String The result to free.
  # @return The mysql_free_result() return value.
  #
  # @author DanielWHoward
  #
  def mysql_free_query(self, result):
    return self.xibdb.mysql_free_query(result)

  #
  # Flexible mysql_real_escape_string() function.
  # 
  # @param $unescaped_string string The string.
  # @return string The mysql_real_escape_string() return value.
  #
  # @author DanielWHoward
  #
  def mysql_real_escape_string(self, unescaped_string):
    return self.xibdb.mysql_real_escape_string(unescaped_string)

  #
  # Flexible mysql_insert_id() function.
  #
  # @return The mysql_insert_id() return value.
  #
  # @author DanielWHoward
  #/
  def mysql_insert_id(self):
    return self.xibdb.mysql_insert_id()
