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

import datetime
import json
import math
import mysql
import numbers
import secrets
import sqlite3

#
# Reads, inserts, deletes, updates and moves rows in
# MySQL database using the JSON (JavaScript Object
# Notation) format.
#
# Adapted, refactored and re-licensed from the jsonhib
# open source project.
#
# @author DanielWHoward
#
class XibDb(object):
  #
  # Use a database for JSON.
  #
  # Configurations are arrays with keys like "sort_column",
  # "json_column", and "link_identifier" keys.
  #
  # @param config A configuration.
  #
  # @author DanielWHoward
  #
  def __init__(self, config={}):
    self.config = config
    self.cache = {}
    self.mapBool = True
    self.checkConstraints = False
    self.autoCommit = config['autoCommit'] if 'autoCommit' in config else True
    self.dryRun = False
    self.dumpSql = False
    self.opt = True
    self.log = config['log'] if 'log' in config else self
    # generate a unique unguessable identifier
    length = 25
    a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    self.paramRand = ''
    for i in range(length):
      self.paramRand += a[self.rand_secure(0, len(a))]

  #
  # Get JSON table rows from the database.
  #
  # If there is no sort column, the rows are in arbitrary
  # order.
  #
  # @param querySpec String A database table.
  # @param whereSpec String A WHERE clause.
  # @param columnsSpec String A columns clause.
  # @param onSpec String An ON clause.
  # @return A JSON array of objects.
  #
  # @author DanielWHoward
  #
  def readRowsNative(self, querySpec, whereSpec='', columnsSpec='*', onSpec=''):
    if self.dumpSql or self.dryRun:
      self.log.println('readRowsNative()')

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('pre-check: ' + e.Error())
        return None

    # decode the arguments into variables
    queryMap = querySpec
    if not isinstance(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'columns': '*',
      'on': '',
      'where': '',
      'order by': ''
    }, {
      'table': querySpec,
      'columns': columnsSpec,
      'on': onSpec,
      'where': whereSpec,
      'order by': ''
    }, queryMap)
    table = queryMap['table']
    columns = queryMap['columns']
    onVar = queryMap['on']
    where = queryMap['where']
    orderby = queryMap['order by']

    # decode ambiguous table argument
    tableStr = ''
    tableArr = []
    if isinstance(table, list): # is_list
      tableStr = table[0]
      tableArr = table
    elif isinstance(table, str):
      tableStr = table
      tableArr.append(table)
    if isinstance(onVar, dict) and (len(tableArr) == 1): # is_map
      for key, value in onVar.items():
        tableArr.append(key)

    # cache the table description
    dryRun = self.dryRun
    dumpSql = self.dumpSql
    self.dryRun = False
    self.dumpSql = False
    for t in tableArr:
      self.readDescNative(t)
    self.dryRun = dryRun
    self.dumpSql = dumpSql
    descMap = self.cache[tableStr]
    desc = {}
    for tbl in tableArr:
      desc = arrayMerge(desc, self.cache[tbl]['desc_a'])
    sort_field = descMap['sort_column'] if 'sort_column' in descMap else ''
    json_field = descMap['json_column'] if 'json_column' in descMap else ''
    orderByStr = ''
    if sort_field != '':
      orderByStr = ' ORDER BY `' + sort_field + '` ASC'
    if orderby != '':
      orderByStr = ' ORDER BY ' + orderby

    # decode remaining ambiguous arguments
    columnsStr = columns
    if (len(tableArr) >= 2) and isinstance(columns, str) and (columnsStr == '*'):
      # convert '*' to '`table2`.*, `table3`.*'
      columnsStr = ''
      for t in range(1, len(tableArr)):
        tbl = tableArr[t]
        if columnsStr != '':
          columnsStr += ', '
        columnsStr += '`' + tbl + '`.*'
    if isinstance(columns, list): # is_list
      columnsStr = ''
      columnArr = columns
      if len(tableArr) == 1:
        # only one table so it's simple
        for col in columnArr:
          if columnsStr != '':
            columnsStr += ','
          columnsStr += '`' + col + '`'
      elif len(tableArr) > 1:
        # figure out all JOIN syntaxes at the same time
        for col in columnArr:
          if columnsStr != '':
            columnsStr += ','
          columnsStr += '`' + tableStr + '`.`' + col + '`'
        # assume '*' columns from remaining tables
        for t in range(1, len(tableArr)):
          tbl = tableArr[t]
          if columnsStr != '':
            columnsStr += ', '
          columnsStr += '`' + tbl + '`.*'
    onVarStr = onVar
    if isinstance(onVar, list) or isinstance(onVar, dict): # both
      # "on" spec shortcut: assume second table
      tableNamesInBoth = []
      tableArrList = tableArr.keys() if isinstance(tableArr, dict) else tableArr
      onVarList = onVar.keys() if isinstance(onVar, dict) else onVar
      tableNamesInBoth = set(tableArrList).intersection(onVarList)
      if not tableNamesInBoth:
        # explicitly specify the second table
        newOnVar = {}
        newOnVar[tableArr[1]] = onVar
        onVar = newOnVar
      onVarStr = self.implementOn(onVar)
    if onVarStr != '':
      onVarStr = ' ' + onVarStr
    whereStr = where
    if isinstance(where, dict): # is_map
      whereMap = self.applyTablesToWhere(where, tableStr)
      whereStr = self.implementWhere(whereMap)
    if (whereStr != '') and not whereStr.startswith(' '):
      whereStr = ' WHERE ' + whereStr

    config = self.config

    # read the table
    q = 'SELECT ' + columnsStr + ' FROM `' + tableStr + '`' + onVarStr + whereStr + orderByStr + ';'
    params = {}
    rows = self.mysql_query(q)
    # read result
    objs = []
    row = self.mysql_fetch_assoc(rows)
    while row != None:
      obj = {}
      # add the SQL data first
      for key, value in row.items():
        if key == 'class':
          key = 'clazz'
        if key == json_field:
          # add non-SQL JSON data later
          pass
        elif key == config['sort_column']:
          # sort column isn't user data
          pass
        elif value == None:
          obj[key] = None
        elif self.mapBool and isinstance(value, int) and isinstance(desc[key], bool):
          obj[key] = (int(value) == 1)
        elif isinstance(value, int) and isinstance(desc[key], int):
          obj[key] = int(value)
        elif isinstance(value, float) and isinstance(desc[key], float):
          obj[key] = float(value)
        elif isinstance(value, datetime.datetime):
          obj[key] = value
        else:
          val = value
          try:
            if value[0] in ['{', '[']:
              val = json.loads(value)
            obj[key] = val
          except ValueError as e:
            obj[key] = val
      # add non-SQL JSON data
      if (json_field != '') and (row[json_field] != None):
        try:
          jsonMap = json.loads(row[json_field])
          if jsonMap != None:
            for key, value in jsonMap.items():
              obj[key] = value
        except ValueError as e:
          obj[key] = {}
      objs.append(obj)
      row = self.mysql_fetch_assoc(rows)
    self.mysql_free_query(rows)

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('post-check: ' + e.Error())
        return None

    return objs

  def readRows(self, querySpec, whereSpec='', columnsSpec='*', onSpec=''):
    objs = self.readRowsNative(querySpec, whereSpec, columnsSpec, onSpec)
    rowsStr = json.dumps(objs)
    return rowsStr

  #
  # Get a JSON table description from the database.
  #
  # It does not return "sort" and "json" columns, if any.
  #
  # @param querySpec String A database table.
  # @return A string containing a JSON object with columns and default values.
  #
  # @author DanielWHoward
  #
  def readDescNative(self, querySpec):
    if self.dumpSql or self.dryRun:
      self.log.println('readDescNative()')

    # check constraints
    e = ''
