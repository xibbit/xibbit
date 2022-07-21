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
   * @param {Map} config A configuration.
   *
   * @author DanielWHoward
   */
  function XibDb(config) {
    config = config || {};
    this.config = config;
    this.cache = {};
    this.mapBool = true;
    this.checkConstraints = false;
    this.dryRun = false;
    this.dumpSql = false;
    this.opt = true;
    this.log = config.log || this;
  }

  /**
   * Get JSON table rows from the database.
   *
   * The callback function is passed an error argument and
   * a JSON array of objects.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * @param {string} querySpec A database table.
   * @param {Map} whereSpec A WHERE clause.
   * @param {Array} columnsSpec A columns clause.
   * @param {Map} onSpec An ON clause.
   * @param {function} callback A callback function.
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

    if (that.dumpSql || that.dryRun) {
      that.log.println('readRowsNative()');
    }

    // check constraints
    var e = null;
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        return that.fail(e, 'pre-check', '', callback);
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') // not is_map
        || (queryMap.constructor.name !== 'Object')) {
      queryMap = {};
    }
    queryMap = array3Merge({
      table: '',
      columns: '*',
      on: '',
      where: '',
      'order by': ''
    }, {
      table: querySpec,
      columns: columnsSpec,
      on: onSpec,
      where: whereSpec,
      'order by': ''
    }, queryMap);
    var table = queryMap.table;
    var columns = queryMap.columns;
    var onVar = queryMap['on'];
    var where = queryMap.where;
    var orderby = queryMap['order by'];

    // decode ambiguous table argument
    var tableStr = '';
    var tableArr = [];
    if (((typeof table) === 'object') // is_list
        && (table.constructor.name === 'Array')) {
      tableStr = table[0];
      tableArr = table;
    } else if (typeof table === 'string') {
      tableStr = table;
      tableArr.push(table);
    }
    if ((typeof onVar === 'object') // is_map
        && (onVar.constructor.name === 'Object')
        && (tableArr.length === 1)) {
      for (var key in onVar) {
        tableArr.push(key);
      }
    }

    // cache the table description
    var dryRun = that.dryRun;
    var dumpSql = that.dumpSql;
    that.dryRun = false;
    that.dumpSql = false;
    var promises = promise_map([]);
    for (var t=0; t < tableArr.length; ++t) {
      promises.push((function(t) {
        return function promise() {
          that.readDescNative(t, function() {
            promise.resolve(true);
          });
        };
      })(tableArr[t]));
    }
    promises.resolve(function() {
      that.dryRun = dryRun;
      that.dumpSql = dumpSql;
      var descMap = that.cache[tableStr];
      var desc = {};
      for (var i=0; i < tableArr.length; ++i) {
        var t = tableArr[i];
        desc = arrayMerge(desc, that.cache[t].desc_a);
      }
      var sort_field = descMap.sort_column || '';
      var json_field = descMap.json_column || '';
      var orderByStr = '';
      if (sort_field !== '') {
        orderByStr = ' ORDER BY `' + sort_field + '` ASC';
      }
      if (orderby !== '') {
        orderByStr = ' ORDER BY ' + orderby;
      }

      // decode remaining ambiguous arguments
      var columnsStr = columns;
      if ((tableArr.length >= 2) && (typeof columns === 'string') && (columnsStr === '*')) {
        // convert '*' to '`table2`.*, `table3`.*'
        columnsStr = '';
        for (var t=1; t < tableArr.length; ++t) {
          var tbl = tableArr[t];
          if (columnsStr !== '') {
            columnsStr += ', ';
          }
          columnsStr += '`' + tbl + '`.*';
        }
      } else if (((typeof columns) === 'object') // is_list
          && (columns.constructor.name === 'Array')) {
        columnsStr = '';
        var columnArr = columns;
        if (tableArr.length === 1) {
          // only one table so it's simple
          for (var c=0; c < columnArr.length; ++c) {
            var col = columnArr[c];
            if (columnsStr !== '') {
              columnsStr += ', ';
            }
            columnsStr += '`' + col + '`';
          }
        } else if (tableArr.length >= 2) {
          // pick specific columns from first table
          for (var c=0; c < columnArr.length; ++c) {
            var col = columnArr[c];
            if (columnsStr !== '') {
              columnsStr += ', ';
            }
            columnsStr += '`' + tableStr + '`.`' + col + '`';
          }
          // assume '*' columns from remaining tables
          for (var t=1; t < tableArr.length; ++t) {
            var tbl = tableArr[t];
            if (columnsStr !== '') {
              columnsStr += ', ';
            }
            columnsStr += '`' + tbl + '`.*';
          }
        }
      }
      var onVarStr = onVar;
      if ((typeof onVar === 'object') // both
          && (['Object', 'Array'].indexOf(onVar.constructor.name) >= 0)) {
        // "on" spec shortcut: assume second table
        var tableNamesInBoth = [];
        var tableArrList = (tableArr.constructor.name === 'Object')? Object.keys(tableArr): tableArr;
        var onVarList = (onVar.constructor.name === 'Object')? Object.keys(onVar): onVar;
        tableNamesInBoth = tableArrList.filter(function(n){return onVarList.indexOf(n) !== -1;});
        if (tableNamesInBoth.length === 0) {
          // explicitly specify the second table
          var newOnVar = {};
          newOnVar[tableArr[1]] = onVar;
          onVar = newOnVar;
        }
        onVarStr = that.implementOn(onVar);
      }
      if (onVarStr !== '') {
        onVarStr = ' ' + onVarStr;
      }
      var whereStr = where;
      if ((typeof where === 'object') // is_map
          && (where.constructor.name === 'Object')) {
        var whereMap = that.applyTablesToWhere(where, tableStr);
        whereStr = that.implementWhere(whereMap);
      }
      if ((whereStr !== '') && !whereStr.startsWith(' ')) {
        whereStr = ' WHERE ' + whereStr;
      }

      var config = that.config;

      // read the table
      var q = 'SELECT ' + columnsStr + ' FROM `' + tableStr + '`' + onVarStr + whereStr + orderByStr + ';';
      that.mysql_query(q, function(e, rows, f) {
        if (e) {
          callback(e, rows, f);
        } else {
          // read result
          var objs = [];
          for (var r=0; r < rows.length; ++r) {
            var row = rows[r];
            var obj = {};
            // add the SQL data first
            for (var key in row) {
              if (!row.hasOwnProperty(key)) {
                continue;
              }
              var value = row[key];
              if (key === 'class') {
                key = 'clazz';
              }
              if (key === json_field) {
                // add non-SQL JSON data later
              } else if (key === config['sort_column']) {
                // sort column isn't user data
              } else if (value === null) {
                obj[key] = null;
              } else if (that.mapBool && is_numeric(value) && (strval(intval(value)) == value) && ((typeof desc[key]) === 'boolean')) {
                obj[key] = (intval(value) === 1);
              } else if (is_numeric(value) && (strval(intval(value)) == value) && is_int(desc[key])) {
                obj[key] = intval(value);
              } else if (is_numeric(value) && is_float(desc[key])) {
                obj[key] = floatval(value);
              } else {
                var val = value;
                try {
                  if (['{', '['].indexOf(value[0]) >= 0) {
                    val = JSON.parse(value);
                  }
                  obj[key] = val;
                } catch (e) {
                  obj[key] = val;
                }
              }
            }
            // add non-SQL JSON data
            if ((json_field !== '') && (row[json_field] !== null)) {
              try {
                var jsonMap = JSON.parse(row[json_field]);
                if ((typeof jsonMap !== 'object') // not is_map
                    || (jsonMap.constructor.name !== 'Object')) {
                  throw 'JSON.parse() error';
                }
                for (var key in jsonMap) {
                  if (!jsonMap.hasOwnProperty(key)) {
                    continue;
                  }
                  var value = jsonMap[key];
                  obj[key] = value;
                }
              } catch (e) {
                that.log.println(e);
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
   * @param {string} querySpec A database table.
   * @return A string containing a JSON object with columns and default values.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.readDescNative = function(querySpec, callback) {
    var that = this;
    if (Object.prototype.toString.call(querySpec) === '[object Object]') {
      var args = arrayMerge({
      }, querySpec);
      querySpec = args['table'];
    }
    var config = this.config;

    if (that.dumpSql || that.dryRun) {
      that.log.println('readDescNative()');
    }

    // check constraints
    var e = null;
//    if (that.checkConstraints) {
//      e = that.checkSortColumnConstraint(querySpec, whereSpec);
//      if (e === null) {
//        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
//      }
//      if (e !== null) {
//        return that.fail(e, 'pre-check', '', callback);
//      }
//    }

    var tableStr = querySpec;
    if ((typeof querySpec === 'object') // is_map
        && (querySpec.constructor.name === 'Object')) {
      var queryMap = arrayMerge({}, querySpec);
      tableStr = queryMap.table;
    }
    config = that.config;

    var desc = {};
    if (this.cache.hasOwnProperty(tableStr) && this.cache[tableStr].hasOwnProperty('desc')) {
      desc = this.cache[tableStr]['desc'];
      callback(e, desc);
    } else {
      // read the table description
      var sort_column = '';
      var json_column = '';
      var auto_increment_column = '';
      var q = 'DESCRIBE `' + tableStr + '`;';
      this.mysql_query(q, function(e, rows, f) {
        if (e) {
          return that.fail(e, '', q, callback);
        }
        for (var r=0; r < rows.length; ++r) {
          var rowdesc = rows[r];
          var field = rowdesc['Field'];
          var typ = rowdesc['Type'];
          var extra = rowdesc['Extra'];
          if (field === config['sort_column']) {
            sort_column = field;
          } else if (field === config['json_column']) {
            json_column = field;
          } else if (that.mapBool && (typ.indexOf('tinyint(1)') >= 0)) {
            desc[field] = false;
          } else if (typ.indexOf('int') >= 0) {
            desc[field] = 0;
          } else if (typ.indexOf('float') >= 0) {
            desc[field] = floatval(0.001);
          } else if (typ.indexOf('double') >= 0) {
            desc[field] = doubleval(0.000001);
          } else {
            desc[field] = '';
          }
          if (extra === 'auto_increment') {
            auto_increment_column = field;
          }
        }

        // cache the description
        if (!that.cache.hasOwnProperty(tableStr)) {
          that.cache[tableStr] = {};
        }
        that.cache[tableStr]['desc_a'] = desc;
        var descStr = JSON.stringify(desc);
        that.cache[tableStr]['desc'] = descStr;
        if (sort_column !== '') {
          that.cache[tableStr]['sort_column'] = sort_column;
        }
        if (json_column !== '') {
          that.cache[tableStr]['json_column'] = json_column;
        }
        if (auto_increment_column !== '') {
          that.cache[tableStr]['auto_increment_column'] = auto_increment_column;
        }

        // check constraints
//        if (that.checkConstraints) {
//          e = that.checkSortColumnConstraint(querySpec, whereSpec);
//          if (e === null) {
//            e = that.checkJsonColumnConstraint(querySpec, whereSpec);
//          }
//          if (e !== null) {
//            return that.fail(e, 'post-check', '', callback);
//          }
//        }

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
   * @param {string} querySpec A database table.
   * @param {string} whereSpec A WHERE clause.
   * @param {mixed} valuesSpec A JSON string (string) or JSON array (array).
   * @param {number} nSpec The place to insert the row before; -1 means the end.
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

    if (that.dumpSql || that.dryRun) {
      that.log.println('insertRowNative()');
    }

    // check constraints
    var e = null;
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        return that.fail(e, 'pre-check', '', callback);
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') // not is_map
        || (queryMap.constructor.name !== 'Object')) {
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
      var auto_increment_field = descMap.auto_increment_column || '';
      var orderByStr = '';
      if (sort_field !== '') {
        orderByStr = ' ORDER BY `' + sort_field + '` DESC';
      }

      // decode remaining ambiguous arguments
      var valuesStr = values;
      var valuesMap = values;
      var sqlValuesMap = {}; // SET clause
      var jsonMap = {}; // 'json' field
      if (typeof values === 'string') {
        valuesStr = ' ' + values;
        valuesMap = {};
      } else {
        valuesStr = '';
        valuesMap = arrayMerge({}, values);
        jsonMap = arrayMerge({}, values);
        // copy SQL columns to sqlValuesMap
        for (var col in desc) {
          if (!desc.hasOwnProperty(col)) {
            continue;
          }
          if (jsonMap.hasOwnProperty(col)) {
            var compat = false;
            if (gettype(desc[col]) === gettype(jsonMap[col])) {
              compat = true;
            }
            if (is_float(desc[col]) && is_int(jsonMap[col])) {
              compat = true;
            }
            if (typeof desc[col] === 'string') {
              compat = true;
            }
            if (compat) {
              sqlValuesMap[col] = jsonMap[col];
              delete jsonMap[col];
            }
          }
        }
        // copy freeform values into 'json' field
        if (json_field !== '') {
          sqlValuesMap[json_field] = jsonMap;
        }
      }
      var nInt = n;
      var whereStr = where;
      if ((typeof where === 'object') // is_map
          && (where.constructor.name === 'Object')) {
        whereStr = that.implementWhere(where);
      }
      if ((whereStr !== '') && !whereStr.startsWith(' ')) {
        whereStr = ' WHERE ' + whereStr;
      }
      var limitStr = '';
      if (that.opt || (nInt === -1)) {
        limitStr = ' LIMIT 1';
      }

      var qa = [];

      // update the positions
      var promises = promise_mapSeries([]);
      if (sort_field !== '') {
        var nLen = 0;
        promises.push((function() {
          return function promise() {
            var q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + limitStr + ';';
            that.mysql_query(q, function(e, rows) {
              for (var r=0; r < rows.length; ++r) {
                var row = rows[r];
                nValue = row[sort_field];
                if (nValue >= nLen) {
                  nLen = nValue + 1;
                }
                if (nInt === -1) {
                  nInt = nValue + 1;
                }
                if (nInt > nValue) {
                  break;
                }
                var setStr = '';
                var andStr = ' WHERE ';
                if (whereStr !== '') {
                  andStr = ' AND ';
                }
                if (that.opt) {
                  setStr += ' SET `' + sort_field + '`=`' + sort_field + '`+1';
                  andStr += '`' + sort_field + '`>=' + nInt;
                  q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
                  qa.push(q);
                  break;
                } else {
                  setStr += ' SET `' + sort_field + '`=' + (nValue+1);
                  andStr += ' `' + sort_field + '`=' + nValue;
                  q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
                  qa.push(q);
                }
              }
              that.mysql_free_query(rows);
              if (nInt === -1) {
                nInt = 0;
              }
              if (nInt > nLen) {
                return that.fail(null, '`n` value out of range', q, callback);
              }

              // add sort field to sqlValuesMap
              if (Object.keys(sqlValuesMap).length > 0) {
                sqlValuesMap[sort_field] = nInt;
              }
              promise.resolve(true);
            });
          };
        })());
      }
      promises.resolve(function() {
        // finally, generate valuesStr from valuesMap
        if (Object.keys(sqlValuesMap).length > 0) {
          var colsStr = '';
          var valuesStr = '';
          for (var col in sqlValuesMap) {
            if (!sqlValuesMap.hasOwnProperty(col)) {
              continue;
            }
            var value = sqlValuesMap[col];
            if (colsStr !== '') {
              colsStr += ',';
            }
            colsStr += '`' + that.mysql_real_escape_string(col) + '`';
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
            } else if (typeof value === 'boolean') {
              var valueBool = !!value;
              if (valueBool) {
                valueStr = '1';
              } else {
                valueStr = '0';
              }
            } else if (is_int(value)) {
              valueStr = value;
            } else if (value === null) {
              valueStr = 'NULL';
            } else {
              valueStr = "'" + that.mysql_real_escape_string(value) + "'";
            }
            valuesStr += valueStr;
          }
          valuesStr = ' (' + colsStr + ') VALUES (' + valuesStr + ')';
        }

        var q = 'INSERT INTO `' + tableStr + '`' + valuesStr + ';';
        qa.push(q);

        var promises = promise_mapSeries([]);
        var qr = null;
        for (var i=0; i < qa.length; ++i) {
          var q = qa[i];
          promises.push((function(q) {
            return function promise() {
              that.mysql_query(q, function(e, rows) {
                qr = rows;
                if (rows) {
                  that.mysql_free_query(rows);
                }
                promise.resolve(q);
              });
            };
          })(q));
        }
        promises.resolve(function() {
          if ((auto_increment_field !== '') && qr) {
            valuesMap[auto_increment_field] = that.mysql_insert_id(qr);
          }

          // check constraints
          if (that.checkConstraints) {
            e = that.checkSortColumnConstraint(querySpec, whereSpec);
            if (e === null) {
              e = that.checkJsonColumnConstraint(querySpec, whereSpec);
            }
            if (e !== null) {
              return that.fail(e, 'post-check', '', callback);
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
   * @param {string} querySpec A database table.
   * @param {string} whereSpec A WHERE clause.
   * @param {mixed} nSpec The row to delete (int) or JSON data to select the row (string).
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
      that.log.println('deleteRowNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        return that.fail(e, 'pre-check', '', callback);
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') // not is_map
        || (queryMap.constructor.name !== 'Object')) {
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

      // decode remaining ambiguous arguments
      var params = {};
      var nInt = n;
      var nStr = n;
      var whereStr = where;
      if ((typeof where === 'object') // is_map
          && (where.constructor.name === 'Object')) {
        whereStr = that.implementWhere(where);
      }
      if ((whereStr !== '') && !whereStr.startsWith(' ')) {
        whereStr = ' WHERE ' + whereStr;
      }
      var andStr = '';

      var promises = promise_mapSeries([]);
      promises.push((function() {
        return function promise() {
          if ((sort_field !== '') && is_int(n) && (n !== -1)) {
            var opStr = ' WHERE ';
            if (whereStr !== '') {
              opStr = ' AND ';
            }
            andStr += opStr + '`' + sort_field + '`=' + nInt;
            promise.resolve(true);
          } else {
            if (nInt === -1) {
              andStr = '';
            }
            if ((typeof n === 'string') && (nStr !== '')) {
              try {
                var nMap = JSON.parse(nStr);
                if ((typeof nMap !== 'object') // not is_map
                    || (nMap.constructor.name !== 'Object')) {
                  throw 'JSON.parse() error';
                }
                for (var col in nMap) {
                  if (!nMap.hasOwnProperty(col)) {
                    continue;
                  }
                  var value = nMap[col];
                  if ((andStr === '') && (whereStr === '')) {
                    andStr += ' WHERE ';
                  } else {
                    andStr += ' AND ';
                  }
                  andStr += col + "='" + value + "'";
                }
              } catch (e) {
                andStr += nStr;
              }
            }
            var field = sort_field;
            if (sort_field === '') {
              field = '*';
            }
            var orderByStr = '';
            if (sort_field !== '') {
              orderByStr = ' ORDER BY `' + sort_field + '` DESC';
            }
            var q = 'SELECT COUNT(*) AS num_rows FROM `' + tableStr + '`' + whereStr + andStr + orderByStr + ';';
            that.mysql_query(q, function(e, rows) {
              if (e) {
                return that.fail(e, '', q, callback);
              }
              var num_rows = 0;
              for (var r=0; r < rows.length; ++r) {
                var row = rows[r];
                num_rows = row.num_rows;
              }
              if (nInt === -1) {
                nInt = num_rows - 1;
              }
              that.mysql_free_query(rows);
              var quotedField = field;
              if (field !== '*') {
                quotedField = '`' + field + '`';
              }
              q = 'SELECT ' + quotedField + ' FROM `' + tableStr + '`' + whereStr + andStr + orderByStr + ';';
              // verify that non-standard n var yields valid rows
              if ((num_rows === 1) || ((num_rows > 1) && (sort_field !== ''))) {
                that.mysql_query(q, function(e, rows) {
                  var row = rows[0];
                  if (num_rows === 1) {
                    if (sort_field !== '') {
                      n = row[sort_field];
                    }
                  } else if ((num_rows > 1) && (sort_field !== '')) {
                    n = row[sort_field];
                    if ((andStr === '') && (whereStr === '')) {
                      andStr += ' WHERE ';
                    } else {
                      andStr += ' AND ';
                    }
                    andStr += '`' + sort_field + '`=' + nInt;
                  }
                  that.mysql_free_query(rows);
                  promise.resolve(true);
                });
              } else {
                return that.fail(null, 'xibdb.DeleteRow():num_rows:' + num_rows, '', callback);
              }
            });
          }
        };
      })());
      promises.resolve(function() {
        var qa = [];

        // update the positions
        var promises = promise_mapSeries([]);
        if (sort_field !== '') {
          var nLen = 0;
          var orderByStr = ' ORDER BY `' + sort_field + '` ASC';
          var limitStr = '';
          if (that.opt) {
            orderByStr = ' ORDER BY `' + sort_field + '` DESC';
            limitStr = ' LIMIT 1';
          }
          promises.push((function() {
            return function promise() {
              var q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + limitStr + ';';
              that.mysql_query(q, function(e, rows) {
                for (var r=0; r < rows.length; ++r) {
                  var row = rows[r];
                  nValue = row[sort_field];
                  if (nValue >= nLen) {
                    nLen = nValue + 1;
                  }
                  var setStr = '';
                  var andSetStr = ' WHERE ';
                  if (whereStr !== '') {
                    andSetStr = ' AND ';
                  }
                  if (that.opt) {
                    setStr += ' SET `' + sort_field + '`=`' + sort_field + '`-1';
                    andSetStr += '`' + sort_field + '`>=' + nInt;
                    q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andSetStr + ';';
                    qa.push(q);
                    break;
                  } else {
                    setStr += ' SET `' + sort_field + '`=' + (nValue-1);
                    andSetStr += '`' + sort_field + '`=' + nValue;
                    q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andSetStr + ';';
                    qa.push(q);
                  }
                }
                that.mysql_free_query(rows);
                if (nInt >= nLen) {
                  return that.fail(null, '`n` value out of range', '', callback);
                }
                promise.resolve(true);
              });
            };
          })());
        }

        promises.resolve(function() {
          var q = 'DELETE FROM `' + tableStr + '`' + whereStr + andStr + ';';
          qa.unshift(q);

          var promises = promise_mapSeries([]);
          for (var i=0; i < qa.length; ++i) {
            var q = qa[i];
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
                return that.fail(e, 'post-check', '', callback);
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
   * @param {string} querySpec A database table.
   * @param {Map} valuesSpec A JSON string (string) or JSON array (array).
   * @param {mixed} nSpec The row to update (int) or JSON data to select the row (string).
   * @param {Map} whereSpec A WHERE clause.
   * @param {number} limitSpec A LIMIT value for number of rows to retrieve.
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

    if (that.dumpSql || that.dryRun) {
      that.log.println('updateRowNative()');
    }

    // check constraints
    var e = null;
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        return that.fail(e, 'pre-check', '', callback);
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') // not is_map
        || (queryMap.constructor.name !== 'Object')) {
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
      var orderByStr = '';
      if (sort_field !== '') {
        orderByStr = ' ORDER BY `' + sort_field + '` ASC';
      }

      // decode remaining ambiguous arguments
      var valuesStr = values;
      var valuesMap = values;
      var sqlValuesMap = {}; // SET clause
      var jsonMap = {}; // 'json' field
      if (typeof values === 'string') {
        valuesStr = ' SET ' + values;
        valuesMap = {};
      } else {
        valuesStr = '';
        valuesMap = arrayMerge({}, valuesMap);
        jsonMap = arrayMerge({}, valuesMap);
        // copy SQL columns to sqlValuesMap
        for (var col in desc) {
          if (!desc.hasOwnProperty(col)) {
            continue;
          }
          var compat = false;
          if (jsonMap.hasOwnProperty(col)) {
            if (gettype(desc[col]) === gettype(jsonMap[col])) {
              compat = true;
            }
            if (is_float(desc[col]) && is_int(jsonMap[col])) {
              compat = true;
            }
            if (typeof desc[col] === 'string') {
              compat = true;
            }
            if (compat) {
              sqlValuesMap[col] = jsonMap[col];
              delete jsonMap[col];
            }
          }
        }
      }
      var updateJson = (json_field !== '') && (Object.keys(jsonMap).length > 0);
      var nInt = n;
      var limitInt = limit;
      var whereStr = where;
      if ((typeof where === 'object') // is_map
          && (where.constructor.name === 'Object')) {
        whereStr = that.implementWhere(where);
      }
      if ((whereStr !== '') && !whereStr.startsWith(' ')) {
        whereStr = ' WHERE ' + whereStr;
      }
      var andStr = '';
      if ((sort_field !== '') && (nInt >= 0)) {
        andStr = ' WHERE';
        if (whereStr !== '') {
          andStr = ' AND';
        }
        andStr += ' `' + sort_field + '`=' + nInt;
      }

      // get the number of rows_affected and save values
      q = 'SELECT * FROM `' + tableStr + '`' + whereStr + andStr + orderByStr + ';';
      that.mysql_query(q, function(e, rows) {
        var rows_affected = 0;
        var sqlRowMaps = [];
        for (var r=0; r < rows.length; ++r) {
          var row = rows[r];
          ++rows_affected;
          rowValues = {};
          for (var col in row) {
            if (!row.hasOwnProperty(col)) {
              continue;
            }
            rowValues[col] = row[col];
          }
          // test json_field contents for each affected row
          if (updateJson) {
            try {
              var jsonRowMap = JSON.parse(row[json_field]);
              if ((typeof jsonRowMap !== 'object') // not is_map
                  || (jsonRowMap.constructor.name !== 'Object')) {
                throw 'JSON.parse() error';
              }
            } catch (e) {
              return that.fail(e, '--' + row[json_field] + '-- value in `' + json_field + '` column in `' + tableStr + '` table; ' + e, q, callback);
            }
          }
          sqlRowMaps.push(rowValues);
        }
        that.mysql_free_query(rows);

        if (rows_affected === 0) {
          if (andStr === '') {
            return that.fail(null, '0 rows affected', q, callback);
          } else {
            q = 'SELECT COUNT(*) AS rows_affected FROM `' + tableStr + '`' + whereStr + ';';
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
              return that.fail(null, e, q, callback);
            });
          }
          return;
        } else if ((limitInt !== -1) && (rows_affected > limitInt)) {
          return that.fail(null, '' + rows_affected + ' rows affected but limited to ' + limitInt + ' rows', q, callback);
        }

        var qa = [];

        // generate UPDATE statements using json_field
        var promises = promise_mapSeries([]);
        promises.push((function() {
          return function promise() {
            if (typeof values === 'string') {
              q = 'UPDATE `' + tableStr + '`' + valuesStr + whereStr + andStr + ';';
              qa.push(q);
              promise.resolve(q);
            } else {
              for (var m=0; m < sqlRowMaps.length; ++m) {
                var sqlRowMap = sqlRowMaps[m];
                // construct SET clause
                var valuesRow = ' SET ';
                for (var col in sqlRowMap) {
                  if (!sqlRowMap.hasOwnProperty(col)) {
                    continue;
                  }
                  var oldValue = sqlRowMap[col];
                  var newValue = oldValue;
                  if (updateJson && (col === json_field)) {
                    try {
                      // figure out newValue for json_field
                      var oldMap = JSON.parse(oldValue);
                      if ((typeof oldMap !== 'object') // not is_map
                          || (oldMap.constructor.name !== 'Object')) {
                        throw 'JSON.parse() error';
                      }
                      var newMap = arrayMerge(oldMap, jsonMap);
                      newValue = JSON.stringify(newMap);
                      if ((newValue === '') || (newValue === '[]')) {
                        newValue = '{}';
                      }
                    } catch (e) {
                    }
                  } else if (sqlValuesMap.hasOwnProperty(col)) {
                    newValue = sqlValuesMap[col];
                  }
                  // add changed values to SET clause
                  if (oldValue !== newValue) {
                    if (valuesRow !== ' SET ') {
                      valuesRow += ', ';
                    }
                    valuesRow += '`' + that.mysql_real_escape_string(col) + "`='" + that.mysql_real_escape_string(newValue) + "'";
                  }
                }
              }
              // construct WHERE clause
              var whereRow = ' WHERE ';
              for (var col in sqlRowMap) {
                if (!sqlRowMap.hasOwnProperty(col)) {
                  continue;
                }
                var value = sqlRowMap[col];
                //TODO include date values properly
                if (Object.prototype.toString.call(value) !== '[object Date]') {
                  if (whereRow !== ' WHERE ') {
                    whereRow += ' AND ';
                  }
                  var opStr = '=';
                  if (is_numeric(value) && is_float(desc[col])) {
                    opStr = ' LIKE ';
                  }
                  whereRow += '`' + that.mysql_real_escape_string(col) + "`" + opStr + "'" + that.mysql_real_escape_string(value) + "'";
                }
              }
              if (valuesRow !== ' SET ') {
                var q = 'UPDATE `' + tableStr + '`' + valuesRow + whereRow + ' LIMIT 1;';
                qa.push(q);
                promise.resolve(q);
              } else {
                promise.resolve();
              }
            }
          };
        })());

        promises.resolve(function() {
          var promises = promise_mapSeries([]);
          for (var i=0; i < qa.length; ++i) {
            var q = qa[i];
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
                return that.fail(e, 'post-check', '', callback);
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
   * @param {string} querySpec A database table.
   * @param {Map} whereSpec A WHERE clause.
   * @param {number} mSpec The row to move.
   * @param {number} nSpec The row to move to.
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
      that.log.println('moveRowNative()');
    }

    // check constraints
    if (that.checkConstraints) {
      e = that.checkSortColumnConstraint(querySpec, whereSpec);
      if (e === null) {
        e = that.checkJsonColumnConstraint(querySpec, whereSpec);
      }
      if (e !== null) {
        return that.fail(e, 'pre-check', '', callback);
      }
    }

    // decode the arguments into variables
    var queryMap = querySpec;
    if ((typeof queryMap !== 'object') // not is_map
        || (queryMap.constructor.name !== 'Object')) {
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
      var orderByStr = '';
      if (sort_field !== '') {
        orderByStr = ' ORDER BY `' + sort_field + '` DESC';
      } else {
        return that.fail('', tableStr + ' does not have a sort_field', '', callback);
      }
      var limitStr = ' LIMIT 1';

      if (m === n) {
        return that.fail('', '`m` and `n` are the same so nothing to do', '', callback);
      }

      // decode remaining ambiguous arguments
      var whereStr = where;
      if ((typeof where === 'object') // is_map
          && (where.constructor.name === 'Object')) {
        whereMap = that.applyTablesToWhere(where, tableStr);
        whereStr = that.implementWhere(whereMap);
      }
      if ((whereStr !== '') && !whereStr.startsWith(' ')) {
        whereStr = ' WHERE ' + whereStr;
      }
      var opStr = '';
      if ((sort_field !== '') && (n >= 0)) {
        opStr = ' WHERE';
        if (whereStr !== '') {
          opStr = ' AND';
        }
      }

      // get the length of the array
      var q = 'SELECT `' + sort_field + '` FROM `' + tableStr + '`' + whereStr + orderByStr + limitStr + ';';
      that.mysql_query(q, function(e, rows) {
        var nLen = 0;
        if (rows.length > 0) {
          var row = rows[0];
          nLen = row[sort_field] + 1;
        }
        that.mysql_free_query(rows);
        if ((m < 0) || (m >= nLen)) {
          return that.fail(null, '`m` value out of range', q, callback);
        }
        if ((n < 0) || (n >= nLen)) {
          return that.fail(null, '`n` value out of range', q, callback);
        }

        var qa = [];

        // save the row at the m-th to the end
        var setStr = ' SET `' + sort_field + '`=' + nLen;
        var andStr = opStr + ' `' + sort_field + '`=' + m;
        q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
        qa.push(q);

        // update the indices between m and n
        if (that.opt) {
          if (m < n) {
            setStr = ' SET `' + sort_field + '`=`' + sort_field + '`-1';
            andStr = opStr + ' `' + sort_field + '`>' + m + ' AND `' + sort_field + '`<=' + n;
          } else {
            setStr = ' SET `' + sort_field + '`=`' + sort_field + '`+1';
            andStr = opStr + ' `' + sort_field + '`>=' + n + ' AND `' + sort_field + '`<' + m;
          }
          q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
          qa.push(q);
        } else {
          if (m < n) {
            for (var i = m; i < n; i++) {
              setStr = ' SET `' + sort_field + '`=' + i;
              andStr = opStr + ' `' + sort_field + '`=' + (i+1);
              q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
              qa.push(q);
            }
          } else {
            for (var i = m - 1; i >= n; i--) {
              setStr = ' SET `' + sort_field + '`=' + (i+1);
              andStr = opStr + ' `' + sort_field + '`=' + i;
              q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
              qa.push(q);
            }
          }
        }

        // copy the row at the end to the n-th position
        setStr = ' SET `' + sort_field + '`=' + n;
        andStr = opStr + ' `' + sort_field + '`=' + nLen;
        q = 'UPDATE `' + tableStr + '`' + setStr + whereStr + andStr + ';';
        qa.push(q);

        var promises = promise_mapSeries([]);
        for (var i=0; i < qa.length; ++i) {
          var q = qa[i];
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
              return that.fail(e, 'post-check', '', callback);
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
  };

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
      that.log.println(query);
    }
    if (that.dryRun && (!query.startsWith('SELECT ') && !query.startsWith('DESCRIBE '))) {
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
   * Renamed mysql_query() for INSERT queries so
   * mysql_insert_id() will work.
   *
   * @param {string} query The query to execute.
   * @param {function} callback A callback function.
   * @return {string} The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_exec = function(query, callback) {
    return that.mysql_query(query, callback);
  };

  /**
   * Flexible mysql_fetch_assoc() function.
   *
   * @param {Map} result The result to fetch.
   * @return The mysql_fetch_assoc() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_fetch_assoc = function(rows) {
    var assoc = null;
    if (rows) {
      if (!rows.hasOwnProperty('mysql_fetch_assoc_index')) {
        rows.mysql_fetch_assoc_index = 0;
      }
      if (rows.mysql_fetch_assoc_index < rows.length) {
        assoc = rows[rows.mysql_fetch_assoc_index++];
      }
    }
    return assoc;
  };

  /**
   * Flexible mysql_free_result() function.
   *
   * @param {Object} result The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_free_query = function(result) {
  };

  /**
   * Flexible mysql_free_result() function for INSERTs.
   *
   * @param {Object} result The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.mysql_free_exec = function(result) {
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
    return (unescaped_string + '')
      .replace(/\0/g, '\\x00')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, '\\\'')
      .replace(/"/g, '\\"')
      .replace(/\x1a/g, '\\\x1a');
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
   * Return true if the data in a table, optionally
   * filtered with a WHERE clause, has integers 0 .. n-1
   * in its sort_column such that it is an array.
   *
   * @param {string} querySpec A database table.
   * @param {Map} whereSpec A WHERE clause.
   * @param {function} callback A callback function.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.checkSortColumnConstraint = function(querySpec, whereSpec, callback) {
    var e = null;

    callback(e);
  };

  /**
   * Return true if the data in a table, optionally
   * filtered with a WHERE clause, has integers 0 .. n-1
   * in its sort_column such that it is an array.
   *
   * @param {string} querySpec A database table.
   * @param {function} callback A callback function.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.checkJsonColumnConstraint = function(querySpec, callback) {
    var e = null;

    // decode the arguments into variables
    var queryMap = querySpec;
    callback(e);
  };

  /**
   * Prepend a table specifier to keys and values in a
   * WHERE array.
   *
   * @param {Map} a An array with WHERE clause specification.
   * @param {string} table An array of tables.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.applyTablesToWhere = function(a, table) {
    var keywords = ['AND', 'OR'];
    var aa = {};
    for (var key in a) {
      if (!a.hasOwnProperty(key)) {
        continue;
      }
      var value = a[key];
      if ((key.indexOf('.') === -1) && (keywords.indexOf(key) === -1)) {
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
   * @param {Map} whereSpec An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementWhere = function(whereSpec) {
    var that = this;
    var whereStr = '';
    if ((typeof whereSpec === 'object') // is_map
        && (whereSpec.constructor.name === 'Object')) {
      whereStr = that.implementCondition(whereSpec);
      if (whereStr !== '') {
        whereStr = ' WHERE ' + whereStr;
      }
    } else {
      whereStr = whereSpec;
    }
    return whereStr;
  };

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param {Map} onVar An array with an ON clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementOn = function(onVar) {
    var that = this;
    var joins = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN'];
    var onVarStr = '';
    if ((typeof onVar === 'object') // is_map
        && (onVar.constructor.name === 'Object')) {
      for (var table in onVar) {
        if (!onVar.hasOwnProperty(table)) {
          continue;
        }
        var cond = onVar[table];
        // INNER JOIN is the default
        var join = joins[0];
        // remove JOIN indicator from conditions
        var conds = {};
        for (var k in cond) {
          if (!cond.hasOwnProperty(k)) {
            continue;
          }
          var v = cond[k];
          if (joins.indexOf(k.toUpperCase()) !== -1) {
            join = k;
          } else {
            conds[k] = v;
          }
        }
        // build the JOIN clause
        onVarStr += join + ' `' + table + '` ON ' + that.implementCondition(conds, 'ON ');
      }
    } else {
      onVarStr = onVar;
    }
    return onVarStr;
  };

  /**
   * Return a SQL condition string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param {Map} condObj An array with conditional specification.
   * @param {string} onVar A string with an ON clause specification.
   * @return A SQL string containing a nested conditional.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementCondition = function(condObj, onVar) {
    var that = this;
    onVar = onVar || '';
    var cond = '';
    if ((typeof condObj) == 'string') {
      cond = condObj;
    } else if ((typeof condObj === 'object') // is_map
        && (condObj.constructor.name === 'Object')) {
      var condMap = condObj;
      var conds = [];
      var op = ' AND ';
      for (var key in condMap) {
        if (!condMap.hasOwnProperty(key)) {
          continue;
        }
        var value = condMap[key];
        var sub = '';
        if (key.toUpperCase() === 'OR') {
          op = ' OR ';
        } else if (key.toUpperCase() !== 'AND') {
          if (((typeof value) === 'object') // is_list
              && (value.constructor.name === 'Array')) {
            // assume it is some SQL syntax
            sub = that.implementSyntax(key, value);
            if (sub !== '') {
              sub = '(' + sub + ')';
            }
          } else if (((typeof value) === 'object') // is_map
              && (value.constructor.name === 'Object')) {
            // assume it is a sub-clause
            sub = that.implementCondition(value);
            if (sub !== '') {
              sub = '(' + sub + ')';
            }
          } else {
            sub = that.mysql_real_escape_string(value);
            if (onVar === '') {
              sub = "'" + sub + "'";
            } else {
              sub = '`' + sub.replace(/\./g, '`.`') + '`';
            }
            sub = '`' + key.replace(/\./g, '`.`') + '`=' + sub;
          }
        }
        if (sub !== '') {
          conds.push(sub);
        }
      }
      if (conds.length > 0) {
        cond = conds.join(op);
      }
    }
    return cond;
  }

  /**
   * Return a SQL string created from an array specification.
   *
   * It is easier to use an array to create a SQL string (like LIKE)
   * instead of using string concatenation.
   *
   * @param {string} key A name, possibly unused.
   * @param {Array} syntax An array with syntax specification.
   * @return A SQL syntax string.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.implementSyntax = function(key, syntax) {
    var sql = '';
    var cmdStr = syntax[0];
    if ((syntax.length >= 1) && (cmdStr.toUpperCase() === 'LIKE')) {
      // LIKE: 'unused': ['LIKE', 'tags', '% ', $arrayOfTags, ' %']
      var op = ' OR ';
      var clauses = [];
      var col = syntax[1];
      var likeStr = '`' + col + '` LIKE';
      if (syntax.length === 3) {
        var valueStr = syntax[2];
        valueStr = likeStr + " '" + that.mysql_real_escape_string(valueStr) + "'";
        clauses.push(valueStr);
      } else if ((syntax.length === 4) || (syntax.length === 5)) {
        var pre = syntax[2];
        var post = '';
        if (syntax.length === 5) {
          post = syntax[4];
        }
        if (((typeof syntax[3]) === 'object') // is_list
            && (syntax[3].constructor.name === 'Array')) {
          for (var i=0; i < syntax[3].length; ++i) {
            var value = syntax[3][i];
            var valueStr = pre + value + post;
            valueStr = likeStr + " '" + that.mysql_real_escape_string(valueStr) + "'";
            clauses.append(valueStr);
          }
        } else {
          var valueStr = syntax[3];
          valueStr = likeStr + " '" + that.mysql_real_escape_string(valueStr) + "'";
          clauses.append(valueStr);
        }
      }
      sql = clauses.join(op);
    } else {
      // OR: aColumn: ['1', '2', '3']
      var op = ' OR ';
      var clauses = [];
      for (var v=0; v < syntax.length; ++v) {
        var valueStr = syntax[i];
        valueStr = '`' + key + "`='" + that.mysql_real_escape_string(valueStr) + "'";
        clauses.append(valueStr);
      }
      sql = clauses.join(op);
    }
    return sql;
  };

  /**
   * Do nothing for log output.
   *
   * @param {string} s The string to log.
   8
   * @author DanielWHoward
   */
  XibDb.prototype.println = function(s) {
    console.debug(s);
  };

  /**
   * Throw an exception to create a stack trace.
   *
   * @author DanielWHoward
   */
  XibDb.prototype.fail = function(ex, eStr, q, callback) {
    var that = this;
    q = q || '';
    if (q !== '') {
      that.log.println('E:' + q);
    }
    eStr = eStr || ex.toString();
    return callback(eStr);
  };

