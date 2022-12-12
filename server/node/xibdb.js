// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
/**
 * Reads, inserts, deletes, updates and moves rows in
 * MySQL database using the JSON (JavaScript Object
 * Notation) format.
 *
 * Adapted, refactored and re-licensed from the jsonhib
 * open source project.
 *
 * @author DanielWHoward
 */

  /**
   * Use a database for JSON.
   *
   * Configurations are arrays with keys like "sort_column",
   * "json_column", and "link_identifier" keys.
   *
   * @param config A configuration.
   *
   * @author DanielWHoward
   */
  function XibDb(config) {
    config = config || {};
    this.config = config;
    this.cache = {};
    this.checkConstraints = false;
    this.dryRun = false;
    this.dumpSql = false;
    this.opt = true;
  }

  /**
   * Get JSON table rows from the database.
   *
   * The callback function is passed a JSON string of an
   * array of columns and data.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * @param {string} table A database table.
   * @param {string} where A WHERE clause.
   * @param {function} callback A callback function with one argument.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.readRowsNative = function(querySpec, whereSpec, columnsSpec, onSpec, callback) {
    var that = this;
    var callbackIndex = findCallback(arguments, 1, 5);
    if (callbackIndex >= 0) {
      callback = arguments[callbackIndex];
      arguments[callbackIndex] = null;
    }
    whereSpec = whereSpec || '';
    columnsSpec = columnsSpec || '*';
    onSpec = onSpec || '';
    callback = callback || function() {};
    var e = null;

    if (that.dumpSql || that.dryRun) {
      console.debug('readRowsNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        callback("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') || (queryMap.constructor.name !== 'Object')) {
      queryMap = {};
    }
    queryMap = array3Merge({
      table: '',
      columns: '*',
      on: '',
      where: ''
    }, {
      table: querySpec,
      columns: columnsSpec,
      on: onSpec,
      where: whereSpec
    }, queryMap);
    var table = queryMap.table;
    var columns = queryMap.columns;
    var onVar = queryMap['on'];
    var where = queryMap.where;

    // decode ambiguous table argument
    var tableArr = [];
    var tableStr = '';
    if (table instanceof Array) {
      tableArr = table;
      tableStr = table[0];
    } else if (typeof table === 'string') {
      tableArr.push(table);
      tableStr = table;
    }
    tablesStr = tableStr;
    for (var t=0; t < tableArr.length; ++t) {
      var tableName = tableArr[t];
      if (tablesStr !== tableName) {
        tablesStr += ',' + tableName;
      }
    }
    table = '`' + tableStr + '`';

    // cache the table description
    var dryRun = that.dryRun;
    var dumpSql = that.dumpSql;
    that.dryRun = false;
    that.dumpSql = false;
    that.readDescNative(tableStr, function() {
      that.dryRun = dryRun;
      that.dumpSql = dumpSql;
      var descMap = that.cache[tableStr];
      var desc = descMap.desc_a;
      var sort_field = descMap.sort_column || '';
      var json_field = descMap.json_column || '';
      var orderby = '';
      if (sort_field !== '') {
        orderby = ' ORDER BY `' + sort_field + '` ASC';
      }

      // decode remaining ambiguous arguments
      if (columns instanceof Array) {
        var columnArr = columns;
        columnStr = '';
        if (tableArr.length === 1) {
          for (var col in columnArr) {
            if (columnsStr !== '') {
              columnsStr += ',';
            }
            columnsStr += '`' + col + '`';
          }
        } else if (tableArr.length > 1) {
          // assume all columns from first table
          columnsStr += '`' + tableStr + '`.*';
          for (var col in columnArr) {
            if (col.indexOf('.') === -1) {
              // assume column is from second table
              columnsStr += ',`' + tableArr[1] + '`.`' + col + '`';
            } else {
              // do not assume table; table is specified
              var parts = col.split('.', 2);
              var tablePart = parts[0];
              var colPart = parts[1];
              columnStr += ',`' + tablePart + '`.`' + colPart + '`';
            }
          }
        }
      }
      if ((typeof onVar === 'object') && (onVar.constructor.name === 'Object')) {
        // "on" spec shortcut: assume second table
        if (stringKeysOrArrayIntersect(tableArr, onVar).length === 0) {
          // explicitly specify the second table
          var newOnVar = {};
          newOnVar[tableArr[1]] = onVar;
          onVar = newOnVar;
        }
        onVar = that.implementOn(onVar);
      }
      if (onVar !== '') {
        onVar = ' ' + onVar;
      }
      if ((typeof where === 'object') && (where.constructor.name === 'Object')) {
        var whereMap = where;
        whereMap = that.applyTablesToWhere(whereMap, tableStr);
        where = that.implementWhere(whereMap);
      }
      if (where.substring(0, 1) === ' ') {
        // add raw SQL
      } else if (where.substring(0, 'WHERE '.length) === 'WHERE ') {
        where = ' ' + where;
      } else if (where !== '') {
        $where = " WHERE " . $where;
      }

      var config = that.config;

      // read the table
      var q = 'SELECT ' + columns + ' FROM ' + table + ' '+where+' ' + onVar + orderby + ';';
      that.mysql_query(q, function(e, rows, f) {
        if (e) {
          callback(e, rows, f);
        } else {
          var objs = [];
          for (var r=0; r < rows.length; ++r) {
            var row = rows[r];
            var obj = {};
            // add the SQL data first
            for (var key in row) {
              var value = row[key];
              if (key == 'class') {
                key = 'clazz';
              }
              if (key == json_field) {
                // add non-SQL JSON data later
              } else if (key == config['sort_column']) {
                // sort column isn't user data
              } else if (value === null) {
                obj[key] = null;
              } else if (is_numeric(value) && (strval(intval(value)) == value) && is_bool(desc[key])) {
                obj[key] = (intval(value) === 1);
              } else if (is_numeric(value) && (strval(intval(value)) == value) && is_int(desc[key])) {
                obj[key] = intval(value);
              } else if (is_numeric(value) && is_float(desc[key])) {
                obj[key] = floatval(value);
              } else {
                try {
                  var val = JSON.parse(value);
                  obj[key] = val;
                } catch (e) {
                  obj[key] = value;
                }
              }
            }
            // add non-SQL JSON data
            if ((json_field != '') && (row[json_field] !== null)) {
              try {
                var jsonMap = JSON.parse(row[json_field]);
                for (var key in jsonMap) {
                  var value = jsonMap[key];
                  obj[key] = value;
                }
              } catch (e) {
                console.error(e);
              }
            }
            objs.push(obj);
          }
          callback(e, objs);
        }
      });
    });
  };

  XibDb.prototype.readRows = function(querySpec, whereSpec, columnsSpec, onSpec, callback) {
    var that = this;
    var callbackIndex = findCallback(arguments, 1, 5);
    if (callbackIndex >= 0) {
      callback = arguments[callbackIndex];
      arguments[callbackIndex] = null;
    }
    whereSpec = whereSpec || '';
    columnsSpec = columnsSpec || '*';
    onSpec = onSpec || '';
    callback = callback || function() {};
    that.readRowsNative(querySpec, whereSpec, columnsSpec, onSpec, function(e, objs) {
      if (!e && objs && (typeof objs === 'object') && (objs.constructor.name === 'Object')) {
        try {
          arguments[1] = JSON.stringify(objs);
        } catch (e) {
          console.error(e);
        }
      }
      callback.apply(null, arguments);
    });
  }

  /**
   * Get a JSON table description from the database.
   *
   * It does not return "sort" and "json" columns, if any.
   *
   * The callback function is passed a JSON string of
   * columns and default values.
   *
   * @param table String A database table.
   * @return A string containing a JSON object with columns and default values.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.readDescNative = function(table, callback) {
    var that = this;
    if (is_object(table)) {
      var args = array_merge({
      }, table);
      table = args['table'];
    }
    var config = this.config;

    if (that.dumpSql || that.dryRun) {
      console.debug('readDescNative()');
    }

    // check constraints
/*    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        callback("pre-check: " + e.Error());
      }
    }*/

    var e = null;
    var desc = {};
    if (isset(this.cache[table]) && isset(this.cache[table]['desc'])) {
      desc = this.cache[table]['desc'];
      callback(e, desc);
    } else {
      // read the table description
      var sort_column = '';
      var json_column = '';
      var auto_increment_column = '';
      var q = 'DESCRIBE `'+table+'`;';
      this.mysql_query(q, function(e, rows, f) {
        if (e) {
          console.error(q);
        }
        for (var r=0; r < rows.length; ++r) {
          var rowdesc = rows[r];
          var field = rowdesc['Field'];
          var extra = rowdesc['Extra'];
          if (field === config['sort_column']) {
            sort_column = field;
          } else if (field === config['json_column']) {
            json_column = field;
          } else if (strpos(rowdesc['Type'], 'tinyint(1)') !== false) {
            desc[field] = false;
          } else if (strpos(rowdesc['Type'], 'int') !== false) {
            desc[field] = 0;
          } else if (strpos(rowdesc['Type'], 'float') !== false) {
            desc[field] = floatval(0);
          } else if (strpos(rowdesc['Type'], 'double') !== false) {
            desc[field] = floatval(0);
          } else {
            desc[field] = '';
          }
          if (extra === 'auto_increment') {
            auto_increment_column = field;
          }
        }
        // cache the description
        if (!isset(that.cache[table])) {
          that.cache[table] = {};
        }
        that.cache[table]['desc_a'] = desc;
        desc = JSON.stringify(desc);
        that.cache[table]['desc'] = desc;
        if (sort_column !== '') {
          that.cache[table]['sort_column'] = sort_column;
        }
        if (json_column !== '') {
          that.cache[table]['json_column'] = json_column;
        }
        if (auto_increment_column !== '') {
          that.cache[table]['auto_increment_column'] = auto_increment_column;
        }
        callback(e, desc);
      });
    }
  };

  XibDb.prototype.readDesc = function(querySpec, callback) {
    var that = this;
    callback = callback || function() {};
    that.readDescNative(querySpec, function(e, objs) {
      if (!e && objs && (typeof objs === 'object') && (objs.constructor.name === 'Object')) {
        try {
          arguments[1] = JSON.stringify(objs);
        } catch (e) {
          console.error(e);
        }
      }
      callback.apply(null, arguments);
    });
  }

  /**
   * Insert a row of JSON into a database table.
   *
   * If there is no sort column, it inserts the row, anyway.
   *
   * @param {string} table A database table.
   * @param {string} where A WHERE clause.
   * @param {number} n The place to insert the row before; -1 means the end.
   * @param {mixed} json A JSON string (string) or JSON array (array).
   * @param {function} callback A callback function.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.insertRowNative = function(querySpec, whereSpec, valuesSpec, nSpec, callback) {
    var that = this;
    var funcIndex = findCallback(arguments, 1, 5);
    if (funcIndex >= 0) {
      callback = arguments[funcIndex];
      arguments[funcIndex] = null;
    }
    whereSpec = whereSpec || '';
    valuesSpec = valuesSpec || '{}';
    nSpec = nSpec || -1;
    callback = callback || function() {};
    var e = null;

    if (that.dumpSql || that.dryRun) {
      console.debug('insertRowNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        callback("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') || (queryMap.constructor.name !== 'Object')) {
      queryMap = {};
    }
    queryMap = array3Merge({
      table: '',
      values: '',
      n: -1,
      where: ''
    }, {
      table: querySpec,
      values: valuesSpec,
      n: nSpec,
      where: whereSpec
    }, queryMap);
    var table = queryMap.table;
    var values = queryMap.values;
    var n = queryMap.n;
    var where = queryMap.where;

    // decode ambiguous table argument
    var tableStr = table;
    table = '`' + tableStr + '`';

    // cache the table description
    var dryRun = that.dryRun;
    var dumpSql = that.dumpSql;
    that.dryRun = false;
    that.dumpSql = false;
    that.readDescNative(tableStr, function() {
      that.dryRun = dryRun;
      that.dumpSql = dumpSql;
      var descMap = that.cache[tableStr];
      var desc = descMap.desc_a;
      var sort_field = descMap.sort_column || '';
      var json_field = descMap.json_column || '';
      var orderby = '';
      if (sort_field !== '') {
        orderby = ' ORDER BY `' + sort_field + '` DESC';
      }

      // decode remaining ambiguous arguments
      var valuesMap = {};
      var sqlValuesMap = {}; // SET clause
      var jsonMap = arrayMerge(valuesMap, values);
      if (is_string(values)) {
        values = ' SET ' + values;
      } else {
        valuesMap = arrayMerge(valuesMap, values);
        // copy SQL columns to sqlValuesMap
        for (var col in desc) {
          var colValue = desc[col];
          if (array_key_exists(col, jsonMap)) {
            var compat = false;
            if (array_key_exists(col, desc)) {
              if (gettype(desc[col]) === gettype(jsonMap[col])) {
                compat = true;
              }
              if (is_float(desc[col]) && is_int(jsonMap[col])) {
                compat = true;
              }
              if (is_string(desc[col])) {
                compat = true;
              }
              if (compat) {
                sqlValuesMap[col] = jsonMap[col];
                delete jsonMap[col];
              }
            }
          }
        }
        // copy freeform values into 'json' field
        if (json_field !== '') {
          sqlValuesMap[json_field] = jsonMap;
        }
      }
      var nInt = n;
      if ((typeof where === 'object') && (where.constructor.name === 'Object')) {
        where = that.implementWhere(where);
      }
      if (where.substring(0, 1) === ' ') {
        // add raw SQL
      } else if (where.substring(0, 'WHERE '.length) === 'WHERE ') {
        where = ' ' + where;
      } else if (where !== '') {
        where = " WHERE " + where;
      }

      var qa = [];

      // update the positions
      var promises = promise_mapSeries([]);
      if (sort_field !== '') {
        var nLen = 0;
        var limit = '';
        if (that.opt || (nInt === -1)) {
          limit = ' LIMIT 1';
        }
        promises.push((function() {
          return function promise() {
            var qu = 'SELECT `' + sort_field + '` FROM ' + table + where + orderby + limit + ';';
            that.mysql_query(qu, function(e, rows) {
              for (var r=0; r < rows.length; ++r) {
                var row = rows[r];
                nValue = row[sort_field];
                if (nValue >= nLen) {
                  nLen = nValue + 1;
                }
                if (nInt === -1) {
                  n = nValue + 1;
                  nInt = n;
                }
                if (nInt > nValue) {
                  break;
                }
                var and_clause = ' WHERE ';
                if (where !== '') {
                  and_clause = ' AND ';
                }
                if (that.opt) {
                  set_clause = ' `' + sort_field + '`=`' + sort_field + '`+1';
                  and_clause += '`' + sort_field + '`>=' + nInt;
                  var qu = 'UPDATE ' + table + ' SET' + set_clause + where + and_clause + ';';
                  qa.push(qu);
                  break;
                } else {
                  set_clause = ' `' + sort_field + '`=' + (nValue+1);
                  and_clause += ' `' + sort_field + '`=' + nValue;
                  qu = 'UPDATE ' + table + ' SET' + set_clause + where + and_clause + ';';
                  qa.push(qu);
                }
              }
              that.mysql_free_query(rows);
              if (nInt === -1) {
                n = 0;
                nInt = n;
              }
              if (nInt > nLen) {
                throw new Exception('`n` value out of range');
              }

              // add sort field to valuesMap
              if (Object.keys(sqlValuesMap).length > 0) {
                sqlValuesMap[sort_field] = n;
              }
              promise.resolve(true);
            });
          };
        })());
      }
      promises.resolve(function() {
        // finally, generate values.(string) from valuesMap
        if (Object.keys(valuesMap).length > 0) {
          var valuesStr = '';
          for (var col in sqlValuesMap) {
            var value = sqlValuesMap[col];
            if (valuesStr !== '') {
              valuesStr += ',';
            }
            valueStr = '';
            if (((typeof value === 'object') || (value.constructor.name === 'Object') ||
                value instanceof Array)) {
              jsonStr = JSON.stringify(jsonMap);
              if ((jsonStr === '') || (jsonStr === '[]')) {
                jsonStr = '{}';
              }
              valueStr = '"' + that.mysql_real_escape_string(jsonStr) + '"';
            } else if (is_bool(value)) {
              valueBool = value;
              if (valueBool) {
                valueStr = '1';
              } else {
                valueStr = '0';
              }
            } else if (is_int(value)) {
              valueStr = value;
            } else if (is_null(value)) {
              valueStr = 'NULL';
            } else {
              valueStr = '"' + that.mysql_real_escape_string(value) + '"';
            }
            valuesStr += '`' + that.mysql_real_escape_string(col) + '`=' + valueStr;
          }
          values = ' SET ' + valuesStr;
        }

        var q = 'INSERT INTO ' + table + values + ';';
        qa.push(q);

        var promises = promise_mapSeries([]);
        for (var qi in qa) {
          var q = qa[qi];
          promises.push((function(q) {
            return function promise() {
              that.mysql_query(q, function(e, rows) {
                if (rows) {
                  that.mysql_free_query(rows);
                }
                promise.resolve(q);
              });
            };
          })(q));
        }
        promises.resolve(function() {
          // check constraints
          if (that.checkConstraints) {
            e = that.checkSortColumnConstraint(querySpec, whereSpec);
            if (e === null) {
              e = that.checkJsonColumnConstraint(querySpec, whereSpec);
            }
            if (e !== null) {
              callback("post-check: " + e, valuesMap);
            }
          }

          callback(null, valuesMap);
        });
      });
    });
  };

  XibDb.prototype.insertRow = function(querySpec, whereSpec, valuesSpec, nSpec, callback) {
    var that = this;
    var funcIndex = findCallback(arguments, 1, 5);
    if (funcIndex >= 0) {
      callback = arguments[funcIndex];
      arguments[funcIndex] = null;
    }
    whereSpec = whereSpec || '';
    valuesSpec = valuesSpec || '{}';
    nSpec = (nSpec === 0)? nSpec: (nSpec || -1);
    callback = callback || function() {};
    that.insertRowNative(querySpec, whereSpec, valuesSpec, nSpec, function(e, objs) {
      if (!e && objs && (typeof objs === 'object') && (objs.constructor.name === 'Object')) {
        try {
          arguments[1] = JSON.stringify(objs);
        } catch (e) {
          console.error(e);
        }
      }
      callback.apply(null, arguments);
    });
  }

  /**
   * Delete a row of JSON from a database table.
   *
   * If there is no sort column, it deletes the first row.
   *
   * @param {string} table A database table.
   * @param {string} where A WHERE clause.
   * @param {mixed} n The row to delete (int) or JSON data to select the row (string).
   * @param {function} callback A callback function.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.deleteRowNative = function(querySpec, whereSpec, nSpec, callback) {
    var that = this;
    var callbackIndex = findCallback(arguments, 1, 5);
    if (callbackIndex >= 0) {
      callback = arguments[callbackIndex];
      arguments[callbackIndex] = null;
    }
    whereSpec = whereSpec || '';
    nSpec = nSpec || '';
    callback = callback || function() {};
    var e = null;

    if (that.dumpSql || that.dryRun) {
      console.debug('deleteRowNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        callback("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') || (queryMap.constructor.name !== 'Object')) {
      queryMap = {};
    }
    queryMap = array3Merge({
      table: '',
      n: '',
      where: ''
    }, {
      table: querySpec,
      n: nSpec,
      where: whereSpec
    }, queryMap);
    var table = queryMap.table;
    var n = queryMap.n;
    var where = queryMap.where;

    // decode ambiguous table argument
    var tableStr = table;
    table = '`' + tableStr + '`';

    // cache the table description
    var dryRun = that.dryRun;
    var dumpSql = that.dumpSql;
    that.dryRun = false;
    that.dumpSql = false;
    that.readDescNative(tableStr, function() {
      that.dryRun = dryRun;
      that.dumpSql = dumpSql;
      var descMap = that.cache[tableStr];
      var sort_field = descMap.sort_column || '';
      var json_field = descMap.json_column || '';
      var and_clause = '';

      // decode remaining ambiguous arguments
      var promises = promise_mapSeries([]);
      promises.push((function() {
        return function promise() {
          if ((typeof where === 'object') && (where.constructor.name === 'Object')) {
            where = that.implementWhere(where);
          }
          if (where.substring(0, 1) === ' ') {
            // add raw SQL
          } else if (where.substring(0, 'WHERE '.length) === 'WHERE ') {
            where = ' ' + where;
          } else if (where !== '') {
            where = " WHERE " + where;
          }
          if ((sort_field !== '') && is_int(n)) {
            var sort_start = ' AND ';
            if (where === '') {
              sort_start = ' WHERE ';
            }
            and_clause += sort_start + '`' + sort_field + '`=' + n;
            promise.resolve(true);
          } else {
            if (is_string(n) && (n !== '')) {
              var nMap = JSON.parse(n);
              if (nMap !== null) {
                for (var col in nMap) {
                  var value = nMap[col];
                  if ((and_clause === '') && (where === '')) {
                    and_clause += ' WHERE ';
                  } else {
                    and_clause += ' AND ';
                  }
                  and_clause += col + '=\'' + value + '\'';
                }
              } else {
                and_clause += n;
              }
            }
            var field = sort_field;
            if (sort_field === '') {
              field = '*';
            }
            var orderby_clause = '';
            if (sort_field !== '') {
              orderby_clause = ' ORDER BY ' + sort_field + ' DESC';
            }
            var q = 'SELECT COUNT(*) AS num_rows FROM ' + table + ' ' + where + and_clause + orderby_clause + ';';
            that.mysql_query(q, function(e, rows) {
              var num_rows = 0;
              for (var r=0; r < rows.length; ++r) {
                var row = rows[r];
                num_rows = row.num_rows;
              }
              that.mysql_free_query(rows);
              if ((num_rows === 1) || ((num_rows > 1) && (sort_field !== ''))) {
                q = 'SELECT ' + field + ' FROM ' + table + ' ' + where + ' ' + and_clause + orderby_clause + ';';
                that.mysql_query(q, function(e, rows) {
                  var row = rows[0];
                  if (num_rows === 1) {
                    if (sort_field !== '') {
                      n = row[sort_field];
                    }
                  } else if ((num_rows > 1) && (sort_field !== '')) {
                    n = row[sort_field];
                    if ((and_clause === '') && (where === '')) {
                      and_clause += 'WHERE ';
                    } else {
                      and_clause += ' AND ';
                    }
                    and_clause += sort_field + '="' + n + '"';
                  }
                  that.mysql_free_query(rows);
                  promise.resolve(true);
                });
              } else {
                var e = 'xibdb.DeleteRow():num_rows:' + num_rows;
                callback(e);
              }
            });
          }
        };
      })());
      promises.resolve(function() {
        var nInt = n;
        if ((typeof where === 'object') && (where.constructor.name === 'Object')) {
          var whereMap = where;
          where = that.implementWhere(whereMap);
        }
        if (where.substring(0, 1) === ' ') {
          // add raw SQL
        } else if (where.substring(0, 'WHERE '.length) === 'WHERE ') {
          where = ' ' + where;
        } else if (where !== '') {
          $where = " WHERE " . $where;
        }

        var qa = [];

        // update the positions
        var promises = promise_mapSeries([]);
        if (sort_field !== '') {
          var nLen = 0;
          var orderby = ' ORDER BY `' + sort_field + '` ASC';
          var limit = '';
          if (that.opt || (nInt === -1)) {
            orderby = ' ORDER BY `' + sort_field + '` DESC';
            limit = ' LIMIT 1';
          }
          promises.push((function() {
            return function promise() {
              var qu = 'SELECT `' + sort_field + '` FROM ' + table + where + orderby + limit + ';';
              that.mysql_query(qu, function(e, rows) {
                for (var r=0; r < rows.length; ++r) {
                  var row = rows[r];
                  nValue = row[sort_field];
                  if (nValue >= nLen) {
                    nLen = nValue + 1;
                  }
                  var and_where = ' WHERE ';
                  if (where !== '') {
                    and_where = ' AND ';
                  }
                  if (that.opt) {
                    set_clause = ' `' + sort_field + '`=`' + sort_field + '`+1';
                    and_where += '`' + sort_field + '`>=' + nInt;
                    var qu = 'UPDATE ' + table + ' SET' + set_clause + where + and_where + ';';
                    qa.push(qu);
                    break;
                  } else {
                    set_clause = ' `' + sort_field + '`=' + (nValue+1);
                    and_where += ' `' + sort_field + '`=' + nValue;
                    qu = 'UPDATE ' + table + ' SET' + set_clause + where + and_where + ';';
                    qa.push(qu);
                  }
                }
                that.mysql_free_query(rows);
                if (nInt >= nLen) {
                  e = '`n` value out of range';
                  callback(e);
                  return;
                }
                promise.resolve(true);
              });
            };
          })());
        }

        promises.resolve(function() {
          var q = 'DELETE FROM ' + table + where + and_clause + ';';
          qa.unshift(q);

          var promises = promise_mapSeries([]);
          for (var qi in qa) {
            var q = qa[qi];
            promises.push((function(q) {
              return function promise() {
                that.mysql_query(q, function(e, rows) {
                  if (rows) {
                    that.mysql_free_query(rows);
                  }
                  promise.resolve(q);
                });
              };
            })(q));
          }
          promises.resolve(function() {
            // check constraints
            if (that.checkConstraints) {
              e = that.checkSortColumnConstraint(querySpec, whereSpec);
              if (e === null) {
                e = that.checkJsonColumnConstraint(querySpec, whereSpec);
              }
              if (e !== null) {
                callback("post-check: " + e);
              }
            }
            callback(null, true);
          });
        });
      });
    });
  };

  XibDb.prototype.deleteRow = function(querySpec, whereSpec, nSpec, callback) {
    var that = this;
    var funcIndex = findCallback(arguments, 1, 5);
    if (funcIndex >= 0) {
      callback = arguments[funcIndex];
      arguments[funcIndex] = null;
    }
    whereSpec = whereSpec || '';
    nSpec = (typeof nSpec !== undefined)? nSpec: -1;
    callback = callback || function() {};
    that.deleteRowNative(querySpec, whereSpec, nSpec, function(e, objs) {
      if (!e && objs && (typeof objs === 'object') && (objs.constructor.name === 'Object')) {
        try {
          arguments[1] = JSON.stringify(objs);
        } catch (e) {
          console.error(e);
        }
      }
      callback.apply(null, arguments);
    });
  }

  /**
   * Update a row of JSON in a database table.
   *
   * If there is no sort column, it updates the first row.
   *
   * @param {string} table A database table.
   * @param {string} where A WHERE clause.
   * @param {mixed} n The row to update (int) or JSON data to select the row (string).
   * @param {mixed} json A JSON string (string) or JavaScript object (object).
   * @param {function} callback A callback function.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.updateRowNative = function(querySpec, valuesSpec, nSpec, whereSpec, limitSpec, callback) {
    var that = this;
    var callbackIndex = findCallback(arguments, 1, 5);
    if (callbackIndex >= 0) {
      callback = arguments[callbackIndex];
      arguments[callbackIndex] = null;
    }
    valuesSpec = valuesSpec || '';
    nSpec = nSpec || -1;
    whereSpec = whereSpec || '';
    limitSpec = limitSpec || '';
    callback = callback || function() {};
    var e = null;

    if (that.dumpSql || that.dryRun) {
      console.debug('updateRowNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        callback("pre-check: " + e.Error());
        return;
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') || (queryMap.constructor.name !== 'Object')) {
      queryMap = {};
    }
    queryMap = array3Merge({
      table: '',
      values: '',
      n: -1,
      where: '',
      limit: 1
    }, {
      table: querySpec,
      values: valuesSpec,
      n: nSpec,
      where: whereSpec,
      limit: limitSpec
    }, queryMap);
    var table = queryMap.table;
    var values = queryMap.values;
    var n = queryMap.n;
    var where = queryMap.where;
    var limit = queryMap.limit;

    // decode ambiguous table argument
    var tableStr = table;
    table = '`' + tableStr + '`';

    // cache the table description
    var dryRun = that.dryRun;
    var dumpSql = that.dumpSql;
    that.dryRun = false;
    that.dumpSql = false;
    that.readDescNative(tableStr, function() {
      that.dryRun = dryRun;
      that.dumpSql = dumpSql;
      var descMap = that.cache[tableStr];
      var desc = descMap.desc_a;
      var sort_field = descMap.sort_column || '';
      var json_field = descMap.json_column || '';
      var orderby = '';
      if (sort_field !== '') {
        orderby = ' ORDER BY `' + sort_field + '` ASC';
      }

      // decode remaining ambiguous arguments
      var valuesMap = {};
      var sqlValuesMap = {}; // SET clause
      var jsonMap = arrayMerge(valuesMap, values);
      if (is_string(values)) {
        values = ' SET ' + values;
      } else {
        valuesMap = arrayMerge(valuesMap, values);
        // copy SQL columns to sqlValuesMap
        for (var col in desc) {
          var colValue = desc[col];
          if (array_key_exists(col, jsonMap)) {
            var compat = false;
            if (array_key_exists(col, desc)) {
              if (gettype(desc[col]) === gettype(jsonMap[col])) {
                compat = true;
              }
              if (is_float(desc[col]) && is_int(jsonMap[col])) {
                compat = true;
              }
              if (is_string(desc[col])) {
                compat = true;
              }
              if (compat) {
                sqlValuesMap[col] = jsonMap[col];
                delete jsonMap[col];
              }
            }
          }
        }
      }
      var nInt = n;
      if ((typeof where === 'object') && (where.constructor.name === 'Object')) {
        where = that.implementWhere(where);
      }
      if (where.substring(0, 1) === ' ') {
        // add raw SQL
      } else if (where.substring(0, 'WHERE '.length) === 'WHERE ') {
        where = ' ' + where;
      } else if (where !== '') {
        where = " WHERE " + where;
      }
      var limitInt = limit;
      var op_clause = ' WHERE';
      if (where !== '') {
        op_clause = ' AND';
      }
      var op_and_clause = '';
      var rows_affected = 0;

      if ((sort_field !== '') && (nInt >= 0)) {
        op_and_clause = op_clause + ' `' + sort_field + '`=' + nInt;
      }

      // get the number of rows_affected
      q = 'SELECT COUNT(*) AS rows_affected FROM ' + table + where + op_and_clause + ';';
      that.mysql_query(q, function(e, rows) {
        var rows_affected = 0;
        var row = rows[0];
        rows_affected = row.rows_affected;
        that.mysql_free_query(rows);
        if (rows_affected === 0) {
          if (op_and_clause === '') {
            var e = '0 rows affected';
            callback(e);
          } else {
            q = 'SELECT COUNT(*) AS rows_affected FROM ' + table + where + ';';
            that.mysql_query(q, function(e, rows) {
              rows_affected = 0;
              for (var r=0; r < rows.length; ++r) {
                var row = rows[r];
                rows_affected = intval(row.rows_affected);
              }
              that.mysql_free_query(rows);
              if (rows_affected > 0) {
                e = '`n` value out of range';
              } else {
                e = '0 rows affected';
              }
              callback(e);
            });
          }
          return;
        } else if ((limitInt !== -1) && (rows_affected > limitInt)) {
          e = '' + rows_affected + ' rows affected but limited to ' + limitInt + ' rows';
          callback(e);
          return;
        }

        var qa = [];
        qa.push(q);

        // generate UPDATE statements using json_field
        var promises = promise_mapSeries([]);
        promises.push((function() {
          return function promise() {
            if (Object.keys(valuesMap).length === 0) {
              q = 'UPDATE ' + table + values + where + op_and_clause + ';';
              qa.push(q);
              promise.resolve(q);
            } else {
              // get the contents of the json_field for each affected row
              var updateJson = (json_field !== '') && (Object.keys(jsonMap).length > 0);
              var jsonRowMaps = [];
              if (!updateJson) {
                promise.resolve(q);
              } else {
                jsonValue = '';
                q = 'SELECT `' + json_field + '` FROM ' + table + where + op_and_clause + orderby + ';';
                that.mysql_query(q, function(e, rows) {
                  for (var r=0; (r < rows.length) && !e; ++r) {
                    var row = rows[r];
                    var jsonValue = row[json_field];
                    var jsonRowMap = JSON.parse(jsonValue);
                    if (jsonRowMap === null) {
                      e = 'json_decode() returned null';
                    } else {
                      jsonRowMaps.push(jsonRowMap);
                    }
                  }
                  that.mysql_free_query(rows);
                  if (e) {
                    err = '"' + that.mysql_real_escape_string(jsonValue) + '" value in `' + json_field + '` column in ' + table + ' table; ' + e;
                    callback(err);
                    return;
                  }
                  var qIns = [];
                  var qInsMap = {};
                  for (var i in jsonRowMaps) {
                    var jsonRowMap = jsonRowMaps[i];
                    // copy freeform values into 'json' field
                    if (updateJson) {
                      sqlValuesMap[json_field] = arrayMerge(jsonRowMap, jsonMap);
                    }
                    // sort valuesMap keys
                    var sqlValuesKeys = Object.keys(sqlValuesMap);
                    sqlValuesKeys.sort();
                    // finally, generate values from valuesMap
                    valuesStr = '';
                    for (var c in sqlValuesKeys) {
                      var col = sqlValuesKeys[c];
                      value = sqlValuesMap[col];
                      if (valuesStr !== '') {
                        valuesStr = ',';
                      }
                      valueStr = '';
                      if (is_array(value)) {
                        var jsonStr = JSON.stringify(value);
                        if ((jsonStr === '') || (jsonStr === '[]')) {
                          jsonStr = '{}';
                        }
                        valueStr = '"' + that.mysql_real_escape_string(jsonStr) + '"';
                      } else if (is_bool(value)) {
                        valueBool = boolval(value);
                        if (valueBool) {
                          valueStr = '1';
                        } else {
                          valueStr = '0';
                        }
                      } else if (is_int(value)) {
                        valueStr = strval(value);
                      } else if (is_null(value)) {
                        valueStr = 'NULL';
                      } else {
                        valueStr = '"' + that.mysql_real_escape_string(value) + '"';
                      }
                      valuesStr += '`' + that.mysql_real_escape_string(col) + '`=' + valueStr;
                    }
                    values = ' SET ' + valuesStr;
                    // add a custom update for each row
                    if (that.opt && updateJson) {
                      q = 'UPDATE ' + table + values + where;
                      if (sort_field === '') {
                        q += ';';
                        qa.push(q);
                      } else {
                        if (typeof qInsMap[q] !== 'undefined') {
                          var qi = qInsMap[q];
                          qIns[qi].Values.push(i);
                        } else {
                          qIns.push(newQueryUsingInKeyword(q, op_clause, sort_field, i));
                          qInsMap[q] = qIns.length - 1;
                        }
                      }
                    } else {
                      var op_and_clause = '';
                      if (nInt >= 0) {
                        op_and_clause = op_clause + ' `' + sort_field + '`=' + i;
                      }
                      q = 'UPDATE ' + table + values + where + op_and_clause + ';';
                      qa.push(q);
                    }
                  }
                  if (that.opt) {
                    for (var i=0; i < qIns.length; ++i) {
                      var qIn = qIns[i];
                      q = qIn.getQuery();
                      qa.push(q);
                    }
                  }
                  promise.resolve(q);
                });
              }
            }
          };
        })());

        promises.resolve(function() {
          var promises = promise_mapSeries([]);
          for (var qi in qa) {
            var q = qa[qi];
            promises.push((function(q) {
              return function promise() {
                that.mysql_query(q, function(e, rows) {
                  if (rows) {
                    that.mysql_free_query(rows);
                  }
                  promise.resolve(q);
                });
              };
            })(q));
          }
          promises.resolve(function() {
            // check constraints
            if (that.checkConstraints) {
              e = that.checkSortColumnConstraint(querySpec, whereSpec);
              if (e === null) {
                e = that.checkJsonColumnConstraint(querySpec, whereSpec);
              }
              if (e !== null) {
                callback("post-check: " + e);
              }
            }
            callback(null, true);
          });
        });
      });
    });
  };

  XibDb.prototype.updateRow = function(querySpec, whereSpec, nSpec, valuesSpec, limitSpec, callback) {
    var that = this;
    var funcIndex = findCallback(arguments, 1, 5);
    if (funcIndex >= 0) {
      callback = arguments[funcIndex];
      arguments[funcIndex] = null;
    }
    whereSpec = whereSpec || '';
    nSpec = (typeof nSpec !== 'undefined')? nSpec: -1;
    valuesSpec = valuesSpec || '';
    limitSpec = limitSpec || 1;
    callback = callback || function() {};
    that.updateRowNative(querySpec, whereSpec, nSpec, valuesSpec, limitSpec, function(e, objs) {
      if (!e && objs && (typeof objs === 'object') && (objs.constructor.name === 'Object')) {
        try {
          arguments[1] = JSON.stringify(objs);
        } catch (e) {
          console.error(e);
        }
      }
      callback.apply(null, arguments);
    });
  }

  /**
   * Reorder a row of JSON in a database table.
   *
   * If there is no sort column, it does nothing.
   *
   * @param {string} table A database table.
   * @param {string} where A WHERE clause.
   * @param {number} m The row to move.
   * @param {number} n The row to move to.
   * @param {function} callback A callback function.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.moveRowNative = function(querySpec, whereSpec, mSpec, nSpec, callback) {
    var that = this;
    var callbackIndex = findCallback(arguments, 1, 5);
    if (callbackIndex >= 0) {
      callback = arguments[callbackIndex];
      arguments[callbackIndex] = null;
    }
    whereSpec = whereSpec || '';
    mSpec = mSpec || 0;
    nSpec = nSpec || 0;
    callback = callback || function() {};
    var e = null;

    if (that.dumpSql || that.dryRun) {
      console.debug('moveRowNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        callback("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') || (queryMap.constructor.name !== 'Object')) {
      queryMap = {};
    }
    queryMap = array3Merge({
      table: '',
      m: 0,
      n: 0,
      where: ''
    }, {
      table: querySpec,
      m: mSpec,
      n: nSpec,
      where: whereSpec
    }, queryMap);
    var table = queryMap.table;
    var m = queryMap.m;
    var n = queryMap.n;
    var where = queryMap.where;

    // decode ambiguous table argument
    var tableStr = table;
    table = '`' + tableStr + '`';

    // cache the table description
    var dryRun = that.dryRun;
    var dumpSql = that.dumpSql;
    that.dryRun = false;
    that.dumpSql = false;
    that.readDescNative(tableStr, function() {
      that.dryRun = dryRun;
      that.dumpSql = dumpSql;
      var descMap = that.cache[tableStr];
      var sort_field = descMap.sort_column || '';
      var json_field = descMap.json_column || '';
      var orderby = '';
      if (sort_field !== '') {
        orderby = ' ORDER BY `' + sort_field + '` DESC';
      } else {
        callback(tableStr + ' does not have a sort_field');
        return;
      }

      if (m === n) {
        callback('`m` and `n` are the same so nothing to do');
        return;
      }

      // decode remaining ambiguous arguments
      if ((typeof where === 'object') && (where.constructor.name === 'Object')) {
        var whereMap = where;
        whereMap = that.applyTablesToWhere(whereMap, tableStr);
        where = that.implementWhere(whereMap);
      }
      if (where.substring(0, 1) === ' ') {
        // add raw SQL
      } else if (where.substring(0, 'WHERE '.length) === 'WHERE ') {
        where = ' ' + where;
      } else if (where !== '') {
        where = " WHERE " + where;
      }
      var op_cause = ' WHERE';
      if (where !== '') {
        op_cause = ' AND';
      }

      // get the length of the array
      var nLen = 0;
      var q = 'SELECT `' + sort_field + '` FROM ' + table + where + orderby + ';';
      that.mysql_query(q, function(e, rows) {
        if (rows.length > 0) {
          var row = rows[0];
          nLen = row[sort_field] + 1;
        }
        that.mysql_free_query(rows);
        if ((m < 0) || (m >= nLen)) {
          callback('`m` value out of range');
          return;
        }
        if ((n < 0) || (n >= nLen)) {
          callback('`n` value out of range');
          return;
        }

        var qa = [];

        // save the row at the m-th to the end
        var valuesStr = ' `' + sort_field + '`=' + nLen;
        var and_clause = ' `' + sort_field + '`=' + m;
        q = 'UPDATE ' + table + ' SET' + valuesStr + where + op_cause + and_clause + ';';
        qa.push(q);

        // update the indices between m and n
        if (that.opt) {
          if (m < n) {
            valuesStr = ' `' + sort_field + '`=`' + sort_field + '`-1';
            and_clause = ' `' + sort_field + '`>' + m + ' AND `' + sort_field + '`<=' + n;
          } else {
            valuesStr = ' `' + sort_field + '`=`' + sort_field + '`+1';
            and_clause = ' `' + sort_field + '`>=' + n + ' AND `' + sort_field + '`<' + m;
          }
          q = 'UPDATE ' + table + ' SET' + valuesStr + where + op_cause + and_clause + ';';
          qa.push(q);
        } else {
          if (m < n) {
            for (var i = m; i < n; i++) {
              valuesStr = ' `' + sort_field + '`=' + i;
              and_clause += ' `' + sort_field + '`=' + (i+1);
              q = 'UPDATE ' + table + ' SET' + valuesStr + where + op_cause + and_clause + ';';
              qa.push(q);
            }
          } else {
            for (i = m - 1; i >= n; i--) {
              valuesStr = ' `' + sort_field + '`=' + (i+1);
              and_clause = ' `' + sort_field + '`=' + i;
              q = 'UPDATE ' + table + ' SET' + valuesStr + where + op_cause + and_clause + ';';
              qa.push(q);
            }
          }
        }

        // copy the row at the end to the n-th position
        valuesStr = ' `' + sort_field + '`=' + n;
        and_clause = ' `' + sort_field + '`=' + nLen;
        q = 'UPDATE ' + table + ' SET' + valuesStr + where + op_cause + and_clause + ';';
        qa.push(q);

        var promises = promise_mapSeries([]);
        for (var qi in qa) {
          var q = qa[qi];
          promises.push((function(q) {
            return function promise() {
              that.mysql_query(q, function(e, rows) {
                if (rows) {
                  that.mysql_free_query(rows);
                }
                promise.resolve(q);
              });
            };
          })(q));
        }
        promises.resolve(function() {
          // check constraints
          if (that.checkConstraints) {
            e = that.checkSortColumnConstraint(querySpec, whereSpec);
            if (e === null) {
              e = that.checkJsonColumnConstraint(querySpec, whereSpec);
            }
            if (e !== null) {
              callback("post-check: " + e);
            }
          }

          callback(null, true);
        });
      });
    });
  };

  XibDb.prototype.moveRow = function(querySpec, whereSpec, mSpec, nSpec, callback) {
    var that = this;
    var funcIndex = findCallback(arguments, 1, 5);
    if (funcIndex >= 0) {
      callback = arguments[funcIndex];
      arguments[funcIndex] = null;
    }
    whereSpec = whereSpec || '';
    mSpec = (typeof obj !== 'undefined')? mSpec: 0;
    nSpec = (typeof obj !== 'undefined')? nSpec: 0;
    callback = callback || function() {};
    that.moveRowNative(querySpec, whereSpec, mSpec, nSpec, function(e, objs) {
      if (!e && objs && (typeof objs === 'object') && (objs.constructor.name === 'Object')) {
        try {
          arguments[1] = JSON.stringify(objs);
        } catch (e) {
          console.error(e);
        }
      }
      callback.apply(null, arguments);
    });
  }

  /**
   * Flexible mysql_query() function.
   *
   * @param {string} query The query to execute.
   * @param {function} callback A callback function.
   * @return {string} The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_query = function(query, callback) {
    var that = this;
    if (that.dumpSql || that.dryRun) {
      console.debug(query);
    }
    if (that.dryRun && (query.substring(0, 'SELECT '.length) !== 'SELECT ') && (query.substring(0, 'DESCRIBE '.length) !== 'DESCRIBE ')) {
      return callback({
        code: 'ER_DRY_RUN',
        errno: 0,
        fatal: false,
        sql: query,
        sqlState: 'HY000',
        sqlMessage: 'Dry run'
      });
    }
    return that.config['link_identifier'].query(query, callback);
  };

  /**
   * Flexible mysql_num_rows() function.
   *
   * @param $result String The result to fetch.
   * @return The mysql_num_rows() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_num_rows = function(result) {
    return (result && result.length)? result.length: 0;
  };

  /**
   * Flexible mysql_fetch_assoc() function.
   *
   * @param $result String The result to fetch.
   * @return The mysql_fetch_assoc() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_fetch_assoc = function(result) {
    return result;
  };

  /**
   * Flexible mysql_free_result() function.
   *
   * @param $result String The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_free_query = function() {
  };

  /**
   * Flexible mysql_free_result() function for INSERTs.
   *
   * @param $result String The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_free_exec = function() {
  };

  /**
   * Flexible mysql_real_escape_string() function.
   *
   * @param {string} unescaped_string String The string.
   * @return {string} The mysql_real_escape_string() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_real_escape_string = function(unescaped_string) {
    return mysql_real_escape_string(unescaped_string, this.config['link_identifier']);
  };

  /**
   * Flexible mysql_insert_id() function.
   *
   * @return The mysql_insert_id() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_insert_id = function(result) {
    return result.insertId;
  };

  /**
   * Prepend a table specifier to keys and values in a
   * WHERE array.
   *
   * @param a An array with WHERE clause specification.
   * @param table An array of tables.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.applyTablesToWhere = function(a, table) {
    var aa = {};
    for (var key in a) {
      var value = a[key];
      if (key.indexOf('.') === -1) {
        aa[table + '.' + key] = value;
      } else {
        aa[key] = value;
      }
    }
    return aa;
  };

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param where An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementWhere = function(whereSpec) {
    var that = this;
    var ret = whereSpec;
    if ((typeof whereSpec === 'object') && (whereSpec.constructor.name === 'Object')) {
      ret = that.implementClause(whereSpec);
      if (ret !== '') {
        ret = 'WHERE ' + ret;
      }
    }
    return ret;
  };

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param where An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementOn = function(on) {
    var joins = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN'];
    if (is_array(on)) {
      var clause = '';
      for (var table in on) {
        var cond = on[table];
        // INNER JOIN is the default
        var join = joins[0];
        // remove JOIN indicator from conditions
        var conds = {};
        for (var k in cond) {
          var v = cond[k];
          if (joins.indexOf(k.toUpperCase()) !== -1) {
            join = k;
          } else {
            conds[k] = v;
          }
        }
        // build the JOIN clause
        clause += ' '+join+' '+table+' ON '+this.implementClause(conds, true);
      }
      on = clause;
    }
    return on;
  };

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param clause An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementClause = function(clause, on) {
    on = on || false;
    if (is_array(clause) && (clause.length === 0)) {
      clause = '';
    } else if (is_array(clause)) {
      var op = 'AND';
      if (clause['or']) {
        op = 'OR';
        delete clause['or'];
      } else if (clause['and']) {
        delete clause['and'];
      }
      var s = '(';
      for (var key in clause) {
        var value = clause[key];
        if (s !== '(') {
          s += ' '+op+' ';
        }
        if (is_array(value)) {
          if (Array.isArray(value)) {
            // assume it is some SQL syntax
            s += '('+this.implementSyntax(key, value)+')';
          } else {
            // assume it is a sub-clause
            s += this.implementClause(value);
          }
        } else {
          s += key+'="'+this.mysql_real_escape_string(value)+'"';
        }
      }
      s += ')';
      clause = s;
    }
    return clause;
  }

  /**
   * Return a SQL string created from an array specification.
   *
   * It is easier to use an array to create a SQL string (like LIKE)
   * instead of using string concatenation.
   *
   * @param key A name, possibly unused.
   * @param clause An array with syntax specification.
   * @return A SQL syntax string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementSyntax = function(key, syntax) {
    var sql = '';
    if ((syntax.length >= 1) && (syntax[0] === 'LIKE')) {
      // LIKE: array('LIKE', 'tags', '% ', $arrayOfTags, ' %')
      var key = syntax[1];
      var values = [];
      if (syntax.length === 3) {
        values.push(syntax[2]);
      } else if ((syntax.length === 4) || (syntax.length === 5)) {
        var pre = syntax[2];
        var post = (syntax.length === 5)? syntax[4]: '';
        if (is_array(syntax[3])) {
          for (var v=0; v < syntax[3].length; ++v) {
            values.push(pre+syntax[3][v]+post);
          }
        } else {
          values.push(pre+syntax[3]+post);
        }
      }
      var op = 'OR';
      for (var v=0; v < values.length; ++v) {
        if (v > 0) {
          sql += ' '+op+' ';
        }
        sql += key+' LIKE \''+this.mysql_real_escape_string(values[v])+'\'';
      }
    } else {
      // OR: 'column'=>array('1', '2', '3')
      var op = 'OR';
      var values = syntax;
      for (var v=0; v < values.length; ++v) {
        if (v > 0) {
          sql += ' '+op+' ';
        }
        sql += '`'+key+'`=\''+this.mysql_real_escape_string(values[v])+'\'';
      }
    }
    return sql;
  };

// constructor is the module
module.exports = XibDb;

/**
 * True if the variable is defined.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if not undefined.
 */
