<?php
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
    $this->mapBool = true;
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
   * @return A JSON array of objects.
   *
   * @author DanielWHoward
   */
  function &readRowsNative($querySpec, $whereSpec='', $columnsSpec='*', $onSpec='') {
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
        $this->fail('pre-check: ' . $e->getMessage());
        return null;
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
      'where'=>'',
      'order by'=>''
    ), array(
      'table'=>$querySpec,
      'columns'=>$columnsSpec,
      'on'=>$onSpec,
      'where'=>$whereSpec,
      'order by'=>''
    ), $queryMap);
    $table = $queryMap['table'];
    $columns = $queryMap['columns'];
    $onVar = $queryMap['on'];
    $where = $queryMap['where'];
    $orderby = $queryMap['order by'];

    // decode ambiguous table argument
    $tableStr = '';
    $tableArr = array();
    if (is_array($table)
        && (count(array_filter(array_keys($table), 'is_string')) === 0)) {
      $tableStr = $table[0];
      $tableArr = $table;
    } elseif (is_string($table)) {
      $tableStr = $table;
      $tableArr[] = $table;
    }
    if (is_array($onVar)
        && (count(array_filter(array_keys($onVar), 'is_string')) > 0)
        && (count($tableArr) === 1)) {
      foreach ($onVar as $tbl=>$cond) {
        $tableArr[] = $tbl;
      }
    }

    // cache the table description
    $dryRun = $this->dryRun;
    $dumpSql = $this->dumpSql;
    $this->dryRun = false;
    $this->dumpSql = false;
    foreach ($tableArr as $t) {
      $this->readDescNative($t);
    }
    $this->dryRun = $dryRun;
    $this->dumpSql = $dumpSql;
    $descMap = $this->cache[$tableStr];
    $desc = array();
    foreach ($tableArr as $tbl) {
      $desc = array_merge($desc, $this->cache[$tbl]['desc_a']);
    }
    $sort_field = isset($descMap['sort_column'])? $descMap['sort_column']: '';
    $json_field = isset($descMap['json_column'])? $descMap['json_column']: '';
    $orderByStr = '';
    if ($sort_field !== '') {
      $orderByStr = ' ORDER BY `' . $sort_field . '` ASC';
    }
    if ($orderby !== '') {
      $orderByStr = ' ORDER BY ' . $orderby;
    }

    // decode remaining ambiguous arguments
    $columnsStr = $columns;
    if ((count($tableArr) >= 2) && is_string($columns) && ($columnsStr === '*')) {
      // convert '*' to '`table2`.*, `table3`.*'
      $columnsStr = '';
      for ($t=1; $t < count($tableArr); ++$t) {
        $tbl = $tableArr[$t];
        if ($columnsStr !== '') {
          $columnsStr .= ', ';
        }
        $columnsStr .= '`' . $tbl . '`.*';
      }
    } elseif (is_array($columns)
        && (count(array_filter(array_keys($columns), 'is_string')) === 0)) {
      $columnsStr = '';
      $columnArr = $columns;
      if (count($tableArr) === 1) {
        // only one table so it's simple
        foreach ($columnArr as $col) {
          if ($columnsStr !== '') {
            $columnsStr .= ', ';
          }
          $columnsStr .= '`' . $col . '`';
        }
      } elseif (count($tableArr) >= 2) {
        // pick specific columns from first table
        foreach ($columnArr as $col) {
          if ($columnsStr !== '') {
            $columnsStr .= ', ';
          }
          $columnsStr .= '`' . $tableStr . '`.`' . $col . '`';
        }
        // assume '*' columns from remaining tables
        for ($t=1; $t < count($tableArr); ++$t) {
          $tbl = $tableArr[$t];
          if ($columnsStr !== '') {
            $columnsStr .= ', ';
          }
          $columnsStr .= '`' . $tbl . '`.*';
        }
      }
    }
    $onVarStr = $onVar;
    if (is_array($onVar)) {
      // "on" spec shortcut: assume second table
      $tableNamesInBoth = array();
      $tableArrList = (count(array_filter(array_keys($tableArr), 'is_string')) > 0)? array_keys($tableArr): $tableArr;
      $onVarList = (count(array_filter(array_keys($onVar), 'is_string')) > 0)? array_keys($onVar): $onVar;
      $tableNamesInBoth = array_intersect($tableArrList, $onVarList);
      if (count($tableNamesInBoth) === 0) {
        // explicitly specify the second table
        $newOnVar = array();
        $newOnVar[$tableArr[1]] = $onVar;
        $onVar = $newOnVar;
      }
      $onVarStr = $this->implementOn($onVar);
    }
    if ($onVarStr !== '') {
      $onVarStr = ' ' . $onVarStr;
    }
    $whereStr = $where;
    if (is_array($where)
        && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
      $whereMap = $this->applyTablesToWhere($where, $tableStr);
      $whereStr = $this->implementWhere($whereMap);
    }
    if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
      $whereStr = ' WHERE ' . $whereStr;
    }

    $config = $this->config;

    // read the table
    $q = 'SELECT ' . $columnsStr . ' FROM `' . $tableStr . '`' . $onVarStr . $whereStr . $orderByStr . ';';
    $rows = &$this->mysql_query($q);
    // read result
    $objs = array();
    for ($row = &$this->mysql_fetch_assoc($rows); $row !== null; $row = &$this->mysql_fetch_assoc($rows)) {
      $obj = array();
      // add the SQL data first
      foreach ($row as $key => $value) {
        if ($key === 'class') {
          $key = 'clazz';
        }
        if ($key === $json_field) {
          // add non-SQL JSON data later
        } elseif ($key === $config['sort_column']) {
          // sort column isn't user data
        } elseif ($value === null) {
          $obj[$key] = null;
        } elseif ($this->mapBool && is_numeric($value) && (strval(intval($value)) == $value) && is_bool($desc[$key])) {
          $obj[$key] = (intval($value) === 1);
        } elseif (is_numeric($value) && (strval(intval($value)) == $value) && is_int($desc[$key])) {
          $obj[$key] = intval($value);
        } elseif (is_numeric($value) && is_float($desc[$key])) {
          $obj[$key] = floatval($value);
        } else {
          $val = $value;
          try {
            if (in_array($value[0], array('{', '['))) {
              $val = json_decode($value, true);
            }
            $obj[$key] = $val;
          } catch (Exception $e) {
            $obj[$key] = $val;
          }
        }
      }
      // add non-SQL JSON data
      if (($json_field !== '') && ($row[$json_field] !== null)) {
        try {
          $jsonMap = json_decode($row[$json_field], true);
          if ($jsonMap !== null) {
            foreach ($jsonMap as $key => $value) {
              $obj[$key] = $value;
            }
          }
        } catch (Exception $e) {
          $obj[$key] = array();
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
        $this->fail('post-check: ' . $e->getMessage());
        return null;
      }
    }

    return $objs;
  }

  function readRows($querySpec, $whereSpec='', $columnsSpec='*', $onSpec='') {
    $objs = $this->readRowsNative($querySpec, $whereSpec, $columnsSpec, $onSpec);
    $rowsStr = json_encode($objs);
    return $rowsStr;
  }

  /**
   * Get a JSON table description from the database.
   *
   * It does not return "sort" and "json" columns, if any.
   *
   * @param $querySpec String A database table.
   * @return A string containing a JSON object with columns and default values.
   *
   * @author DanielWHoward
   */
  function readDescNative($querySpec) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println('readDescNative()');
    }

    // check constraints
    $e = '';
