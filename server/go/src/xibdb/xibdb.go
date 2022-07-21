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
package xibdb

import (
	"database/sql"
	"encoding/json"
	"runtime/debug"
	"errors"
	"fmt"
	"log"
	"reflect"
	"strconv"
	"strings"
)

type Logger interface {
	Println(s string)
}

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
type XibDb struct {
	config           map[string]interface{}
	cache            map[string]interface{}
	CheckConstraints bool
	DryRun           bool
	DumpSql          bool
	MapBool          bool
	Opt              bool
	log              Logger
}

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
func NewXibDb(config map[string]interface{}) *XibDb {
	self := new(XibDb)
	self.config = config
	self.cache = map[string]interface{}{}
	self.MapBool = true
	self.CheckConstraints = false
	self.DryRun = false
	self.DumpSql = false
	self.Opt = true
	self.log = self
	if obj, ok := config["log"].(Logger); ok {
		self.log = obj
	}
	return self
}

/**
 * Get JSON table rows from the database.
 *
 * If there is no sort column, the rows are in arbitrary
 * order.
 *
 * @param {string} querySpec A query object or a database table string or array.
 * @param {string} whereSpec Usually nil but a WHERE clause or raw SQL.
 * @param {string} columnsSpec Usually nil but a columns clause.
 * @param {string} onSpec Usually nil but a ON clause.
 * @return A JSON array of objects.
 *
 * @author DanielWHoward
 */
func (that XibDb) ReadRowsNative(querySpec interface{}, whereSpec interface{}, columnsSpec interface{}, onSpec interface{}) (objs []map[string]interface{}, e error) {
	if that.DumpSql || that.DryRun {
		that.log.Println("ReadRowsNative()")
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, that.Fail(e, "pre-check: " + e.Error(), "")
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table":    "",
		"columns":  "*",
		"on":       "",
		"where":    "",
		"order by": "",
	}, map[string]interface{}{
		"table":    querySpec,
		"columns":  columnsSpec,
		"on":       onSpec,
		"where":    whereSpec,
		"order by": "",
	}, queryMap)
	table := queryMap["table"]
	columns := queryMap["columns"]
	onVar := queryMap["on"]
	where := queryMap["where"]
	orderby := queryMap["order by"]

	// decode ambiguous table argument
	tableArr, okList := table.([]string)
	tableStr, okStr := table.(string)
	if okList { // is_list
		tableStr = tableArr[0]
	} else if okStr {
		tableArr = append(tableArr, tableStr)
	}
	if onVarMap, ok := onVar.(map[string]interface{}); ok && (len(tableArr) == 1) { // is_map
		for key, _ := range onVarMap {
			tableArr = append(tableArr, key)
		}
	}

	// cache the table description
	dryRun := that.DryRun
	dumpSql := that.DumpSql
	that.DryRun = false
	that.DumpSql = false
	for _, t := range tableArr {
		that.ReadDescNative(t)
	}
	that.DryRun = dryRun
	that.DumpSql = dumpSql
	descMap := that.cache[tableStr].(map[string]interface{})
    desc := map[string]interface{}{}
	for _, t := range tableArr {
		desc = arrayMerge(desc, that.cache[t].(map[string]interface{})["desc_a"].(map[string]interface{}))
    }
	sort_field, _ := descMap["sort_column"].(string)
	json_field, _ := descMap["json_column"].(string)
	orderByStr := ""
	if sort_field != "" {
		orderByStr = " ORDER BY `" + sort_field + "` ASC"
	}
	if orderByParamStr, ok := orderby.(string); ok && (orderByParamStr != "") {
		orderByStr = " ORDER BY " + orderByParamStr
	}

	// decode remaining ambiguous arguments
	columnsStr, _ := columns.(string)
	if (len(tableArr) >= 2) && (columnsStr == "*") {
		// convert '*' to '`table2`.*, `table3`.*'
		columnsStr = ""
		for t := 1; t < len(tableArr); t++ {
			tbl := tableArr[t]
			if columnsStr != "" {
				columnsStr += ", "
			}
			columnsStr += "`" + tbl + "`.*"
		}
	} else if columnArr, ok := columns.([]string); ok { // is_list
		if len(tableArr) == 1 {
			// only one table so it's simple
			for _, col := range columnArr {
				if columnsStr != "" {
					columnsStr += ", "
				}
				columnsStr += "`" + col + "`"
			}
		} else if len(tableArr) >= 2 {
			// pick specific columns from first table
			for _, col := range columnArr {
				if columnsStr != "" {
					columnsStr += ", "
				}
				columnsStr += "`" + tableStr + "`.`" + col + "`"
			}
			// assume '*' columns from remaining tables
			for t := 1; t < len(tableArr); t++ {
				tbl := tableArr[t]
				if columnsStr != "" {
					columnsStr += ", "
				}
				columnsStr += "`" + tbl + "`.*"
			}
		}
	}
	onVarStr, _ := onVar.(string)
	if onVarMap, ok := onVar.(map[string]interface{}); ok { // both
		// "on" spec shortcut: assume second table
		tableNamesInBoth := make([]string, len(tableArr))
		for _, v1 := range tableArr {
			for k2, _ := range onVarMap {
				if v1 == k2 {
					tableNamesInBoth = append(tableNamesInBoth, v1)
					break
				}
			}
		}
		if len(tableNamesInBoth) == 0 {
			// explicitly specify the second table
			newOnVar := map[string]interface{}{}
			newOnVar[tableArr[1]] = onVar
			onVar = newOnVar
		}
		onVarStr = that.implementOn(onVar)
	}
	if onVarStr != "" {
		onVarStr = " " + onVarStr
	}
	whereStr, _ := where.(string)
	if whereMap, ok := where.(map[string]interface{}); ok { // is_map
		whereMap = that.ApplyTablesToWhere(whereMap, tableStr)
		whereStr = that.ImplementWhere(whereMap)
	}
	if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
		whereStr = " WHERE " + whereStr
	}

	config := that.config

	// read the table
	q := "SELECT " + columnsStr + " FROM `" + tableStr + "`" + onVarStr + whereStr + orderByStr + ";"
	rows, e, _ := that.Mysql_query(q)
	if e != nil {
		return nil, that.Fail(e, "", q, nil)
	}
	// read result
	objs = []map[string]interface{}{}
	for row := that.Mysql_fetch_assoc(rows); row != nil; row = that.Mysql_fetch_assoc(rows) {
		obj := map[string]interface{}{}
		// add the SQL data first
		for key, value := range row {
			if key == "class" {
				key = "clazz"
			}
			valueStr, _ := value.(string)
			if key == json_field {
				// add non-SQL JSON data later
				_ = 0
			} else if key == config["sort_column"] {
				// sort column isn't user data
			} else if value == nil {
				obj[key] = nil
			} else if _, ok := desc[key].(bool); that.MapBool && is_numeric(value) && (intval(fmt.Sprintf("%v", (intval(value)))) == intval(value)) && ok {
				//TODO intval() conditional above does nothing; make it actually check properly
				valueStr = fmt.Sprintf("%v", value)
				boolVal := false
				if valueStr == "1" {
					boolVal = true
				}
				obj[key] = boolVal
			} else if is_numeric(value) && (fmt.Sprintf("%v", (intval(value))) == value) && is_int(desc[key]) {
				obj[key] = intval(value)
			} else if is_numeric(value) && is_float(desc[key]) {
				obj[key] = floatval(value)
			} else {
				val := []map[string]interface{}{}
				e = json.Unmarshal([]byte(valueStr), &val)
				if e == nil {
					obj[key] = val
				} else {
					obj[key] = value
				}
			}
		}
		// add non-SQL JSON data
		if (json_field != "") && (row[json_field] != nil) {
			jsonMap := map[string]interface{}{}
			jsonStr, _ := row[json_field].(string)
			e = json.Unmarshal([]byte(jsonStr), &jsonMap)
			if e == nil {
				for key, value := range jsonMap {
					obj[key] = value
				}
			}
		}
		objs = append(objs, obj)
	}
	that.Mysql_free_query(rows)

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, that.Fail(e, "post-check: " + e.Error(), "")
		}
	}

	return
}