function isset(v) {
  return typeof v !== 'undefined';
}

/**
 * Get the type but uses PHP constants.  Return NULL,
 * boolean, integer, double, string, array, object or
 * unknown type.
 * 
 * @param {mixed} v The variable to check.
 * @returns {String} The type of the variable.
 */
function gettype(v) {
  if (v === null) {
    return 'NULL';
  } else if ((typeof v) == 'boolean') {
    return 'boolean';
  } else if (((typeof v) == 'number') && ((v % 1) === 0)) {
    return 'integer';
  } else if (((typeof v) == 'number') && (Math.round(v) !== v)) {
    return 'double';
  } else if ((typeof v) == 'string') {
    return 'string';
  } else if (v instanceof Array) {
    return 'array'; // indexed array
  } else if (((typeof v) == 'object') && (v.constructor.name === 'Object')) {
    return 'array'; // associative array
  } else if ((typeof v) == 'object') {
    return 'object';
  }
  return 'unknown type';
}

/**
 * Return true if the varible is NULL.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is null.
 */
function is_null(v) {
  return gettype(v) == 'NULL';
}

/**
 * Return true if the variable is a string.
 * 
 * @param {mixed} s The variable to check.
 * @returns {Boolean} True if it is a string.
 */
function is_string(s) {
  return gettype(s) === 'string';
}