#    if self.checkConstraints:
#      e = self.checkJsonColumnConstraint(querySpec)
#      if e != None:
#        self.fail('pre-check: ' + e.Error())
#        return None

    tableStr = querySpec
    if isinstance(querySpec, dict): # is_map
      queryMap = arrayMerge({}, querySpec)
      tableStr = queryMap['table']
    config = self.config

    desc = {}
    if tableStr in self.cache and 'desc_a' in self.cache[tableStr]:
      desc = self.cache[tableStr]['desc_a']
    else:
      # read the table description
      sort_column = ''
      json_column = ''
      auto_increment_column = ''
      q = 'DESCRIBE `' + tableStr + '`;'
      if 'sqlite3' in self.config and 'link' in self.config['sqlite3']:
        q = 'PRAGMA table_info(`' + tableStr + '`);'
      rows = self.mysql_query(q)
      rowdesc = self.mysql_fetch_assoc(rows)
      while rowdesc != None:
        field = rowdesc['Field']
        typ = rowdesc['Type']
        extra = rowdesc['Extra']
        if field == config['sort_column']:
          sort_column = field
        elif field == config['json_column']:
          json_column = field
        elif self.mapBool and ('tinyint(1)' in typ):
          desc[field] = False
        elif 'int' in typ:
          desc[field] = 0
        elif 'float' in typ:
          desc[field] = float(0)
        elif 'double' in typ:
          desc[field] = doubleval(0)
        elif 'datetime' in typ:
          desc[field] = str(datetime.datetime(1970, 1, 1))
        else:
          desc[field] = ''
        if extra == 'auto_increment':
          auto_increment_column = field
        rowdesc = self.mysql_fetch_assoc(rows)
      self.mysql_free_query(rows)

      # cache the description
      if tableStr not in self.cache:
        self.cache[tableStr] = {}
      self.cache[tableStr]['desc_a'] = desc
      descStr = json.dumps(desc)
      self.cache[tableStr]['desc'] = descStr
      if sort_column != '':
        self.cache[tableStr]['sort_column'] = sort_column
      if json_column != '':
        self.cache[tableStr]['json_column'] = json_column
      if auto_increment_column != '':
        self.cache[tableStr]['auto_increment_column'] = auto_increment_column

    # check constraints
