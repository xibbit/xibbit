///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
package xibdb

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"
)

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
	Name             string
	Num              int
	config           map[string]interface{}
	cache            map[string]interface{}
	CheckConstraints bool
	DryRun           bool
	DumpSql          bool
	Opt              bool
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
	self.CheckConstraints = false
	self.DryRun = false
	self.DumpSql = false
	self.Opt = true
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
 *
 * @author DanielWHoward
 */
func (that XibDb) ReadRowsNative(querySpec interface{}, whereSpec interface{}, columnsSpec interface{}, onSpec interface{}) ([]map[string]interface{}, error) {
	if that.DumpSql || that.DryRun {
		log.Println("ReadRowsNative()")
	}

	// check constraints
	var e error = nil
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("pre-check: " + e.Error())
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok {
		queryMap = map[string]interface{}{}
	}
	queryMap = array3Merge(map[string]interface{}{
		"table":   "",
		"columns": "*",
		"on":      "",
		"where":   "",
	}, map[string]interface{}{
		"table":   querySpec,
		"columns": columnsSpec,
		"on":      onSpec,
		"where":   whereSpec,
	}, queryMap)
	table := queryMap["table"]
	columns := queryMap["columns"]
	onVar := queryMap["on"]
	where := queryMap["where"]

	// decode ambiguous table argument
	tableArr, okArr := table.([]string)
	tableStr, okStr := table.(string)
	if okStr {
		tableArr = append(tableArr, tableStr)
	} else if okArr {
		tableStr = tableArr[0]
	}
	tablesStr := tableStr
	for _, tableName := range tableArr {
		if tablesStr != tableName {
			tablesStr += "," + tableName
		}
	}
	table = "`" + tablesStr + "`"

	// cache the table description
	dryRun := that.DryRun
	dumpSql := that.DumpSql
	that.DryRun = false
	that.DumpSql = false
	that.ReadDesc(tableStr)
	that.DryRun = dryRun
	that.DumpSql = dumpSql
	descMap := that.cache[tableStr].(map[string]interface{})
	desc := descMap["desc_a"].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)
	json_field, _ := descMap["json_column"].(string)
	orderby := ""
	if sort_field != "" {
		orderby = " ORDER BY `" + sort_field + "` ASC"
	}

	// decode remaining ambiguous arguments
	if columnArr, ok := columns.([]string); ok {
		columnsStr := ""
		if len(tableArr) == 1 {
			for _, col := range columnArr {
				if columnsStr != "" {
					columnsStr += ","
				}
				columnsStr += "`" + col + "`"
			}
		} else if len(tableArr) > 1 {
			// assume all columns from first table
			columnsStr += "`" + tableStr + "`.*"
			for _, col := range columnArr {
				if strings.Index(col, ".") == -1 {
					// assume column is from second table
					columnsStr += ",`" + tableArr[1] + "`.`" + col + "`"
				} else {
					// do not assume table; table is specified
					parts := strings.SplitAfterN(col, ".", 2)
					tablePart := parts[0]
					colPart := parts[1]
					columnsStr += ",`" + tablePart + "`.`" + colPart + "`"
				}
			}
		}
		columns = columnsStr
	}
	if _, ok := onVar.(map[string]interface{}); ok {
		// "on" spec shortcut: assume second table
		if len(stringKeysOrArrayIntersect(tableArr, onVar)) == 0 {
			// explicitly specify the second table
			var newOnVar = map[string]interface{}{}
			newOnVar[tableArr[1]] = onVar
			onVar = newOnVar
		}
		onVar = that.ImplementOn(onVar)
	}
	if onVar.(string) != "" {
		onVar = " " + onVar.(string)
	}
	if whereMap, ok := where.(map[string]interface{}); ok {
		where = that.ApplyTablesToWhere(whereMap, tableStr)
		where = that.ImplementWhere(whereMap)
	}
	if strings.HasPrefix(where.(string), " ") {
		// add raw SQL
		where = where.(string)
	} else if strings.HasPrefix(where.(string), "WHERE ") {
		where = " " + where.(string)
	} else if where.(string) != "" {
		where = " WHERE " + where.(string)
	}

	var config = that.config

	// read the table
	q := "SELECT " + columns.(string) + " FROM " + table.(string) + where.(string) + onVar.(string) + orderby + ";"
	rows, e, _ := that.Mysql_query(q)
	// read result
	objs := make([]map[string]interface{}, 0)
	for row := that.Mysql_fetch_assoc(rows); row != nil; row = that.Mysql_fetch_assoc(rows) {
		obj := map[string]interface{}{}
		// add the SQL data first
		for key, value := range row {
			if key == "class" {
				key = "clazz"
			}
			if key == json_field {
				// add non-SQL JSON data later
			} else if key == config["sort_column"] {
				// sort column isn't user data
			} else if value == nil {
				obj[key] = nil
			} else if is_numeric(value) && (strval(intval(value)) == value) && is_bool(desc[key]) {
				obj[key] = (value.(int) == 1)
			} else if is_numeric(value) && (strval(intval(value)) == value) && is_int(desc[key]) {
				obj[key] = intval(value)
			} else if is_numeric(value) && is_float(desc[key]) {
				obj[key] = floatval(value)
			} else {
				val := make([]map[string]interface{}, 0)
				e = json.Unmarshal([]byte(value.(string)), &val)
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
			e = json.Unmarshal([]byte(row[json_field].(string)), &jsonMap)
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
			return nil, errors.New("post-check: " + e.Error())
		}
	}

	return objs, e
}

func (that XibDb) ReadRows(querySpec interface{}, whereSpec interface{}, columnsSpec interface{}, onSpec interface{}) (string, error) {
	objs, e := that.ReadRowsNative(querySpec, whereSpec, columnsSpec, onSpec)
	s, _ := json.Marshal(objs)
	return string(s), e
}