/**
 * Return true if the variable is a boolean.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is a boolean.
 */
function is_bool(v) {
  return gettype(v) == 'boolean';
}

/**
 * Return true if the variable is an integer.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is an integer.
 */
function is_int(s) {
  return gettype(s) === 'integer';
}

/**
 * Return true if the variable is a float.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is a float.
 */
function is_float(v) {
  return gettype(v) == 'double';
}

/**
 * Return true if the variable is an array.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is an array.
 */
function is_array(v) {
  return gettype(v) == 'array';
}

/**
 * Return true if the variable is an object.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is an object.
 */
function is_object(v) {
  return gettype(v) == 'object';
}

/**
 * Return true if the variable is an integer or a
 * float.
 * 
 * @param {mixed} v The variable to check.
 * @returns {Boolean} True if it is an integer or a float.
 */
function is_numeric(v) {
  var typ = gettype(v);
  return ((typ == 'integer') || (typ == 'double'));
}

/**
 * Get the string representation of this variable.
 * 
 * @param {mixed} n The variable.
 * @returns {String} The string representation.
 */
function strval(n) {
  return ''+n;
}

/**
 * Return the variable as an integer.
 * 
 * @param {mixed} n The variable.
 * @returns {number} The integer representation.
 */
function intval(n) {
  var typ = gettype(n);
  if (typ == 'integer') {
    return n;
  } else if (typ == 'string') {
    return parseInt(n);
  }
  return NaN;
}

