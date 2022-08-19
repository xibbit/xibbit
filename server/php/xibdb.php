<?php
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
class XibDb {
  /**
   * Use a database for JSON.
   *
   * Configurations are arrays with keys like "sort_column",
   * "json_column", and "link_identifier" keys.
   *
   * @param $config A configuration.
   *
   * @author DanielWHoward
   */
  function __construct($config=array()) {
    $this->config = $config;
    $this->cache = array();
    $this->checkConstraints = false;
    $this->dryRun = false;
    $this->dumpSql = false;
    $this->opt = true;
    $this->log = isset($config['log'])? $config['log']: $this;
//    $this->undefine = curl_init();
//    $this->json = new Services_JSON();
//    json___construct(SERVICES_JSON_LOOSE_TYPE);
  }

  /**
   * Get JSON table rows from the database.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * @param $querySpec String A database table.
   * @param $whereSpec String A WHERE clause.
   * @param $columnsSpec String A columns clause.
   * @param $onSpec String An ON clause.
   * @return A string containing a JSON array of objects.
   *
   * @author DanielWHoward
   */
  function readRowsNative($querySpec, $whereSpec='', $columnsSpec='*', $onSpec='') {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println('readRowsNative()');
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("pre-check: " . e.Error());
      }
    }

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'columns'=>'*',
      'on'=>'',
      'where'=>''
    ), array(
      'table'=>$querySpec,
      'columns'=>$columnsSpec,
      'on'=>$onSpec,
      'where'=>$whereSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $columns = $queryMap['columns'];
    $onVar = $queryMap['on'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableArr = array();
    $tableStr = '';
    if (is_array($table)
        && (count(array_filter(array_keys($table), 'is_string')) === 0)) {
      $tableArr = $table;
      $tableStr = $table[0];
    } else if (is_string($table)) {
      $tableArr[] = $table;
      $tableStr = $table;
    }
    $tablesStr = $tableStr;
    foreach ($tableArr as $tableName) {
      if ($tablesStr !== $tableName) {
        $tablesStr .= ',' . $tableName;
      }
    }
    $table = '`' . $tableStr . '`';

    // cache the table description
    $dryRun = $this->dryRun;
    $dumpSql = $this->dumpSql;
    $this->dryRun = false;
    $this->dumpSql = false;
    $this->readDescNative($tableStr);
    $this->dryRun = $dryRun;
    $this->dumpSql = $dumpSql;
    $descMap = $this->cache[$tableStr];
    $desc = $descMap['desc_a'];
    $sort_field = isset($descMap['sort_column'])? $descMap['sort_column']: '';
    $json_field = isset($descMap['json_column'])? $descMap['json_column']: '';
    $orderby = '';
    if ($sort_field !== '') {
      $orderby = ' ORDER BY `' . $sort_field . '` ASC';
    }

    // decode remaining ambiguous arguments
    if (is_array($columns)) {
      $columnArr = $columns;
      $columnsStr = '';
      if (count($tableArr) === 1) {
        foreach ($columnArr as $col) {
          if ($columnsStr !== '') {
            $columnsStr .= ',';
          }
          $columnsStr .= '`' . $col . '`';
        }
      } else if (count($tableArr) > 1) {
        // assume all columns from first table
        $columnsStr .= '`' . $tableStr . '`.*';
        foreach ($columnArr as $col) {
          if (strpos($col, '.') === false) {
            // assume column is from second table
            $columnsStr .= ',`' . $tableArr[1] . '`.`' . $col . '`';
          } else {
            // do not assume table; table is specified
            $parts = explode('.', $col, 2);
            $tablePart = $parts[0];
            $colPart = $parts[1];
            $columnsStr .= ',`' . $tablePart . '`.`' . $colPart . '`';
          }
        }
      }
      $columns = $columnsStr;
    }
    if (is_array($onVar)) {
      // "on" spec shortcut: assume second table
      if (stringKeysOrArrayIntersect($tableArr, $onVar)) {
        // explicitly specify the second table
        $newOnVar = array();
        $newOnVar[$tableArr[1]] = $onVar;
        $onVar = $newOnVar;
      }
      $onVar = $this->implementOn($onVar);
    }
    if ($onVar !== '') {
      $onVar = ' ' . $onVar;
    }
    if (is_array($where)) {
      $whereMap = $where;
      $whereMap = $this->applyTablesToWhere($whereMap, $tableStr);
      $where = $this->implementWhere($whereMap);
    }
    if (substr($where, 0, 1) === ' ') {
      // add raw SQL
    } else if (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
      $where = ' ' . $where;
    } else if ($where !== '') {
      $where = ' WHERE ' . $where;
    }

    $config = $this->config;

    // read the table
    $q = 'SELECT ' . $columns . ' FROM ' . $table . ' ' . $onVar . ' ' . $where . $orderby . ';';
    $rows = &$this->mysql_query($q);
    // read result
    $objs = array();
    for ($row = &$this->mysql_fetch_assoc($rows); $row !== null; $row = &$this->mysql_fetch_assoc($rows)) {
      $obj = array();
      // add the SQL data first
      foreach ($row as $key => $value) {
        if ($key == 'class') {
          $key = 'clazz';
        }
        if ($key == $json_field) {
          // add non-SQL JSON data later
        } elseif ($key == $config['sort_column']) {
          // sort column isn't user data
        } elseif ($value === null) {
          $obj[$key] = null;
        } elseif (is_numeric($value) && (strval(intval($value)) == $value) && is_bool($desc[$key])) {
          $obj[$key] = (intval($value) === 1);
        } elseif (is_numeric($value) && (strval(intval($value)) == $value) && is_int($desc[$key])) {
          $obj[$key] = intval($value);
        } elseif (is_numeric($value) && is_float($desc[$key])) {
          $obj[$key] = floatval($value);
        } else {
          $val = json_decode($value, true);
          if ($val !== null) {
            $obj[$key] = $val;
          } else {
            $obj[$key] = $value;
          }
        }
      }
      // add non-SQL JSON data
      if (($json_field != '') && ($row[$json_field] !== null)) {
        $jsonMap = json_decode($row[$json_field], true);
        if ($jsonMap !== null) {
          foreach ($jsonMap as $key => $value) {
            $obj[$key] = $value;
          }
        }
      }
      $objs[] = $obj;
    }
    $this->mysql_free_query($rows);

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("post-check: " . e.Error());
      }
    }

    return $objs;
  }

  function readRows($querySpec, $whereSpec='', $columnsSpec='*', $onSpec='') {
    $objs = $this->ReadRowsNative($querySpec, $whereSpec, $columnsSpec, $onSpec);
    $s = json_encode($objs);
    return $s;
  }

  /**
   * Get a JSON table description from the database.
   *
   * It does not return "sort" and "json" columns, if any.
   *
   * @param $table String A database table.
   * @return A string containing a JSON object with columns and default values.
   *
   * @author DanielWHoward
   */
  function readDescNative($querySpec) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println("readDescNative()");
    }

    // check constraints
    $e = '';