//    if ($this->checkConstraints) {
//      $e = $this->checkJsonColumnConstraint($querySpec);
//      if ($e !== null) {
//        $this->fail('pre-check: ' . $e->getMessage());
//        return null;
//      }
//    }

    $tableStr = $querySpec;
    if (is_array($querySpec)
        && (count(array_filter(array_keys($querySpec), 'is_string')) > 0)) {
      $queryMap = array_merge(array(), $querySpec);
      $tableStr = $queryMap['table'];
    }
    $config = $this->config;

    $desc = array();
    if (isset($this->cache[$tableStr]) && isset($this->cache[$tableStr]['desc_a'])) {
      $desc = $this->cache[$tableStr]['desc_a'];
    } else {
      // read the table description
      $sort_column = '';
      $json_column = '';
      $auto_increment_column = '';
      $q = 'DESCRIBE `' . $tableStr . '`;';
      $rows = &$this->mysql_query($q);
      while ($rowdesc = &$this->mysql_fetch_assoc($rows)) {
        $field = $rowdesc['Field'];
        $typ = $rowdesc['Type'];
        $extra = $rowdesc['Extra'];
        if ($field === $config['sort_column']) {
          $sort_column = $field;
        } elseif ($field === $config['json_column']) {
          $json_column = $field;
        } elseif ($this->mapBool && (strpos($typ, 'tinyint(1)') !== false)) {
          $desc[$field] = false;
        } elseif (strpos($typ, 'int') !== false) {
          $desc[$field] = 0;
        } elseif (strpos($typ, 'float') !== false) {
          $desc[$field] = floatval(0);
        } elseif (strpos($typ, 'double') !== false) {
          $desc[$field] = doubleval(0);
        } else {
          $desc[$field] = '';
        }
        if ($extra === 'auto_increment') {
          $auto_increment_column = $field;
        }
      }
      $this->mysql_free_query($rows);

      // cache the description
      if (!isset($this->cache[$tableStr])) {
        $this->cache[$tableStr] = array();
      }
      $this->cache[$tableStr]['desc_a'] = $desc;
      $descStr = json_encode($desc);
      $this->cache[$tableStr]['desc'] = $descStr;
      if ($sort_column !== '') {
        $this->cache[$tableStr]['sort_column'] = $sort_column;
      }
      if ($json_column !== '') {
        $this->cache[$tableStr]['json_column'] = $json_column;
      }
      if ($auto_increment_column !== '') {
        $this->cache[$tableStr]['auto_increment_column'] = $auto_increment_column;
      }
    }

    // check constraints
