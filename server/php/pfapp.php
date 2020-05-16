<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once(__DIR__.'/./array.php');

if (!function_exists('fail')) {
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
 * Convenience class to make xibdb more convenient.
 * @author DanielWHoward
 */
class pfapp {

  /**
   * Create an object.
   *
   * @param $xibdb object A XibDb object.
   * @param $sql_prefix string A prefix for database tables.
   *
   * @author DanielWHoward
   */
  function pfapp($xibdb, $sql_prefix) {
    $this->xibdb = $xibdb;
    $this->sql_prefix = $sql_prefix;
    $this->usernamesNotAllowed = array(
      'user'
    );
  }

  /**
   * Return true if debugging.
   *
   * @return boolean True if debugging on.
   *
   * @author DanielWHoward
   */
  function debugging() {
    return $this->xibdb->dumpSql;
  }

  /**
   * Toggle debugging on/off.
   *
   * @param $on boolean True to dump SQL.
   *
   * @author DanielWHoward
   */
  function debug($on=true) {
    $this->xibdb->dumpSql = $on;
  }

  /**
   * Prepend database table names to an array as appropriate.
   *
   * @param $a array A database query array.
   * @return array A revised database query array.
   *
   * @author DanielWHoward
   */
  function addTableSpecifiers($a) {
    $keywords = array('AND', 'OR');
    if (is_string($a) && (preg_match('/^[A-Za-z0-9]+\\.[A-Za-z0-9]+$/', $a) === 1) && !in_array(strtoupper($a), $keywords)) {
      $a = $this->sql_prefix.$a;
    } elseif (is_array($a)) {
      $b = array();
      if (has_numeric_keys($a)) {
        foreach ($a as $value) {
          $b[] = $this->addTableSpecifiers($value);
        }
      } else {
        foreach ($a as $key=>$value) {
          if (strtoupper($key) === 'TABLE') {
            if (is_string($value)) {
              $b[$key] = $this->sql_prefix.$value;
            } else {
              $b[$key] = array();
              foreach ($value as $table) {
                $b[$key][] = $this->sql_prefix.$table;
              }
            }
          } elseif (strtoupper($key) === 'ON') {
            $b[$key] = array();
            foreach ($value as $k=>$v) {
              $b[$key][$this->sql_prefix.$k] = $this->addTableSpecifiers($v);
            }
          } else {
            $b[$this->addTableSpecifiers($key)] = $this->addTableSpecifiers($value);
          }
        }
      }
      $a = $b;
    }
    return $a;
  }

  /**
   * Get JSON table rows from the database.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * This method supports multiple JOINs.
   *
   * @param $table array A database query array.
   *
   * @author DanielWHoward
   */
  function readRows($querySpec) {
    $querySpec = $this->addTableSpecifiers($querySpec);
    return $this->xibdb->readRowsNative($querySpec);
  }

  /**
   * Get one JSON table row from the database.
   *
   * If there is no sort column, the rows are in arbitrary
   * order.
   *
   * @param $table string A database table.
   * @param $where string A WHERE clause.
   * @return object A JSON object.
   *
   * @author DanielWHoward
   */
  function readOneRow($querySpec) {
    $rows = $this->readRows($querySpec);
    return (count($rows) >= 1)? $rows[0]: null;
  }

  /**
   * Get a JSON table description from the database.
   *
   * It does not return "sort" and "json" columns, if any.
   *
   * @param $table string A database table.
   * @return string A string containing a JSON object with columns and default values.
   *
   * @author DanielWHoward
   */
  function readDesc($table) {
    if (is_array($table)) {
      $args = array_merge(array(
      ), $table);
      $table = $args['table'];
    }
    $table = $this->sql_prefix.$table;
    return json_decode($this->xibdb->readDesc($table), true);
  }

  /**
   * Insert a row of JSON into a database table.
   *
   * If there is no sort column, it inserts the row, anyway.
   *
   * @param $table string A database table.
   * @param $values object A JSON object.
   * @param $index int The place to insert the row before; -1 means the end.
   * @param $where string A WHERE clause.
   * @return object A JSON object with updated autoincrement fields.
   *
   * @author DanielWHoward
   */
  function insertRow($querySpec) {
    $querySpec = $this->addTableSpecifiers($querySpec);
    return $this->xibdb->insertRowNative($querySpec);
  }

  /**
   * Delete a row of JSON from a database table.
   *
   * If there is no sort column, it deletes the first row.
   *
   * @param $table string A database table.
   * @param $index mixed The row to delete (int) or JSON data to select the row (string).
   * @param $where string A WHERE clause.
   *
   * @author DanielWHoward
   */
  function deleteRow($querySpec) {
    $querySpec = $this->addTableSpecifiers($querySpec);
    return $this->xibdb->deleteRowNative($querySpec);
  }

  /**
   * Update a row of JSON in a database table.
   *
   * If there is no sort column, it updates the first row.
   *
   * @param $table string A database table.
   * @param $index mixed The row to update (int) or JSON data to select the row (string).
   * @param $values mixed A JSON string (string) or JSON array (array).
   * @param $where string A WHERE clause.
   *
   * @author DanielWHoward
   */
  function updateRow($querySpec) {
    $querySpec = $this->addTableSpecifiers($querySpec);
    return $this->xibdb->updateRowNative($querySpec);
  }

  /**
   * Reorder a row of JSON in a database table.
   *
   * If there is no sort column, it does nothing.
   *
   * @param $table string A database table.
   * @param $where string A WHERE clause.
   * @param $m int The row to move.
   * @param $n int The row to move to.
   *
   * @author DanielWHoward
   */
  function moveRow($querySpec) {
    $querySpec = $this->addTableSpecifiers($querySpec);
    return $this->xibdb->moveRowNative($querySpec);
  }

  /**
   * Flexible mysql_query() function.
   * 
   * @param $query string The query to execute.
   * @return string The mysql_query() return value.
   *
   * @author DanielWHoward
   */
  function &mysql_query($query) {
    if ($this->debugging()) {
      print $query;
    }
    return $this->xibdb->mysql_query($query);
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
    return $this->xibdb->mysql_fetch_assoc($result);
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
    return $this->xibdb->mysql_free_query($result);
  }

  /**
   * Flexible mysql_real_escape_string() function.
   * 
   * @param $unescaped_string string The string.
   * @return string The mysql_real_escape_string() return value.
   *
   * @author DanielWHoward
   */
  function mysql_real_escape_string($unescaped_string) {
    return $this->xibdb->mysql_real_escape_string($unescaped_string);
  }

  /**
   * Flexible mysql_insert_id() function.
   *
   * @return The mysql_insert_id() return value.
   *
   * @author DanielWHoward
   */
  function mysql_insert_id() {
    return $this->xibdb->mysql_insert_id();
  }
}
