<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/**
 * Throw an exception if the assert condition is false.
 *
 * @param $cond boolean A boolean for the assertion.
 * @param $msg The message to use if the assertion fails.
 * @throws Exception The assertion failed.
 *
 * @author DanielWHoward
 **/
function asserte($cond, $msg) {
  if (!$cond) {
    throw new Exception($msg);
  }
}
/**
 * Throw an exception if the event object has too few
 * or too many arguments.
 *
 * @param $event array The event that should be minimal.
 * @throws Exception The assertion failed.
 *
 * @author DanielWHoward
 **/
function noAsserte($event) {
  // check the required properties
  asserte(isset($event['type']), 'missing:type');
  asserte(isset($event['_id']), 'missing:_id');
  asserte(isset($event['_session']), 'missing:_session');
  asserte(isset($event['_conn']), 'missing:_conn');
  // check the "from" property
  $keys = count($event);
  if ((count($event) === 5) && isset($event['from'])) {
    --$keys;
  }
  if ($keys !== 4) {
    // find at least one extra property
    if (isset($event['from'])) {
      unset($event['from']);
    }
    unset($event['type']);
    unset($event['_id']);
    unset($event['_session']);
    unset($event['_conn']);
    $keys = array_keys($event);
    throw new Exception('property:'.$keys[0]);
  }
}
?>