func (that XibDb) ReadRows(querySpec interface{}, whereSpec interface{}, columnsSpec interface{}, onSpec interface{}) (rowsStr string, e error) {
	objs, e := that.ReadRowsNative(querySpec, whereSpec, columnsSpec, onSpec)
	if e == nil {
		jsonBytes, ee := json.Marshal(objs)
		if ee == nil {
			rowsStr = string(jsonBytes)
		} else {
			e = ee
		}
	}
	return
}

/**
 * Get a JSON table description from the database.
 *
 * It does not return "sort" and "json" columns, if any.
 *
 * @param querySpec String A database table.
 * @return A string containing a JSON object with columns and default values.
 *
 * @author DanielWHoward
 */
func (that XibDb) ReadDescNative(querySpec interface{}) (desc map[string]interface{}, e error) {
	if that.DumpSql || that.DryRun {
		that.log.Println("ReadDescNative()")
	}

	// check constraints
//	if that.CheckConstraints {
//		e = that.CheckJsonColumnConstraint(querySpec, nil)
//		if e != nil {
//			return nil, that.Fail(e, "pre-check: " + e.Error(), "")
//		}
//	}

	tableStr, _ := querySpec.(string)
	if queryMap, ok := querySpec.(map[string]interface{}); ok { // is_map
		queryMap = arrayMerge(map[string]interface{}{}, queryMap)
		tableStr, _ = queryMap["table"].(string)
	}
	config := that.config

	desc = map[string]interface{}{}
	if (that.cache[tableStr] != nil) && (that.cache[tableStr].(map[string]interface{})["desc_a"] != nil) {
		desc = that.cache[tableStr].(map[string]interface{})["desc_a"].(map[string]interface{})
	} else {
		// read the table description
		sort_column := ""
		json_column := ""
		auto_increment_column := ""
		q := "DESCRIBE `" + tableStr + "`;"
		rows, e, _ := that.Mysql_query(q)
		if e != nil {
			return nil, that.Fail(e, "", q)
		}
		for rowdesc := that.Mysql_fetch_assoc(rows); rowdesc != nil; rowdesc = that.Mysql_fetch_assoc(rows) {
			field, _ := rowdesc["Field"].(string)
			typ, _ := rowdesc["Type"].(string)
			extra, _ := rowdesc["Extra"].(string)
			if field == config["sort_column"] {
				sort_column = field
			} else if field == config["json_column"] {
				json_column = field
			} else if that.MapBool && strings.Contains(typ, "tinyint(1)") {
				desc[field] = false
			} else if strings.Contains(typ, "int") {
				desc[field] = 0
			} else if strings.Contains(typ, "float") {
				desc[field] = floatval(0)
			} else if strings.Contains(typ, "double") {
				desc[field] = doubleval(0)
			} else {
				desc[field] = ""
			}
			if extra == "auto_increment" {
				auto_increment_column = field
			}
		}
		that.Mysql_free_query(rows)

		// cache the description
		if _, ok := that.cache[tableStr]; !ok {
			that.cache[tableStr] = map[string]interface{}{}
		}
		that.cache[tableStr].(map[string]interface{})["desc_a"] = desc
		descBytes, _ := json.Marshal(desc)
		descStr := string(descBytes)
		that.cache[tableStr].(map[string]interface{})["desc"] = descStr
		if sort_column != "" {
			that.cache[tableStr].(map[string]interface{})["sort_column"] = sort_column
		}
		if json_column != "" {
			that.cache[tableStr].(map[string]interface{})["json_column"] = json_column
		}
		if auto_increment_column != "" {
			that.cache[tableStr].(map[string]interface{})["auto_increment_column"] = auto_increment_column
		}
	}

	// check constraints
//	if that.CheckConstraints {
//		e = that.CheckJsonColumnConstraint(querySpec, nil)
//		if e != nil {
//			return nil, that.Fail(e, "post-check: " + e.Error(), "")
//		}
//	}

	return
}