// constructor is the module
module.exports = XibDb;

var unknownTypeId = 1;

/**
 * Get the type but uses PHP constants.  Return NULL,
 * boolean, integer, double, string, array, object or
 * unknown type.
 * 
 * @param {mixed} v The variable to check.
 * @returns {string} The type of the variable.
 */
function gettype(v) {
  if (v === null) {
    return 'NULL';
  } else if (typeof v == 'boolean') {
    return 'boolean';
  } else if ((typeof v == 'number') && ((v % 1) === 0)) {
    return 'integer';
  } else if ((typeof v == 'number') && (Math.round(v) !== v)) {
    return 'double';
  } else if (typeof v == 'string') {
    return 'string';
  } else if ((typeof v === 'object') && v.constructor && (v.constructor.name === 'Array')) {
    return 'list'; // list/indexed array
  } else if ((typeof v === 'object') && v.constructor && (v.constructor.name === 'Object')) {
    return 'map'; // map/associative array
  } else if ((typeof v === 'object') && v.constructor && v.constructor.name) {
    return v.constructor.name;
  }
  return 'unknown type ' + unknownTypeId++;
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
 * Return the variable as a double.
 *
 * @param {mixed} n The variable.
 * @returns {number} The double representation.
 */
function doubleval(n) {
  return floatval(n);
}

/**
 * Merge keys of objects with string indices and
 * return a new array.  Standard now but provided
 * so merge can be customized.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
function arrayMerge(a, b) {
  var r = {};
  var key;
  for (key in a) {
    if (!a.hasOwnProperty(key)) {
      continue;
    }
    r[key] = a[key];
  }
  for (key in b) {
    if (!b.hasOwnProperty(key)) {
      continue;
    }
    r[key] = b[key];
  }
  return r;
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
    if (!a.hasOwnProperty(key)) {
      continue;
    }
    value = a[key];
    r[key] = value;
  }
  for (key in b) {
    if (!b.hasOwnProperty(key)) {
      continue;
    }
    value = b[key];
    if ((value !== null) && (value !== '')) {
      r[key] = value;
    }
  }
  for (key in c) {
    if (!c.hasOwnProperty(key)) {
      continue;
    }
    value = c[key];
    if ((value !== null) && (value !== '')) {
      r[key] = value;
    }
  }
  return r;
}

/**
 * Add a resolve() function to an array of
 * promises that will resolve all promises in
 * parallel.
 *
 * @param {Array} a The array of promise functions.
 * @return {Array} The array of promise functions.
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
 * @param {Array} a The array of promise functions.
 * @return {Array} The array of promise functions.
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
 * @param {Object} conn The MySQL connection.
 * @param {Array} qa An array of MySQL statements.
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