/*    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("pre-check: " . e.Error());
      }
    }*/

    $table = '';
    if (is_array($querySpec)) {
      $queryMap = $querySpec;
      $args = array_merge(array(), $queryMap);
      $table = $queryMap['table'];
    } else {
      $table = $querySpec;
    }
    $config = $this->config;

    $desc = array();
    if (isset($this->cache[$table]) && isset($this->cache[$table]['desc_a'])) {
      $desc = $this->cache[$table]['desc_a'];
    } else {
      // read the table description
      $sort_column = '';
      $json_column = '';
      $auto_increment_column = '';
      $q = 'DESCRIBE `' . $table . '`;';
      $rows = &$this->mysql_query($q);
      while ($rowdesc = &$this->mysql_fetch_assoc($rows)) {
        $field = $rowdesc['Field'];
        $typ = $rowdesc['Type'];
        $extra = $rowdesc['Extra'];
        if ($field === $config['sort_column']) {
          $sort_column = $field;
        } elseif ($field === $config['json_column']) {
          $json_column = $field;
        } elseif (strpos($typ, 'tinyint(1)') !== false) {
          $desc[$field] = false;
        } elseif (strpos($typ, 'int') !== false) {
          $desc[$field] = 0;
        } elseif (strpos($typ, 'float') !== false) {
          $desc[$field] = floatval(0);
        } elseif (strpos($typ, 'double') !== false) {
          $desc[$field] = floatval(0);
        } else {
          $desc[$field] = '';
        }
        if ($extra === 'auto_increment') {
          $auto_increment_column = $field;
        }
      }
      // cache the description
      if (!isset($this->cache[$table])) {
        $this->cache[$table] = array();
      }
      $this->cache[$table]['desc_a'] = $desc;
      $descStr = json_encode($desc);
      $this->cache[$table]['desc'] = $descStr;
      if ($sort_column != '') {
        $this->cache[$table]['sort_column'] = $sort_column;
      }
      if ($json_column != '') {
        $this->cache[$table]['json_column'] = $json_column;
      }
      if ($auto_increment_column != '') {
        $this->cache[$table]['auto_increment_column'] = $auto_increment_column;
      }
    }

    // check constraints
