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
package main

import (
	"fmt"
	"log"
	"sort"
	"strconv"
	"strings"
	"time"

	"database/sql"
	_ "github.com/go-sql-driver/mysql"

	"xibdb"
)

func sortJsonNativeXibdb(o interface{}) (s string) {
	_, ok32 := o.(float32)
	_, ok64 := o.(float64)
	if oArr, ok := o.([]map[string]interface{}); ok {
		s += "["
		for _, value := range oArr {
			if s != "[" {
				s += ","
			}
			s += sortJsonNativeXibdb(value)
		}
		s += "]"
	} else if oArr, ok := o.([]interface{}); ok {
		s += "["
		for _, value := range oArr {
			if s != "[" {
				s += ","
			}
			s += sortJsonNativeXibdb(value)
		}
		s += "]"
	} else if oMap, ok := o.(map[string]interface{}); ok {
		keys := make([]string, len(oMap))
		i := 0
		for k, _ := range oMap {
			keys[i] = k
			i++
		}
		sort.Strings(keys)
		s += "{"
		for _, key := range keys {
			value := oMap[key]
			if s != "{" {
				s += ","
			}
			s += sortJsonNativeXibdb(key) + ":" + sortJsonNativeXibdb(value)
		}
		s += "}"
	} else if oBool, ok := o.(bool); ok {
		s = "false"
		if oBool {
			s = "true"
		}
	} else if oInt, ok := o.(int); ok {
		s = strconv.Itoa(oInt)
	} else if ok32 || ok64 {
		s = fmt.Sprintf("%v", o)
		if !strings.Contains(s, ".") {
			s += ".0"
		}
	} else if oTime, ok := o.(time.Time); ok {
		s = "\"" + strings.ReplaceAll(oTime.Format("2006-01-02 15:04:05"), "\"", "\\\"") + "\""
	} else if oStr, ok := o.(string); ok {
		s = "\"" + strings.ReplaceAll(oStr, "\"", "\\\"") + "\""
	}
	return s
}

func assertDb(name string, xdb *xibdb.XibDb, tables []string, output bool, expectedJson []string) {
	i := 0
	color := "green"
	result := "passed"
	out := ""
	for _, table := range tables {
		rows, _ := xdb.ReadRowsNative(map[string]interface{}{
			"table": table,
		}, nil, nil, nil)
		actual := sortJsonNativeXibdb(rows)
		expected := expectedJson[i]
		if output {
			quoted := actual
			quoted = strings.ReplaceAll(quoted, "\\", "\\\\")
			quoted = strings.ReplaceAll(quoted, "\"", "\\\"")
			quoted = "\"" + quoted + "\","
			out += quoted + "\n"
		}
		if actual != expected {
			color = "red"
			result = "failed to match actual to expected"
			break
		}
		i++
	}
	pre := "\x1b[32m"
	if color != "green" {
		pre = "\x1b[31m"
	}
	log.Println(pre + name + ": " + result + "\x1b[0m")
	if (out != "") || output {
		log.Println("\n" + out)
	}
}
func assertRows(name string, rows []map[string]interface{}, output bool, expectedJson string) {
	actual := sortJsonNativeXibdb(rows)
	expected := expectedJson
	color := "green"
	result := "passed"
	out := ""
	if output {
		quoted := actual
		quoted = strings.ReplaceAll(quoted, "\\", "\\\\")
		quoted = strings.ReplaceAll(quoted, "\"", "\\\"")
		quoted = "\"" + quoted + "\","
		out += quoted
	}
	if actual != expected {
		color = "red"
		result = "failed"
	}
	pre := "\x1b[32m"
	if color != "green" {
		pre = "\x1b[31m"
	}
	log.Println(pre + name + ": " + result + "\x1b[0m")
	if out != "" {
		log.Println(out)
	}
}