/**
 * Get a JSON table description from the database.
 *
 * It does not return "sort" and "json" columns, if any.
 *
 * @param table String A database table.
 * @return A string containing a JSON object with columns and default values.
 *
 * @author DanielWHoward
 */
func (that XibDb) ReadDescNative(querySpec interface{}) (map[string]interface{}, error) {
	if that.DumpSql || that.DryRun {
		log.Println("ReadDescNative()")
	}

	// check constraints
	var e error = nil
	/*	if that.CheckConstraints {
		e = that.CheckJsonColumnConstraint(querySpec, nil)
		if e != nil {
			return nil, errors.New("pre-check: "+e.Error())
		}
	}*/

	table := ""
	_, valid := querySpec.(map[string]interface{})
	if valid {
		queryMap := querySpec.(map[string]interface{})
		queryMap = arrayMerge(map[string]interface{}{}, queryMap)
		table = queryMap["table"].(string)
	} else {
		table = querySpec.(string)
	}
	var config = that.config

	desc := map[string]interface{}{}
	if (that.cache[table] != nil) && (that.cache[table].(map[string]interface{})["desc_a"] != nil) {
		desc = that.cache[table].(map[string]interface{})["desc_a"].(map[string]interface{})
	} else {
		// read the table description
		sort_column := ""
		json_column := ""
		auto_increment_column := ""
		q := "DESCRIBE `" + table + "`;"
		rows, _, _ := that.Mysql_query(q)
		for rowdesc := that.Mysql_fetch_assoc(rows); rowdesc != nil; rowdesc = that.Mysql_fetch_assoc(rows) {
			field := rowdesc["Field"].(string)
			typ := rowdesc["Type"].(string)
			extra := rowdesc["Extra"].(string)
			if field == config["sort_column"] {
				sort_column = field
			} else if field == config["json_column"] {
				json_column = field
			} else if strings.Contains(typ, "tinyint(1)") {
				desc[field] = false
			} else if strings.Contains(typ, "int") {
				desc[field] = 0
			} else if strings.Contains(typ, "float") {
				desc[field] = floatval(0)
			} else if strings.Contains(typ, "double") {
				desc[field] = floatval(0)
			} else {
				desc[field] = ""
			}
			if extra == "auto_increment" {
				auto_increment_column = field
			}
		}
		that.Mysql_free_query(rows)
		// cache the description
		if that.cache[table] == nil {
			that.cache[table] = map[string]interface{}{}
		}
		that.cache[table].(map[string]interface{})["desc_a"] = desc
		descBytes, _ := json.Marshal(desc)
		descStr := string(descBytes)
		that.cache[table].(map[string]interface{})["desc"] = descStr
		if sort_column != "" {
			that.cache[table].(map[string]interface{})["sort_column"] = sort_column
		}
		if json_column != "" {
			that.cache[table].(map[string]interface{})["json_column"] = json_column
		}
		if auto_increment_column != "" {
			that.cache[table].(map[string]interface{})["auto_increment_column"] = auto_increment_column
		}
	}

	// check constraints
	/*	if that.CheckConstraints {
		e = that.CheckJsonColumnConstraint(querySpec, nil)
		if e != nil {
			return nil, errors.New("post-check: "+e.Error())
		}
	}*/

	return desc, e
}