//    if ($this->checkConstraints) {
//      $e = $this->checkJsonColumnConstraint($querySpec);
//      if ($e !== null) {
//        $this->fail('post-check: ' . $e->getMessage());
//        return null;
//      }
//    }

    return $desc;
  }

  function readDesc($querySpec) {
    $desc = $this->readDescNative($querySpec);
    $descStr = json_encode($desc);
    return $descStr;
  }

  /**
   * Insert a row of JSON into a database table.
   *
   * If there is no sort column, it inserts the row, anyway.
   *
   * @param $querySpec String A database table.
   * @param $whereSpec String A WHERE clause.
   * @param $valuesSpec mixed A JSON string (string) or JSON array (array).
   * @param $nSpec int The place to insert the row before; -1 means the end.
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
        $this->fail('pre-check: ' . $e->getMessage());
        return null;
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
    $orderByStr = '';
    if ($sort_field !== '') {
      $orderByStr = ' ORDER BY `' . $sort_field . '` DESC';
    }

    // decode remaining ambiguous arguments
    $valuesStr = $values;
    $valuesMap = $values;
    $sqlValuesMap = array(); // SET clause
    $jsonMap = array(); // 'json' field
    if (is_string($values)) {
      $valuesStr = ' ' . $values;
      $valuesMap = array();
    } else {
      $valuesStr = '';
      $valuesMap = array_merge(array(), $values);
      $jsonMap = array_merge(array(), $values);
      // copy SQL columns to sqlValuesMap
      foreach ($desc as $col => $colValue) {
        if (array_key_exists($col, $jsonMap)) {
          $compat = false;
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
      // copy freeform values into 'json' field
      if ($json_field !== '') {
        $sqlValuesMap[$json_field] = $jsonMap;
      }
    }
    $nInt = $n;
    $whereStr = $where;
    if (is_array($where)
        && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
      $whereStr = $this->implementWhere($where);
    }
    if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
      $whereStr = ' WHERE ' . $whereStr;
    }
    $limitStr = '';
    if ($this->opt || ($nInt === -1)) {
      $limitStr = ' LIMIT 1';
    }

    $qa = array();

    // update the positions
    if ($sort_field !== '') {
      $nLen = 0;
      $q = 'SELECT `' . $sort_field . '` FROM `' . $tableStr . '`' . $whereStr . $orderByStr . $limitStr . ';';
      $qr_reorder = &$this->mysql_query($q);
      while ($row = &$this->mysql_fetch_assoc($qr_reorder)) {
        $nValue = intval($row[$sort_field]);
        if ($nValue >= $nLen) {
          $nLen = $nValue + 1;
        }
        if ($nInt === -1) {
          $nInt = $nValue + 1;
        }
        if ($nInt > $nValue) {
          break;
        }
        $setStr = '';
        $andStr = ' WHERE ';
        if ($whereStr !== '') {
          $andStr = ' AND ';
        }
        if ($this->opt) {
          $setStr .= ' SET `' . $sort_field . '`=`' . $sort_field . '`+1';
          $andStr .= '`' . $sort_field . '`>=' . $nInt;
          $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
          $qa[] = $q;
          break;
        } else {
          $setStr .= ' SET `' . $sort_field . '`=' . ($nValue+1);
          $andStr .= ' `' . $sort_field . '`=' . $nValue;
          $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
          $qa[] = $q;
        }
      }
      $this->mysql_free_query($qr_reorder);
      if ($nInt === -1) {
        $nInt = 0;
      }
      if ($nInt > $nLen) {
        $this->fail('`n` value out of range', $q);
        return null;
      }

      // add sort field to sqlValuesMap
      if (count($sqlValuesMap) > 0) {
        $sqlValuesMap[$sort_field] = $nInt;
      }
    }

    // finally, generate valuesStr from valuesMap
    if (count($sqlValuesMap) > 0) {
      $colsStr = '';
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
          $valueStr = "'" . $this->mysql_real_escape_string($jsonStr) . "'";
        } elseif ($this->mapBool && is_bool($value)) {
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
          $valueStr = "'" . $this->mysql_real_escape_string($value) . "'";
        }
        $valuesStr .= '`' . $this->mysql_real_escape_string($col) . '`=' . $valueStr;
      }
      $valuesStr = ' SET ' . $valuesStr;
    }

    $q = 'INSERT INTO `' . $tableStr . '`' . $valuesStr . ';';
    $qa[] = $q;

    $qr = null;

    foreach ($qa as $q) {
      try {
        if ($qr !== null) {
          $this->mysql_free_query($qr);
        }
        $qr = &$this->mysql_query($q);
      } catch (Exception $e) {
        $this->fail($e, $q);
        return null;
      }
    }

    if (($auto_increment_field !== '') && (qr !== null)) {
      $valuesMap[$auto_increment_field] = $this->mysql_insert_id($qr);
    }

    $this->mysql_free_exec($qr);

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        $this->fail('post-check: ' . $e->getMessage());
        return null;
      }
    }

    return $valuesMap;
  }

  function insertRow($querySpec, $whereSpec='', $valuesSpec='{}', $nSpec=-1) {
    $valuesMap = $this->insertRowNative($querySpec, $whereSpec, $valuesSpec, $nSpec);
    $valuesStr = json_encode($valuesMap);
    return $valuesStr;
  }

  /**
   * Delete a row of JSON from a database table.
   *
   * If there is no sort column, it deletes the first row.
   *
   * @param $querySpec String A database table.
   * @param $whereSpec String A WHERE clause.
   * @param $nSpec mixed The row to delete (int) or JSON data to select the row (string).
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
        $this->fail('pre-check: ' . $e->getMessage());
        return null;
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

    // decode remaining ambiguous arguments
    $nInt = $n;
    $nStr = $n;
    $whereStr = $where;
    if (is_array($where)
        && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
      $whereStr = $this->implementWhere($where);
    }
    if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
      $whereStr = ' WHERE ' . $whereStr;
    }
    $andStr = '';
    if (($sort_field !== '') && is_int($n) && ($n !== -1)) {
      $opStr = ' WHERE ';
      if ($whereStr !== '') {
        $opStr = ' AND ';
      }
      $andStr .= $opStr . '`' . $sort_field . '`=' . $nInt;
    } else {
      if ($nInt === -1) {
        $andStr = '';
      }
      if (is_string($n) && ($nStr !== '')) {
        $nMap = json_decode($nStr, true);
        if ($nMap !== null) {
          foreach ($nMap as $col=>$value) {
            if (($andStr === '') && ($whereStr === '')) {
              $andStr .= ' WHERE ';
            } else {
              $andStr .= ' AND ';
            }
            $andStr .= $col . "='" . $value . "'";
          }
        } else {
          $andStr .= $nStr;
        }
      }
      $field = $sort_field;
      if ($sort_field === '') {
        $field = '*';
      }
      $orderByStr = '';
      if ($sort_field !== '') {
        $orderByStr = ' ORDER BY `' . $sort_field . '` DESC';
      }
      $q = 'SELECT COUNT(*) AS num_rows FROM `' . $tableStr . '`' . $whereStr . $andStr . $orderByStr . ';';
      $qr = $this->mysql_query($q);
      $num_rows = 0;
      while ($row = &$this->mysql_fetch_assoc($qr)) {
        $num_rows = intval($row['num_rows']);
      }
      if ($nInt === -1) {
        $nInt = $num_rows - 1;
      }
//      $this->mysql_free_query($qr);
      $quotedField = $field;
      if ($field !== '*') {
        $quotedField = '`' . $field . '`';
      }
      $q = 'SELECT ' . $quotedField. ' FROM `' . $tableStr . '`' . $whereStr . $andStr . $orderByStr . ';';
      // verify that non-standard n var yields valid rows
      if (($num_rows === 1) || (($num_rows > 1) && ($sort_field !== ''))) {
        $qr = $this->mysql_query($q);
        $row = $this->mysql_fetch_assoc($qr);
        if ($num_rows === 1) {
          if ($sort_field !== '') {
            $n = intval($row[$sort_field]);
          }
//          $this->mysql_free_query($qr);
        } elseif (($num_rows > 1) && ($sort_field !== '')) {
          $n = $row[$sort_field];
          if (($andStr === '') && ($whereStr === '')) {
            $andStr .= ' WHERE ';
          } else {
            $andStr .= ' AND ';
          }
          $andStr .= '`' . $sort_field . '`=' . $nInt;
        }
        $this->mysql_free_query($qr);
      } else {
        $e = 'xibdb.DeleteRow():num_rows:' . $num_rows;
        $this->fail($e, $q);
        return null;
      }
    }

    $qa = array();

    // update the positions
    if ($sort_field !== '') {
      $nLen = 0;
      $orderByStr = ' ORDER BY `' . $sort_field . '` ASC';
      $limitStr = '';
      if ($this->opt) {
        $orderByStr = ' ORDER BY `' . $sort_field . '` DESC';
        $limitStr = ' LIMIT 1';
      }
      $q = 'SELECT `' . $sort_field . '` FROM `' . $tableStr . '`' . $whereStr . $orderByStr . $limitStr . ';';
      $qr_reorder = &$this->mysql_query($q);
      while ($row = &$this->mysql_fetch_assoc($qr_reorder)) {
        $nValue = intval($row[$sort_field]);
        if ($nValue >= $nLen) {
          $nLen = $nValue + 1;
        }
        $setStr = '';
        $andSetStr = ' WHERE ';
        if ($whereStr !== '') {
          $andSetStr = ' AND ';
        }
        if ($this->opt) {
          $setStr .= ' SET `' . $sort_field . '`=`' . $sort_field . '`-1';
          $andSetStr .= '`' . $sort_field . '`>=' . $nInt;
          $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andSetStr . ';';
          $qa[] = $q;
          break;
        } else {
          $setStr .= ' SET `' . $sort_field . '`=' . ($nValue-1);
          $andSetStr .= '`' . $sort_field . '`=' . $nValue;
          $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andSetStr . ';';
          $qa[] = $q;
        }
      }
      $this->mysql_free_query($qr_reorder);
      if ($nInt >= $nLen) {
        $e = '`n` value out of range';
        $this->fail($e, $q);
        return null;
      }
    }

    $q = 'DELETE FROM `' . $tableStr . '`' . $whereStr . $andStr . ';';
    array_splice($qa, 0, 0, array($q));

    $qr = null;

    foreach ($qa as $q) {
      try {
        $qr = &$this->mysql_query($q);
        $this->mysql_free_query($qr);
      } catch (Exception $e) {
        $this->fail($e, $q);
        return null;
      }
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        $this->fail('post-check: ' . $e->getMessage());
        return null;
      }
    }

    return $e;
  }

  function deleteRow($querySpec, $whereSpec='', $nSpec='') {
    return $this->deleteRowNative($querySpec, $whereSpec, $nSpec);
  }

  /**
   * Update a row of JSON in a database table.
   *
   * If there is no sort column, it updates the first row.
   *
   * @param $querySpec String A database table.
   * @param $valuesSpec mixed A JSON string (string) or JSON array (array).
   * @param $nSpec mixed The row to update (int) or JSON data to select the row (string).
   * @param $whereSpec String A WHERE clause.
   * @param $limitSpec int A LIMIT value for number of rows to retrieve.
   *
   * @author DanielWHoward
   */
  function updateRowNative($querySpec, $valuesSpec='', $nSpec=-1, $whereSpec='', $limitSpec=1) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println('updateRowNative()');
    }

    // check constraints
    $e = null;
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        $this->fail('pre-check: ' . $e->getMessage());
        return null;
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
    $orderByStr = '';
    if ($sort_field !== '') {
      $orderByStr = ' ORDER BY `' . $sort_field . '` ASC';
    }

    // decode remaining ambiguous arguments
    $valuesStr = $values;
    $valuesMap = $values;
    $sqlValuesMap = array(); // SET clause
    $jsonMap = array(); // 'json' field
    if (is_string($values)) {
      $valuesStr = ' SET ' . $values;
      $valuesMap = array();
    } else {
      $valuesStr = '';
      $valuesMap = array_merge(array(), $valuesMap);
      $jsonMap = array_merge(array(), $valuesMap);
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
    $limitInt = $limit;
    $whereStr = $where;
    if (is_array($where)
        && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
      $whereStr = $this->implementWhere($where);
    }
    if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
      $whereStr = ' WHERE ' . $whereStr;
    }
    $op_clause = ' WHERE';
    if ($whereStr !== '') {
      $op_clause = ' AND';
    }
    $andStr = '';
    if (($sort_field !== '') && ($nInt >= 0)) {
      $andStr = ' WHERE';
      if ($whereStr !== '') {
        $andStr = ' AND';
      }
      $andStr .= ' `' . $sort_field . '`=' . $nInt;
    }

    // get the number of rows_affected
    $q = 'SELECT COUNT(*) AS rows_affected FROM `' . $tableStr . '`' . $whereStr . $andStr . ';';
    $qr = $this->mysql_query($q);
    $rows_affected = 0;
    while ($row = &$this->mysql_fetch_assoc($qr)) {
      $rows_affected = intval($row['rows_affected']);
    }
    $this->mysql_free_query($qr);

    if ($rows_affected === 0) {
      if ($andStr === '') {
        $e = '0 rows affected';
        $this->fail($e, $q);
        return null;
      }
      $q = 'SELECT COUNT(*) AS rows_affected FROM `' . $tableStr . '`' . $whereStr . ';';
      $qr = $this->mysql_query($q);
      while ($row = &$this->mysql_fetch_assoc($qr)) {
        $rows_affected = intval($row['rows_affected']);
      }
      $this->mysql_free_query($qr);
      if ($rows_affected > 0) {
        $e = '`n` value out of range';
      } else {
        $e = '0 rows affected';
      }
      $this->fail($e, $q);
      return null;
    } elseif (($limitInt !== -1) && ($rows_affected > $limitInt)) {
      $e = '' . $rows_affected . ' rows affected but limited to ' . $limitInt . ' rows';
      $this->fail($e, $q);
      return null;
    }

    $qa = array();

    // generate UPDATE statements using json_field
    if (is_string($values)) {
      $q = 'UPDATE `' . $tableStr . '`' . $valuesStr . $whereStr . $andStr . ';';
      $qa[] = $q;
    } else {
      // get the contents of the json_field for each affected row
      $updateJson = ($json_field !== '') && (count($jsonMap) > 0);
      $jsonRowMaps = array();
      if (!$updateJson) {
        $jsonRowMaps[] = array();
      } else {
        $jsonValue = '';
        $q = 'SELECT `' . $json_field . '` FROM `' . $tableStr . '`' . $whereStr . $andStr . $orderByStr . ';';
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
          $err = '"' . $this->mysql_real_escape_string($jsonValue) . '" value in `' . $json_field . '` column in `' . $tableStr . '` table; ' . $e;
          $this->fail($err, $q);
          return null;
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
            $valueStr = "'" . $this->mysql_real_escape_string($jsonStr) . "'";
          } elseif ($this->mapBool && is_bool($value)) {
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
            $valueStr = "'" . $this->mysql_real_escape_string($value) . "'";
          }
          $valuesStr .= '`' . $this->mysql_real_escape_string($col) . '`=' . $valueStr;
        }
        $values = ' SET ' . $valuesStr;
        // add a custom update for each row
        if ($this->opt && $updateJson) {
          $q = 'UPDATE `' . $tableStr . '`' . $values . $whereStr;
          if ($nInt === -1) {
            $q .= ';';
            $qa[] = $q;
          } else {
            if (isset($qInsMap[$q])) {
              $qi = $qInsMap[$q];
              $qIns[$qi]->Values[] = $nInt;
            } else {
              $qIns[] = new QueryUsingInKeyword($q, $op_clause, $sort_field, $nInt);
              $qInsMap[$q] = count($qIns) - 1;
            }
          }
        } else {
          $op_and_clause = '';
          if ($nInt >= 0) {
            $op_and_clause = $op_clause . ' `' . $sort_field . '`=' . $nInt;
          }
          $q = 'UPDATE `' . $tableStr . '`' . $values . $whereStr . $op_and_clause . ';';
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

    $qr = null;

    foreach ($qa as $q) {
      try {
        $qr = &$this->mysql_query($q);
        $this->mysql_free_query($qr);
      } catch (Exception $e) {
        $this->fail($e, $q);
        return null;
      }
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        $this->fail('post-check: ' . $e->getMessage());
        return null;
      }
    }

    return $valuesMap;
  }

  function updateRow($querySpec, $whereSpec='', $nSpec=-1, $valuesSpec='', $limitSpec=1) {
    $valuesMap = $this->updateRowNative($querySpec, $whereSpec, $nSpec, $valuesSpec, $limitSpec);
    $valuesStr = json_encode($valuesMap);
    return $valuesStr;
  }

  /**
   * Reorder a row of JSON in a database table.
   *
   * If there is no sort column, it does nothing.
   *
   * @param $querySpec String A database table.
   * @param $whereSpec String A WHERE clause.
   * @param $mSpec int The row to move.
   * @param $nSpec int The row to move to.
   *
   * @author DanielWHoward
   */
  function moveRowNative($querySpec, $whereSpec='', $mSpec=0, $nSpec=0) {
    if ($this->dumpSql || $this->dryRun) {
      $this->log->println('moveRowNative()');
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        $this->fail('pre-check: ' . $e->getMessage());
        return null;
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
    $orderByStr = '';
    if ($sort_field !== '') {
      $orderByStr = ' ORDER BY `' . $sort_field . '` DESC';
    } else {
      $this->fail($tableStr . ' does not have a sort_field');
      return null;
    }
    $limitStr = ' LIMIT 1';

    if ($m === $n) {
      $this->fail('`m` and `n` are the same so nothing to do');
      return null;
    }

    // decode remaining ambiguous arguments
    $whereStr = $where;
    if (is_array($where)
        && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
      $whereMap = $this->applyTablesToWhere($where, $tableStr);
      $whereStr = $this->implementWhere($whereMap);
    }
    if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
      $whereStr = ' WHERE ' . $whereStr;
    }
    $opStr = '';
    if (($sort_field !== '') && ($n >= 0)) {
      $opStr = ' WHERE';
      if ($whereStr !== '') {
        $opStr = ' AND';
      }
    }

    // get the length of the array
    $q = 'SELECT `' . $sort_field . '` FROM `' . $tableStr . '`' . $whereStr . $orderByStr . $limitStr . ';';
    $qr_end = $this->mysql_query($q);
    $nLen = 0;
    if ($row = &$this->mysql_fetch_assoc($qr_end)) {
      $nLen = intval($row[$sort_field]) + 1;
    }
    $this->mysql_free_query($qr_end);
    if (($m < 0) || ($m >= $nLen)) {
      $this->fail('`m` value out of range', $q);
      return null;
    }
    if (($n < 0) || ($n >= $nLen)) {
      $this->fail('`n` value out of range', $q);
      return null;
    }

    $qa = array();

    // save the row at the m-th to the end
    $setStr = ' SET `' . $sort_field . '`=' . $nLen;
    $andStr = $opStr . ' `' . $sort_field . '`=' . $m;
    $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
    $qa[] = $q;

    // update the indices between m and n
    if ($this->opt) {
      if ($m < $n) {
        $setStr = ' SET `' . $sort_field . '`=`' . $sort_field . '`-1';
        $andStr = $opStr . ' `' . $sort_field . '`>' . $m . ' AND `' . $sort_field . '`<=' . $n;
      } else {
        $setStr = ' SET `' . $sort_field . '`=`' . $sort_field . '`+1';
        $andStr = $opStr . ' `' . $sort_field . '`>=' . $n . ' AND `' . $sort_field . '`<' . $m;
      }
      $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
      $qa[] = $q;
    } else {
      if ($m < $n) {
        for ($i = m; $i < $n; $i++) {
          $setStr = ' SET `' . $sort_field . '`=' . $i;
          $andStr = $opStr . ' `' . $sort_field . '`=' . ($i+1);
          $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
          $qa[] = $q;
        }
      } else {
        for ($i = $m - 1; $i >= $n; $i--) {
          $setStr = ' SET `' . $sort_field . '`=' . ($i+1);
          $andStr = $opStr . ' `' . $sort_field . '`=' . $i;
          $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
          $qa[] = $q;
        }
      }
    }

    // copy the row at the end to the n-th position
    $setStr = ' SET `' . $sort_field . '`=' . $n;
    $andStr = $opStr . ' `' . $sort_field . '`=' . $nLen;
    $q = 'UPDATE `' . $tableStr . '`' . $setStr . $whereStr . $andStr . ';';
    $qa[] = $q;

    $qr = null;

    foreach ($qa as $q) {
      try {
        $qr = &$this->mysql_query($q);
        $this->mysql_free_query($qr);
      } catch (Exception $e) {
        $this->fail($e, $q);
        return null;
      }
    }

    // check constraints
    if ($this->checkConstraints) {
      $e = $this->checkSortColumnConstraint($querySpec, $whereSpec);
      if ($e === null) {
        $e = $this->checkJsonColumnConstraint($querySpec, $whereSpec);
      }
      if ($e !== null) {
        $this->fail('post-check: ' . $e->getMessage());
        return null;
      }
    }

    return true;
  }

  function moveRow($querySpec, $whereSpec='', $mSpec=0, $nSpec=0) {
    return $this->moveRowNative($querySpec, $whereSpec, $mSpec, $nSpec);
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
    if ($this->dryRun && (substr($query, 0, strlen('SELECT ')) !== 'SELECT ') && (substr($query, 0, strlen('DESCRIBE ')) !== 'DESCRIBE ')) {
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
    // fail on error
    if ($e !== '') {
      $this->fail($e, $query);
    }
    return $result;
  }

  /**
   * Renamed mysql_query() for INSERT queries so
   * mysql_insert_id() will work.
   *
   * @param $query String The query to execute.
   * @return The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  function mysql_exec(&$query) {
    return $this->mysql_query($query);
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
    } elseif (isset($this->config['mysqli'])) {
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
    } elseif (isset($this->config['mysqli'])) {
      $result->free_result();
    } elseif (isset($this->config['mysql']) && isset($this->config['mysql']['link'])) {
      mysql_free_result($result, $this->config['mysql']['link']);
    } else {
      mysql_free_result($result);
    }
    if ($e !== '') {
      $this->fail($e);
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
   * @param $a An array with WHERE clause specification.
   * @param $table An array of tables.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function checkSortColumnConstraint($querySpec, $whereSpec) {
    $e = null;

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'where'=>''
    ), array(
      'table'=>$querySpec,
      'where'=>$whereSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableStr = $table;
    $whereStr = $where;

    // cache the table description
    $this->readDescNative($tableStr);
    $descMap = $this->cache[$tableStr];
    $sort_field = $descMap['sort_column'];
    $orderByStr = '';
    if ($sort_field !== '') {
      $orderByStr = ' ORDER BY `' . $sort_field . '` ASC';
    } else {
      $e = new Exception('checkSortColumnConstraint(): ' . $tableStr . ' does not contain `' . $sort_field . '`');
    }

    if ($e === null) {
      // decode remaining ambiguous arguments
      if (is_array($where)
          && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
        $whereStr = $this->implementWhere($where);
      }
      if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
        $whereStr = ' WHERE ' . $whereStr;
      }

      // read the table
      $q = 'SELECT `' . $sort_field . '` FROM `' . $tableStr . '`' . $whereStr . $orderByStr . ';';
      $rows = $this->mysql_query($q);
      // read result
      $n = 0;
      for ($row = $this->mysql_fetch_assoc($rows); ($row !== null); $row = $this->mysql_fetch_assoc($rows)) {
        if (intval($row[$sort_field]) !== $n) {
          $err = '"' . strval($n) . '" value in `' . $sort_field . '` column in ' . $tableStr . ' table; missing';
          $e = new Exception('checkSortColumnConstraint(): ' . $err);
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
   * @param $a An array with WHERE clause specification.
   * @param $table An array of tables.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function checkJsonColumnConstraint($querySpec, $whereSpec) {
    $e = null;

    // decode the arguments into variables
    $queryMap = $querySpec;
    if (!is_array($queryMap)
        || (count(array_filter(array_keys($queryMap), 'is_string')) === 0)) {
      $queryMap = array();
    }
    $queryMap = array3Merge(array(
      'table'=>'',
      'where'=>''
    ), array(
      'table'=>$querySpec,
      'where'=>$whereSpec
    ), $queryMap);
    $table = $queryMap['table'];
    $where = $queryMap['where'];

    // decode ambiguous table argument
    $tableStr = $table;
    $whereStr = $where;

    // cache the table description
    $this->readDescNative($tableStr);
    $descMap = $this->cache[$tableStr];
    $json_field = $descMap['json_column'];
    if ($json_field === '') {
      $e = new Exception('checkJsonColumnConstraint(): ' . $tableStr . ' does not contain `' . $json_field . '`');
    }

    if ($e === null) {
      // decode remaining ambiguous arguments
      if (is_array($where)
          && (count(array_filter(array_keys($where), 'is_string')) > 0)) {
        $whereStr = $this->implementWhere($where);
      }
      if (($whereStr !== '') && (substr($whereStr, 0, 1) !== ' ')) {
        $whereStr = ' WHERE ' . $whereStr;
      }

      // read the table
      $q = 'SELECT `' . $json_field . '` FROM `' . $tableStr . '`' . $whereStr . ';';
      $rows = $this->mysql_query($q);
      // read result
      for ($row = $this->mysql_fetch_assoc($rows); ($row !== null) && ($e === null); $row = $this->mysql_fetch_assoc($rows)) {
        $jsonValue = $row[$json_field];
        $jsonRowMap = json_decode($jsonValue, true);
        if ($jsonRowMap === null) {
          $err = '"' . $this->mysql_real_escape_string($jsonValue) . '" value in `' . $json_field . '` column in ' . $tableStr . ' table; ' . $e;
          $e = new Exception('checkJsonColumnConstraint(): ' . $err);
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
   * @param $whereSpec An array with clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function implementWhere($whereSpec) {
    $whereStr = '';
    if (is_array($whereSpec)
        && (count(array_filter(array_keys($whereSpec), 'is_string')) > 0)) {
      $whereStr = $this->implementCondition($whereSpec);
      if ($whereStr !== '') {
        $whereStr = ' WHERE ' . $whereStr;
      }
    } else {
      $whereStr = $whereSpec;
    }
    return $whereStr;
  }

  /**
   * Return a clause string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param $onVar An array with an ON clause specification.
   * @return A clause string.
   *
   * @author DanielWHoward
   */
  function implementOn($onVar) {
    $joins = array('INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'OUTER JOIN');
    $onVarStr = '';
    if (is_array($onVar)
        && (count(array_filter(array_keys($onVar), 'is_string')) > 0)) {
      foreach ($onVar as $table=>$cond) {
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
        $onVarStr .= $join . ' `' . $table . '` ON ' . $this->implementCondition($conds, 'ON ');
      }
    } else {
      $onVarStr = $onVar;
    }
    return $onVarStr;
  }

  /**
   * Return a SQL condition string created from an array specification.
   *
   * It is easier to use an array to create a MySQL WHERE clause instead
   * of using string concatenation.
   *
   * @param $condObj An array with conditional specification.
   * @param $onVar A string with an ON clause specification.
   * @return A SQL string containing a nested conditional.
   *
   * @author DanielWHoward
   */
  function implementCondition($condObj, $onVar='') {
    $cond = '';
    if (is_string($condObj)) {
      $cond = $condObj;
    } elseif (is_array($condObj)
        && (count(array_filter(array_keys($condObj), 'is_string')) > 0)) {
      $condMap = $condObj;
      $conds = array();
      $op = ' AND ';
      foreach ($condMap as $key=>$value) {
        $sub = '';
        if (strtoupper($key) === 'OR') {
          $op = ' OR ';
        } elseif (strtoupper($key) !== 'AND') {
          if (is_array($value)) {
            if (count(array_filter(array_keys($value), 'is_string')) === 0) {
              // assume it is some SQL syntax
              $sub = $this->implementSyntax($key, $value);
            } else {
              // assume it is a sub-clause
              $sub = $this->implementCondition($value);
            }
            if ($sub !== '') {
              $sub = '(' . $sub . ')';
            }
          } else {
            $sub = $this->mysql_real_escape_string($value);
            if ($onVar === '') {
              $sub = "'" . $sub . "'";
            } else {
              $sub = '`' . str_replace('.', '`.`', $sub) . '`';
            }
            $sub = '`' . str_replace('.', '`.`', $key) . '`=' . $sub;
          }
        }
        if ($sub !== '') {
          $conds[] = $sub;
        }
      }
      if (count($conds) > 0) {
        $cond = implode($op, $conds);
      }
    }
    return $cond;
  }

  /**
   * Return a SQL string created from an array specification.
   *
   * It is easier to use an array to create a SQL string (like LIKE)
   * instead of using string concatenation.
   *
   * @param $key A name, possibly unused.
   * @param $syntax An array with syntax specification.
   * @return A SQL syntax string.
   *
   * @author DanielWHoward
   */
  function implementSyntax($key, $syntax) {
    $sql = '';
    $cmdStr = $syntax[0];
    if ((count($syntax) >= 1) && (strtoupper($cmdStr) === 'LIKE')) {
      // LIKE: 'unused'=>array('LIKE', 'tags', '% ', $arrayOfTags, ' %')
      $op = ' OR ';
      $clauses = array();
      $col = $syntax[1];
      $likeStr = '`' . $col . '` LIKE';
      if (count($syntax) === 3) {
        $valueStr = $syntax[2];
        $valueStr = $likeStr . " '" . $this->mysql_real_escape_string($valueStr) . "'";
        $clauses[] = $valueStr;
      } elseif ((count($syntax) === 4) || (count($syntax) === 5)) {
        $pre = $syntax[2];
        $post = '';
        if (count($syntax) === 5) {
          $post = $syntax[4];
        }
        if (is_array($syntax[3])
            && (count(array_filter(array_keys($syntax[3]), 'is_string')) === 0)) {
          foreach ($syntax[3] as $value) {
            $valueStr = $pre . $value . $post;
            $valueStr = $likeStr . " '" . $this->mysql_real_escape_string($valueStr) . "'";
            $clauses[] = $valueStr;
          }
        } else {
          $valueStr = $pre . $syntax[3] . $post;
          $valueStr = $likeStr . " '" . $this->mysql_real_escape_string($valueStr) . "'";
          $clauses[] = $valueStr;
        }
      }
      $sql = implode($op, $clauses);
    } else {
      // OR: 'aColumn'=>array('1', '2', '3')
      $op = ' OR ';
      $clauses = array();
      foreach ($syntax as $value) {
        $valueStr = $value;
        $valueStr = '`' . $key . "`='" . $this->mysql_real_escape_string($valueStr) . "'";
        $clauses[] = $valueStr;
      }
      $sql = implode($op, $clauses);
    }
    return $sql;
  }

  /**
   * Do nothing for log output.
   *
   * @author DanielWHoward
   */
  function println($s) {
    print($s);
  }

  /**
   * Throw an exception to create a stack trace.
   *
   * @author DanielWHoward
   */
  function fail($e, $q='') {
    if ($q !== '') {
      $this->log->println('E:' . $q);
    }
    throw new Exception($e);
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
    $this->op_clause = $op_clause;
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
 * return a new array.  Standard now but provided
 * so merge can be customized.
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
?>
