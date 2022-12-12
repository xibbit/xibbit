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
const {
  array_concat,
  has_string_keys,
  has_numeric_keys,
  array_merge
} = require('./array');
/**
 * Convenience class to make xibdb more convenient.
 * @author DanielWHoward
 */

  /**
   * Create an object.
   *
   * @param xibdb object A xibdb object.
   * @param sql_prefix string A prefix for database tables.
   *
   * @author DanielWHoward
   */
  function pfapp(xibdb, sql_prefix) {
    this.xibdb = xibdb;
    this.sql_prefix = sql_prefix;
    this.usernamesNotAllowed = [
      'user'
    ];
  }

  /**
   * Return true if debugging.
   *
   * @return boolean True if debugging on.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.debugging = function() {
    return this.xibdb.dumpSql;
  }

  /**
   * Toggle debugging on/off.
   *
   * @param on boolean True to dump SQL.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.debug = function(on) {
    on = (typeof on === 'undefined')? true: on;
    this.xibdb.dumpSql = on;
  }

  /**
   * Prepend database table names to an array as appropriate.
   *
   * @param a array A database query array.
   * @return array A revised database query array.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.addTableSpecifiers = function(a) {
    var keywords = ['AND', 'OR'];
    if ((typeof a === 'string') && (a.match(/^[A-Za-z0-9]+\\.[A-Za-z0-9]+$/) !== null) && (keywords.indexOf(a) === -1)) {
      a = this.sql_prefix+a;
    } else if (has_numeric_keys(a) || has_string_keys(a)) {
      var b = [];
      if (has_numeric_keys(a)) {
        for (var value in a) {
          b.push(this.addTableSpecifiers(a[value]));
        }
      } else {
        b = {};
        for (var key in a) {
          var value = a[key];
          if (key.toUpperCase() === 'TABLE') {
            if (typeof value === 'string') {
              b[key] = this.sql_prefix+value;
            } else {
              b[key] = [];
              for (var table_key in value) {
                var table = value[table_key];
                b[key].push(this.sql_prefix+table);
              }
            }
          } else if (key.toUpperCase() === 'ON') {
            b[key] = {};
            for (var k in value) {
              var v = value[k];
              b[key][this.sql_prefix+k] = this.addTableSpecifiers(v);
            }
          } else {
            b[this.addTableSpecifiers(key)] = this.addTableSpecifiers(value);
          }
        }
      }
      a = b;
    }
    return a;
  }

  /**
   * Get JSON table rows from the database.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * This method supports multiple JOINs.
   *
   * @param table array A database query array.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.readRows = function(table, callback) {
    table = this.addTableSpecifiers(table);
    if (callback) {
      this.xibdb.readRowsNative(table, '', function(e, rows) {
        callback(e, rows);
      });
    } else {
      return new Promise((resolve, reject) => this.xibdb.readRowsNative(table, '', (e, rows) => {
        if (e) {
          reject(e);
        } else {
          resolve(rows);
        }
      }));
    }
  };

  /**
   * Get JSON table rows from the database.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * @param table string A database table.
   * @param where string A WHERE clause.
   * @returnobject A JSON object.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.readOneRow = function(table, callback) {
    if (callback) {
      this.readRows(table, function(e, rows) {
        callback(e, (rows.length >= 1)? rows[0]: null);
      });
    } else {
      return new Promise((resolve, reject) => this.readRows(table, (e, rows) => {
        if (e) {
          reject(e);
        } else {
          resolve((rows.length >= 1)? rows[0]: null);
        }
      }));
    }
  };

  /**
   * Get a JSON table description from the database.
   *
   * It does not return "sort" and "json" columns, if any.
   *
   * @param table string A database table.
   * @return A string containing a JSON object with columns and default values.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.readDesc = function(table, callback) {
    if (typeof table === 'object') {
      var args = array_merge({
      }, table);
      table = args['table'];
    }
    table = this.sql_prefix+table;
    this.xibdb.readDesc(table, function(e, desc) {
      callback(e, desc);
    });
  };

  /**
   * Insert a row of JSON into a database table.
   *
   * If there is no sort column, it inserts the row, anyway.
   *
   * @param table string A database table.
   * @param where string A WHERE clause.
   * @param n int The place to insert the row before; -1 means the end.
   * @param json mixed A JSON string (string) or JSON array (array).
   *
   * @author DanielWHoward
   */
  pfapp.prototype.insertRow = function(table, callback) {
    table = this.addTableSpecifiers(table);
    if (callback) {
      this.xibdb.insertRowNative(table, function(e, rows) {
        callback(e, rows);
      });
    } else {
      return new Promise((resolve, reject) => this.xibdb.insertRowNative(table, '', -1, {}, (e, rows) => {
        if (e) {
          reject(e);
        } else {
          resolve(rows);
        }
      }));
    }
  };

  /**
   * Delete a row of JSON from a database table.
   *
   * If there is no sort column, it deletes the first row.
   *
   * @param table string A database table.
   * @param where string A WHERE clause.
   * @param n mixed The row to delete (int) or JSON data to select the row (string).
   *
   * @author DanielWHoward
   */
  pfapp.prototype.deleteRow = function(table, callback) {
    table = this.addTableSpecifiers(table);
    if (callback) {
      this.xibdb.deleteRowNative(table, function(e, rows) {
        callback(e, rows);
      });
    } else {
      return new Promise((resolve, reject) => this.xibdb.deleteRowNative(table, (e, rows) => {
        if (e) {
          reject(e);
        } else {
          resolve(rows);
        }
      }));
    }
  };

  /**
   * Update a row of JSON in a database table.
   *
   * If there is no sort column, it updates the first row.
   *
   * @param table string A database table.
   * @param index mixed The row to update (int) or JSON data to select the row (string).
   * @param values mixed A JSON string (string) or JSON array (array).
   * @param where string A WHERE clause.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.updateRow = function(table, callback) {
    table = this.addTableSpecifiers(table);
    if (callback) {
      this.xibdb.updateRowNative(table, function(e, rows) {
        callback(e, rows);
      });
    } else {
      return new Promise((resolve, reject) => this.xibdb.updateRowNative(table, (e, rows) => {
        if (e) {
          reject(e);
        } else {
          resolve(rows);
        }
      }));
    }
  };

  /**
   * Reorder a row of JSON in a database table.
   *
   * If there is no sort column, it does nothing.
   *
   * @param table string A database table.
   * @param where string A WHERE clause.
   * @param m int The row to move.
   * @param n int The row to move to.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.moveRow = function(table, callback) {
    table = this.addTableSpecifiers(table);
    if (callback) {
      this.xibdb.moveRowNative(table, function(e, rows) {
        callback(e, rows);
      });
    } else {
      return new Promise((resolve, reject) => this.xibdb.moveRowNative(table, (e, rows) => {
        if (e) {
          reject(e);
        } else {
          resolve(rows);
        }
      }));
    }
  };

  /**
   * Flexible mysql_query() function.
   * 
   * @param query string The query to execute.
   * @return The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.mysql_query = function(query) {
    return this.xibdb.mysql_query(query);
  };

  /**
   * Flexible mysql_num_rows() function.
   *
   * @param result String The result to fetch.
   * @return The mysql_num_rows() return value.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.mysql_num_rows = function(result) {
    return this.xibdb.mysql_num_rows(result);
  };

  /**
   * Flexible mysql_fetch_assoc() function.
   *
   * @param result String The result to fetch.
   * @return The mysql_fetch_assoc() return value.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.mysql_fetch_assoc = function(result) {
    return this.xibdb.mysql_fetch_assoc(result);
  };

  /**
   * Flexible mysql_free_result() function.
   * 
   * @param result String The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.mysql_free_query = function(result) {
    return this.xibdb.mysql_free_query(result);
  };

  /**
   * Flexible mysql_real_escape_string() function.
   * 
   * @param unescaped_string string The string.
   * @return The mysql_real_escape_string() return value.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.mysql_real_escape_string = function(unescaped_string) {
    return this.xibdb.mysql_real_escape_string(unescaped_string);
  };

  /**
   * Flexible mysql_insert_id() function.
   *
   * @return The mysql_insert_id() return value.
   *
   * @author DanielWHoward
   */
  pfapp.prototype.mysql_insert_id = function() {
    return this.xibdb.mysql_insert_id();
  };

module.exports = pfapp;
