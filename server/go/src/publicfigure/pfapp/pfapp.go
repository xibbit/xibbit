// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
package pfapp

import (
	"database/sql"
	"encoding/json"
	"publicfigure/array"
	"regexp"
	"strings"
	"xibdb"
)

/**
 * Convenience class to make xibdb more convenient.
 * @author DanielWHoward
 */
type Pfapp struct {
	xibdb               *xibdb.XibDb
	sql_prefix          string
	UsernamesNotAllowed []string
}

/**
 * Create an object.
 *
 * @param xibdb object A xibdb object.
 * @param sql_prefix string A prefix for database tables.
 *
 * @author DanielWHoward
 */
func NewPfapp(xibdb *xibdb.XibDb, sql_prefix string) *Pfapp {
	self := new(Pfapp)
	self.xibdb = xibdb
	self.sql_prefix = sql_prefix
	self.UsernamesNotAllowed = []string{
		"user",
	}
	return self
}

/**
 * Return true if debugging.
 *
 * @return boolean True if debugging on.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Debugging() bool {
	return self.xibdb.DumpSql
}

/**
 * Toggle debugging on/off.
 *
 * @param on boolean True to dump SQL.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Debug(on bool) {
	//    on = (typeof on === 'undefined')? true: on;
	self.xibdb.DumpSql = on
}

/**
 * Prepend database table names to an array as appropriate.
 *
 * @param a array A database query array.
 * @return array A revised database query array.
 *
 * @author DanielWHoward
 */
func (self Pfapp) AddTableSpecifiers(a interface{}) interface{} {
	keywords := []string{"AND", "OR"}
	_, ok := a.(string)
	if ok {
		ok, _ = regexp.MatchString(`^[A-Za-z0-9]+\\.[A-Za-z0-9]+$`, a.(string))
		if ok {
			ok = !array.ArrayIncludes(a.(string), keywords)
		}
	}
	if ok {
		a = self.sql_prefix + a.(string)
	} else if array.HasNumericKeys(a) || array.HasStringKeys(a) {
		if array.HasNumericKeys(a) {
			b := []interface{}{}
			for _, value := range a.([]map[string]interface{}) {
				b = append(b, self.AddTableSpecifiers(value))
			}
			a = b
		} else {
			b := map[string]interface{}{}
			for key, value := range a.(map[string]interface{}) {
				if strings.ToUpper(key) == "TABLE" {
					_, ok := value.(string)
					if ok {
						b[key] = self.sql_prefix + value.(string)
					} else {
						b[key] = []string{}
						for _, table := range value.([]string) {
							b[key] = append(b[key].([]string), self.sql_prefix+table)
						}
					}
				} else if strings.ToUpper(key) == "ON" {
					specified := map[string]interface{}{}
					for k, v := range value.(map[string]interface{}) {
						specified[self.sql_prefix+k] = self.AddTableSpecifiers(v)
					}
					b[key] = specified
				} else {
					b[self.AddTableSpecifiers(key).(string)] = self.AddTableSpecifiers(value)
				}
			}
			a = b
		}
	}
	return a
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
func (self Pfapp) ReadRows(table map[string]interface{}) ([]map[string]interface{}, error) {
	table = self.AddTableSpecifiers(table).(map[string]interface{})
	return self.xibdb.ReadRowsNative(table, nil, nil, nil)
}

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
func (self Pfapp) ReadOneRow(table map[string]interface{}) (map[string]interface{}, error) {
	table = self.AddTableSpecifiers(table).(map[string]interface{})
	s, e := self.xibdb.ReadRows(table, nil, nil, nil)
	rows := make([]map[string]interface{}, 0)
	if e == nil {
		e = json.Unmarshal([]byte(s), &rows)
	}
	var row map[string]interface{} = nil
	if len(rows) == 1 {
		row = rows[0]
	}
	return row, e
}

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
func (self Pfapp) ReadDesc(table string) (map[string]interface{}, error) {
	table = self.AddTableSpecifiers(table).(string)
	s, e := self.xibdb.ReadDesc(table)
	rows := make([]map[string]interface{}, 0)
	if e == nil {
		e = json.Unmarshal([]byte(s), &rows)
	}
	var row map[string]interface{} = nil
	if len(rows) == 1 {
		row = rows[0]
	}
	return row, e
}

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
func (self Pfapp) InsertRow(table map[string]interface{}) (map[string]interface{}, error) {
	table = self.AddTableSpecifiers(table).(map[string]interface{})
	s, e := self.xibdb.InsertRow(table, nil, nil, nil)
	row := make(map[string]interface{}, 0)
	if e == nil {
		e = json.Unmarshal([]byte(s), &row)
	}
	return row, e
}

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
func (self Pfapp) DeleteRow(tableSpec map[string]interface{}) error {
	tableSpec = self.AddTableSpecifiers(tableSpec).(map[string]interface{})
	e := self.xibdb.DeleteRow(tableSpec, nil, nil)
	return e
}

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
func (self Pfapp) UpdateRow(table map[string]interface{}) (map[string]interface{}, error) {
	table = self.AddTableSpecifiers(table).(map[string]interface{})
	s, e := self.xibdb.UpdateRow(table, nil, nil, nil, nil)
	row := make(map[string]interface{}, 0)
	if e == nil {
		e = json.Unmarshal([]byte(s), &row)
	}
	return row, e
}

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
func (self Pfapp) MoveRow(table map[string]interface{}) (map[string]interface{}, error) {
	table = self.AddTableSpecifiers(table).(map[string]interface{})
	s, e := self.xibdb.MoveRow(table, "", -1, -1)
	row := make(map[string]interface{}, 0)
	if e == nil {
		e = json.Unmarshal([]byte(s), &row)
	}
	return row, e
}

/**
 * Flexible mysql_query() function.
 *
 * @param query string The query to execute.
 * @return The mysql_query() return value.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Mysql_query(query string) (*sql.Rows, error, []string) {
	return self.xibdb.Mysql_query(query)
}

/**
 * Flexible mysql_fetch_assoc() function.
 *
 * @param result String The result to fetch.
 * @return The mysql_fetch_assoc() return value.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Mysql_fetch_assoc(result string) string {
	return result
}

/**
 * Flexible mysql_free_result() function.
 *
 * @param result String The result to free.
 * @return The mysql_free_result() return value.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Mysql_free_query(result string) string {
	return result
}

/**
 * Flexible mysql_real_escape_string() function.
 *
 * @param unescaped_string string The string.
 * @return The mysql_real_escape_string() return value.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Mysql_real_escape_string(unescaped_string string) string {
	return self.xibdb.Mysql_real_escape_string(unescaped_string)
}

/**
 * Flexible mysql_insert_id() function.
 *
 * @return The mysql_insert_id() return value.
 *
 * @author DanielWHoward
 */
func (self Pfapp) Mysql_insert_id(result int) int {
	return result
}