func (that XibDb) ReadDesc(querySpec interface{}) (descStr string, e error) {
	desc, e := that.ReadDescNative(querySpec)
	if e == nil {
		jsonBytes, ee := json.Marshal(desc)
		if ee == nil {
			descStr = string(jsonBytes)
		} else {
			e = ee
		}
	}
	return
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
 * @param {function} func A callback function.
 *
 * @author DanielWHoward
 */
func (that XibDb) InsertRowNative(querySpec interface{}, whereSpec interface{}, valuesSpec interface{}, nSpec interface{}) (valuesMap map[string]interface{}, e error) {
	if that.DumpSql || that.DryRun {
		that.log.Println("InsertRowNative()")
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, that.Fail(e, "pre-check: " + e.Error(), "")
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table":  "",
		"values": "",
		"n":      -1,
		"where":  "",
	}, map[string]interface{}{
		"table":  querySpec,
		"values": valuesSpec,
		"n":      nSpec,
		"where":  whereSpec,
	}, queryMap)
	table := queryMap["table"]
	values := queryMap["values"]
	n := queryMap["n"]
	where := queryMap["where"]

	// decode ambiguous table argument
	tableStr, _ := table.(string)

	// cache the table description
	dryRun := that.DryRun
	dumpSql := that.DumpSql
	that.DryRun = false
	that.DumpSql = false
	that.ReadDescNative(tableStr)
	that.DryRun = dryRun
	that.DumpSql = dumpSql
	descMap := that.cache[tableStr].(map[string]interface{})
	desc := descMap["desc_a"].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)
	json_field, _ := descMap["json_column"].(string)
	auto_increment_field, _ := descMap["auto_increment_column"].(string)
	orderByStr := ""
	if sort_field != "" {
		orderByStr = " ORDER BY `" + sort_field + "` DESC"
	}

	// decode remaining ambiguous arguments
	valuesStr, ok := values.(string)
	valuesMap, _ = values.(map[string]interface{})
	sqlValuesMap := map[string]interface{}{} // SET clause
	jsonMap := map[string]interface{}{} // 'json' field
	if ok {
		valuesStr = " " + valuesStr
	} else {
		valuesMap = arrayMerge(map[string]interface{}{}, valuesMap)
		jsonMap = arrayMerge(map[string]interface{}{}, valuesMap)
		// copy SQL columns to sqlValuesMap
		for col, _ := range desc {
			if _, ok := jsonMap[col]; ok {
				compat := false
				if reflect.TypeOf(desc[col]) == reflect.TypeOf(jsonMap[col]) {
					compat = true
				}
				if is_float(desc[col]) && is_int(jsonMap[col]) {
					compat = true
				}
				if _, ok := desc[col].(string); ok {
					compat = true
				}
				if compat {
					sqlValuesMap[col] = jsonMap[col]
					delete(jsonMap, col)
				}
			}
		}
		// copy freeform values into 'json' field
		if json_field != "" {
			sqlValuesMap[json_field] = jsonMap
		}
	}
	nInt, _ := n.(int)
	whereStr, _ := where.(string)
	if whereMap, ok := where.(map[string]interface{}); ok { // is_map
		whereStr = that.ImplementWhere(whereMap)
	}
	if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
		whereStr = " WHERE " + whereStr
	}
	limitStr := ""
	if that.Opt || (nInt == -1) {
		limitStr = " LIMIT 1"
	}

	qa := []string{}

	// update the positions
	if sort_field != "" {
		nLen := 0
		q := "SELECT `" + sort_field + "` FROM `" + tableStr + "`" + whereStr + orderByStr + limitStr + ";"
		qr_reorder, e, _ := that.Mysql_query(q)
		if e != nil {
			return nil, that.Fail(e, "", q)
		}
		for row := that.Mysql_fetch_assoc(qr_reorder); row != nil; row = that.Mysql_fetch_assoc(qr_reorder) {
			nValue := intval(row[sort_field])
			if nValue >= nLen {
				nLen = nValue + 1
			}
			if nInt == -1 {
				nInt = nValue + 1
			}
			if nInt > nValue {
				break
			}
			setStr := ""
			andStr := " WHERE "
			if whereStr != "" {
				andStr = " AND "
			}
			if that.Opt {
				setStr += " SET `" + sort_field + "`=`" + sort_field + "`+1"
				andStr += "`" + sort_field + "`>=" + strconv.Itoa(nInt)
				q := "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
				qa = append(qa, q)
				break
			} else {
				setStr += " SET `" + sort_field + "`=" + strconv.Itoa(nValue+1)
				andStr += " `" + sort_field + "`=" + strconv.Itoa(nValue)
				q := "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
				qa = append(qa, q)
			}
		}
		that.Mysql_free_query(qr_reorder)
		if nInt == -1 {
			nInt = 0
		}
		if nInt > nLen {
			return nil, that.Fail(e, "`n` value out of range", q)
		}

		// add sort field to sqlValuesMap
		if len(sqlValuesMap) > 0 {
			sqlValuesMap[sort_field] = nInt
		}
	}

	// finally, generate valuesStr from valuesMap
	if len(sqlValuesMap) > 0 {
		colsStr := ""
		for col, value := range sqlValuesMap {
			if colsStr != "" {
				colsStr += ","
			}
			colsStr += "`" + that.Mysql_real_escape_string(col) + "`"
			if valuesStr != "" {
				valuesStr += ","
			}
			valueStr := ""
			if hasStringKeys(value) || hasNumericKeys(value) {
				jsonBytes, _ := json.Marshal(jsonMap)
				jsonStr := string(jsonBytes)
				if (jsonStr == "") || (jsonStr == "[]") {
					jsonStr = "{}"
				}
				valueStr = "'" + that.Mysql_real_escape_string(jsonStr) + "'"
			} else if _, ok := value.(bool); ok {
				valueBool, _ := value.(bool)
				if valueBool {
					valueStr = "1"
				} else {
					valueStr = "0"
				}
			} else if _, ok := value.(int); ok {
				valueStr = strconv.Itoa(value.(int))
			} else if value == nil {
				valueStr = "NULL"
			} else {
				valueStr = "'" + that.Mysql_real_escape_string(value.(string)) + "'"
			}
			valuesStr += valueStr
		}
		valuesStr = " (" + colsStr + ") VALUES (" + valuesStr + ")"
	}

	q := "INSERT INTO `" + tableStr + "`" + valuesStr + ";"
	qa = append(qa, q)

	var result *sql.Result = nil
	for _, q := range qa {
		if strings.HasPrefix(q, "INSERT INTO ") {
			result, e, _ = that.Mysql_exec(q)
		} else {
			rows, _, _ := that.Mysql_query(q)
			that.Mysql_free_query(rows)
		}
	}

	if (auto_increment_field != "") && (valuesMap != nil) && (result != nil) {
		valuesMap[auto_increment_field], e = that.Mysql_insert_id(result)
		if e != nil {
			return nil, that.Fail(e, "", q)
		}
	}

	that.Mysql_free_exec(result)

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, that.Fail(e, "post-check: " + e.Error(), "")
		}
	}

	return
}

func (that XibDb) InsertRow(querySpec interface{}, whereSpec interface{}, valuesSpec interface{}, nSpec interface{}) (valuesStr string, e error) {
	valuesMap, e := that.InsertRowNative(querySpec, whereSpec, valuesSpec, nSpec)
	if e == nil {
		jsonBytes, ee := json.Marshal(valuesMap)
		if ee == nil {
			valuesStr = string(jsonBytes)
		} else {
			e = ee
		}
	}
	return
}

/**
 * Delete a row of JSON from a database table.
 *
 * If there is no sort column, it deletes the first row.
 *
 * @param {string} table A database table.
 * @param {string} where A WHERE clause.
 * @param {mixed} n The row to delete (int) or JSON data to select the row (string).
 * @param {function} func A callback function.
 *
 * @author DanielWHoward
 */