/**
 * Return the variable as a float.
 * 
 * @param {mixed} n The variable.
 * @returns {number} The float representation.
 */
function floatval(n) {
  var typ = gettype(n);
  if (typ == 'integer') {
    return n;
  } else if (typ == 'double') {
    return n;
  } else if (typ == 'string') {
    return parseFloat(n);
  }
  return NaN;
}

/**
 * Return true if the key (property) exists in a
 * JavaScript object.
 * 
 * @param {string} k The property.
 * @param {Array} a The object.
 * @returns {Boolean} True if it exists.
 */
function array_key_exists(k, a) {
  return (typeof a[k]) != 'undefined';
}

/**
 * Merge keys of objects with string indices and
 * return a new array.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
function arrayMerge(a, b) {
  var r = {};
  var key;
  var value;
  for (key in a) {
    r[key] = a[key];
  }
  for (key in b) {
    r[key] = b[key];
  }
  return r;
}

/**
 * Merge two objects and return the result.
 *
 * @param {Array} array1 The first array.
 * @param {Array} array2 The second array.
 * @returns {Array} The merged array.
 */
function array_merge(array1, array2) {
  var p = '';
  var result = {};
  for (p in array1) {
    result[p] = array1[p];
  }
  for (p in array2) {
    result[p] = array2[p];
  }
  return result;
}