#    if self.checkConstraints:
#      e = self.checkJsonColumnConstraint(querySpec)
#      if e != None:
#        self.fail('post-check: ' + e.Error())
#        return None

    return desc

  def readDesc(self, querySpec):
    desc = self.readDescNative(querySpec)
    descStr = json.dumps(desc)
    return descStr

  #
  # Insert a row of JSON into a database table.
  #
  # If there is no sort column, it inserts the row, anyway.
  #
  # @param querySpec String A database table.
  # @param whereSpec String A WHERE clause.
  # @param valuesSpec mixed A JSON string (string) or JSON array (array).
  # @param nSpec int The place to insert the row before; -1 means the end.
  #
  # @author DanielWHoward
  #
  def insertRowNative(self, querySpec, whereSpec='', valuesSpec='{}', nSpec=-1):
    if self.dumpSql or self.dryRun:
      self.log.println('insertRowNative()')

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('pre-check: ' + e.Error())
        return None

    # decode the arguments into variables
    queryMap = querySpec
    if not isinstance(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'values': '',
      'n': -1,
      'where': ''
    }, {
      'table': querySpec,
      'values': valuesSpec,
      'n': nSpec,
      'where': whereSpec
    }, queryMap)
    table = queryMap['table']
    values = queryMap['values']
    n = queryMap['n']
    where = queryMap['where']

    # decode ambiguous table argument
    tableStr = table

    # cache the table description
    dryRun = self.dryRun
    dumpSql = self.dumpSql
    self.dryRun = False
    self.dumpSql = False
    self.readDescNative(tableStr)
    self.dryRun = dryRun
    self.dumpSql = dumpSql
    descMap = self.cache[tableStr]
    desc = descMap['desc_a']
    sort_field = descMap['sort_column'] if 'sort_column' in descMap else ''
    json_field = descMap['json_column'] if 'json_column' in descMap else ''
    auto_increment_field = descMap['auto_increment_column'] if 'auto_increment_column' in descMap else ''
    orderByStr = ''
    if sort_field != '':
      orderByStr = ' ORDER BY `' + sort_field + '` DESC'

    # decode remaining ambiguous arguments
    valuesStr = values;
    valuesMap = values;
    sqlValuesMap = {} # SET clause
    jsonMap = {} # 'json' field
    if isinstance(values, str):
      valuesStr = ' ' + values
      valuesMap = {}
    else:
      valuesStr = ''
      valuesMap = arrayMerge({}, values)
      jsonMap = arrayMerge({}, values)
      # copy SQL columns to sqlValuesMap
      for col, colValue in desc.items():
        if col in jsonMap:
          compat = False
          if type(desc[col]) == type(jsonMap[col]):
            compat = True
          if isinstance(desc[col], float) and isinstance(jsonMap[col], int):
            compat = True
          if isinstance(desc[col], str):
            compat = True
          if compat:
            sqlValuesMap[col] = jsonMap[col]
            del jsonMap[col]
      # copy freeform values into 'json' field
      if json_field != '':
        sqlValuesMap[json_field] = jsonMap
    nInt = n
    whereStr = where
    if isinstance(where, dict): # is_map
      whereStr = self.implementWhere(where)
    if whereStr != '' and not whereStr.startswith(' '):
      whereStr = ' WHERE ' + whereStr
    limitStr = ''
    if self.opt or (nInt == -1):
      limitStr = ' LIMIT 1'

    transaction = self.xibdb_begin()

    qa = []
    params = {}

    # update the positions
    if sort_field != '':
      nLen = 0
      q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + limitStr + ';'
      qr_reorder = self.mysql_query(q)
      row = self.mysql_fetch_assoc(qr_reorder)
      while row != None:
        nValue = int(row[sort_field])
        if nValue >= nLen:
          nLen = nValue + 1
        if nInt == -1:
          nInt = nValue + 1
        if nInt > nValue:
          break
        setStr = ''
        andStr = ' WHERE '
        if whereStr != '':
          andStr = ' AND '
        if self.opt:
          setStr += ' SET `' + sort_field + '`=`' + sort_field + '`+1'
          andStr += '`' + sort_field + '`>=' + str(nInt)
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
          qa.append(q)
          break
        else:
          setStr += ' SET `' + sort_field + '`=' + str(nValue+1)
          andStr += ' `' + sort_field + '`=' + str(nValue)
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
          qa.append(q)
        row = self.mysql_fetch_assoc(qr_reorder)
      self.mysql_free_query(qr_reorder)
      if nInt == -1:
        nInt = 0
      if nInt > nLen:
        self.fail('`n` value out of range', q)
        return None

      # add sort field to sqlValuesMap
      if len(sqlValuesMap) > 0:
        sqlValuesMap[sort_field] = nInt

    # finally, generate valuesStr from valuesMap
    if len(sqlValuesMap) > 0:
      colsStr = ''
      for col, value in sqlValuesMap.items():
        if col != descMap['auto_increment_column']:
          if colsStr != '':
            colsStr += ','
          colsStr += '`' + self.mysql_real_escape_string(col) + '`'
          if valuesStr != '':
            valuesStr += ','
          param = '{{{' + self.paramRand + '--value--' + str(len(qa)) + '--' + col + '}}}'
          params[param] = value
          valuesStr += param
      valuesStr = ' (' + colsStr + ') VALUES (' + valuesStr + ')'

    q = 'INSERT INTO `' + tableStr + '`' + valuesStr + ';'
    qa.append(q)

    qr = None

    for q in qa:
      try:
        if qr != None:
          self.mysql_free_query(qr)
        qr = self.mysql_query(q, params)
      except Exception as e:
        self.fail(e, q, transaction)
        return None

    if (auto_increment_field != '') and (qr != None):
      valuesMap[auto_increment_field] = self.mysql_insert_id(qr)

    self.mysql_free_exec(qr)

    self.xibdb_commit(transaction)

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('post-check: ' + e.Error())
        return None

    return valuesMap

  def insertRow(self, querySpec, whereSpec='', valuesSpec='{}', nSpec=-1):
    valuesMap = self.insertRowNative(querySpec, whereSpec, valuesSpec, nSpec)
    valuesStr = json.dumps(valuesMap)
    return valuesStr

  #
  # Delete a row of JSON from a database table.
  #
  # If there is no sort column, it deletes the first row.
  #
  # @param querySpec String A database table.
  # @param whereSpec String A WHERE clause.
  # @param nSpec mixed The row to delete (int) or JSON data to select the row (string).
  #
  # @author DanielWHoward
  #
  def deleteRowNative(self, querySpec, whereSpec='', nSpec=''):
    if self.dumpSql or self.dryRun:
      self.log.println('deleteRowNative()')

    # check constraints
    e = None
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('pre-check: ' + e.Error())
        return None

    # decode the arguments into variables
    queryMap = querySpec
    if not isinstance(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'n': '',
      'where': ''
    }, {
      'table': querySpec,
      'n': nSpec,
      'where': whereSpec
    }, queryMap)
    table = queryMap['table']
    n = queryMap['n']
    where = queryMap['where']

    # decode ambiguous table argument
    tableStr = table

    # cache the table description
    dryRun = self.dryRun
    dumpSql = self.dumpSql
    self.dryRun = False
    self.dumpSql = False
    self.readDescNative(tableStr)
    self.dryRun = dryRun
    self.dumpSql = dumpSql
    descMap = self.cache[tableStr]
    sort_field = descMap['sort_column'] if 'sort_column' in descMap else ''
    json_field = descMap['json_column'] if 'json_column' in descMap else ''

    transaction = self.xibdb_begin()

    # decode remaining ambiguous arguments
    params = {}
    nInt = n
    nStr = n
    whereStr = where
    if isinstance(where, dict): # is_map
      whereStr = self.implementWhere(where)
    if (whereStr != '') and not whereStr.startswith(' '):
      whereStr = ' WHERE ' + whereStr
    andStr = ''
    if (sort_field != '') and isinstance(n, int) and (n != -1):
      opStr = ' WHERE '
      if whereStr != '':
        opStr = ' AND '
      andStr += opStr + '`' + sort_field + '`=' + str(nInt)
    else:
      if nInt == -1:
        andStr = ''
      if isinstance(n, str) and (nStr != ''):
        try:
          nMap = json.loads(nStr)
          for col, value in nMap.items():
            if (andStr == '') and (whereStr == ''):
              andStr += ' WHERE '
            else:
              andStr += ' AND '
            andStr += col + "='" + value + "'"
        except ValueError as e:
          andStr += nStr
      field = sort_field
      if sort_field == '':
        field = '*'
      orderByStr = ''
      if sort_field != '':
        orderByStr = ' ORDER BY `' + sort_field + '` DESC'
      q = 'SELECT COUNT(*) AS num_rows FROM `' + tableStr + '`' + whereStr + andStr + orderByStr + ';'
      qr = self.mysql_query(q)
      num_rows = 0
      row = self.mysql_fetch_assoc(qr)
      while row != None:
        num_rows = int(row['num_rows'])
        row = self.mysql_fetch_assoc(qr)
      if nInt == -1:
        nInt = num_rows - 1
      self.mysql_free_query(qr)
      quotedField = field
      if field != '*':
        quotedField = '`' + field + '`'
      q = 'SELECT ' + quotedField + ' FROM `' + tableStr + '`' + whereStr + andStr + orderByStr + ';'
      # verify that non-standard n var yields valid rows
      if (num_rows == 1) or ((num_rows > 1) and (sort_field != '')):
        qr = self.mysql_query(q)
        row = self.mysql_fetch_assoc(qr)
        rowUnused = row
        while rowUnused != None:
          rowUnused = self.mysql_fetch_assoc(qr)
        if num_rows == 1:
          if sort_field != '':
            n = int(row[sort_field])
          self.mysql_free_query(qr)
        elif (num_rows > 1) and (sort_field != ''):
          n = row[sort_field]
          if (andStr == '') and (whereStr == ''):
            andStr += ' WHERE '
          else:
            andStr += ' AND '
          andStr += '`' + sort_field + '`=' + str(n)
        self.mysql_free_query(qr)
      else:
        e = 'xibdb.DeleteRow():num_rows:' + num_rows
        self.fail(e, q)
        return None

    qa = []

    # update the positions
    if sort_field != '':
      nLen = 0
      orderByStr = ' ORDER BY `' + sort_field + '` ASC'
      limitStr = ''
      if self.opt:
        orderByStr = ' ORDER BY `' + sort_field + '` DESC'
        limitStr = ' LIMIT 1'
      q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + limitStr + ';'
      qr_reorder = self.mysql_query(q)
      row = self.mysql_fetch_assoc(qr_reorder)
      while row != None:
        nValue = int(row[sort_field])
        if nValue >= nLen:
          nLen = nValue + 1
        setStr = ''
        andSetStr = ' WHERE '
        if whereStr != '':
          andSetStr = ' AND '
        if self.opt:
          setStr += ' SET `' + sort_field + '`=`' + sort_field + '`-1'
          andSetStr += '`' + sort_field + '`>=' + str(nInt)
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andSetStr + ';'
          qa.append(q)
          break
        else:
          setStr += ' SET `' + sort_field + '`=' + str(nValue-1)
          andSetStr += '`' + sort_field + '`=' + nValue
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andSetStr + ';'
          qa.append(q)
        row = self.mysql_fetch_assoc(r_reorder)
      self.mysql_free_query(qr_reorder)
      if nInt >= nLen:
        e = '`n` value out of range'
        self.fail(e, q)
        return None

    q = 'DELETE FROM `' + tableStr + '`' + whereStr + andStr + ';'
    qa.insert(0, q)

    qr = None

    for q in qa:
      try:
        qr = self.mysql_query(q, params)
        self.mysql_free_query(qr)
      except Exception as e:
        self.fail(e, q, transaction)
        return None

    self.xibdb_commit(transaction)

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('post-check: ' + e.Error())
        return None

    return e

  def deleteRow(self, querySpec, whereSpec='', nSpec=''):
    return self.deleteRowNative(querySpec, whereSpec, nSpec)

  #
  # Update a row of JSON in a database table.
  #
  # If there is no sort column, it updates the first row.
  #
  # @param querySpec String A database table.
  # @param valuesSpec mixed A JSON string (string) or JSON array (array).
  # @param nSpec mixed The row to update (int) or JSON data to select the row (string).
  # @param whereSpec String A WHERE clause.
  # @param limitSpec int A LIMIT value for number of rows to retrieve.
  #
  # @author DanielWHoward
  #
  def updateRowNative(self, querySpec, valuesSpec='', nSpec=-1, whereSpec='', limitSpec=1):
    if self.dumpSql or self.dryRun:
      self.log.println('updateRowNative()')

    # check constraints
    e = None
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('pre-check: ' + e.Error())
        return None

    # decode the arguments into variables
    queryMap = querySpec
    if not isinstance(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'values': '',
      'n': -1,
      'where': '',
      'limit': 1
    }, {
      'table': querySpec,
      'values': valuesSpec,
      'n': nSpec,
      'where': whereSpec,
      'limit': limitSpec
    }, queryMap)
    table = queryMap['table']
    values = queryMap['values']
    n = queryMap['n']
    where = queryMap['where']
    limit = queryMap['limit']

    # decode ambiguous table argument
    tableStr = table

    # cache the table description
    dryRun = self.dryRun
    dumpSql = self.dumpSql
    self.dryRun = False
    self.dumpSql = False
    self.readDescNative(tableStr)
    self.dryRun = dryRun
    self.dumpSql = dumpSql
    descMap = self.cache[tableStr]
    desc = descMap['desc_a']
    sort_field = descMap['sort_column'] if 'sort_column' in descMap else ''
    json_field = descMap['json_column'] if 'json_column' in descMap else ''
    orderByStr = ''
    if sort_field != '':
      orderByStr = ' ORDER BY `' + sort_field + '` ASC'

    # decode remaining ambiguous arguments
    valuesStr = values
    valuesMap = values
    sqlValuesMap = {} # SET clause
    jsonMap = {} # 'json' field
    if isinstance(values, str):
      valuesStr = ' SET ' + values
      valuesMap = {}
    else:
      valuesStr = ''
      valuesMap = arrayMerge({}, valuesMap)
      jsonMap = arrayMerge({}, valuesMap)
      # copy SQL columns to sqlValuesMap
      for col, colValue in desc.items():
        if col in jsonMap:
          compat = False
          if col in desc:
            if type(desc[col]) == type(jsonMap[col]):
              compat = True
            if isinstance(desc[col], float) and isinstance(jsonMap[col], int):
              compat = True
            if isinstance(desc[col], str):
              compat = True
            if compat:
              sqlValuesMap[col] = jsonMap[col]
              del jsonMap[col]
    updateJson = (json_field != '') and (len(jsonMap) > 0)
    nInt = n
    limitInt = limit
    whereStr = where
    if isinstance(where, dict): # is_map
      whereStr = self.implementWhere(where)
    if (whereStr != '') and not whereStr.startswith(' '):
      whereStr = ' WHERE ' + whereStr
    andStr = ''
    if (sort_field != '') and (nInt >= 0):
      andStr = ' WHERE'
      if whereStr != '':
        andStr = ' AND'
      andStr += ' `' + sort_field + '`=' + str(nInt)

    transaction = self.xibdb_begin()

    # get the number of rows_affected and save values
    q = 'SELECT * FROM `' + tableStr + '`' + whereStr + andStr + orderByStr + ';'
    params = {}
    qr = self.mysql_query(q)
    rows_affected = 0
    sqlRowMaps = []
    row = self.mysql_fetch_assoc(qr)
    while (row != None):
      rows_affected += 1
      rowValues = {}
      for col, value in row.items():
        rowValues[col] = value
      # test json_field contents for each affected row
      if updateJson:
        jsonRowMap = json.loads(row[json_field])
        if jsonRowMap == None:
          e = '"' + self.mysql_real_escape_string(row[json_field]) + '" value in `' + json_field + '` column in `' + tableStr + '` table; ' + e
          self.fail(e, q)
          return None
      sqlRowMaps.append(rowValues)
      row = self.mysql_fetch_assoc(qr)
    self.mysql_free_query(qr)

    if rows_affected == 0:
      if andStr == '':
        e = '0 rows affected'
        self.fail(e, q)
        return None
      q = 'SELECT COUNT(*) AS rows_affected FROM `' + tableStr + '`' + whereStr + ';'
      qr = self.mysql_query(q)
      row = self.mysql_fetch_assoc(qr)
      while row != None:
        rows_affected = int(row['rows_affected'])
        row = self.mysql_fetch_assoc(qr)
      self.mysql_free_query(qr)
      if rows_affected > 0:
        e = '`n` value out of range'
      else:
        e = '0 rows affected'
      self.fail(e, q)
      return None
    elif (limitInt != -1) and (rows_affected > limitInt):
      e = '' + str(rows_affected) + ' rows affected but limited to ' + str(limitInt) + ' rows'
      self.fail(e, q)
      return None

    qa = []

    # generate UPDATE statements using json_field
    if isinstance(values, str):
      q = 'UPDATE `' + tableStr + '`' + valuesStr + whereStr + andStr + ';'
      qa.append(q)
    else:
      for sqlRowMap in sqlRowMaps:
        # construct SET clause
        valuesRow = ' SET '
        for col, oldValue in sqlRowMap.items():
          newValue = oldValue
          if updateJson and (col == json_field):
            # figure out newValue for json_field
            oldMap = json.loads(oldValue)
            newMap = arrayMerge(oldMap, jsonMap)
            newValue = json.dumps(newMap)
            if (newValue == '') or (newValue == '[]'):
              newValue = '{}'
          elif col in sqlValuesMap:
            newValue = sqlValuesMap[col]
          # add changed values to SET clause
          if oldValue != newValue:
            param = '{{{' + self.paramRand + '--set--' + str(len(qa)) + '--' + col + '}}}'
            params[param] = newValue
            if valuesRow != ' SET ':
              valuesRow += ', '
            valuesRow += '`' + self.mysql_real_escape_string(col) + '`=' + param
        # construct WHERE clause
        whereRow = ' WHERE '
        for col, value in sqlRowMap.items():
          opStr = '='
          if isinstance(value, float) and isinstance(desc[col], float):
            opStr = ' LIKE '
          if not('sqlite3' in self.config and 'link' in self.config['sqlite3'] and opStr == ' LIKE '):
            param = '{{{' + self.paramRand + '--where--' + str(len(qa)) + '--' + col + '}}}'
            params[param] = value
            if whereRow != ' WHERE ':
              whereRow += ' AND '
            whereRow += '`' + self.mysql_real_escape_string(col) + '`' + opStr + param
        if valuesRow != ' SET ':
          q = 'UPDATE `' + tableStr + '`' + valuesRow + whereRow + ' LIMIT 1;'
          if 'sqlite3' in self.config and 'link' in self.config['sqlite3']:
            q = 'UPDATE `' + tableStr + '`' + valuesRow + whereRow + ';'
          qa.append(q)

    qr = None

    for q in qa:
      try:
        qr = self.mysql_query(q, params)
        self.mysql_free_query(qr)
      except Exception as e:
        self.fail(e, q, transaction)
        return None

    self.xibdb_commit(transaction)

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('post-check: ' + e.Error())
        return None

    return valuesMap

  def updateRow(self, querySpec, whereSpec='', nSpec=-1, valuesSpec='', limitSpec=1):
    valuesMap = self.updateRowNative(querySpec, whereSpec, nSpec, valuesSpec, limitSpec)
    valuesStr = json.dumps(valuesMap)
    return valuesStr

  #
  # Reorder a row of JSON in a database table.
  #
  # If there is no sort column, it does nothing.
  #
  # @param querySpec String A database table.
  # @param whereSpec String A WHERE clause.
  # @param mSpec int The row to move.
  # @param nSpec int The row to move to.
  #
  # @author DanielWHoward
  #
  def moveRowNative(self, querySpec, whereSpec='', mSpec=0, nSpec=0):
    if self.dumpSql or self.dryRun:
      self.log.println('moveRowNative()')

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('pre-check: ' + e.Error())
        return None

    # decode the arguments into variables
    queryMap = querySpec
    if not isinstance(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'm': 0,
      'n': 0,
      'where': ''
    }, {
      'table': querySpec,
      'm': mSpec,
      'n': nSpec,
      'where': whereSpec
    }, queryMap)
    table = queryMap['table']
    m = queryMap['m']
    n = queryMap['n']
    where = queryMap['where']

    # decode ambiguous table argument
    tableStr = table

    # cache the table description
    dryRun = self.dryRun
    dumpSql = self.dumpSql
    self.dryRun = False
    self.dumpSql = False
    self.readDescNative(tableStr)
    self.dryRun = dryRun
    self.dumpSql = dumpSql
    descMap = self.cache[tableStr]
    desc = descMap['desc_a']
    sort_field = descMap['sort_column'] if 'sort_column' in descMap else ''
    orderByStr = ''
    if sort_field != '':
      orderByStr = ' ORDER BY `' + sort_field + '` DESC'
    else:
      self.fail(tableStr + ' does not have a sort_field')
      return None
    limitStr = ' LIMIT 1'

    if m == n:
      self.fail('`m` and `n` are the same so nothing to do')
      return None

    # decode remaining ambiguous arguments
    whereStr = where
    if isinstance(where, dict): # is_map
      whereMap = self.applyTablesToWhere(where, tableStr)
      whereStr = self.implementWhere(whereMap)
    if (whereStr != '') and not whereStr.startswith(' '):
      whereStr = ' WHERE ' + whereStr
    opStr = ''
    if (sort_field != '') and (n >= 0):
      opStr = ' WHERE'
      if whereStr != '':
        opStr = ' AND'

    transaction = self.xibdb_begin()

    # get the length of the array
    q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + limitStr + ';'
    params = {}
    qr_end = self.mysql_query(q)
    nLen = 0
    row = self.mysql_fetch_assoc(qr_end)
    if row != None:
      nLen = int(row[sort_field]) + 1
    self.mysql_free_query(qr_end)
    if (m < 0) or (m >= nLen):
      self.fail('`m` value out of range', q)
      return None
    if (n < 0) or (n >= nLen):
      self.fail('`n` value out of range', q)
      return None

    qa = []

    # save the row at the m-th to the end
    setStr = ' SET `' + sort_field + '`=' + str(nLen)
    andStr = opStr + ' `' + sort_field + '`=' + str(m)
    q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
    qa.append(q)

    # update the indices between m and n
    if self.opt:
      if m < n:
        setStr = ' SET `' + sort_field + '`=`' + sort_field + '`-1'
        andStr = opStr + ' `' + sort_field + '`>' + str(m) + ' AND `' + sort_field + '`<=' + str(n)
      else:
        setStr = ' SET `' + sort_field + '`=`' + sort_field + '`+1'
        andStr = opStr + ' `' + sort_field + '`>=' + str(n) + ' AND `' + sort_field + '`<' + str(m)
      q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
      qa.append(q)
    else:
      if m < n:
        for i in range(m, n):
          setStr = ' SET `' + sort_field + '`=' + str(i)
          andStr = opStr + ' `' + sort_field + '`=' + str(i+1)
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
          qa.append(q)
      else:
        for i in range(m-1, n-1, -1):
          setStr = ' SET `' + sort_field + '`=' + str(i+1)
          andStr = opStr + ' `' + sort_field + '`=' + str(i)
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
          qa.append(q)

    # copy the row at the end to the n-th position
    setStr = ' SET `' + sort_field + '`=' + str(n)
    andStr = opStr + ' `' + sort_field + '`=' + str(nLen)
    q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';'
    qa.append(q)

    qr = None

    for q in qa:
      try:
        qr = self.mysql_query(q, params)
        self.mysql_free_query(qr)
      except Exception as e:
        self.fail(e, q, transaction)
        return None

    self.xibdb_commit(transaction)

    # check constraints
    if self.checkConstraints:
      e = self.checkSortColumnConstraint(querySpec, whereSpec)
      if e == None:
        e = self.checkJsonColumnConstraint(querySpec, whereSpec)
      if e != None:
        self.fail('post-check: ' + e.Error())
        return None

    return True

  def moveRow(self, querySpec, whereSpec='', mSpec=0, nSpec=0):
    return self.moveRowNative(querySpec, whereSpec, mSpec, nSpec)

  #
  # Flexible mysql_query() function.
  #
  # @param query String The query to execute.
  # @param a Map A parameterized query argument map.
  # @return The mysql_query() return value.
  #
  # @author DanielWHoward
  #
  def mysql_query(self, query, a={}):
    if self.dumpSql or self.dryRun:
      self.log.println(query)
    if self.dryRun and not query.startswith('SELECT ') and not query.startswith('DESCRIBE '):
      return None
    link_identifier = None
    cursor = None
    e = ''
    if not a:
      if 'mysql' in self.config and 'link' in self.config['mysql']:
        link_identifier = self.config['mysql']['link']
        try:
          cursor = link_identifier.cursor()
          cursor.execute(query)
          if query.startswith('UPDATE ') or query.startswith('INSERT ') or query.startswith('DELETE '):
            link_identifier.commit()
        except mysql.connector.Error as err:
          e = err
      elif 'sqlite3' in self.config and 'link' in self.config['sqlite3']:
        link_identifier = self.config['sqlite3']['link']
        try:
          cursor = link_identifier.cursor()
          cursor.execute(query)
          if query.startswith('UPDATE ') or query.startswith('INSERT ') or query.startswith('DELETE '):
            link_identifier.commit()
        except sqlite3.Error as err:
          e = err
    else:
      query = self.xibdb_flatten_query(query, a)
      return self.mysql_query(query)
    # fail on error
    if e != '':
      self.fail(e, query)
    return cursor

  #
  # Renamed mysql_query() for INSERT queries so
  # mysql_insert_id() will work.
  #
  # @param query String The query to execute.
  # @param a Map A parameterized query argument map.
  # @return The mysql_query() return value.
  #
  # @author DanielWHoward
  #
  def mysql_exec(self, query, a={}):
    return self.mysql_query(query, a)

  #
  # Flexible mysql_fetch_assoc() function.
  #
  # @param result String The result to fetch.
  # @return The mysql_fetch_assoc() return value.
  #
  # @author DanielWHoward
  #
  def mysql_fetch_assoc(self, result):
    assoc = None
    cursor = result
    if result == None:
      assoc = None
    elif 'mysql' in self.config:
      row = cursor.fetchone()
      if row != None:
        column_names = cursor.column_names
        assoc = dict(zip(column_names, row))
    else:
      row = cursor.fetchone()
      if row != None:
        describeQuery = False
        column_names = [unicode(d[0], 'utf-8') for d in cursor.description]
        if column_names == [u'cid', u'name', u'type', u'notnull', u'dflt_value', u'pk']:
          describeQuery = True
        if describeQuery:
          column_names = [u'cid', u'Field', u'Type', u'Null', u'Default', u'Key']
        assoc = dict(zip(column_names, row))
        if describeQuery:
          del assoc[u'cid']
          assoc[u'Null'] = u'YES' if assoc[u'Null'] == 0 else u'NO'
          assoc[u'Key'] = u'PRI' if assoc[u'Key'] == 1 else u''
          assoc[u'Extra'] = u'auto_increment' if assoc[u'Key'] == u'PRI' else ''
    return assoc

  #
  # Flexible mysql_free_result() function.
  #
  # @param result String The result to free.
  # @return The mysql_free_result() return value.
  #
  # @author DanielWHoward
  #
  def mysql_free_query(self, result):
    e = ''
    if result != None:
      result.close()
    if e != '':
      self.fail(e)

  #
  # Flexible mysql_free_result() function for INSERTs.
  #
  # @param result String The result to free.
  # @return The mysql_free_result() return value.
  #
  # @author DanielWHoward
  #
  def mysql_free_exec(self, result):
    pass

  #
  # Flexible mysql_real_escape_string() function.
  #
  # @param unescaped_string String The string.
  # @return The mysql_real_escape_string() return value.
  #
  # @author DanielWHoward
  #
  def mysql_real_escape_string(self, unescaped_string):
    if 'mysql' in self.config and 'link' in self.config['mysql']:
      return str(self.config['mysql']['link'].converter.escape(unescaped_string))
    if 'sqlite3' in self.config and 'link' in self.config['sqlite3']:
      return str(unescaped_string).replace('\'', '\'\'')
    return unescaped_string

  #
  # Flexible mysql_insert_id() function.
  #
  # @return The mysql_insert_id() return value.
  #
  # @author DanielWHoward
  #
  def mysql_insert_id(self, result):
    if 'mysql' in self.config and 'link' in self.config['mysql']:
      return result.lastrowid
    if 'sqlite3' in self.config and 'link' in self.config['sqlite3']:
      return result.lastrowid
    return mysql_insert_id()

  #
  # Begin a database transaction.
  #
  # @author DanielWHoward
  #
  def xibdb_begin(self):
    transaction = None
    return transaction

  #
  # Commit a database transaction.
  #
  # @author DanielWHoward
  #
  def xibdb_commit(self, transaction):
    committed = True
    return committed

  #
  # Return query string with argument map appied.
  #
  # An argument map allows the caller to specify his
  # own string template substitutions.  This allows
  # xibdb to convert a query to a real parameterized
  # query in mysql_query().  But this method just does
  # a dumb substitution to create a query with escaped
  # strings.
  #
  # @param query String The query to execute.
  # @param a An argument map.
  # @return The mysql_query() return value.
  #
  # @author DanielWHoward
  #
  def xibdb_flatten_query(self, query, a):
    for name, value in a.items():
      valueStr = ''
      if isinstance(value, dict): # is_map
        jsonStr = json.dumps(value)
        if (jsonStr == '') or (jsonStr == '[]'):
          jsonStr = '{}'
        valueStr = "'" + self.mysql_real_escape_string(jsonStr) + "'"
      elif self.mapBool and isinstance(value, bool):
        if value:
          valueStr = '1'
        else:
          valueStr = '0'
      elif isinstance(value, int):
        valueStr = str(value)
      elif isinstance(value, float):
        valueStr = str(value)
        if valueStr.endswith('.0'):
          valueStr = valueStr[:-2]
      elif value == None:
        valueStr = 'NULL'
      elif isinstance(value, datetime.datetime):
        valueStr = value.strftime('%Y-%m-%d %H:%M:%S')
        valueStr = "'" + self.mysql_real_escape_string(valueStr) + "'"
      else:
        valueStr = "'" + self.mysql_real_escape_string(value) + "'"
      query = query.replace(name, valueStr)
    return query

  #
  # Roll back a database transaction.
  #
  # @author DanielWHoward
  #
  def xibdb_rollback(self, transaction):
    rolledBack = True
    return rolledBack

  #
  # Return true if the data in a table, optionally
  # filtered with a WHERE clause, has integers 0 .. n-1
  # in its sort_column such that it is an array.
  #
  # @param a An array with WHERE clause specification.
  # @param table An array of tables.
  # @return A clause string.
  #
  # @author DanielWHoward
  #
  def checkSortColumnConstraint(self, querySpec, whereSpec):
    e = None

    # decode the arguments into variables
    queryMap = querySpec
    if not instanceOf(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'where': ''
    }, {
      'table': querySpec,
      'where': whereSpec
    }, queryMap)
    table = queryMap['table']
    where = queryMap['where']

    # decode ambiguous table argument
    tableStr = table
    whereStr = where

    # cache the table description
    self.readDescNative(tableStr)
    descMap = self.cache[tableStr]
    sort_field = descMap['sort_column']
    orderByStr = ''
    if sort_field != '':
      orderByStr = ' ORDER BY `' + sort_field + '` ASC'
    else:
      e = Exception('checkSortColumnConstraint(): ' + tableStr + ' does not contain `' + sort_field + '`')

    if e == None:
      # decode remaining ambiguous arguments
      if isinstance(where, dict): # is_map
        whereStr = self.implementWhere(where)
      if (whereStr != '') and not whereStr.startswith(' '):
        whereStr = ' WHERE ' + whereStr

      # read the table
      q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + ';'
      rows = self.mysql_query(q)
      # read result
      n = 0
      row = self.mysql_fetch_assoc(rows)
      while row != None:
        if int(row[sort_field]) != n:
          err = '"' + str(n) + '" value in `' + sort_field + '` column in ' + tableStr + ' table; missing'
          e = Exception('checkSortColumnConstraint(): ' + err)
        n += 1
        row = self.mysql_fetch_assoc(rows)
      self.mysql_free_query(rows)

    return e

  #
  # Return true if the data in a table, optionally
  # filtered with a WHERE clause, has integers 0 .. n-1
  # in its sort_column such that it is an array.
  #
  # @param a An array with WHERE clause specification.
  # @param table An array of tables.
  # @return A clause string.
  #
  # @author DanielWHoward
  #
  def checkJsonColumnConstraint(self, querySpec, whereSpec):
    e = None

    # decode the arguments into variables
    queryMap = querySpec
    if not isinstance(queryMap, dict): # not is_map
      queryMap = {}
    queryMap = array3Merge({
      'table': '',
      'where': ''
    }, {
      'table': querySpec,
      'where': whereSpec
    }, queryMap)
    table = queryMap['table']
    where = queryMap['where']

    # decode ambiguous table argument
    tableStr = table
    whereStr = where

    # cache the table description
    self.readDescNative(tableStr)
    descMap = self.cache[tableStr]
    json_field = descMap['json_column']
    if json_field == '':
      e = Exception('checkJsonColumnConstraint(): ' + tableStr + ' does not contain `' + json_field + '`')

    if e == None:
      # decode remaining ambiguous arguments
      if isinstance(where, dict): # is_map
        whereStr = self.implementWhere(where)
      if (whereStr != '') and not whereStr.startswith(' '):
        whereStr = ' WHERE ' + whereStr

      # read the table
      q = 'SELECT `' + json_field + '` FROM `' + tableStr + '`' + whereStr + ';'
      rows = self.mysql_query(q)
      # read result
      row = self.mysql_fetch_assoc(rows)
      while (row != None) and (e == None):
        jsonValue = row[json_field]
        jsonRowMap = json.loads(jsonValue)
        if jsonRowMap == None:
          err = '"' + self.mysql_real_escape_string(jsonValue) + '" value in `' + json_field + '` column in ' + tableStr + ' table; ' + e
          e = Exception('checkJsonColumnConstraint(): ' + err)
        row = self.mysql_fetch_assoc(rows)
      self.mysql_free_query(rows)

    return e

  #
  # Prepend a table specifier to keys and values in a
  # WHERE array.
  #
  # @param a An array with WHERE clause specification.
  # @param table An array of tables.
  # @return A clause string.
  #
  # @author DanielWHoward
  #
  def applyTablesToWhere(self, a, table):
    keywords = ['AND', 'OR']
    aa = {}
    for key, value in a.items():
      if '.' not in key and key.upper() not in keywords:
        aa[table + '.' + key] = value
      else:
        aa[key] = value
    return aa

  #
  # Return a clause string created from an array specification.
  #
  # It is easier to use an array to create a MySQL WHERE clause instead
  # of using string concatenation.
  #
  # @param whereSpec An array with clause specification.
  # @return A clause string.
  #
  # @author DanielWHoward
  #
  def implementWhere(self, whereSpec):
    whereStr = ''
    if isinstance(whereSpec, dict): # is_map
      whereStr = self.implementCondition(whereSpec)
      if whereStr != '':
        whereStr = ' WHERE ' + whereStr
    else:
      whereStr = whereSpec
    return whereStr

  #
  # Return a clause string created from an array specification.
  #
  # It is easier to use an array to create a MySQL WHERE clause instead
  # of using string concatenation.
  #
  # @param onVar An array with an ON clause specification.
  # @return A clause string.
  #
  # @author DanielWHoward
  #
  def implementOn(self, onVar):
    joins = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN']
    onVarStr = ''
    if isinstance(onVar, dict): # is_map
      for table, cond in onVar.items():
        # INNER JOIN is the default
        join = joins[0]
        # remove JOIN indicator from conditions
        conds = {}
        for k, v in cond.items():
          if k.upper() in joins:
            join = k
          else:
            conds[k] = v
        # build the JOIN clause
        onVarStr += join + ' `' + table + '` ON ' + self.implementCondition(conds, 'ON ')
    else:
      onVarStr = onVar
    return onVarStr

  #
  # Return a SQL condition string created from an array specification.
  #
  # It is easier to use an array to create a MySQL WHERE clause instead
  # of using string concatenation.
  #
  # @param condObj An array with conditional specification.
  # @param onVar A string with an ON clause specification.
  # @return A SQL string containing a nested conditional.
  #
  # @author DanielWHoward
  #
  def implementCondition(self, condObj, onVar=''):
    cond = ''
    if isinstance(condObj, str):
      cond = condObj
    elif isinstance(condObj, dict): # is_map
      condMap = condObj
      conds = []
      op = ' AND '
      for key, value in condMap.items():
        sub = ''
        if key.upper() == 'OR':
          op = ' OR '
        elif key.upper() != 'AND':
          if isinstance(value, list): # is_list
            # assume it is some SQL syntax
            sub = self.implementSyntax(key, value)
            if sub != '':
              sub = '(' + sub + ')'
          elif isinstance(value, dict): # is_map
            # assume it is a sub-clause
            sub = self.implementCondition(value)
            if sub != '':
              sub = '(' + sub + ')'
          else:
            sub = self.mysql_real_escape_string(value)
            if onVar == '':
              sub = "'" + sub + "'"
            else:
              sub = '`' + sub.replace('.', '`.`') + '`'
            sub = '`' + key.replace('.', '`.`') + '`=' + sub
        if sub != '':
          conds.append(sub)
      if len(conds) > 0:
        cond = op.join(conds)
    return cond

  #
  # Return a SQL string created from an array specification.
  #
  # It is easier to use an array to create a SQL string (like LIKE)
  # instead of using string concatenation.
  #
  # @param key A name, possibly unused.
  # @param syntax An array with syntax specification.
  # @return A SQL syntax string.
  #
  # @author DanielWHoward
  #
  def implementSyntax(self, key, syntax):
    sql = ''
    cmdStr = syntax[0]
    if (len(syntax) >= 1) and (cmdStr.upper() == 'LIKE'):
      # LIKE: 'unused': ['LIKE', 'tags', '% ', arrayOfTags, ' %']
      key = syntax[1]
      values = []
      if len(syntax) == 3:
        values.append(syntax[2])
      elif (len(syntax) == 4) or (len(syntax) == 5):
        pre = syntax[2]
        post = syntax[4] if len(syntax) == 5 else ''
        if isinstance(syntax[3], list): # is_list
          for v in range(len(syntax[3])):
            values.append(pre + syntax[3][v] + post)
        else:
          values.append(pre + syntax[3] + post)
      op = 'OR'
      for v in range(len(values)):
        if v > 0:
          sql += ' ' + op + ' '
        sql += '`' + key + "` LIKE '" + self.mysql_real_escape_string(values[v]) + "'"
    else:
      # OR: 'aColumn': ['1', '2', '3']
      op = ' OR '
      values = syntax
      for v in range(len(values)):
        if v > 0:
          sql += ' ' + op + ' '
        sql += '`' + key + "`='" + self.mysql_real_escape_string(values[v]) + "'"
    return sql

  #
  # Return a random number in a range.
  #
  # @param min int The minimum value.
  # @param max int The maximum value.
  # @return int A random value.
  #
  # @author DanielWHoward
  #
  def rand_secure(self, min, max):
    log = math.log(max - min, 2)
    bytes = int(math.floor((log / 8) + 1))
    bits = int(math.floor(log + 1))
    filter = int(math.floor((1 << bits) - 1))
    rnd = int(secrets.token_hex(bytes), 16)
    rnd = rnd & filter # discard irrelevant bits
    while (rnd >= (max - min)):
      rnd = int(secrets.token_hex(bytes), 16)
      rnd = rnd & filter # discard irrelevant bits
    return int(math.floor(min + rnd))

  #
  # Do nothing for log output.
  #
  # @author DanielWHoward
  #
  def println(self, s):
    print(s)

  #
  # Throw an exception to create a stack trace.
  #
  # @author DanielWHoward
  #
  def fail(self, e, q='', transaction=None):
    if q != '':
      self.log.println('E:' + q)
    if transaction != None:
      self.xibdb_rollback(transaction)
    raise Exception(e)

#
# Merge keys of objects with string indices and
# return a new array.  Standard now but provided
# so merge can be customized.
#
# @return object The merged object.
#
# @author DanielWHoward
#
def arrayMerge(a, b):
  r = {}
  for key, value in a.items():
    r[key] = value

  for key, value in b.items():
    r[key] = value

  return r

#
# Merge keys of objects with string indices.
#
# @return object The merged object.
#
# @author DanielWHoward
#
def array3Merge(a, b, c):
  r = {}
  for key, value in a.items():
    r[key] = value

  for key, value in b.items():
    if (value != None) and (value != ''):
      r[key] = value

  for key, value in c.items():
    if (value != None) and (value != ''):
      r[key] = value

  return r

def doubleval(d):
  return float(d)