func (that XibDb) DeleteRowNative(querySpec interface{}, whereSpec interface{}, nSpec interface{}) (e error) {
	if that.DumpSql || that.DryRun {
		that.log.Println("DeleteRowNative()")
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return that.Fail(e, "pre-check: " + e.Error(), "")
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table": "",
		"n":     "",
		"where": "",
	}, map[string]interface{}{
		"table": querySpec,
		"n":     nSpec,
		"where": whereSpec,
	}, queryMap)
	table := queryMap["table"]
	n := queryMap["n"]
	where := queryMap["where"]

	// decode ambiguous table argument
	tableStr, _ := table.(string)

	// cache the table description
	dryRun := that.DryRun
	dumpSql := that.DumpSql
	that.DryRun = false
	that.DumpSql = false
	that.ReadDescNative(tableStr)
	that.DryRun = dryRun
	that.DumpSql = dumpSql
	descMap := that.cache[tableStr].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)

	// decode remaining ambiguous arguments
	nInt, _ := n.(int)
	nStr, _ := n.(string)
	whereStr, _ := where.(string)
	if whereMap, ok := where.(map[string]interface{}); ok { // is_map
		whereStr = that.ImplementWhere(whereMap)
	}
	if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
		whereStr = " WHERE " + whereStr
	}
	andStr := ""
	if (sort_field != "") && is_int(n) && (nInt != -1) {
		opStr := " WHERE "
		if whereStr != "" {
			opStr = " AND "
		}
		andStr += opStr + "`" + sort_field + "`=" + strconv.Itoa(nInt)
	} else {
		if nInt == -1 {
			andStr = ""
		}
		if nStr != "" {
			nMap := map[string]interface{}{}
			e := json.Unmarshal([]byte(nStr), &nMap)
			if e == nil {
				for col, value := range nMap {
					if (andStr == "") && (whereStr == "") {
						andStr += " WHERE "
					} else {
						andStr += " AND "
					}
					andStr += col + "='" + fmt.Sprintf("%v", value) + "'"
				}
			} else {
				andStr += nStr
			}
		}
		field := sort_field
		if sort_field == "" {
			field = "*"
		}
		orderByStr := ""
		if sort_field != "" {
			orderByStr = " ORDER BY `" + sort_field + "` DESC"
		}
		q := "SELECT COUNT(*) AS num_rows FROM `" + tableStr + "`" + whereStr + andStr + orderByStr + ";"
		qr, e, _ := that.Mysql_query(q)
		if e != nil {
			return that.Fail(e, "", q)
		}
		num_rows := 0
		for qr.Next() {
			qr.Scan(&num_rows)
		}
		if nInt == -1 {
			nInt = num_rows - 1
		}
		that.Mysql_free_query(qr)
		quotedField := field
		if field != "*" {
			quotedField = "`" + field + "`"
		}
		q = "SELECT " + quotedField + " FROM `" + tableStr + "`" + whereStr + andStr + orderByStr + ";"
		// verify that non-standard n var yields valid rows
		if num_rows == 1 {
			qr, e, _ = that.Mysql_query(q)
			if sort_field != "" {
				row := that.Mysql_fetch_assoc(qr)
				n, _ = row[sort_field].(int)
			}
		} else if (num_rows > 1) && (sort_field != "") {
			qr, e, _ = that.Mysql_query(q)
			row := that.Mysql_fetch_assoc(qr)
			n = row[sort_field]
			if (andStr == "") && (whereStr == "") {
				andStr += " WHERE "
			} else {
				andStr += " AND "
			}
			andStr += "`" + sort_field + "`=" + strconv.Itoa(nInt)
		} else {
			return that.Fail(nil, "xibdb.DeleteRow():num_rows:" + strconv.Itoa(num_rows), q)
		}
		that.Mysql_free_query(qr)
	}

	qa := []string{}

	// update the positions
	if sort_field != "" {
		nLen := 0
		orderByStr := " ORDER BY `" + sort_field + "` ASC"
		limitStr := ""
		if that.Opt {
			orderByStr = " ORDER BY `" + sort_field + "` DESC"
			limitStr = " LIMIT 1"
		}
		q := "SELECT `" + sort_field + "` FROM `" + tableStr + "`" + whereStr + orderByStr + limitStr + ";"
		qr_reorder, e, _ := that.Mysql_query(q)
		if e != nil {
			return that.Fail(e, "", q)
		}
		for row := that.Mysql_fetch_assoc(qr_reorder); row != nil; row = that.Mysql_fetch_assoc(qr_reorder) {
			nValue := intval(row[sort_field])
			if nValue >= nLen {
				nLen = nValue + 1
			}
			setStr := ""
			andSetStr := " WHERE "
			if whereStr != "" {
				andSetStr = " AND "
			}
			if that.Opt {
				setStr += " SET `" + sort_field + "`=`" + sort_field + "`-1"
				andSetStr += "`" + sort_field + "`>=" + strconv.Itoa(nInt)
				q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andSetStr + ";"
				qa = append(qa, q)
				break
			} else {
				setStr += " SET `" + sort_field + "`=" + strconv.Itoa(nValue-1)
				andSetStr += "`" + sort_field + "`=" + strconv.Itoa(nValue)
				q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andSetStr + ";"
				qa = append(qa, q)
			}
		}
		that.Mysql_free_query(qr_reorder)
		if nInt >= nLen {
			return that.Fail(nil, "`n` value out of range", q)
		}
	}

	q := "DELETE FROM `" + tableStr + "`" + whereStr + andStr + ";"
	qa = append([]string{q}, qa...)

	for _, q := range qa {
		rows, e, _ := that.Mysql_query(q)
		that.Mysql_free_query(rows)
		if e != nil {
			return that.Fail(e, "", q)
		}
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return that.Fail(e, "post-check: " + e.Error(), "")
		}
	}

	return
}