/**
 * Merge keys of objects with string indices.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
function array3Merge(a, b, c) {
  var key = null;
  var value = null;
  var r = {};
  for (key in a) {
    value = a[key];
    r[key] = value;
  }
  for (key in b) {
    value = b[key];
    if ((value !== null) && (value !== '')) {
      r[key] = value;
    }
  }
  for (key in c) {
    value = c[key];
    if ((value !== null) && (value !== '')) {
      r[key] = value;
    }
  }
  return r;
}

function array_intersect(a, b) {
  return a.filter(function(n) {
    return b.indexOf(n) !== -1;
  });

}

/**
 * Return the position of a substring in a string.
 * 
 * @param {string} s The string to search.
 * @param {string} needle The string to search for.
 * @param {number} offset The index to start from.
 * @returns {mixed} Return the position (int) or, if not found, false (boolean).
 */
function strpos(s, needle, offset) {
  var p = s.indexOf(needle, offset);
  return (p == -1)? false: p;
}

/**
 * Return a string with escape characters added for MySQL queries.
 * 
 * @param {string} s The string.
 * @returns {string} The escaped string.
 */
function mysql_real_escape_string(s) {
  return (s + '')
    .replace(/\0/g, '\\x00')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, '\\\'')
    .replace(/"/g, '\\"')
    .replace(/\x1a/g, '\\\x1a');
}

