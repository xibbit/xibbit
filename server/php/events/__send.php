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
require_once('./asserte.php');
/**
 * Handle __send event.  Process "all" and user
 * aliases to send this event to multiple
 * instances.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('__send', function($event, $vars) {
  $hub = $vars['hub'];
  $pf = $vars['pf'];
  $useInstances = isset($vars['useInstances']) && $vars['useInstances'];

  // assume that this event does not need special handling
  $event['e'] = 'unimplemented';

  if (useInstances) {
    if (!isset($event['event']) || !isset($event['event']['to'])) {
      print '__send did not get event.to';
    }
    $toStr = $event['event']['to'];
    $now = date('Y-m-d H:i:s', time());
    $sent = false;
    // get the sender
    $eventFrom = isset($event['event']['from'])? $event['event']['from']: 'x';
    $from = $pf->readOneRow(array(
      'table'=>'users',
      'where'=>array(
        'username'=>$eventFrom
    )));
    // get the receiver
    $to = $pf->readOneRow(array(
      'table'=>'users',
      'where'=>array(
        'username'=>$toStr
    )));
    // resolve the "to" address to instances
    $q = array(
      'table'=>'instances'
    );
    if (($to !== null) && ($toStr !== 'all')) {
      $q = array(
        'table'=>'instances',
        'where'=>array(
          'uid'=>$to['uid']
      ));
    }
    $instances = $pf->readRows($q);
    // send an event to each instance
    for ($i=0; $i < count($instances); ++$i) {
      $keysToSkip = array('_conn');
      $sent = true;
      // clone the event so we can safely modify it
      $evt = $hub->cloneEvent($event['event'], $keysToSkip);
      // "to" is an instance ID in events table
      $instanceId = $instances[$i]['instance'];
      // overwrite "from" and add "fromid" field
      if ($from !== null) {
        $evt['from'] = $from['username'];
        $evt['fromid'] = $from['uid'];
      }
      $evtStr = json_encode($evt);
      $pf->insertRow(array(
        'table'=>'sockets_events',
        'values'=>array(
          'id'=>0,
          'sid'=>$instanceId,
          'event'=>$evtStr,
          'touched'=>$now
      )));
    }
    if ($sent) {
      unset($event['e']);
    }
  }
  return $event;
});
?>