func (that XibDb) DeleteRow(querySpec interface{}, whereSpec interface{}, nSpec interface{}) error {
	return that.DeleteRowNative(querySpec, whereSpec, nSpec)
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
 * @param {function} func A callback function.
 *
 * @author DanielWHoward
 */
func (that XibDb) UpdateRowNative(querySpec interface{}, whereSpec interface{}, valuesSpec interface{}, nSpec interface{}, limitSpec interface{}) (valuesMap map[string]interface{}, e error) {
	if that.DumpSql || that.DryRun {
		that.log.Println("UpdateRowNative()")
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, that.Fail(e, "pre-check: " + e.Error(), "")
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table":  "",
		"values": "",
		"n":      -1,
		"where":  "",
		"limit":  1,
	}, map[string]interface{}{
		"table":  querySpec,
		"values": valuesSpec,
		"n":      nSpec,
		"where":  whereSpec,
		"limit":  limitSpec,
	}, queryMap)
	table := queryMap["table"]
	values := queryMap["values"]
	n := queryMap["n"]
	where := queryMap["where"]
	limit := queryMap["limit"]

	// decode ambiguous table argument
	tableStr, _ := table.(string)

	// cache the table description
	dryRun := that.DryRun
	dumpSql := that.DumpSql
	that.DryRun = false
	that.DumpSql = false
	that.ReadDescNative(tableStr)
	that.DryRun = dryRun
	that.DumpSql = dumpSql
	descMap := that.cache[tableStr].(map[string]interface{})
	desc := descMap["desc_a"].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)
	json_field, _ := descMap["json_column"].(string)
	orderByStr := ""
	if sort_field != "" {
		orderByStr = " ORDER BY `" + sort_field + "` ASC"
	}

	// decode remaining ambiguous arguments
	valuesStr, ok := values.(string)
	valuesMap, _ = values.(map[string]interface{})
	sqlValuesMap := map[string]interface{}{} // SET clause
	jsonMap := map[string]interface{}{} // 'json' field
	if ok {
		valuesStr = " SET " + valuesStr
	} else {
		valuesMap = arrayMerge(map[string]interface{}{}, valuesMap)
		jsonMap = arrayMerge(map[string]interface{}{}, valuesMap)
		// copy SQL columns to sqlValuesMap
		for col, _ := range desc {
			if _, ok := jsonMap[col]; ok {
				compat := false
				if _, ok := desc[col]; ok {
					if reflect.TypeOf(desc[col]) == reflect.TypeOf(jsonMap[col]) {
						compat = true
					}
					if is_float(desc[col]) && is_int(jsonMap[col]) {
						compat = true
					}
					if _, ok := desc[col].(string); ok {
						compat = true
					}
					if compat {
						sqlValuesMap[col] = jsonMap[col]
						delete(jsonMap, col)
					}
				}
			}
		}
	}
	updateJson := (json_field != "") && (len(jsonMap) > 0)
	nInt, _ := n.(int)
	limitInt, _ := limit.(int)
	whereStr, _ := where.(string)
	if whereMap, ok := where.(map[string]interface{}); ok { // is_map
		whereStr = that.ImplementWhere(whereMap)
	}
	if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
		whereStr = " WHERE " + whereStr
	}
	andStr := ""
	if (sort_field != "") && (nInt >= 0) {
		andStr = " WHERE"
		if whereStr != "" {
			andStr = " AND"
		}
		andStr += " `" + sort_field + "`=" + strconv.Itoa(nInt)
	}

	// get the number of rows_affected and save values
	q := "SELECT * FROM `" + tableStr + "`" + whereStr + andStr + orderByStr + ";"
	qr, e, _ := that.Mysql_query(q)
	if e != nil {
		return nil, that.Fail(e, "", q)
	}
	rows_affected := 0
	sqlRowMaps := []map[string]interface{}{}
	for row := that.Mysql_fetch_assoc(qr); row != nil; row = that.Mysql_fetch_assoc(qr) {
		rows_affected++
		rowValues := map[string]interface{}{}
		for col, value := range row {
			rowValues[col] = value
		}
		// test json_field contents for each affected row
		if updateJson {
			jsonValue, _ := row[json_field].(string)
			jsonRowMap := map[string]interface{}{}
			e = json.Unmarshal([]byte(jsonValue), &jsonRowMap)
			if e != nil {
				return nil, that.Fail(e, "\"" + that.Mysql_real_escape_string(row[json_field].(string)) + "\" value in `" + json_field + "` column in `" + tableStr + "` table; " + e.Error(), q)
			}
		}
		sqlRowMaps = append(sqlRowMaps, rowValues)
	}
	that.Mysql_free_query(qr)

	if rows_affected == 0 {
		if andStr == "" {
			return nil, that.Fail(nil, "0 rows affected", q)
		}
		q = "SELECT COUNT(*) AS rows_affected FROM `" + tableStr + "`" + whereStr + ";"
		qr, _, _ = that.Mysql_query(q)
		for qr.Next() {
			qr.Scan(&rows_affected)
		}
		that.Mysql_free_query(qr)
		if rows_affected > 0 {
			return nil, that.Fail(nil, "`n` value out of range", q)
		} else {
			return nil, that.Fail(nil, "0 rows affected", q)
		}
		return nil, e
	} else if (limitInt != -1) && (rows_affected > limitInt) {
		return nil, that.Fail(nil, strconv.Itoa(rows_affected) + " rows affected but limited to " + strconv.Itoa(limitInt) + " rows", q)
	}

	qa := []string{}

	// generate UPDATE statements using json_field
	if valuesStr, ok := values.(string); ok {
		q := "UPDATE `" + tableStr + "`" + valuesStr + whereStr + andStr + ";"
		qa = append(qa, q)
	} else {
		for _, sqlRowMap := range sqlRowMaps {
			// construct SET clause
			valuesRow := " SET "
			for col, oldValue := range sqlRowMap {
				newValue := oldValue
				if updateJson && (col == json_field) {
					// figure out newValue for json_field
					jsonValue, _ := oldValue.(string)
					oldMap := map[string]interface{}{}
					json.Unmarshal([]byte(jsonValue), &oldMap)
					newMap := arrayMerge(oldMap, jsonMap)
					newValueBytes, _ := json.Marshal(newMap)
					newValue = string(newValueBytes)
					if (newValue == "") || (newValue == "[]") {
						newValue = "{}"
					}
				} else if _, ok := sqlValuesMap[col]; ok {
					newValue = fmt.Sprintf("%v", sqlValuesMap[col])
				}
				// add changed values to SET clause
				if oldValue != newValue {
					if valuesRow != " SET " {
						valuesRow += ", "
					}
					valuesRow += "`" + that.Mysql_real_escape_string(col) + "`='" + that.Mysql_real_escape_string(newValue.(string)) + "'"
				}
			}
			// construct WHERE clause
			whereRow := " WHERE "
			for col, value := range sqlRowMap {
				if whereRow != " WHERE " {
					whereRow += " AND "
				}
				opStr := "="
				if is_numeric(value) && is_float(desc[col]) {
					opStr = " LIKE "
				}
				whereRow += "`" + that.Mysql_real_escape_string(col) + "`" + opStr + "'" + that.Mysql_real_escape_string(fmt.Sprintf("%v", value)) + "'"
			}
			if valuesRow != " SET " {
				q = "UPDATE `" + tableStr + "`" + valuesRow + whereRow + " LIMIT 1;"
				qa = append(qa, q)
			}
		}
	}

	for _, q := range qa {
		rows, e, _ := that.Mysql_query(q)
		if e != nil {
			return nil, that.Fail(e, "", q)
		}
		that.Mysql_free_query(rows)
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, that.Fail(e, "post-check: " + e.Error(), "")
		}
	}

	return
}

func (that XibDb) UpdateRow(querySpec interface{}, whereSpec interface{}, nSpec interface{}, valuesSpec interface{}, limitSpec interface{}) (valuesStr string, e error) {
	valuesMap, e := that.UpdateRowNative(querySpec, whereSpec, nSpec, valuesSpec, limitSpec)
	if e == nil {
		jsonBytes, ee := json.Marshal(valuesMap)
		if ee == nil {
			valuesStr = string(jsonBytes)
		} else {
			e = ee
		}
	}
	return
}

/**
 * Reorder a row of JSON in a database table.
 *
 * If there is no sort column, it does nothing.
 *
 * @param {string} querySpec A database table.
 * @param {string} whereSpec A WHERE clause.
 * @param {number} mSpec The row to move.
 * @param {number} nSpec The row to move to.
 *
 * @author DanielWHoward
 */
func (that XibDb) MoveRowNative(querySpec interface{}, whereSpec interface{}, mSpec interface{}, nSpec interface{}) (e error) {
	if that.DumpSql || that.DryRun {
		that.log.Println("MoveRowNative()")
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return that.Fail(e, "pre-check: " + e.Error(), "")
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table": "",
		"m":     0,
		"n":     0,
		"where": "",
	}, map[string]interface{}{
		"table": querySpec,
		"m":     mSpec,
		"n":     nSpec,
		"where": whereSpec,
	}, queryMap)
	table := queryMap["table"]
	m, _ := queryMap["m"].(int)
	n, _ := queryMap["n"].(int)
	where := queryMap["where"]

	// decode ambiguous table argument
	tableStr, _ := table.(string)

	// cache the table description
	dryRun := that.DryRun
	dumpSql := that.DumpSql
	that.DryRun = false
	that.DumpSql = false
	that.ReadDescNative(tableStr)
	that.DryRun = dryRun
	that.DumpSql = dumpSql
	descMap := that.cache[tableStr].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)
	orderByStr := ""
	if sort_field != "" {
		orderByStr = " ORDER BY `" + sort_field + "` DESC"
	} else {
		return that.Fail(nil, tableStr + " does not have a sort_field", "")
	}
	limitStr := " LIMIT 1"

	if m == n {
		return that.Fail(nil, "`m` and `n` are the same so nothing to do", "")
	}

	// decode remaining ambiguous arguments
	whereStr, _ := where.(string)
	if whereMap, ok := where.(map[string]interface{}); ok { // is_map
		whereMap = that.ApplyTablesToWhere(whereMap, tableStr)
		whereStr = that.ImplementWhere(whereMap)
	}
	if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
		whereStr = " WHERE " + whereStr
	}
	opStr := ""
	if (sort_field != "") && (n >= 0) {
		opStr = " WHERE"
		if whereStr != "" {
			opStr = " AND"
		}
	}

	// get the length of the array
	q := "SELECT `" + sort_field + "` FROM `" + tableStr + "`" + whereStr + orderByStr + limitStr + ";"
	qr_end, e, _ := that.Mysql_query(q)
	if e != nil {
		return that.Fail(e, "", q)
	}
	nLen := 0
	if row := that.Mysql_fetch_assoc(qr_end); row != nil {
		nLen = intval(row[sort_field]) + 1
	}
	that.Mysql_free_query(qr_end)
	if (m < 0) || (m >= nLen) {
		return that.Fail(nil, "`m` value out of range", q)
	}
	if (n < 0) || (n >= nLen) {
		return that.Fail(nil, "`n` value out of range", q)
	}

	qa := []string{}

	// save the row at the m-th to the end
	setStr := " SET `" + sort_field + "`=" + strconv.Itoa(nLen)
	andStr := opStr + " `" + sort_field + "`=" + strconv.Itoa(m)
	q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
	qa = append(qa, q)

	// update the indices between m and n
	if that.Opt {
		if m < n {
			setStr = " SET `" + sort_field + "`=`" + sort_field + "`-1"
			andStr = opStr + " `" + sort_field + "`>" + strconv.Itoa(m) + " AND `" + sort_field + "`<=" + strconv.Itoa(n)
		} else {
			setStr = " SET `" + sort_field + "`=`" + sort_field + "`+1"
			andStr = opStr + " `" + sort_field + "`>=" + strconv.Itoa(n) + " AND `" + sort_field + "`<" + strconv.Itoa(m)
		}
		q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
		qa = append(qa, q)
	} else {
		if m < n {
			for i := m; i < n; i++ {
				setStr := " SET `" + sort_field + "`=" + strconv.Itoa(i)
				andStr = opStr + " `" + sort_field + "`=" + strconv.Itoa(i+1)
				q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
				qa = append(qa, q)
			}
		} else {
			for i := m - 1; i >= n; i-- {
				setStr := " SET `" + sort_field + "`=" + strconv.Itoa(i+1)
				andStr = opStr + " `" + sort_field + "`=" + strconv.Itoa(i)
				q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
				qa = append(qa, q)
			}
		}
	}

	// copy the row at the end to the n-th position
	setStr = " SET `" + sort_field + "`=" + strconv.Itoa(n)
	andStr = opStr + " `" + sort_field + "`=" + strconv.Itoa(nLen)
	q = "UPDATE `" + tableStr + "`" + setStr + whereStr + andStr + ";"
	qa = append(qa, q)

	for _, q := range qa {
		rows, e, _ := that.Mysql_query(q)
		if e != nil {
			return that.Fail(e, "", q)
		}
		that.Mysql_free_query(rows)
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return that.Fail(e, "post-check: " + e.Error(), "")
		}
	}

	return
}