/**
 * Add a resolve() function to an array of
 * promises that will resolve all promises in
 * parallel.
 *
 * @param a array The array of promise functions.
 * @return array The array of promise functions.
 *
 * @author DanielWHoward
 **/
function promise_map(a) {
  a.resolve = function(f) {
    var a = this;
    if (f) a.resolved = f;
    if (!a.length) a.resolved([]);
    a.forEach(function(p) {
      p.resolve = function(v) {
        p.r = v;
        // fiddle here to modify resolver
        if (a.every(function(p) {
          return typeof p.r !== 'undefined';
        })) a.resolved(a.map(function(p) {
          return p.r;
        }));
      };
      p.call(a);
    });
  };
  return a;
}

/**
 * Add a resolve() function to an array of
 * promises that will resolve all promises in
 * serially, that is, one by one in order.
 *
 * @param a array The array of promise functions.
 * @return array The array of promise functions.
 *
 * @author DanielWHoward
 **/
function promise_mapSeries(a) {
  a.resolve = function(f) {
    var a = this;
    if (f) a.resolved = f;
    if (!a.length) a.resolved([]);
    a.forEach(function(p, i) {
      p.resolve = function(v) {
        p.r = v;
        if (i === (a.length - 1)) {
          a.resolved(a.map(function(p) {
            return p.r;
          }));
        } else {
          a[i+1].call(a);
        }
      };
    });
    if (a.length) a[0].call(a);
  };
  return a;
}

/**
 * Execute an array of MySQL queries synchronously and
 * in order.
 * 
 * @param conn The MySQL connection.
 * @param qa An array of MySQL statements.
 * @param func A callback function.
 */
function findCallback(args, start, end) {
  var index = -1;
  start = start || 0;
  end = end || 0;
  for (var a=Math.min(args.length-1, end-1); (a >= start) && (index === -1); --a) {
     if (!!(args[a] && args[a].constructor && args[a].call && args[a].apply)) {
      index = a;
    }
  }
  return index;
}