/*    if ($this->checkConstraints) {
      $e = $this->checkJsonColumnConstraint($querySpec);
      if ($e !== null) {
        throw new Exception("post-check: " . e.Error());
      }
    }*/

    return $desc;
  }

  function readDesc($querySpec) {
    $desc = $this->readDescNative($querySpec);
    $s = json_encode($desc);
    return $s;
  }

  /**
   * Insert a row of JSON into a database table.
   *
   * If there is no sort column, it inserts the row, anyway.
   *
   * @param $table String A database table.
   * @param $where String A WHERE clause.
   * @param $index int The place to insert the row before; -1 means the end.
   * @param $values mixed A JSON string (string) or JSON array (array).
   *
   * @author DanielWHoward
   */
  function insertRowNative($querySpec, $whereSpec='', $valuesSpec='{}', $nSpec=-1) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println('insertRowNative()');
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("pre-check: " . e.Error());
      }
    }

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'values'=>'',
      'n'=>-1,
      'where'=>''
    ), array(
      'table'=>$querySpec,
      'values'=>$valuesSpec,
      'n'=>$nSpec,
      'where'=>$whereSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $values = $queryMap['values'];
    $n = $queryMap['n'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableStr = $table;
    $table = '`' . $tableStr . '`';

    // cache the table description
    $dryRun = $this->dryRun;
    $dumpSql = $this->dumpSql;
    $this->dryRun = false;
    $this->dumpSql = false;
    $this->readDescNative($tableStr);
    $this->dryRun = $dryRun;
    $this->dumpSql = $dumpSql;
    $descMap = $this->cache[$tableStr];
    $desc = $descMap['desc_a'];
    $sort_field = isset($descMap['sort_column'])? $descMap['sort_column']: '';
    $json_field = isset($descMap['json_column'])? $descMap['json_column']: '';
    $auto_increment_field = isset($descMap['auto_increment_column'])? $descMap['auto_increment_column']: '';
    $orderby = '';
    if ($sort_field !== '') {
      $orderby = ' ORDER BY `' . $sort_field . '` DESC';
    }

    // decode remaining ambiguous arguments
    $valuesMap = array();
    $sqlValuesMap = array(); // SET clause
    $jsonMap = arrayMerge($valuesMap, $values);
    if (is_string($values)) {
      $values = ' SET ' . $values;
    } else {
      $valuesMap = arrayMerge($valuesMap, $values);
      // copy SQL columns to sqlValuesMap
      foreach ($desc as $col => $colValue) {
        if (isset($jsonMap[$col])) {
          $compat = false;
          if (gettype($desc[$col]) == gettype($jsonMap[$col])) {
            $compat = true;
          }
          if (is_float($desc[$col]) && is_int($jsonMap[$col])) {
            $compat = true;
          }
          if (is_string($desc[$col])) {
            $compat = true;
          }
          if ($compat) {
            $sqlValuesMap[$col] = $jsonMap[$col];
            unset($jsonMap[$col]);
          }
        }
      }
      // copy freeform values into 'json' field
      if ($json_field !== '') {
        $sqlValuesMap[$json_field] = $jsonMap;
      }
    }
    $nInt = $n;
    if (is_array($where)) {
      $where = $this->implementWhere($where);
    }
    if (substr($where, 0, strlen(' ')) === ' ') {
      // add raw SQL
    } elseif (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
      $where = ' ' . $where;
    } elseif ($where !== '') {
      $where = " WHERE " . $where;
    }

    $qa = array();

    // update the positions
    if ($sort_field !== '') {
      $nLen = 0;
      $limit = '';
      if ($this->opt || ($nInt === -1)) {
        $limit = ' LIMIT 1';
      }
      $qu = 'SELECT `' . $sort_field . '` FROM ' . $table . $where . $orderby . $limit . ';';
      $qr_reorder = &$this->mysql_query($qu);
      while ($row = &$this->mysql_fetch_assoc($qr_reorder)) {
        $nValue = intval($row[$sort_field]);
        if ($nValue >= $nLen) {
          $nLen = $nValue + 1;
        }
        if ($nInt === -1) {
          $n = $nValue + 1;
          $nInt = $n;
        }
        if ($nInt > $nValue) {
          break;
        }
        $and_clause = ' WHERE ';
        if ($where !== '') {
          $and_clause = ' AND ';
        }
        if ($this->opt) {
          $set_clause = ' `' . $sort_field . '`=`' . $sort_field . '`+1';
          $and_clause .= '`' . $sort_field . '`>=' . intval($nInt);
          $qu = 'UPDATE ' . $table . ' SET' . $set_clause . $where . $and_clause . ';';
          $qa[] = $qu;
          break;
        } else {
          $set_clause = ' `' . $sort_field . '`=' . ($nValue+1);
          $and_clause .= ' `' . $sort_field . '`=' . $nValue;
          $qu = 'UPDATE ' . $table . ' SET' . $set_clause . $where . $and_clause . ';';
          $qa[] = $qu;
        }
      }
      $this->mysql_free_query($qr_reorder);
      if ($nInt === -1) {
        $n = 0;
        $nInt = $n;
      }
      if ($nInt > $nLen) {
        throw new Exception('`n` value out of range');
      }

      // add sort field to valuesMap
      if (count($sqlValuesMap) > 0) {
        $sqlValuesMap[$sort_field] = $n;
      }
    }

    // finally, generate values.(string) from valuesMap
    if (count($valuesMap) > 0) {
      $valuesStr = '';
      foreach ($sqlValuesMap as $col => $value) {
        if ($valuesStr !== '') {
          $valuesStr .= ',';
        }
        $valueStr = '';
        if (is_array($value)) {
          $jsonStr = json_encode($jsonMap);
          if (($jsonStr === '') || ($jsonStr === '[]')) {
            $jsonStr = '{}';
          }
          $valueStr = '"' . $this->mysql_real_escape_string($jsonStr) . '"';
        } elseif (is_bool($value)) {
          $valueBool = $value;
          if ($valueBool) {
            $valueStr = '1';
          } else {
            $valueStr = '0';
          }
        } elseif (is_int($value)) {
          $valueStr = $value;
        } elseif (is_null($value)) {
          $valueStr = 'NULL';
        } else {
          $valueStr = '"' . $this->mysql_real_escape_string($value) . '"';
        }
        $valuesStr .= '`' . $this->mysql_real_escape_string($col) . '`=' . $valueStr;
      }
      $values = ' SET ' . $valuesStr;
    }

    $q = 'INSERT INTO ' . $table . $values . ';';
    $qa[] = $q;

    $result = null;
    foreach ($qa as $q) {
      $result = &$this->mysql_query($q);
    }

    if ($auto_increment_field !== '') {
      $valuesMap[$auto_increment_field] = $this->mysql_insert_id($result);
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("post-check: " + e.Error());
      }
    }

    return $valuesMap;
  }

  function insertRow($querySpec, $whereSpec='', $valuesSpec='{}', $nSpec=-1) {
    $row = $this->insertRowNative($querySpec, $whereSpec, $valuesSpec, $nSpec);
    $s = json_encode($row);
    return $s;
  }

  /**
   * Delete a row of JSON from a database table.
   *
   * If there is no sort column, it deletes the first row.
   *
   * @param $table String A database table.
   * @param $where String A WHERE clause.
   * @param $index mixed The row to delete (int) or JSON data to select the row (string).
   *
   * @author DanielWHoward
   */
  function deleteRowNative($querySpec, $whereSpec='', $nSpec='') {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println('deleteRowNative()');
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'n'=>'',
      'where'=>''
    ), array(
      'table'=>$querySpec,
      'n'=>$nSpec,
      'where'=>$whereSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $n = $queryMap['n'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableStr = $table;
    $table = '`' . $tableStr . '`';

    // cache the table description
    $dryRun = $this->dryRun;
    $dumpSql = $this->dumpSql;
    $this->dryRun = false;
    $this->dumpSql = false;
    $this->readDescNative($tableStr);
    $this->dryRun = $dryRun;
    $this->dumpSql = $dumpSql;
    $descMap = $this->cache[$tableStr];
    $sort_field = isset($descMap['sort_column'])? $descMap['sort_column']: '';
    $json_field = isset($descMap['json_column'])? $descMap['json_column']: '';
    $and_clause = '';

    // decode remaining ambiguous arguments
    if (is_array($where)) {
      $whereMap = $where;
      $where = $this->implementWhere($whereMap);
    }
    if (substr($where, 0, 1) === ' ') {
      // add raw SQL
    } else if (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
      $where = ' ' . $where;
    } else if ($where !== '') {
      $where = ' WHERE ' . $where;
    }
    if (($sort_field !== '') && is_int($n)) {
      $sort_start = ' AND ';
      if ($where === '') {
        $sort_start = ' WHERE ';
      }
      $and_clause .= $sort_start . '`' . $sort_field . '`=' . $n;
    } else {
      if (is_string($n) && ($n !== '')) {
        $nMap = json_decode($n, true);
        if ($nMap !== null) {
          foreach ($nMap as $col=>$value) {
            if (($and_clause === '') && ($where === '')) {
              $and_clause .= ' WHERE ';
            } else {
              $and_clause .= ' AND ';
            }
            $and_clause .= $col . '=\'' . $value . '\'';
          }
        } else {
          $and_clause .= $n;
        }
      }
      $field = $sort_field;
      if ($sort_field === '') {
        $field = '*';
      }
      $orderby_clause = '';
      if ($sort_field !== '') {
        $orderby_clause = ' ORDER BY ' . $sort_field . ' DESC';
      }
      $q = 'SELECT COUNT(*) AS num_rows FROM ' . $table . ' ' . $where . ' ' . $and_clause . $orderby_clause . ';';
      $qr = $this->mysql_query($q);
      $num_rows = 0;
      while ($row = &$this->mysql_fetch_assoc($qr)) {
        $num_rows = intval($row['num_rows']);
      }
//      $this->mysql_free_query($qr);
      $q = 'SELECT ' . $field . ' FROM ' . $table . ' ' . $where . ' ' . $and_clause . $orderby_clause . ';';
      if (($num_rows === 1) || (($num_rows > 1) && ($sort_field !== ''))) {
        $qr = $this->mysql_query($q);
        $row = $this->mysql_fetch_assoc($qr);
        if ($num_rows === 1) {
          if (sort_field !== '') {
            $n = intval($row[$sort_field]);
          }
//          $this->mysql_free_query($qr);
        } elseif (($num_rows > 1) && ($sort_field !== '')) {
          $n = $row[$sort_field];
          if (($and_clause === '') && ($where === '')) {
            $and_clause .= 'WHERE ';
          } else {
            $and_clause .= ' AND ';
          }
          $and_clause .= $sort_field . '="' . $n . '"';
        }
        $this->mysql_free_query($qr);
      } else {
        $e = 'xibdb.DeleteRow():num_rows:' . $num_rows;
        $this->fail($e);
      }
    }
    $nInt = $n;

    $qa = array();

    // update the positions
    if ($sort_field !== '') {
      $nLen = 0;
      $orderby = ' ORDER BY `' . $sort_field . '` ASC';
      $limit = '';
      if ($this->opt) {
        $orderby = ' ORDER BY `' . $sort_field . '` DESC';
        $limit = ' LIMIT 1';
      }
      $qu = 'SELECT `' . $sort_field . '` FROM ' . $table . $where . $orderby . $limit . ';';
      $qr_reorder = &$this->mysql_query($qu);
      while ($row = &$this->mysql_fetch_assoc($qr_reorder)) {
        $nValue = intval($row[$sort_field]);
        if ($nValue >= $nLen) {
          $nLen = $nValue + 1;
        }
        $and_where = ' WHERE ';
        if ($where !== '') {
          $and_where = ' AND ';
        }
        if ($this->opt) {
          $set_clause .= ' `' . $sort_field . '`=`' . $sort_field . '`-1';
          $and_where .= '`' . $sort_field . '`>=' . $nInt;
          $qu = 'UPDATE ' . $table . ' SET' . $set_clause . $where . $and_where . ';';
          $qa[] = $qu;
          break;
        } else {
          $set_clause .= ' `' . $sort_field . '`=' . ($nValue-1);
          $and_where .= $sort_field . '=' . $nValue;
          $qu = 'UPDATE ' . $table . ' SET' . $set_clause . $where . $and_where . ';';
          $qa[] = $qu;
        }
      }
      $this->mysql_free_query($qr_reorder);
      if ($nInt >= $nLen) {
        $e = '`n` value out of range';
        $this->fail($e);
      }
    }

    $q = 'DELETE FROM ' . $table . $where . $and_clause . ';';
    array_splice($qa, 0, 0, array($q));

    foreach ($qa as $q) {
      $qr = &$this->mysql_query($q);
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("post-check: " + e.Error());
      }
    }
  }

  function deleteRow($querySpec, $whereSpec='', $nSpec='') {
    return $this->deleteRowNative($querySpec, $whereSpec, $nSpec);
  }

  /**
   * Update a row of JSON in a database table.
   *
   * If there is no sort column, it updates the first row.
   *
   * @param $table String A database table.
   * @param $where String A WHERE clause.
   * @param $index mixed The row to update (int) or JSON data to select the row (string).
   * @param $values mixed A JSON string (string) or JSON array (array).
   *
   * @author DanielWHoward
   */
  function updateRowNative($querySpec, $valuesSpec='', $nSpec=-1, $whereSpec='', $limitSpec=1) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println("updateRowNative()");
    }

    // check constraints
    $e = null;
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'values'=>'',
      'n'=>-1,
      'where'=>'',
      'limit'=>1
    ), array(
      'table'=>$querySpec,
      'values'=>$valuesSpec,
      'n'=>$nSpec,
      'where'=>$whereSpec,
      'limit'=>$limitSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $values = $queryMap['values'];
    $n = $queryMap['n'];
    $where = $queryMap['where'];
    $limit = $queryMap['limit'];

    // decode ambiguous table argument
    $tableStr = $table;
    $table = '`' . $tableStr . '`';

    // cache the table description
    $dryRun = $this->dryRun;
    $dumpSql = $this->dumpSql;
    $this->dryRun = false;
    $this->dumpSql = false;
    $this->readDescNative($tableStr);
    $this->dryRun = $dryRun;
    $this->dumpSql = $dumpSql;
    $descMap = $this->cache[$tableStr];
    $desc = $descMap['desc_a'];
    $sort_field = isset($descMap['sort_column'])? $descMap['sort_column']: '';
    $json_field = isset($descMap['json_column'])? $descMap['json_column']: '';
    $orderby = '';
    if ($sort_field !== '') {
      $orderby = ' ORDER BY `' . $sort_field . '` ASC';
    }

    // decode remaining ambiguous arguments
    $valuesMap = array();
    $sqlValuesMap = array(); // SET clause
    $jsonMap = arrayMerge($valuesMap, $values);
    if (is_string($values)) {
      $values = " SET " . $values;
    } else {
      $valuesMap = arrayMerge($valuesMap, $values);
      // copy SQL columns to sqlValuesMap
      foreach ($desc as $col => $colValue) {
        if (array_key_exists($col, $jsonMap)) {
          $compat = false;
          if (array_key_exists($col, $desc)) {
            if (gettype($desc[$col]) === gettype($jsonMap[$col])) {
              $compat = true;
            }
            if (is_float($desc[$col]) && is_int($jsonMap[$col])) {
              $compat = true;
            }
            if (is_string($desc[$col])) {
              $compat = true;
            }
            if ($compat) {
              $sqlValuesMap[$col] = $jsonMap[$col];
              unset($jsonMap[$col]);
            }
          }
        }
      }
    }
    $nInt = $n;
    if (is_array($where)) {
      $where = $this->implementWhere($where);
    }
    if (substr($where, 0, strlen(' ')) === ' ') {
      // add raw SQL
    } elseif (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
      $where = ' ' . $where;
    } elseif ($where !== '') {
      $where = " WHERE " . $where;
    }
    $limitInt = $limit;
    $op_clause = ' WHERE';
    if ($where !== '') {
      $op_clause = ' AND';
    }
    $op_and_clause = '';
    $rows_affected = 0;

    if (($sort_field !== '') && ($nInt >= 0)) {
      $op_and_clause = $op_clause . ' `' . $sort_field . '`=' . $nInt;
    }

    // get the number of rows_affected
    $q = 'SELECT COUNT(*) AS rows_affected FROM ' . $table . $where . $op_and_clause . ';';
    $qr = $this->mysql_query($q);
    $rows_affected = 0;
    while ($row = &$this->mysql_fetch_assoc($qr)) {
      $rows_affected = intval($row['rows_affected']);
    }
    $this->mysql_free_query($qr);
    if ($rows_affected === 0) {
      if ($op_and_clause === '') {
        $e = '0 rows affected';
        $this->log->println($q);
        $this->fail($e);
      }
      $q = 'SELECT COUNT(*) AS rows_affected FROM ' . $table . $where . ';';
      $qr = $this->mysql_query($q);
      $rows_affected = 0;
      while ($row = &$this->mysql_fetch_assoc($qr)) {
        $rows_affected = intval($row['rows_affected']);
      }
      $this->mysql_free_query($qr);
      if ($rows_affected > 0) {
        $e = '`n` value out of range';
      } else {
        $e = '0 rows affected';
      }
      $this->log->println($q);
      $this->fail($e);
    } elseif (($limitInt !== -1) && ($rows_affected > $limitInt)) {
      $e = '' . $rows_affected . ' rows affected but limited to ' . $limitInt . ' rows';
      $this->log->println($q);
      $this->fail($e);
    }

    $qa = array($q);

    // generate UPDATE statements using json_field
    if (is_string($valuesMap)) {
      $q = 'UPDATE ' . $table . $values . $where . $op_and_clause . ';';
      $qa[] = $q;
    } else {
      // get the contents of the json_field for each affected row
      $updateJson = ($json_field !== '') && (count($jsonMap) > 0);
      $jsonRowMaps = array();
      if (!$updateJson) {
        $jsonRowMaps[] = array();
      } else {
        $jsonValue = '';
        $q = 'SELECT `' . $json_field . '` FROM ' . $table . $where . $op_and_clause . $orderby . ';';
        $qr_reorder = $this->mysql_query($q);
        while (($row = &$this->mysql_fetch_assoc($qr_reorder)) && ($e === null)) {
          $jsonValue = $row[$json_field];
          $jsonRowMap = json_decode($jsonValue, true);
          if ($jsonRowMap === null) {
            $e = 'json_decode() returned null';
          } else {
            $jsonRowMaps[] = $jsonRowMap;
          }
        }
        $this->mysql_free_query($qr_reorder);
        if ($e) {
          $err = '"' . $this->mysql_real_escape_string($jsonValue) . '" value in `' . $json_field . '` column in ' . $table . ' table; ' . $e;
          $this->fail($err);
        }
      }
      $qIns = array();
      $qInsMap = array();
      foreach ($jsonRowMaps as $i=>$jsonRowMap) {
        // copy freeform values into 'json' field
        if ($updateJson) {
          $sqlValuesMap[$json_field] = arrayMerge($jsonRowMap, $jsonMap);
        }
        // sort valuesMap keys
        $sqlValuesKeys = array();
        foreach ($sqlValuesMap as $key=>$value) {
          $sqlValuesKeys[] = $key;
        }
        sort($sqlValuesKeys);
        // finally, generate values from valuesMap
        $valuesStr = '';
        foreach ($sqlValuesKeys as $col) {
          $value = $sqlValuesMap[$col];
          if ($valuesStr !== '') {
            $valuesStr .= ',';
          }
          $valueStr = '';
          if (is_array($value)) {
            $jsonStr = json_encode($value);
            if (($jsonStr === '') || ($jsonStr === '[]')) {
              $jsonStr = '{}';
            }
            $valueStr = '"' . $this->mysql_real_escape_string($jsonStr) . '"';
          } elseif (is_bool($value)) {
            $valueBool = boolval($value);
            if ($valueBool) {
              $valueStr = '1';
            } else {
              $valueStr = '0';
            }
          } elseif (is_int($value)) {
            $valueStr = strval($value);
          } elseif (is_null($value)) {
            $valueStr = 'NULL';
          } else {
            $valueStr = '"' . $this->mysql_real_escape_string($value) . '"';
          }
          $valuesStr .= '`' . $this->mysql_real_escape_string($col) . '`=' . $valueStr;
        }
        $values = ' SET ' . $valuesStr;
        // add a custom update for each row
        if ($this->opt && $updateJson) {
          $q = 'UPDATE ' . $table . $values . $where;
          if ($sort_field === '') {
            $q .= ';';
            $qa[] = $q;
          } else {
            if (is_set($qInsMap[$q])) {
              $qi = $qInsMap[$q];
              $qIns[$qi]->Values[] = $i;
            } else {
              $qIns[] = newQueryUsingInKeyword($q, $op_clause, $sort_field, $i);
              $qInsMap[$q] = count($qIns) - 1;
            }
          }
        } else {
          $op_and_clause = '';
          if ($nInt >= 0) {
            $op_and_clause = $op_clause . ' `' . $sort_field . '`=' . $i;
          }
          $q = 'UPDATE ' . $table . $values . $where . $op_and_clause . ';';
          $qa[] = $q;
        }
      }
      if ($this->opt) {
        foreach ($qIns as $qIn) {
          $q = $qIn->getQuery();
          $qa[] = $q;
        }
      }
    }

    foreach ($qa as $q) {
      try {
        $rows = &$this->mysql_query($q);
      } catch (Exception $e) {
        print $q;
        throw $e;
      }
      $this->mysql_free_query($rows);
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("post-check: " + e.Error());
      }
    }
  }

  function updateRow($querySpec, $whereSpec='', $nSpec=-1, $valuesSpec='', $limitSpec=1) {
    $row = $this->updateRowNative($querySpec, $whereSpec, $nSpec, $valuesSpec, $limitSpec);
    $s = json_encode($row);
    return $s;
  }

  /**
   * Reorder a row of JSON in a database table.
   *
   * If there is no sort column, it does nothing.
   *
   * @param $table String A database table.
   * @param $where String A WHERE clause.
   * @param $m int The row to move.
   * @param $n int The row to move to.
   *
   * @author DanielWHoward
   */
  function moveRowNative($querySpec, $whereSpec='', $mSpec=0, $nSpec=0) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println("moveRowNative()");
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("pre-check: " + e.Error());
      }
    }

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'm'=>0,
      'n'=>0,
      'where'=>''
    ), array(
      'table'=>$querySpec,
      'm'=>$mSpec,
      'n'=>$nSpec,
      'where'=>$whereSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $m = $queryMap['m'];
    $n = $queryMap['n'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableStr = $table;
    $table = '`' . $tableStr . '`';

    // cache the table description
    $dryRun = $this->dryRun;
    $dumpSql = $this->dumpSql;
    $this->dryRun = false;
    $this->dumpSql = false;
    $this->readDescNative($tableStr);
    $this->dryRun = $dryRun;
    $this->dumpSql = $dumpSql;
    $descMap = $this->cache[$tableStr];
    $desc = $descMap['desc_a'];
    $sort_field = isset($descMap['sort_column'])? $descMap['sort_column']: '';
    $orderby = '';
    if ($sort_field !== '') {
      $orderby = ' ORDER BY `' . $sort_field . '` DESC';
    } else {
      throw new Exception($tableStr . ' does not have a sort_field');
    }

    if ($m === $n) {
      throw new Exception('`m` and `n` are the same so nothing to do');
    }

    // decode remaining ambiguous arguments
    if (is_array($where)) {
      $whereMap = $where;
      $whereMap = $this->applyTablesToWhere($whereMap, $tableStr);
      $where = $this->implementWhere($whereMap);
    }
    if (substr($where, 0, 1) === ' ') {
      // add raw SQL
    } else if (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
      $where = ' ' . $where;
    } else if ($where !== '') {
      $where = ' WHERE ' . $where;
    }
    $op_cause = ' WHERE';
    if ($where !== '') {
      $op_cause = ' AND';
    }

    // get the length of the array
    $nLen = 0;
    $q = 'SELECT `' . $sort_field . '` FROM ' . $table . $where . $orderby . ';';
    $qr_end = $this->mysql_query($q);
    if ($row = &$this->mysql_fetch_assoc($qr_end)) {
      $nLen = intval($row[$sort_field]) + 1;
    }
    $this->mysql_free_query($qr_end);
    if (($m < 0) || ($m >= $nLen)) {
      throw new Exception('`m` value out of range');
    }
    if (($n < 0) || ($n >= $nLen)) {
      throw new Exception('`n` value out of range');
    }

    $qa = array();

    // save the row at the m-th to the end
    $valuesStr = ' `' . $sort_field . '`=' . $nLen;
    $and_clause = ' `' . $sort_field . '`=' . $m;
    $q = 'UPDATE ' . $table . ' SET' . $valuesStr . $where . $op_cause . $and_clause . ';';
    $qa[] = $q;

    // update the indices between m and n
    if ($this->opt) {
      if ($m < $n) {
        $valuesStr = ' `' . $sort_field . '`=`' . $sort_field . '`-1';
        $and_clause = ' `' . $sort_field . '`>' . $m . ' AND `' . $sort_field . '`<=' . $n;
      } else {
        $valuesStr = ' `' . $sort_field . '`=`' . $sort_field . '`+1';
        $and_clause = ' `' . $sort_field . '`>=' . $n . ' AND `' . $sort_field . '`<' . $m;
      }
      $q = 'UPDATE ' . $table . ' SET' . $valuesStr . $where . $op_cause . $and_clause . ';';
      $qa[] = $q;
    } else {
      if ($m < $n) {
        for ($i = m; $i < $n; $i++) {
          $valuesStr = ' `' . $sort_field . '`=' . $i;
          $and_clause .= ' `' . $sort_field . '`=' . ($i+1);
          $q = 'UPDATE ' . $table . ' SET' . $valuesStr . $where . $op_cause . $and_clause . ';';
          $qa[] = $q;
        }
      } else {
        for ($i = $m - 1; $i >= $n; $i--) {
          $valuesStr = ' `' . $sort_field . '`=' . ($i+1);
          $and_clause = ' `' . $sort_field . '`=' . $i;
          $q = 'UPDATE ' . $table . ' SET' . $valuesStr . $where . $op_cause . $and_clause . ';';
          $qa[] = $q;
        }
      }
    }

    // copy the row at the end to the n-th position
    $valuesStr = ' `' . $sort_field . '`=' . $n;
    $and_clause = ' `' . $sort_field . '`=' . $nLen;
    $q = 'UPDATE ' . $table . ' SET' . $valuesStr . $where . $op_cause . $and_clause . ';';
    $qa[] = $q;

    foreach ($qa as $q) {
      $rows = &$this->mysql_query($q);
      $this->mysql_free_query($rows);
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        throw new Exception("post-check: " + e.Error());
      }
    }
    return true;
  }

  function moveRow($querySpec, $whereSpec='', $mSpec=0, $nSpec=0) {
    $row = $this->moveRowNative($querySpec, $whereSpec, $mSpec, $nSpec);
    $s = json_encode($row);
    return $s;
  }

  /**
   * Flexible mysql_query() function.
   *
   * @param $query String The query to execute.
   * @return The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  function &mysql_query(&$query) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println($query);
    }
    if ($this->dryRun && (substr($query, 0, strlen("SELECT ")) !== "SELECT ") && (substr($query, 0, strlen("DESCRIBE ")) !== "DESCRIBE ")) {
      return false;
    }
    $link_identifier = null;
    $result = null;
    $e = '';
    if (isset($this->config['mysqli'])) {
      $link_identifier = &$this->config['mysqli']['link'];
      $result = $link_identifier->query($query);
      $e = mysqli_error($this->config['mysqli']['link']);
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      $link_identifier = &$this->config['mysql']['link'];
      $result = mysql_query($query, $link_identifier);
      $e = mysql_error($this->config['mysql']['link']);
    } else {
      $result = mysql_query($query);
      $e = mysql_error();
    }
    if ($e !== '') {
      if (!$this->dumpSql && !$this->dryRun) {
        $this->log->println($query);
      }
      throw new Exception($e);
    }
    return $result;
  }

  /**
   * Flexible mysql_fetch_assoc() function.
   *
   * @param $result String The result to fetch.
   * @return The mysql_fetch_assoc() return value.
   *
   * @author DanielWHoward
   */
  function &mysql_fetch_assoc(&$result) {
    $assoc = null;
    if ($result === false) {
      $assoc = false;
    } else if (isset($this->config['mysqli'])) {
      $assoc = $result->fetch_assoc();
    } else {
      $assoc = mysql_fetch_assoc($result);
    }
    return $assoc;
  }

  /**
   * Flexible mysql_free_result() function.
   *
   * @param $result String The result to free.
   * @return The mysql_free_result() return value.
   *
   * @author DanielWHoward
   */
  function mysql_free_query(&$result) {
    $e = '';
    if (gettype($result) === 'boolean') {
    } else if (isset($this->config['mysqli'])) {
      $result->free_result();
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      mysql_free_result($result, $this->config['mysql']['link']);
    } else {
      mysql_free_result($result);
    }
    if ($e !== '') {
      throw new Exception($e);
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
  function mysql_free_exec(&$result) {
  }

  /**
   * Flexible mysql_real_escape_string() function.
   *
   * @param $unescaped_string String The string.
   * @return The mysql_real_escape_string() return value.
   *
   * @author DanielWHoward
   */
  function mysql_real_escape_string(&$unescaped_string) {
    if (isset($this->config['mysqli'])) {
      return $this->config['mysqli']['link']->real_escape_string($unescaped_string);
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      return mysql_real_escape_string($unescaped_string, $this->config['mysql']['link']);
    }
    return mysql_real_escape_string($unescaped_string);
  }

  /**
   * Flexible mysql_insert_id() function.
   *
   * @return The mysql_insert_id() return value.
   *
   * @author DanielWHoward
   */
  function mysql_insert_id($result) {
    if (isset($this->config['mysqli'])) {
      return $this->config['mysqli']['link']->insert_id;
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      return mysql_insert_id($this->config['mysql']['link']);
    }
    return mysql_insert_id();
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
  function checkSortColumnConstraint($querySpec, $whereSpec) {
    $e = null;

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($querySpec)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      "table"=>"",
      "where"=>"",
    ), array(
      "table"=>$querySpec,
      "where"=>$whereSpec,
    ), $queryMap);
    $table = $queryMap["table"];
    $where = $queryMap["where"];

    // decode ambiguous table argument
    $tableStr = $table;
    $table = '`' . $tableStr . '`';

    // cache the table description
    $this->readDesc($tableStr);
    $descMap = $this->cache[$tableStr];
    $sort_field = $descMap["sort_column"];
    $orderby = "";
    if ($sort_field !== "") {
      $orderby = ' ORDER BY `' . $sort_field . '` ASC';
    } else {
      throw new Exception('CheckSortColumnConstraint(): ' . $tableStr . ' does not contain `' . $sort_field . '`');
    }

    if ($e === null) {
      // decode remaining ambiguous arguments
      if (is_array($where)) {
        $where = $this->implementWhere($where);
      }
      if (substr($where, 0, 1) === ' ') {
        // add raw SQL
      } else if (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
        $where = " " . $where;
      } else if ($where != "") {
        $where = " WHERE " . $where;
      }

      // read the table
      $q = 'SELECT `' . $sort_field . '` FROM ' . $table . $where . $orderby . ';';
      $rows = $this->mysql_query($q);
      // read result
      $n = 0;
      for ($row = $this->mysql_fetch_assoc($rows); ($row !== null); $row = $this->mysql_fetch_assoc($rows)) {
        if (intval($row[$sort_field]) !== $n) {
          $err = '"' . strval($n) . '" value in `' . $sort_field . '` column in ' . $table . ' table; missing';
          $e = new Exception('CheckSortColumnConstraint(): ' . $err);
        }
        $n++;
      }
      $this->mysql_free_query($rows);
    }

    return $e;
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
  function checkJsonColumnConstraint($querySpec, $whereSpec) {
    $e = null;

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($querySpec)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      "table"=>"",
      "where"=>"",
    ), array(
      "table"=>$querySpec,
      "where"=>$whereSpec,
    ), $queryMap);
    $table = $queryMap['table'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableStr = $table;
    $table = '`' . $tableStr . '`';

    // cache the table description
    $this->readDesc($tableStr);
    $descMap = $this->cache[$tableStr];
    $json_field = $descMap["json_column"];
    if ($json_field === '') {
      $e = new Exception('CheckJsonColumnConstraint(): ' . $tableStr . ' does not contain `' . $json_field . '`');
    }

    if ($e === null) {
      // decode remaining ambiguous arguments
      if (is_array($where)) {
        $where = $this->implementWhere($where);
      }
      if (substr($where, 0, 1) === ' ') {
        // add raw SQL
      } else if (substr($where, 0, strlen('WHERE ')) === 'WHERE ') {
        $where = " " . $where;
      } else if ($where != "") {
        $where = " WHERE " . $where;
      }

      // read the table
      $q = 'SELECT `' . $json_field . '` FROM ' . $table . $where . ';';
      $rows = $this->mysql_query($q);
      // read result
      for ($row = $this->mysql_fetch_assoc($rows); ($row !== null) && ($e === null); $row = $this->mysql_fetch_assoc($rows)) {
        $jsonValue = $row[$json_field];
        $jsonRowMap = json_decode($jsonValue, true);
        if ($jsonRowMap === null) {
          $err = '"' . $this->mysql_real_escape_string($jsonValue) . '" value in `' . $json_field . '` column in ' . $table . ' table; ' . $e;
          $e = new Exception('CheckJsonColumnConstraint(): ' . $err);
        }
      }
      $this->mysql_free_query($rows);
    }

    return $e;
  }

  /**
   * Prepend a table specifier to keys and values in a
   * WHERE array.
   *
   * @param $a An array with WHERE clause specification.
   * @param $table An array of tables.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function applyTablesToWhere($a, $table) {
    $keywords = array('AND', 'OR');
    $aa = array();
    foreach ($a as $key=>$value) {
      if ((strpos($key, '.') === false) && !in_array(strtoupper($key), $keywords)) {
        $aa[$table . '.' . $key] = $value;
      } else {
        $aa[$key] = $value;
      }
    }
    return $aa;
  }

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param $where An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function implementWhere($whereSpec) {
    $ret = $whereSpec;
    if (is_array($whereSpec)) {
      $ret = $this->implementClause($whereSpec);
      if ($ret !== '') {
        $ret = 'WHERE ' . $ret;
      }
    }
    return $ret;
  }

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param $where An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function implementOn($on) {
    $joins = array('INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN');
    if (is_array($on)) {
      $clause = '';
      foreach ($on as $table=>$cond) {
        // INNER JOIN is the default
        $join = $joins[0];
        // remove JOIN indicator from conditions
        $conds = array();
        foreach ($cond as $k=>$v) {
          if (in_array(strtoupper($k), $joins)) {
            $join = $k;
          } else {
            $conds[$k] = $v;
          }
        }
        // build the JOIN clause
        $clause .= ' '.$join.' '.$table.' ON '.$this->implementClause($conds, true);
      }
      $on = $clause;
    }
    return $on;
  }

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param $clause An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function implementClause($clause, $on='') {
    if (is_array($clause) && (count($clause) === 0)) {
      $clause = '';
    } elseif (is_array($clause)) {
      $op = 'AND';
      if (isset($clause['or'])) {
        $op = 'OR';
        unset($clause['or']);
      } elseif (isset($clause['and'])) {
        unset($clause['and']);
      }
      $s = '(';
      foreach ($clause as $key=>$value) {
        if ($s !== '(') {
          $s .= ' '.$op.' ';
        }
        if (is_array($value)) {
          if (count(array_filter(array_keys($value), 'is_string')) === 0) {
            // assume it is some SQL syntax
            $s .= '('.$this->implementSyntax($key, $value).')';
          } else {
            // assume it is a sub-clause
            $s .= $this->implementClause($value);
          }
        } else {
          $quotedKey = '`'.str_replace('.', '`.`', $key).'`';
          if ($on) {
            $s .= ''.$quotedKey.'='.$value.'';
          } else {
            $s .= ''.$quotedKey.'="'.$this->mysql_real_escape_string($value).'"';
          }
        }
      }
      $s .= ')';
      $clause = $s;
    }
    return $clause;
  }

  /**
   * Return a SQL string created from an array specification.
   *
   * It is easier to use an array to create a SQL string (like LIKE)
   * instead of using string concatenation.
   *
   * @param $key A name, possibly unused.
   * @param $clause An array with syntax specification.
   * @return A SQL syntax string.
   *
   * @author DanielWHoward
   */
  function implementSyntax($key, $syntax) {
    $sql = '';
    if ((count($syntax) >= 1) && (strtoupper($syntax[0]) === 'LIKE')) {
      // LIKE: 'unused'=>array('LIKE', 'tags', '% ', $arrayOfTags, ' %')
      $key = $syntax[1];
      $values = array();
      if (count($syntax) === 3) {
        $values[] = $syntax[2];
      } elseif ((count($syntax) === 4) || (count($syntax) === 5)) {
        $pre = $syntax[2];
        $post = (count($syntax) === 5)? $syntax[4]: '';
        if (is_array($syntax[3])) {
          for ($v=0; $v < count($syntax[3]); ++$v) {
            $values[] = $pre.$syntax[3][$v].$post;
          }
        } else {
          $values[] = $pre.$syntax[3].$post;
        }
      }
      $op = 'OR';
      for ($v=0; $v < count($values); ++$v) {
        if ($v > 0) {
          $sql .= ' ' . $op . ' ';
        }
        $sql .= $key . ' LIKE "' . $this->mysql_real_escape_string($values[$v]) . '"';
      }
    } else {
      // OR: 'column'=>array('1', '2', '3')
      $op = 'OR';
      $values = $syntax;
      for ($v=0; $v < count($values); ++$v) {
        if ($v > 0) {
          $sql .= ' ' . $op . ' ';
        }
        $sql .= '`' . $key . '`="' . $this->mysql_real_escape_string($values[$v]) . '"';
      }
    }
    return $sql;
  }

  /**
   * Do nothing for log output.
   *
   * @author DanielWHoward
   */
  function println() {
  }

  /**
   * Throw an exception to create a stack trace.
   *
   * @author DanielWHoward
   */
  function fail() {
    $args = func_get_args();
    $msg = implode(' ', $args);
    throw new Exception($msg);
  }
}