func (that XibDb) MoveRow(querySpec interface{}, whereSpec interface{}, mSpec interface{}, nSpec interface{}) error {
	return that.MoveRowNative(querySpec, whereSpec, mSpec, nSpec)
}

/**
 * Flexible mysql_query() function.
 *
 * @param {string} query The query to execute.
 * @param {function} func A callback function.
 * @return {string} The mysql_query() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_query(query string) (rows *sql.Rows, e error, columnNames []string) {
	if that.DumpSql || that.DryRun {
		that.log.Println(query)
	}
	columnNames = []string{}
	if that.DryRun && !strings.HasPrefix(query, "SELECT ") && !strings.HasPrefix(query, "DESCRIBE ") {
		return
	}
	link_identifier := (that.config["link_identifier"]).(*sql.DB)
	rows, e = link_identifier.Query(query)
	if e == nil {
		columnNames, _ = rows.Columns()
	} else {
		if !that.DumpSql && !that.DryRun {
			that.log.Println(query)
		}
		that.log.Println(e.Error())
	}
	return
}

/**
 * Renamed mysql_query() for INSERT queries so
 * mysql_insert_id() will work.
 *
 * @param {string} query The query to execute.
 * @param {function} func A callback function.
 * @return {string} The mysql_query() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_exec(query string) (*sql.Result, error, []string) {
	if that.DumpSql || that.DryRun {
		that.log.Println(query)
	}
	columnNames := []string{}
	if that.DryRun && !strings.HasPrefix(query, "SELECT ") && !strings.HasPrefix(query, "DESCRIBE ") {
		return nil, nil, columnNames
	}
	link_identifier := (that.config["link_identifier"]).(*sql.DB)
	result, e := link_identifier.Exec(query)
	columnNames = []string{}
	if e != nil {
		if !that.DumpSql && !that.DryRun {
			that.log.Println(query)
		}
		that.log.Println(e.Error())
	}
	return &result, e, columnNames
}

/**
 * Flexible mysql_fetch_assoc() function.
 *
 * @param result String The result to fetch.
 * @return The mysql_fetch_assoc() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_fetch_assoc(rows *sql.Rows) (row map[string]interface{}) {
	var e error = nil
	if rows.Next() {
		columnNames, _ := rows.Columns()
		fields := make([]interface{}, len(columnNames))
		values := make([]interface{}, len(columnNames))
		for i := 0; i < len(columnNames); i++ {
			fields[i] = &values[i]
		}
		if e = rows.Scan(fields...); e == nil {
			row = map[string]interface{}{}
			for i := 0; i < len(columnNames); i++ {
				_, value := values[i].([]byte)
				if value {
					row[columnNames[i]] = string(values[i].([]byte))
				} else {
					row[columnNames[i]] = values[i]
				}
			}
		} else {
			log.Panicln("Mysql_fetch_assoc() coding error: " + e.Error())
		}
	}
	return
}

/**
 * Flexible mysql_free_result() function.
 *
 * @param result String The result to free.
 * @return The mysql_free_result() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_free_query(rows *sql.Rows) {
	if rows != nil {
		rows.Close()
	}
}

/**
 * Flexible mysql_free_result() function for INSERTs.
 *
 * @param result String The result to free.
 * @return The mysql_free_result() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_free_exec(result *sql.Result) {
}

/**
 * Flexible mysql_real_escape_string() function.
 *
 * @param {string} unescaped_string String The string.
 * @return {string} The mysql_real_escape_string() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_real_escape_string(unescaped_string string) (escaped_string string) {
	escaped_string = strings.ReplaceAll(unescaped_string, "\\0", "\\x00")
	escaped_string = strings.ReplaceAll(escaped_string, "\n", "\\n")
	escaped_string = strings.ReplaceAll(escaped_string, "\r", "\\r")
	escaped_string = strings.ReplaceAll(escaped_string, "\\", "\\\\")
	escaped_string = strings.ReplaceAll(escaped_string, "'", "\\'")
	escaped_string = strings.ReplaceAll(escaped_string, "\"", "\\\"")
	escaped_string = strings.ReplaceAll(escaped_string, "\x1a", "\\\x1a")
	return
}

/**
 * Flexible mysql_insert_id() function.
 *
 * @return The mysql_insert_id() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_insert_id(result *sql.Result) (int, error) {
	id, e := (*result).LastInsertId()
	if e != nil {
		return 0, e
	}
	return int(id), e
}

/**
 * Return true if the data in a table, optionally
 * filtered with a WHERE clause, has integers 0 .. n-1
 * in its sort_column such that it is an array.
 *
 * @param a An array with WHERE clause specification.
 * @param table An array of tables.
 * @return A clause string.
 *
 * @author DanielWHoward
 */