func TestFullXibdb() {
	// connect to the MySQL database
	const host string = "127.0.0.1"
	const spec string = "root:mysql@tcp(" + host + ":3306)/publicfigure"
	link, e := sql.Open("mysql", spec)
	if e != nil {
		log.Fatal(e)
	}
	// map the MySQL database to arrays and JSON
	xdb := xibdb.NewXibDb(map[string]interface{}{
		"json_column":     "json", // freeform JSON column name
		"sort_column":     "n",    // array index column name
		"link_identifier": link,
	})

	xdb.DumpSql = false
	xdb.DryRun = false
	params := map[string]interface{}{}

	nowStr := "2023-01-13 19:21:00"
	now, _ := time.Parse("2006-01-02 15:04:05", nowStr)

	q := "DROP TABLE `testplants`;"
	_, e, _ = xdb.Mysql_query(q, params)
	if e != nil {
		log.Println(e)
	}

	q = "DROP TABLE `testratings`;"
	_, e, _ = xdb.Mysql_query(q, params)
	if e != nil {
		log.Println(e)
	}

	q = "CREATE TABLE `testplants` ( "
	q += "`id` bigint(20) unsigned NOT NULL auto_increment,"
	q += "`category` text,"
	q += "`val` text,"
	q += "`colors` text,"
	q += "`seeds` tinyint(1),"
	q += "`total` int,"
	q += "`price` float,"
	q += "`created` datetime NOT NULL," // 2014-12-23 06:00:00 (PST)
	q += "`n` bigint(20) unsigned NOT NULL,"
	q += "`json` text,"
	q += "UNIQUE KEY `id` (`id`));"
	_, e, _ = xdb.Mysql_query(q, params)
	if e != nil {
		log.Println(e)
	}

	q = "CREATE TABLE `testratings` ( "
	q += "`id` bigint(20) unsigned NOT NULL auto_increment,"
	q += "`pid` bigint(20) unsigned NOT NULL,"
	q += "`name` text,"
	q += "`rating` int,"
	q += "`json` text,"
	q += "UNIQUE KEY `id` (`id`));"
	_, e, _ = xdb.Mysql_query(q, params)
	if e != nil {
		log.Println(e)
	}

	//
	// #1
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "apple",
			"colors":   " red green ",
			"seeds":    true,
			"pit":      false,
			"total":    28,
			"price":    0.5,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #1", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"}]",
		"[]",
	})

	//
	// #2
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "lemon's \"the great\"",
			"colors":   " yellow ",
			"seeds":    true,
			"total":    8,
			"price":    0.25,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #2", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"}]",
		"[]",
	})

	//
	// #3
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "apricot",
			"colors":   " yellow orange ",
			"seeds":    false,
			"pit":      true,
			"total":    16,
			"price":    2.0,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #3", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"}]",
		"[]",
	})

	//
	// #4
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "pomegrante",
			"colors":   " purple red white ",
			"seeds":    true,
			"total":    5,
			"price":    4.08,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #4", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
	})

	//
	// #5
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "flower",
			"val":      "rose",
			"colors":   " white yellow red ",
			"seeds":    false,
			"total":    12,
			"price":    5.0,
			"thorns":   true,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "flower",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #5", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"}]",
		"[]",
	})

	//
	// #6
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "orange",
			"colors":   " orange ",
			"total":    1,
			"price":    0.10,
			"seeds":    true,
			"skin": map[string]interface{}{
				"thickness": "thin",
				"fragrant":  true,
			},
			"created": now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #6", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
	})

	//
	// #7
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "flower",
			"val":      "tulip",
			"colors":   " white ",
			"seeds":    false,
			"total":    1,
			"price":    1.75,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "flower",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #7", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"}]",
		"[]",
	})

	//
	// #8
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "strawberry",
			"colors":   " red ",
			"seeds":    false,
			"total":    164,
			"price":    0.08,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #8", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"}]",
		"[]",
	})

	//
	// #9
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "cherry",
			"colors":   " red purple ",
			"seeds":    false,
			"pit":      true,
			"total":    22,
			"price":    0.16,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #9", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[]",
	})

	//
	// #10
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testratings",
		"values": map[string]interface{}{
			"id":     0,
			"pid":    8,
			"name":   "fruitycorp",
			"rating": 9,
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #10", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
	})

	//
	// #11
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testratings",
		"values": map[string]interface{}{
			"id":     0,
			"pid":    8,
			"name":   "greengrocer",
			"rating": 8,
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #11", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8}]",
	})

	//
	// #12
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testratings",
		"values": map[string]interface{}{
			"id":     0,
			"pid":    3,
			"name":   "fruitycorp",
			"rating": 4,
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #12", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4}]",
	})

	//
	// #13
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testratings",
		"values": map[string]interface{}{
			"id":       0,
			"pid":      99,
			"name":     "appledude",
			"reviewed": false,
			"rating":   5,
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #13", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false}]",
	})

	//
	// #14
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testratings",
		"values": map[string]interface{}{
			"id":     0,
			"pid":    3,
			"name":   "apricoteater",
			"draft":  true,
			"rating": 3,
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #14", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3}]",
	})

	//
	// #15
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testratings",
		"values": map[string]interface{}{
			"id":     0,
			"pid":    8,
			"name":   "produceguy",
			"rating": 7,
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #15", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #16
	//

	_, e = xdb.UpdateRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"good4pie": true,
			"val":      "apricot (changed)",
		},
		"n": 2,
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"limit": 1,
	}, nil, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("update #16", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #17
	//

	rows, e := xdb.ReadRowsNative(map[string]interface{}{
		"table": "testplants",
		"on": map[string]interface{}{
			"testratings": map[string]interface{}{
				"testratings.pid": "testplants.id",
			},
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"order by": "`testratings`.`rating`",
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertRows("select on #17", rows, false,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9}]",
	)

	//
	// #18
	//

	rows, e = xdb.ReadRowsNative(map[string]interface{}{
		"table": "testplants",
		"columns": []string{
			"val",
			"price",
		},
		"on": map[string]interface{}{
			"testratings": map[string]interface{}{
				"testratings.pid": "testplants.id",
			},
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"order by": "`testratings`.`rating`",
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertRows("select on #18", rows, false,
		"[{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"price\":2.0,\"rating\":3,\"val\":\"apricot (changed)\"},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"price\":2.0,\"rating\":4,\"val\":\"apricot (changed)\"},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"price\":0.08,\"rating\":7,\"val\":\"strawberry\"},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"price\":0.08,\"rating\":8,\"val\":\"strawberry\"},{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"price\":0.08,\"rating\":9,\"val\":\"strawberry\"}]",
	)

	//
	// #19
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "kiwi",
			"colors":   " green ",
			"seeds":    false,
			"total":    4,
			"sweet":    "very, very",
			"price":    2.28,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": 0,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #19", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #20
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "raspberry",
			"colors":   " red ",
			"seeds":    false,
			"total":    17,
			"sweet":    3,
			"price":    0.12,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": 4,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #20", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #21
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "grapefruit",
			"colors":   " orange yellow pink ",
			"seeds":    true,
			"total":    3,
			"sour":     4,
			"price":    3.14,
			"created":  now,
		},
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": 4,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #21", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #22
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":        0,
			"category":  "fruit",
			"val":       "banana",
			"colors":    " yellow green ",
			"seeds":     false,
			"total":     3,
			"pulpcolor": "white",
			"price":     1.02,
			"created":   now,
		},
		"where": " WHERE `category`='fruit'",
		"n":     4,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #22", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #23
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "watermelon",
			"colors":   " red ",
			"seeds":    false,
			"total":    1.5,
			"price":    2.50,
			"created":  now,
		},
		"where": " WHERE `category`='fruit'",
		"n":     4,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #23", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #24
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"id":       0,
			"category": "fruit",
			"val":      "mango",
			"colors":   " orange ",
			"seeds":    true,
			"total":    7,
			"price":    1.13,
			"created":  now,
		},
		"where": "`category`='fruit'",
		"n":     4,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #24", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #25
	//

	_, e = xdb.InsertRowNative(map[string]interface{}{
		"table":  "testplants",
		"values": "(`id`,`category`,`val`,`colors`,`seeds`,`total`,`price`,`created`,`n`,`json`) VALUES (0,'fruit','blueberry',' blue ',0,18,0.22,'2023-01-13 19:21:00',13,'{\"stains\":true}')",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": 13,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("insert #25", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #26
	//

	_, e = xdb.UpdateRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"open": true,
			"val":  "mango (changed)",
		},
		"n": 4,
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("update #26", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #27
	//

	_, e = xdb.UpdateRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"val":   "mango2 (changed)",
			"zebra": 2.0,
		},
		"n": 4,
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("update #27", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":2},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #28
	//

	_, e = xdb.UpdateRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"zebra": 3.1,
		},
		"n": 4,
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("update #28", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"val\":\"mango2 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #29
	//

	_, e = xdb.UpdateRowNative(map[string]interface{}{
		"table": "testplants",
		"values": map[string]interface{}{
			"unfinished": true,
			"val":        "mango33 (changed)",
			"n":          "str",
		},
		"n": 4,
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("update #29", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #30
	//

	rows, e = xdb.ReadRowsNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertRows("select on #30", rows, false,
		"[{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":15,\"n\":\"str\",\"open\":true,\"price\":1.13,\"seeds\":true,\"total\":7,\"unfinished\":true,\"val\":\"mango33 (changed)\",\"zebra\":3.1},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
	)

	//
	// #31
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": 4,
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #31", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" green \",\"created\":\"2023-01-13 19:21:00\",\"id\":10,\"price\":2.28,\"seeds\":false,\"sweet\":\"very, very\",\"total\":4,\"val\":\"kiwi\"},{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #32
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": 0,
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #32", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"},{\"category\":\"fruit\",\"colors\":\" blue \",\"created\":\"2023-01-13 19:21:00\",\"id\":16,\"price\":0.22,\"seeds\":false,\"stains\":true,\"total\":18,\"val\":\"blueberry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #33
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": -1,
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #33", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" red green \",\"created\":\"2023-01-13 19:21:00\",\"id\":1,\"pit\":false,\"price\":0.5,\"seeds\":true,\"total\":28,\"val\":\"apple\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #34
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": " WHERE `category`='fruit'",
		"n":     0,
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #34", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" yellow \",\"created\":\"2023-01-13 19:21:00\",\"id\":2,\"price\":0.25,\"seeds\":true,\"total\":8,\"val\":\"lemon's \\\"the great\\\"\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #35
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": " WHERE `category`='fruit'",
		"n":     0,
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #35", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"fruit\",\"colors\":\" yellow orange \",\"created\":\"2023-01-13 19:21:00\",\"good4pie\":true,\"id\":3,\"pit\":true,\"price\":2.0,\"seeds\":false,\"total\":16,\"val\":\"apricot (changed)\"},{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #36
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": "`category`='fruit'",
		"n":     0,
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #36", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"id\":4,\"name\":\"appledude\",\"pid\":99,\"rating\":5,\"reviewed\":false},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #37
	//

	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testratings",
		"where": map[string]interface{}{
			"pid": 99,
		},
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #37", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #38
	//

	// DeleteRowNative: "n" is not an int; n is a JSON string
	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": "{\"address\": \"608\"}",
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #38", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #39
	//

	// DeleteRowNative: "n" is not an int; something else
	e = xdb.DeleteRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"n": " ADN something",
	}, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("delete #39", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #40
	//

	e = xdb.MoveRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"m": 2,
		"n": 6,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("move #40", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #41
	//

	e = xdb.MoveRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"m": 5,
		"n": 1,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("move #41", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #42
	//

	e = xdb.MoveRowNative(map[string]interface{}{
		"table": "testplants",
		"where": map[string]interface{}{
			"category": "fruit",
		},
		"m": 5,
		"n": 0,
	}, nil, nil, nil)
	if e != nil {
		log.Println(e)
	}

	assertDb("move #42", xdb, []string{"testplants", "testratings"}, false, []string{
		"[{\"category\":\"flower\",\"colors\":\" white yellow red \",\"created\":\"2023-01-13 19:21:00\",\"id\":5,\"price\":5.0,\"seeds\":false,\"thorns\":true,\"total\":12,\"val\":\"rose\"},{\"category\":\"fruit\",\"colors\":\" orange \",\"created\":\"2023-01-13 19:21:00\",\"id\":6,\"price\":0.1,\"seeds\":true,\"skin\":{\"fragrant\":true,\"thickness\":\"thin\"},\"total\":1,\"val\":\"orange\"},{\"category\":\"flower\",\"colors\":\" white \",\"created\":\"2023-01-13 19:21:00\",\"id\":7,\"price\":1.75,\"seeds\":false,\"total\":1,\"val\":\"tulip\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":14,\"price\":2.5,\"seeds\":false,\"total\":1.5,\"val\":\"watermelon\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":8,\"price\":0.08,\"seeds\":false,\"total\":164,\"val\":\"strawberry\"},{\"category\":\"fruit\",\"colors\":\" yellow green \",\"created\":\"2023-01-13 19:21:00\",\"id\":13,\"price\":1.02,\"pulpcolor\":\"white\",\"seeds\":false,\"total\":3,\"val\":\"banana\"},{\"category\":\"fruit\",\"colors\":\" red \",\"created\":\"2023-01-13 19:21:00\",\"id\":11,\"price\":0.12,\"seeds\":false,\"sweet\":3,\"total\":17,\"val\":\"raspberry\"},{\"category\":\"fruit\",\"colors\":\" purple red white \",\"created\":\"2023-01-13 19:21:00\",\"id\":4,\"price\":4.08,\"seeds\":true,\"total\":5,\"val\":\"pomegrante\"},{\"category\":\"fruit\",\"colors\":\" orange yellow pink \",\"created\":\"2023-01-13 19:21:00\",\"id\":12,\"price\":3.14,\"seeds\":true,\"sour\":4,\"total\":3,\"val\":\"grapefruit\"},{\"category\":\"fruit\",\"colors\":\" red purple \",\"created\":\"2023-01-13 19:21:00\",\"id\":9,\"pit\":true,\"price\":0.16,\"seeds\":false,\"total\":22,\"val\":\"cherry\"}]",
		"[{\"id\":1,\"name\":\"fruitycorp\",\"pid\":8,\"rating\":9},{\"id\":2,\"name\":\"greengrocer\",\"pid\":8,\"rating\":8},{\"id\":3,\"name\":\"fruitycorp\",\"pid\":3,\"rating\":4},{\"draft\":true,\"id\":5,\"name\":\"apricoteater\",\"pid\":3,\"rating\":3},{\"id\":6,\"name\":\"produceguy\",\"pid\":8,\"rating\":7}]",
	})

	//
	// #43
	//

}