func (that XibDb) ReadDesc(querySpec interface{}) (string, error) {
	desc, e := that.ReadDescNative(querySpec)
	s, _ := json.Marshal(desc)
	return string(s), e
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
 * @param {function} func A callback function.
 *
 * @author DanielWHoward
 */
func (that XibDb) InsertRowNative(querySpec interface{}, whereSpec interface{}, valuesSpec interface{}, nSpec interface{}) (map[string]interface{}, error) {
	if that.DumpSql || that.DryRun {
		log.Println("InsertRowNative()")
	}

	// check constraints
	var e error = nil
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("pre-check: " + e.Error())
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok {
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
	tableStr := table.(string)
	table = "`" + tableStr + "`"

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
	orderby := ""
	if sort_field != "" {
		orderby = " ORDER BY `" + sort_field + "` DESC"
	}

	// decode remaining ambiguous arguments
	valuesMap := map[string]interface{}{}
	sqlValuesMap := map[string]interface{}{} // SET clause
	jsonMap := arrayMerge(valuesMap, values.(map[string]interface{}))
	if valuesStr, ok := values.(string); ok {
		values = " SET " + valuesStr
	} else {
		valuesMap = arrayMerge(valuesMap, values.(map[string]interface{}))
		// copy SQL columns to sqlValuesMap
		for col, _ := range desc {
			if jsonMap[col] != nil {
				compat := false
				if gettype(desc[col]) == gettype(jsonMap[col]) {
					compat = true
				}
				if is_float(desc[col]) && is_int(jsonMap[col]) {
					compat = true
				}
				if is_string(desc[col]) {
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
	nInt := n.(int)
	if whereMap, ok := where.(map[string]interface{}); ok {
		where = that.ImplementWhere(whereMap)
	}
	if strings.HasPrefix(where.(string), " ") {
		// add raw SQL
		where = where.(string)
	} else if strings.HasPrefix(where.(string), "WHERE ") {
		where = " " + where.(string)
	} else if where.(string) != "" {
		where = " WHERE " + where.(string)
	}

	qa := []string{}

	// update the positions
	if sort_field != "" {
		nLen := 0
		limit := ""
		if that.Opt || (nInt == -1) {
			limit = " LIMIT 1"
		}
		qu := "SELECT `" + sort_field + "` FROM " + table.(string) + where.(string) + orderby + limit + ";"
		qr_reorder, _, _ := that.Mysql_query(qu)
		for row := that.Mysql_fetch_assoc(qr_reorder); row != nil; row = that.Mysql_fetch_assoc(qr_reorder) {
			nValue := intval(row[sort_field])
			if nValue >= nLen {
				nLen = nValue + 1
			}
			if nInt == -1 {
				n = nValue + 1
				nInt = n.(int)
			}
			if nInt > nValue {
				break
			}
			and_clause := " WHERE "
			if where != "" {
				and_clause = " AND "
			}
			if that.Opt {
				set_clause := " `" + sort_field + "`=`" + sort_field + "`+1"
				and_clause += "`" + sort_field + "`>=" + strconv.Itoa(nInt)
				qu := "UPDATE " + table.(string) + " SET" + set_clause + where.(string) + and_clause + ";"
				qa = append(qa, qu)
				break
			} else {
				set_clause := " `" + sort_field + "`=" + strconv.Itoa(nValue+1)
				and_clause += " `" + sort_field + "`=" + strconv.Itoa(nValue)
				qu := "UPDATE `" + table.(string) + "` SET" + set_clause + where.(string) + and_clause + ";"
				qa = append(qa, qu)
			}
		}
		that.Mysql_free_query(qr_reorder)
		if nInt == -1 {
			n = 0
			nInt = n.(int)
		}
		if nInt > nLen {
			return map[string]interface{}{}, errors.New("`n` value out of range")
		}

		// add sort field to valuesMap
		if len(sqlValuesMap) > 0 {
			sqlValuesMap[sort_field] = n
		}
	}

	// finally, generate values.(string) from valuesMap
	if len(valuesMap) > 0 {
		valuesStr := ""
		for col, value := range sqlValuesMap {
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
				valueStr = "\"" + that.Mysql_real_escape_string(jsonStr) + "\""
			} else if is_bool(value) {
				valueBool, _ := value.(bool)
				if valueBool {
					valueStr = "1"
				} else {
					valueStr = "0"
				}
			} else if is_int(value) {
				valueStr = strconv.Itoa(value.(int))
			} else if is_null(value) {
				valueStr = "NULL"
			} else {
				valueStr = "\"" + that.Mysql_real_escape_string(value.(string)) + "\""
			}
			valuesStr += "`" + that.Mysql_real_escape_string(col) + "`=" + valueStr
		}
		values = " SET " + valuesStr
	}

	q := "INSERT INTO " + table.(string) + values.(string) + ";"
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

	if (auto_increment_field != "") && (result != nil) {
		valuesMap[auto_increment_field] = that.Mysql_insert_id(result)
	}

	that.Mysql_free_exec(result)

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("post-check: " + e.Error())
		}
	}

	return valuesMap, e
}

func (that XibDb) InsertRow(querySpec interface{}, whereSpec interface{}, valuesSpec interface{}, nSpec interface{}) (string, error) {
	row, e := that.InsertRowNative(querySpec, whereSpec, valuesSpec, nSpec)
	s, _ := json.Marshal(row)
	return string(s), e
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
func (that XibDb) DeleteRowNative(querySpec interface{}, whereSpec interface{}, nSpec interface{}) error {
	if that.DumpSql || that.DryRun {
		log.Println("DeleteRowNative()")
	}

	// check constraints
	var e error = nil
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return errors.New("pre-check: " + e.Error())
		}
	}

	// decode the arguments into variables
	queryMap, ok := querySpec.(map[string]interface{})
	if !ok {
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
	tableStr := table.(string)
	table = "`" + tableStr + "`"

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
	and_clause := ""

	// decode remaining ambiguous arguments
	if whereMap, ok := where.(map[string]interface{}); ok {
		where = that.ImplementWhere(whereMap)
	}
	if strings.HasPrefix(where.(string), " ") {
		// add raw SQL
		where = where.(string)
	} else if strings.HasPrefix(where.(string), "WHERE ") {
		where = " " + where.(string)
	} else if where.(string) != "" {
		where = " WHERE " + where.(string)
	}
	if (sort_field != "") && is_int(n) {
		sort_start := " AND "
		if where == "" {
			sort_start = " WHERE "
		}
		and_clause += sort_start + "`" + sort_field + "`=" + strconv.Itoa(n.(int))
	} else {
		if is_string(n) && (n != "") {
			nMap := make(map[string]interface{}, 0)
			e := json.Unmarshal([]byte(n.(string)), &nMap)
			if e == nil {
				for col, value := range nMap {
					if (and_clause == "") && (where == "") {
						and_clause += " WHERE "
					} else {
						and_clause += " AND "
					}
					and_clause += col + "='" + fmt.Sprintf("%v", value) + "'"
				}
			} else {
				and_clause += n.(string)
			}
		}
		field := sort_field
		if sort_field == "" {
			field = "*"
		}
		orderby_clause := ""
		if sort_field != "" {
			orderby_clause = " ORDER BY " + sort_field + " DESC"
		}
		q := "SELECT COUNT(*) AS num_rows FROM " + table.(string) + " " + where.(string) + and_clause + orderby_clause + ";"
		qr, _, _ := that.Mysql_query(q)
		var num_rows int = 0
		for qr.Next() {
			qr.Scan(&num_rows)
		}
		that.Mysql_free_query(qr)
		q = "SELECT " + field + " FROM " + table.(string) + " " + where.(string) + and_clause + orderby_clause + ";"
		if num_rows == 1 {
			qr, _, _ = that.Mysql_query(q)
			if sort_field != "" {
				row := that.Mysql_fetch_assoc(qr)
				n = row[sort_field].(int)
			}
			that.Mysql_free_query(qr)
		} else if (num_rows > 1) && (sort_field != "") {
			qr, _, _ = that.Mysql_query(q)
			row := that.Mysql_fetch_assoc(qr)
			n = row[sort_field]
			if (and_clause == "") && (where == "") {
				and_clause += "WHERE "
			} else {
				and_clause += " AND "
			}
			and_clause += sort_field + "=\"" + strconv.Itoa(n.(int)) + "\""
			that.Mysql_free_query(qr)
		} else {
			e := "xibdb.DeleteRow():num_rows:" + strconv.Itoa(num_rows)
			log.Println(e)
			return errors.New(e)
		}
	}
	nInt, _ := n.(int)

	qa := []string{}

	// update the positions
	if sort_field != "" {
		nLen := 0
		orderby := " ORDER BY `" + sort_field + "` ASC"
		limit := ""
		if that.Opt {
			orderby = " ORDER BY `" + sort_field + "` DESC"
			limit = " LIMIT 1"
		}
		qu := "SELECT `" + sort_field + "` FROM " + table.(string) + where.(string) + orderby + limit + ";"
		qr_reorder, _, _ := that.Mysql_query(qu)
		for row := that.Mysql_fetch_assoc(qr_reorder); row != nil; row = that.Mysql_fetch_assoc(qr_reorder) {
			nValue := intval(row[sort_field])
			if nValue >= nLen {
				nLen = nValue + 1
			}
			and_where := " WHERE "
			if where != "" {
				and_where = " AND "
			}
			if that.Opt {
				set_clause := " `" + sort_field + "`=`" + sort_field + "`-1"
				and_where += "`" + sort_field + "`>=" + strconv.Itoa(nInt)
				qu := "UPDATE " + table.(string) + " SET" + set_clause + where.(string) + and_where + ";"
				qa = append(qa, qu)
				break
			} else {
				set_clause := " `" + sort_field + "`=" + strconv.Itoa(nValue-1)
				and_where += sort_field + "=" + strconv.Itoa(nValue)
				qu := "UPDATE " + table.(string) + " SET" + set_clause + where.(string) + and_where + ";"
				qa = append(qa, qu)
			}
		}
		that.Mysql_free_query(qr_reorder)
		if nInt >= nLen {
			e = errors.New("`n` value out of range")
			return e
		}
	}

	q := "DELETE FROM " + table.(string) + where.(string) + and_clause + ";"
	qa = append([]string{q}, qa...)

	for _, q := range qa {
		rows, e, _ := that.Mysql_query(q)
		that.Mysql_free_query(rows)
		if e != nil {
			break
		}
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return errors.New("post-check: " + e.Error())
		}
	}

	return e
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
func (that XibDb) UpdateRowNative(querySpec interface{}, whereSpec interface{}, valuesSpec interface{}, nSpec interface{}, limitSpec interface{}) (map[string]interface{}, error) {
	if that.DumpSql || that.DryRun {
		log.Println("UpdateRowNative()")
	}

	// check constraints
	var e error = nil
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("pre-check: " + e.Error())
		}
	}

	// decode the arguments into variables
	queryMap, valid := querySpec.(map[string]interface{})
	if !valid {
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
	tableStr := table.(string)
	table = "`" + tableStr + "`"

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
	orderby := ""
	if sort_field != "" {
		orderby = " ORDER BY `" + sort_field + "` ASC"
	}

	// decode remaining ambiguous arguments
	valuesMap := map[string]interface{}{}
	sqlValuesMap := map[string]interface{}{} // SET clause
	jsonMap := arrayMerge(valuesMap, values.(map[string]interface{}))
	if valuesStr, ok := values.(string); ok {
		values = " SET " + valuesStr
	} else {
		valuesMap = arrayMerge(valuesMap, values.(map[string]interface{}))
		// copy SQL columns to sqlValuesMap
		for col, _ := range desc {
			if jsonMap[col] != nil {
				compat := false
				if gettype(desc[col]) == gettype(jsonMap[col]) {
					compat = true
				}
				if is_float(desc[col]) && is_int(jsonMap[col]) {
					compat = true
				}
				if is_string(desc[col]) {
					compat = true
				}
				if compat {
					sqlValuesMap[col] = jsonMap[col]
					delete(jsonMap, col)
				}
			}
		}
	}
	nInt := n.(int)
	if whereMap, ok := where.(map[string]interface{}); ok {
		where = that.ImplementWhere(whereMap)
	}
	if strings.HasPrefix(where.(string), " ") {
		// add raw SQL
		where = where.(string)
	} else if strings.HasPrefix(where.(string), "WHERE ") {
		where = " " + where.(string)
	} else if where.(string) != "" {
		where = " WHERE " + where.(string)
	}
	limitInt := limit.(int)
	op_clause := " WHERE"
	if where != "" {
		op_clause = " AND"
	}
	op_and_clause := ""
	rows_affected := 0

	if (sort_field != "") && (nInt >= 0) {
		op_and_clause = op_clause + " `" + sort_field + "`=" + strconv.Itoa(nInt)
	}

	// get the number of rows_affected
	q := "SELECT COUNT(*) AS rows_affected FROM " + table.(string) + where.(string) + op_and_clause + ";"
	qr, _, _ := that.Mysql_query(q)
	for qr.Next() {
		qr.Scan(&rows_affected)
	}
	that.Mysql_free_query(qr)
	if rows_affected == 0 {
		if op_and_clause == "" {
			return nil, errors.New("0 rows affected")
		}
		q = "SELECT COUNT(*) AS rows_affected FROM " + table.(string) + where.(string) + ";"
		qr, _, _ = that.Mysql_query(q)
		for qr.Next() {
			qr.Scan(&rows_affected)
		}
		that.Mysql_free_query(qr)
		if rows_affected > 0 {
			e = errors.New("`n` value out of range")
		} else {
			e = errors.New("0 rows affected")
		}
		return nil, e
	} else if (limitInt != -1) && (rows_affected > limitInt) {
		e = errors.New(strconv.Itoa(rows_affected) + " rows affected but limited to " + strconv.Itoa(limitInt) + " rows")
		return nil, e
	}

	qa := []string{}

	// generate UPDATE statements using json_field
	if len(valuesMap) == 0 {
		q := "UPDATE " + table.(string) + values.(string) + where.(string) + op_and_clause + ";"
		qa = append(qa, q)
	} else {
		// get the contents of the json_field for each affected row
		updateJson := (json_field != "") && (len(jsonMap) > 0)
		jsonRowMaps := []map[string]interface{}{}
		if !updateJson {
			jsonRowMaps = append(jsonRowMaps, map[string]interface{}{})
		} else {
			jsonValue := ""
			q = "SELECT `" + json_field + "` FROM " + table.(string) + where.(string) + op_and_clause + orderby + ";"
			qr_reorder, _, _ := that.Mysql_query(q)
			for row := that.Mysql_fetch_assoc(qr_reorder); (row != nil) && (e == nil); row = that.Mysql_fetch_assoc(qr_reorder) {
				jsonValue = row[json_field].(string)
				jsonRowMap := make(map[string]interface{}, 0)
				e = json.Unmarshal([]byte(jsonValue), &jsonRowMap)
				if e == nil {
					jsonRowMaps = append(jsonRowMaps, jsonRowMap)
				}
			}
			that.Mysql_free_query(qr_reorder)
			if e != nil {
				err := "\"" + that.Mysql_real_escape_string(jsonValue) + "\" value in `" + json_field + "` column in " + table.(string) + " table; " + e.Error()
				return nil, errors.New(err)
			}
		}
		qIns := make([]queryUsingInKeyword, 0)
		qInsMap := map[string]int{}
		for i, jsonRowMap := range jsonRowMaps {
			// copy freeform values into 'json' field
			if updateJson {
				sqlValuesMap[json_field] = arrayMerge(jsonRowMap, jsonMap)
			}
			// sort valuesMap keys
			sqlValuesKeys := make([]string, 0, len(sqlValuesMap))
			for key := range sqlValuesMap {
				sqlValuesKeys = append(sqlValuesKeys, key)
			}
			sort.Strings(sqlValuesKeys)
			// finally, generate values.(string) from valuesMap
			valuesStr := ""
			for _, col := range sqlValuesKeys {
				value := sqlValuesMap[col]
				if valuesStr != "" {
					valuesStr += ","
				}
				valueStr := ""
				if hasStringKeys(value) || hasNumericKeys(value) {
					jsonBytes, _ := json.Marshal(value)
					jsonStr := string(jsonBytes)
					if (jsonStr == "") || (jsonStr == "[]") {
						jsonStr = "{}"
					}
					valueStr = "\"" + that.Mysql_real_escape_string(jsonStr) + "\""
				} else if is_bool(value) {
					valueBool, _ := value.(bool)
					if valueBool {
						valueStr = "1"
					} else {
						valueStr = "0"
					}
				} else if is_int(value) {
					valueStr = strconv.Itoa(value.(int))
				} else if is_null(value) {
					valueStr = "NULL"
				} else {
					valueStr = "\"" + that.Mysql_real_escape_string(value.(string)) + "\""
				}
				valuesStr += "`" + that.Mysql_real_escape_string(col) + "`=" + valueStr
			}
			values = " SET " + valuesStr
			// add a custom update for each row
			if that.Opt && updateJson {
				q := "UPDATE " + table.(string) + values.(string) + where.(string)
				if sort_field == "" {
					q += ";"
					qa = append(qa, q)
				} else {
					if _, ok := qInsMap[q]; ok {
						qi := qInsMap[q]
						qIns[qi].Values = append(qIns[qi].Values, i)
					} else {
						qIns = append(qIns, *newQueryUsingInKeyword(q, op_clause, sort_field, i))
						qInsMap[q] = len(qIns) - 1
					}
				}
			} else {
				op_and_clause := ""
				if nInt >= 0 {
					op_and_clause = op_clause + " `" + sort_field + "`=" + strconv.Itoa(i)
				}
				q := "UPDATE " + table.(string) + values.(string) + where.(string) + op_and_clause + ";"
				qa = append(qa, q)
			}
		}
		if that.Opt {
			for _, qIn := range qIns {
				q := qIn.getQuery()
				qa = append(qa, q)
			}
		}
	}

	for _, q := range qa {
		rows, _, _ := that.Mysql_query(q)
		that.Mysql_free_query(rows)
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("post-check: " + e.Error())
		}
	}

	return valuesMap, e
}

func (that XibDb) UpdateRow(querySpec interface{}, whereSpec interface{}, nSpec interface{}, valuesSpec interface{}, limitSpec interface{}) (string, error) {
	row, e := that.UpdateRowNative(querySpec, whereSpec, nSpec, valuesSpec, limitSpec)
	s, _ := json.Marshal(row)
	return string(s), e
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
func (that XibDb) MoveRowNative(querySpec interface{}, whereSpec interface{}, mSpec interface{}, nSpec interface{}) (map[string]interface{}, error) {
	if that.DumpSql || that.DryRun {
		log.Println("MoveRowNative()")
	}

	// check constraints
	var e error = nil
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("pre-check: " + e.Error())
		}
	}

	// decode the arguments into variables
	queryMap, valid := querySpec.(map[string]interface{})
	if !valid {
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
	m := queryMap["m"].(int)
	n := queryMap["n"].(int)
	where := queryMap["where"]

	// decode ambiguous table argument
	tableStr := table.(string)
	table = "`" + tableStr + "`"

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
	orderby := ""
	if sort_field != "" {
		orderby = " ORDER BY `" + sort_field + "` DESC"
	} else {
		return nil, errors.New(tableStr + " does not have a sort_field")
	}

	if m == n {
		return nil, errors.New("`m` and `n` are the same so nothing to do")
	}

	// decode remaining ambiguous arguments
	if whereMap, ok := where.(map[string]interface{}); ok {
		where = that.ImplementWhere(whereMap)
	}
	if strings.HasPrefix(where.(string), " ") {
		// add raw SQL
		where = where.(string)
	} else if strings.HasPrefix(where.(string), "WHERE ") {
		where = " " + where.(string)
	} else if where.(string) != "" {
		where = " WHERE " + where.(string)
	}
	op_cause := " WHERE"
	if where != "" {
		op_cause = " AND"
	}

	// get the length of the array
	nLen := 0
	q := "SELECT `" + sort_field + "` FROM " + table.(string) + where.(string) + orderby + ";"
	qr_end, _, _ := that.Mysql_query(q)
	if row := that.Mysql_fetch_assoc(qr_end); row != nil {
		nLen = intval(row[sort_field]) + 1
	}
	that.Mysql_free_query(qr_end)
	if (m < 0) || (m >= nLen) {
		return nil, errors.New("`m` value out of range")
	}
	if (n < 0) || (n >= nLen) {
		return nil, errors.New("`n` value out of range")
	}

	qa := []string{}

	// save the row at the m-th to the end
	valuesStr := " `" + sort_field + "`=" + strconv.Itoa(nLen)
	and_clause := " `" + sort_field + "`=" + strconv.Itoa(m)
	q = "UPDATE " + table.(string) + " SET" + valuesStr + where.(string) + op_cause + and_clause + ";"
	qa = append(qa, q)

	// update the indices between m and n
	if that.Opt {
		if m < n {
			valuesStr = " `" + sort_field + "`=`" + sort_field + "`-1"
			and_clause = " `" + sort_field + "`>" + strconv.Itoa(m) + " AND `" + sort_field + "`<=" + strconv.Itoa(n)
		} else {
			valuesStr = " `" + sort_field + "`=`" + sort_field + "`+1"
			and_clause = " `" + sort_field + "`>=" + strconv.Itoa(n) + " AND `" + sort_field + "`<" + strconv.Itoa(m)
		}
		q = "UPDATE " + table.(string) + " SET" + valuesStr + where.(string) + op_cause + and_clause + ";"
		qa = append(qa, q)
	} else {
		if m < n {
			for i := m; i < n; i++ {
				valuesStr := " `" + sort_field + "`=" + strconv.Itoa(i)
				and_clause := " `" + sort_field + "`=" + strconv.Itoa(i+1)
				q = "UPDATE " + table.(string) + " SET" + valuesStr + where.(string) + op_cause + and_clause + ";"
				qa = append(qa, q)
			}
		} else {
			for i := m - 1; i >= n; i-- {
				valuesStr := " `" + sort_field + "`=" + strconv.Itoa(i+1)
				and_clause := " `" + sort_field + "`=" + strconv.Itoa(i)
				q = "UPDATE " + table.(string) + " SET" + valuesStr + where.(string) + op_cause + and_clause + ";"
				qa = append(qa, q)
			}
		}
	}

	// copy the row at the end to the n-th position
	valuesStr = " `" + sort_field + "`=" + strconv.Itoa(n)
	and_clause = " `" + sort_field + "`=" + strconv.Itoa(nLen)
	q = "UPDATE " + table.(string) + " SET" + valuesStr + where.(string) + op_cause + and_clause + ";"
	qa = append(qa, q)

	for _, q := range qa {
		rows, _, _ := that.Mysql_query(q)
		that.Mysql_free_query(rows)
	}

	// check constraints
	if that.CheckConstraints {
		e = that.CheckSortColumnConstraint(querySpec, whereSpec)
		if e == nil {
			e = that.CheckJsonColumnConstraint(querySpec, whereSpec)
		}
		if e != nil {
			return nil, errors.New("post-check: " + e.Error())
		}
	}

	return nil, nil
}

func (that XibDb) MoveRow(querySpec interface{}, whereSpec interface{}, mSpec interface{}, nSpec interface{}) (string, error) {
	row, e := that.MoveRowNative(querySpec, whereSpec, mSpec, nSpec)
	s, _ := json.Marshal(row)
	return string(s), e
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
func (that XibDb) Mysql_query(query string) (*sql.Rows, error, []string) {
	if that.DumpSql || that.DryRun {
		log.Println(query)
	}
	columnNames := []string{}
	if that.DryRun && !strings.HasPrefix(query, "SELECT ") && !strings.HasPrefix(query, "DESCRIBE ") {
		return nil, nil, columnNames
	}
	link_identifier := (that.config["link_identifier"]).(*sql.DB)
	rows, e := link_identifier.Query(query)
	columnNames = []string{}
	if e == nil {
		columnNames, _ = rows.Columns()
	} else {
		if !that.DumpSql && !that.DryRun {
			log.Println(query)
		}
		log.Println(e)
	}
	return rows, e, columnNames
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
func (that XibDb) Mysql_exec(query string) (*sql.Result, error, []string) {
	if that.DumpSql || that.DryRun {
		log.Println(query)
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
			log.Println(query)
		}
		log.Println(e)
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
func (that XibDb) Mysql_fetch_assoc(rows *sql.Rows) map[string]interface{} {
	var e error = nil
	var row map[string]interface{} = nil
	if rows.Next() {
		columnNames, _ := rows.Columns()
		fields := make([]interface{}, len(columnNames))
		values := make([]interface{}, len(columnNames))
		for i := 0; i < len(columnNames); i++ {
			fields[i] = &values[i]
		}
		if e = rows.Scan(fields...); e == nil {
			row = make(map[string]interface{})
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
	return row
}

/**
 * Flexible mysql_free_result() function.
 *
 * @param $result String The result to free.
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
 * @param $result String The result to free.
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
func (that XibDb) Mysql_real_escape_string(unescaped_string string) string {
	escaped_string := strings.ReplaceAll(unescaped_string, "\\0", "\\x00")
	escaped_string = strings.ReplaceAll(escaped_string, "\n", "\\n")
	escaped_string = strings.ReplaceAll(escaped_string, "\r", "\\r")
	escaped_string = strings.ReplaceAll(escaped_string, "\\", "\\\\")
	escaped_string = strings.ReplaceAll(escaped_string, "'", "\\'")
	escaped_string = strings.ReplaceAll(escaped_string, "\"", "\\\"")
	escaped_string = strings.ReplaceAll(escaped_string, "\x1a", "\\\x1a")
	return escaped_string
}

/**
 * Flexible mysql_insert_id() function.
 *
 * @return The mysql_insert_id() return value.
 *
 * @author DanielWHoward
 */
func (that XibDb) Mysql_insert_id(result *sql.Result) int {
	id, err := (*result).LastInsertId()
	if err != nil {
		// handle err
		log.Fatal(err)
	}
	return int(id)
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
func (that XibDb) CheckSortColumnConstraint(querySpec interface{}, whereSpec interface{}) error {
	var e error = nil

	// decode the arguments into variables
	queryMap, valid := querySpec.(map[string]interface{})
	if !valid {
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
	tableStr := table.(string)
	table = "`" + tableStr + "`"

	// cache the table description
	that.ReadDesc(tableStr)
	descMap := that.cache[tableStr].(map[string]interface{})
	sort_field, _ := descMap["sort_column"].(string)
	orderby := ""
	if sort_field != "" {
		orderby = " ORDER BY `" + sort_field + "` ASC"
	} else {
		e = errors.New("CheckSortColumnConstraint(): " + tableStr + " does not contain `" + sort_field + "`")
	}

	if e == nil {
		// decode remaining ambiguous arguments
		if whereMap, ok := where.(map[string]interface{}); ok {
			where = that.ImplementWhere(whereMap)
		}
		if strings.HasPrefix(where.(string), " ") {
			// add raw SQL
			where = where.(string)
		} else if strings.HasPrefix(where.(string), "WHERE ") {
			where = " " + where.(string)
		} else if where.(string) != "" {
			where = " WHERE " + where.(string)
		}

		// read the table
		q := "SELECT `" + sort_field + "` FROM " + table.(string) + where.(string) + orderby + ";"
		rows, _, _ := that.Mysql_query(q)
		// read result
		n := 0
		for row := that.Mysql_fetch_assoc(rows); (row != nil) && (e == nil); row = that.Mysql_fetch_assoc(rows) {
			if intval(row[sort_field]) != n {
				err := "\"" + strval(n) + "\" value in `" + sort_field + "` column in " + table.(string) + " table; missing"
				e = errors.New("CheckSortColumnConstraint(): " + err)
			}
			n++
		}
		that.Mysql_free_query(rows)
	}

	return e
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
func (that XibDb) CheckJsonColumnConstraint(querySpec interface{}, whereSpec interface{}) error {
	var e error = nil

	// decode the arguments into variables
	queryMap, valid := querySpec.(map[string]interface{})
	if !valid {
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
	tableStr := table.(string)
	table = "`" + tableStr + "`"

	// cache the table description
	that.ReadDesc(tableStr)
	descMap := that.cache[tableStr].(map[string]interface{})
	json_field, _ := descMap["json_column"].(string)
	if json_field == "" {
		e = errors.New("CheckJsonColumnConstraint(): " + tableStr + " does not contain `" + json_field + "`")
	}

	if e == nil {
		// decode remaining ambiguous arguments
		if whereMap, ok := where.(map[string]interface{}); ok {
			where = that.ImplementWhere(whereMap)
		}
		if strings.HasPrefix(where.(string), " ") {
			// add raw SQL
			where = where.(string)
		} else if strings.HasPrefix(where.(string), "WHERE ") {
			where = " " + where.(string)
		} else if where.(string) != "" {
			where = " WHERE " + where.(string)
		}

		// read the table
		q := "SELECT `" + json_field + "` FROM " + table.(string) + where.(string) + ";"
		rows, _, _ := that.Mysql_query(q)
		// read result
		for row := that.Mysql_fetch_assoc(rows); (row != nil) && (e == nil); row = that.Mysql_fetch_assoc(rows) {
			jsonValue := row[json_field].(string)
			jsonRowMap := make(map[string]interface{}, 0)
			e = json.Unmarshal([]byte(jsonValue), &jsonRowMap)
			if e != nil {
				err := "\"" + that.Mysql_real_escape_string(jsonValue) + "\" value in `" + json_field + "` column in " + table.(string) + " table; " + e.Error()
				e = errors.New("CheckJsonColumnConstraint(): " + err)
			}
		}
		that.Mysql_free_query(rows)
	}

	return e
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
func (that XibDb) ApplyTablesToWhere(a map[string]interface{}, table string) map[string]interface{} {
	aa := map[string]interface{}{}
	for key, value := range a {
		if strings.Index(key, ".") == -1 {
			aa[table+"."+key] = value
		} else {
			aa[key] = value
		}
	}
	return aa
}

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
func (that XibDb) ImplementWhere(whereSpec interface{}) string {
	ret := whereSpec
	_, valid := whereSpec.(map[string]interface{})
	if valid {
		ret = that.ImplementClause(whereSpec.(map[string]interface{}), "")
		if ret != "" {
			ret = "WHERE " + ret.(string)
		}
	}
	return ret.(string)
}

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
func (that XibDb) ImplementOn(onVar interface{}) string {
	joins := []string{"INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "OUTER JOIN"}
	ret := ""
	onMap, valid := onVar.(map[string]interface{})
	if valid {
		var clause = ""
		for table, cond := range onMap {
			// INNER JOIN is the default
			var join = joins[0]
			// remove JOIN indicator from conditions
			var conds = map[string]interface{}{}
			for k, v := range cond.(map[string]interface{}) {
				if arrayIncludes(strings.ToUpper(k), joins) {
					join = k
				} else {
					conds[k] = v
				}
			}
			// build the JOIN clause
			clause += " " + join + " " + table + " ON " + that.ImplementClause(conds, "ON ")
		}
		ret = clause
	} else {
		ret = onVar.(string)
	}
	return ret
}

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
func (that XibDb) ImplementClause(clause map[string]interface{}, on string) string {
	ret := ""
	if /*is_array(clause) &&*/ len(clause) == 0 {
		ret = ""
	} else /*if is_array(clause)*/ {
		op := "AND"
		if clause["or"] != nil {
			op = "OR"
			delete(clause, "or")
		} else if clause["and"] != nil {
			delete(clause, "and")
		}
		s := "("
		for key, value := range clause {
			if s != "(" {
				s += " " + op + " "
			}
			_, a := value.([]interface{})
			_, m := value.(map[string]interface{})
			if a {
				// assume it is some SQL syntax
				s += "(" + that.ImplementSyntax(key, value.([]interface{})) + ")"
			} else if m {
				// assume it is a sub-clause
				s += that.ImplementClause(value.(map[string]interface{}), "")
			} else {
				v := fmt.Sprintf("%v", value)
				s += "`" + key + "`=\"" + that.Mysql_real_escape_string(v) + "\""
			}
		}
		s += ")"
		ret = s
	}
	return ret
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
func (that XibDb) ImplementSyntax(key string, syntax []interface{}) string {
	var sql = ""
	if (len(syntax) >= 1) && (syntax[0] == "LIKE") {
		// LIKE: array("LIKE", "tags", "% ", $arrayOfTags, " %")
		var key = syntax[1].(string)
		values := []string{}
		if len(syntax) == 3 {
			values = append(values, syntax[2].(string))
		} else if (len(syntax) == 4) || (len(syntax) == 5) {
			var pre = syntax[2].(string)
			post := ""
			if len(syntax) == 5 {
				post = syntax[4].(string)
			}
			_, arr := syntax[3].([]string)
			if arr {
				for v := 0; v < len(syntax[3].([]string)); v++ {
					values = append(values, pre+syntax[3].([]string)[v]+post)
				}
			} else {
				values = append(values, pre+syntax[3].(string)+post)
			}
		}
		var op = "OR"
		for v := 0; v < len(values); v++ {
			if v > 0 {
				sql += " " + op + " "
			}
			sql += "`" + key + "` LIKE \"" + that.Mysql_real_escape_string(values[v]) + "\""
		}
	} else {
		// OR: "column"=>array("1", "2", "3")
		var op = "OR"
		var values = syntax
		for v := 0; v < len(values); v++ {
			if v > 0 {
				sql += " " + op + " "
			}
			sql += "`" + key + "`=\"" + that.Mysql_real_escape_string(values[v].(string)) + "\""
		}
	}
	return sql
}

/**
 * Store values to create a query with the IN keyword.
 *
 * @version 0.0.9
 * @author DanielWHoward
 */
type queryUsingInKeyword struct {
	prefix    string
	op_clause string
	field     string
	Values    []int
}

/**
 * Create an object to store values to create a query
 * with the IN keyword.
 *
 * @param prefix A string with most of the query.
 * @param value The first value for the IN clause.
 *
 * @author DanielWHoward
 */
func newQueryUsingInKeyword(prefix string, op_clause string, field string, value int) *queryUsingInKeyword {
	self := new(queryUsingInKeyword)
	self.prefix = prefix
	self.field = field
	self.Values = make([]int, 0)
	self.Values = append(self.Values, value)
	return self
}

/**
 * Return a SQL string created from multiple values.
 *
 * @param op_clause A name, possibly unused.
 * @param sort_field An array with syntax specification.
 * @return A SQL syntax string.
 *
 * @author DanielWHoward
 */
func (that queryUsingInKeyword) getQuery() string {
	and_clause := ""
	if len(that.Values) == 1 {
		and_clause = " `" + that.field + "`=" + strconv.Itoa(that.Values[0])
	} else {
		for _, i := range that.Values {
			if and_clause != "" {
				and_clause += ", "
			}
			and_clause += strconv.Itoa(i)
		}
		and_clause = " `" + that.field + "` IN (" + and_clause + ")"
	}
	return that.prefix + that.op_clause + and_clause + ";"
}

/**
 * Merge keys of objects with string indices and
 * return a new array.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
func arrayMerge(a map[string]interface{}, b map[string]interface{}) (r map[string]interface{}) {
	r = make(map[string]interface{})
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
	r = make(map[string]interface{})
	for key, value := range a {
		r[key] = value
	}
	for key, value := range b {
		if value != nil && value != "" {
			r[key] = value
		}
	}
	for key, value := range c {
		if value != nil && value != "" {
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
 * Checks if a string value exists in a string array.
 *
 * @return needle The string to search for.
 * @return haystack The string array to search in.
 *
 * @author DanielWHoward
 **/
func arrayIncludes(needle string, haystack []string) bool {
	for _, v := range haystack {
		if v == needle {
			return true
		}
	}
	return false
}

func stringKeysOrArrayIntersect(a interface{}, b interface{}) (c []string) {
	// turn into a map if it is an array
	aMap, aValid := a.(map[string]interface{})
	if !aValid {
		for _, value := range a.([]string) {
			aMap[value] = true
		}
	}
	// get the keys if it is a map
	bArr, bValid := b.([]string)
	if !bValid {
		for key := range b.(map[string]interface{}) {
			bArr = append(bArr, key)
		}
	}
	// get the keys if it is a map
	for _, value := range bArr {
		if _, ok := aMap[value]; ok {
			c = append(c, value)
		}
	}
	return
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

func is_null(value interface{}) bool {
	return value == nil
}

func is_bool(value interface{}) bool {
	_, ok := value.(bool)
	return ok
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

func is_string(value interface{}) bool {
	_, ok := value.(string)
	return ok
}

func strval(value interface{}) string {
	return fmt.Sprintf("%v", value)
}

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

func floatval(value interface{}) float64 {
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

func gettype(value interface{}) string {
	return ""
}