func (that XibDb) CheckSortColumnConstraint(querySpec interface{}, whereSpec interface{}) (e error) {
	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table": "",
		"where": "",
	}, map[string]interface{}{
		"table": querySpec,
		"where": whereSpec,
	}, queryMap)
	table := queryMap["table"]
	where := queryMap["where"]

	// decode ambiguous table argument
	tableStr, _ := table.(string)
	whereStr, _ := where.(string)

	// cache the table description
	that.ReadDescNative(tableStr)
	descMap, _ := that.cache[tableStr].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)
	orderByStr := ""
	if sort_field != "" {
		orderByStr = " ORDER BY `" + sort_field + "` ASC"
	} else {
		e = errors.New("CheckSortColumnConstraint(): " + tableStr + " does not contain `" + sort_field + "`")
	}

	if e == nil {
		// decode remaining ambiguous arguments
		if whereMap, ok := where.(map[string]interface{}); ok { // is_map
			whereStr = that.ImplementWhere(whereMap)
		}
		if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
			whereStr = " WHERE " + whereStr
		}

		// read the table
		q := "SELECT `" + sort_field + "` FROM `" + tableStr + "`" + whereStr + orderByStr + ";"
		rows, e, _ := that.Mysql_query(q)
		if e != nil {
			e = errors.New("CheckSortColumnConstraint(): error in " + q)
		}
		// read result
		n := 0
		for row := that.Mysql_fetch_assoc(rows); (row != nil) && (e == nil); row = that.Mysql_fetch_assoc(rows) {
			if intval(row[sort_field]) != n {
				err := "\"" + fmt.Sprintf("%v", n) + "\" value in `" + sort_field + "` column in " + tableStr + " table; missing"
				e = errors.New("CheckSortColumnConstraint(): " + err)
			}
			n++
		}
		that.Mysql_free_query(rows)
	}

	return
}

/**
 * Return true if the data in a table, optionally
 * filtered with a WHERE clause, has integers 0 .. n-1
 * in its sort_column such that it is an array.
 *
 * @param a An array with WHERE clause specification.
 * @param table An array of tables.
 * @return A clause string.
 *
 * @author DanielWHoward
 */
func (that XibDb) CheckJsonColumnConstraint(querySpec interface{}, whereSpec interface{}) (e error) {
	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok { // not is_map
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table": "",
		"where": "",
	}, map[string]interface{}{
		"table": querySpec,
		"where": whereSpec,
	}, queryMap)
	table := queryMap["table"]
	where := queryMap["where"]

	// decode ambiguous table argument
	tableStr, _ := table.(string)
	whereStr, _ := where.(string)

	// cache the table description
	that.ReadDescNative(tableStr)
	descMap := that.cache[tableStr].(map[string]interface{})
	json_field, _ := descMap["json_column"].(string)
	if json_field == "" {
		e = errors.New("CheckJsonColumnConstraint(): " + tableStr + " does not contain `" + json_field + "`")
	}

	if e == nil {
		// decode remaining ambiguous arguments
		if whereMap, ok := where.(map[string]interface{}); ok { // is_map
			whereStr = that.ImplementWhere(whereMap)
		}
		if (whereStr != "") && !strings.HasPrefix(whereStr, " ") {
			whereStr = " WHERE " + whereStr
		}

		// read the table
		q := "SELECT `" + json_field + "` FROM `" + tableStr + "`" + whereStr + ";"
		rows, e, _ := that.Mysql_query(q)
		// read result
		for row := that.Mysql_fetch_assoc(rows); (row != nil) && (e == nil); row = that.Mysql_fetch_assoc(rows) {
			jsonValue, _ := row[json_field].(string)
			jsonRowMap := map[string]interface{}{}
			e = json.Unmarshal([]byte(jsonValue), &jsonRowMap)
			if e != nil {
				err := "\"" + that.Mysql_real_escape_string(jsonValue) + "\" value in `" + json_field + "` column in " + tableStr + " table; " + e.Error()
				e = errors.New("CheckJsonColumnConstraint(): " + err)
			}
		}
		that.Mysql_free_query(rows)
	}

	return
}

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
func (that XibDb) ApplyTablesToWhere(a map[string]interface{}, table string) (aa map[string]interface{}) {
	keywords := []string{"AND", "OR"}
	aa = map[string]interface{}{}
	for key, value := range a {
		found := false
		for _, keyword := range keywords {
			if keyword == strings.ToUpper(key) {
				found = true
				break
			}
		}
		if !strings.Contains(key, ".") && !found {
			aa[table + "." + key] = value
		} else {
			aa[key] = value
		}
	}
	return
}

/**
 * Return a clause string created from an array specification.
 *
 * It is easier to use an array to create a MySQL WHERE clause instead
 * of using string concatenation.
 *
 * @param whereSpec An array with clause specification.
 * @return A clause string.
 *
 * @author DanielWHoward
 */
func (that XibDb) ImplementWhere(whereSpec interface{}) (whereStr string) {
	if whereMap, ok := whereSpec.(map[string]interface{}); ok { // is_map
		whereStr = that.implementCondition(whereMap, "")
		if whereStr != "" {
			whereStr = " WHERE " + whereStr
		}
	} else {
		whereStr, _ = whereSpec.(string)
	}
	return
}

/**
 * Return a clause string created from an array specification.
 *
 * It is easier to use an array to create a MySQL WHERE clause instead
 * of using string concatenation.
 *
 * @param onVar An array with an ON clause specification.
 * @return A clause string.
 *
 * @author DanielWHoward
 */