/**
 * Store values to create a query with the IN keyword.
 *
 * @version 0.0.9
 * @author DanielWHoward
 */
class QueryUsingInKeyword {
  /**
   * Create an object to store values to create a query
   * with the IN keyword.
   *
   * @param prefix A string with most of the query.
   * @param value The first value for the IN clause.
   *
   * @author DanielWHoward
   */
  function QueryUsingInKeyword($prefix, $op_clause, $field, $value) {
    $this->prefix = $prefix;
    $this->field = $field;
    $this->Values = array();
    $this->Values[] = $value;
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
  function getQuery() {
    $and_clause = '';
    if (count($this->Values) === 1) {
      $and_clause = ' `' . $this->field . '`=' . $this->Values[0];
    } else {
      foreach ($this->values as $i) {
        if ($and_clause !== '') {
          $and_clause .= ', ';
        }
        $and_clause .= $i;
      }
      $and_clause = ' `' . $this->field . '` IN (' . $and_clause . ')';
    }
    return $this->prefix . $this->op_clause . $and_clause . ';';
  }
}

/**
 * Merge keys of objects with string indices and
 * return a new array.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
function arrayMerge($a, $b) {
  $r = array();
  foreach ($a as $key => $value) {
    $r[$key] = $value;
  }
  foreach ($b as $key => $value) {
    $r[$key] = $value;
  }
  return $r;
}

/**
 * Merge keys of objects with string indices.
 *
 * @return object The merged object.
 *
 * @author DanielWHoward
 **/
function array3Merge($a, $b, $c) {
  $r = array();
  foreach ($a as $key => $value) {
    $r[$key] = $value;
  }
  foreach ($b as $key => $value) {
    if (($value !== null) && ($value !== '')) {
      $r[$key] = $value;
    }
  }
  foreach ($c as $key => $value) {
    if (($value !== null) && ($value !== '')) {
      $r[$key] = $value;
    }
  }
  return $r;
}

/**
 * Return true if numeric arrays with strings or
 * associative arrays with string keys intersect.
 *
 * @return boolean True if array keys or array values.
 *
 * @author DanielWHoward
 **/
function stringKeysOrArrayIntersect($arr1, $arr2) {
  $arr1 = (count(array_filter(array_keys($arr1), 'is_string')) === 0)? $arr1: array_keys($arr1);
  $arr2 = (count(array_filter(array_keys($arr2), 'is_string')) === 0)? $arr2: array_keys($arr2);
  return count(array_intersect($arr1, $arr2)) === 0;
}
?>