func (that XibDb) implementOn(onVar interface{}) (onVarStr string) {
	joins := []string{"INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "OUTER JOIN"}
	if onVarMap, ok := onVar.(map[string]interface{}); ok { // is_map
		for table, cond := range onVarMap {
			// INNER JOIN is the default
			join := joins[0]
			// remove JOIN indicator from conditions
			conds := map[string]interface{}{}
			for k, v := range cond.(map[string]interface{}) {
				found := false
				for _, v := range joins {
					if v == strings.ToUpper(k) {
						found = true
						break
					}
				}
				if found {
					join = k
				} else {
					conds[k] = v
				}
			}
			// build the JOIN clause
			onVarStr += join + " `" + table + "` ON " + that.implementCondition(conds, "ON ")
		}
	} else {
		onVarStr, _ = onVar.(string)
	}
	return
}

/**
 * Return a SQL condition string created from an array specification.
 *
 * It is easier to use an array to create a MySQL WHERE clause instead
 * of using string concatenation.
 *
 * @param condObj An array with conditional specification.
 * @param onVar A string with an ON clause specification.
 * @return A SQL string containing a nested conditional.
 *
 * @author DanielWHoward
 */
func (that XibDb) implementCondition(condObj interface{}, onVar string) (cond string) {
	if condStr, ok := condObj.(string); ok {
		cond = condStr
	} else if condMap, ok := condObj.(map[string]interface{}); ok { // is_map
		conds := []string{}
		op := " AND "
		for key, value := range condMap {
			sub := ""
			if strings.ToUpper(key) == "OR" {
				op = " OR "
			} else if strings.ToUpper(key) != "AND" {
				if valueList, ok := value.([]interface{}); ok { // is_list
					// assume it is some SQL syntax
					sub = that.ImplementSyntax(key, valueList)
					if sub != "" {
						sub = "(" + sub + ")"
					}
				} else if _, ok := value.(map[string]interface{}); ok { // is_map
					// assume it is a sub-clause
					sub = that.implementCondition(value, "")
					if sub != "" {
						sub = "(" + sub + ")"
					}
				} else {
					sub = fmt.Sprintf("%v", value)
					sub = that.Mysql_real_escape_string(sub)
					if onVar == "" {
						sub = "'" + sub + "'"
					} else {
						sub = "`" + strings.ReplaceAll(sub, ".", "`.`") + "`"
					}
					sub = "`" + strings.ReplaceAll(key, ".", "`.`") + "`=" + sub
				}
			}
			if sub != "" {
				conds = append(conds, sub)
			}
		}
		if len(conds) > 0 {
			cond = strings.Join(conds, op)
		}
	}
	return
}

/**
 * Return a SQL string created from an array specification.
 *
 * It is easier to use an array to create a SQL string (like LIKE)
 * instead of using string concatenation.
 *
 * @param key A name, possibly unused.
 * @param syntax An array with syntax specification.
 * @return A SQL syntax string.
 *
 * @author DanielWHoward
 */
func (that XibDb) ImplementSyntax(key string, syntax []interface{}) (sql string) {
	cmdStr, _ := syntax[0].(string)
	if (len(syntax) >= 1) && (strings.ToUpper(cmdStr) == "LIKE") {
		// LIKE: array("LIKE", "tags", "% ", $arrayOfTags, " %")
		op := " OR "
		clauses := []string{}
		col, _ := syntax[1].(string)
		likeStr := "`" + col + "` LIKE"
		if len(syntax) == 3 {
			valueStr, _ := syntax[2].(string)
			valueStr = likeStr + " '" + that.Mysql_real_escape_string(valueStr) + "'"
			clauses = append(clauses, valueStr)
		} else if (len(syntax) == 4) || (len(syntax) == 5) {
			pre, _ := syntax[2].(string)
			post := ""
			if len(syntax) == 5 {
				post, _ = syntax[4].(string)
			}
			if valueList, ok := syntax[3].([]string); ok { // is_list
				for _, value := range valueList {
					valueStr := pre + value + post
					valueStr = likeStr + " '" + that.Mysql_real_escape_string(valueStr) + "'"
					clauses = append(clauses, valueStr)
				}
			} else {
				valueStr := fmt.Sprintf("%v", syntax[3])
				valueStr = likeStr + " '" + that.Mysql_real_escape_string(valueStr) + "'"
				clauses = append(clauses, valueStr)
			}
		}
		sql = strings.Join(clauses, op)
	} else {
		// OR: "aColumn": map[string]interface{}{"1", "2", "3",}
		op := " OR "
		clauses := []string{}
		for _, value := range syntax {
			valueStr := fmt.Sprintf("%v", value)
			valueStr = "`" + key + "`='" + that.Mysql_real_escape_string(valueStr) + "'"
			clauses = append(clauses, valueStr)
		}
		sql = strings.Join(clauses, op)
	}
	return
}


/**
 * Do nothing for log output.
 *
 * @author DanielWHoward
 */
func (that XibDb) Println(s string) {
	log.Println(s)
}

/**
 * Throw an exception to create a stack trace.
 *
 * @author DanielWHoward
 */
func (that XibDb) Fail(ex error, eStr string, q string) (e error) {
	if q != "" {
		that.log.Println("E:" + q)
	}
	if ex == nil {
		if eStr == "" {
			eStr = "Fail(nil, \"\") called"
		}
		ex = errors.New(eStr)
	}
	e = ex
	that.log.Println(e.Error())
	debug.PrintStack()
	return
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
func arrayMerge(a map[string]interface{}, b map[string]interface{}) (r map[string]interface{}) {
	r = map[string]interface{}{}
	for key, value := range a {
		r[key] = value
	}
	for key, value := range b {
		r[key] = value
	}
	return
}

/**
 * Merge keys of objects with string indices.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
func array3Merge(a map[string]interface{}, b map[string]interface{}, c map[string]interface{}) (r map[string]interface{}) {
	r = map[string]interface{}{}
	for key, value := range a {
		r[key] = value
	}
	for key, value := range b {
		if (value != nil) && (value != "") {
			r[key] = value
		}
	}
	for key, value := range c {
		if (value != nil) && (value != "") {
			r[key] = value
		}
	}
	return
}

/**
 * Return true if this is an array and this array
 * is numerically indexed.
 *
 * @param a array An array.
 * @return boolean True if it is a numeric array.
 *
 * @author DanielWHoward
 **/
func hasNumericKeys(a interface{}) bool {
	_, ok := a.([]interface{})
	return ok
}

/**
 * Return true if this is an array and this array
 * is string indexed (associative).
 *
 * An associative array has at least one string key.
 *
 * @param a array An array.
 * @return boolean True if it is an associative array.
 *
 * @author DanielWHoward
 **/
func hasStringKeys(a interface{}) bool {
	_, valid := a.(map[string]interface{})
	return valid
}

/**
 * Return true if a variable is a number or a
 * numeric string.
 *
 * @param value The value to test.
 * @return True if the value is numeric or a numeric string.
 *
 * @author DanielWHoward
 **/
func is_numeric(value interface{}) bool {
	return is_int(value) || is_float(value)
}

/**
 * Return true if a variable is an int or a
 * string that can be converted to an int.
 *
 * @param value The value to test.
 * @return True if the value is int or an int string.
 *
 * @author DanielWHoward
 **/
func is_int(value interface{}) bool {
	_, ok := value.(int)
	if !ok {
		valStr := ""
		if valStr, ok = value.(string); ok {
			_, e := strconv.Atoi(valStr)
			ok = e == nil
		}
	}
	return ok
}

/**
 * Return the integer value of an int or
 * string that can be converted to an int
 * but 0 if it is not an integer.
 *
 * @param value The value to test.
 * @return An int value or 0.
 *
 * @author DanielWHoward
 **/
func intval(value interface{}) int {
	val, ok := value.(int)
	if !ok {
		valStr := ""
		if valStr, ok = value.(string); ok {
			val, _ = strconv.Atoi(valStr)
		}
	}
	return val
}

/**
 * Return true if a variable is an float32,
 * float64 or a string that can be converted to
 * a float32 or float64.
 *
 * @param value The value to test.
 * @return True if the value is float32, float64 or an float string.
 *
 * @author DanielWHoward
 **/
func is_float(value interface{}) bool {
	_, ok32 := value.(float32)
	if ok32 {
		return true
	}
	_, ok64 := value.(float64)
	if ok64 {
		return true
	}
	if valStr, ok := value.(string); ok {
		_, e := strconv.ParseFloat(valStr, 64)
		return e == nil
	}
	return false
}

/**
 * Return the floating point value of a
 * float or string that can be converted
 * to an float but 0 if it is not a
 * floating point number.
 *
 * @param value The value to test.
 * @return An float32 or float64 value or 0.
 *
 * @author DanielWHoward
 **/
func floatval(value interface{}) float64 {
	val32, ok32 := value.(float32)
	if ok32 {
		return float64(val32)
	}
	val64, ok64 := value.(float64)
	if ok64 {
		return value.(float64)
	}
	if vInt, ok := value.(int); ok {
		return float64(vInt)
	}
	val64, _ = strconv.ParseFloat(value.(string), 64)
	return val64
}

/**
 * Return the floating point value of a
 * float or string that can be converted
 * to an float but 0 if it is not a
 * floating point number.
 *
 * @param value The value to test.
 * @return An float32 or float64 value or 0.
 *
 * @author DanielWHoward
 **/
func doubleval(value interface{}) float64 {
	val32, ok32 := value.(float32)
	if ok32 {
		return float64(val32)
	}
	val64, ok64 := value.(float64)
	if ok64 {
		return value.(float64)
	}
	val64, _ = strconv.ParseFloat(value.(string), 64)
	return val64
}
