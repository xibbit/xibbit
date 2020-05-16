<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
/**
 * Handle __send event.  Process 'all' and user
 * aliases to send this event to multiple
 * instances.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('__send', function($event, $vars) {
  $hub = $vars['hub'];
  $pf = $vars['pf'];

  if (isset($event['event']) && isset($event['event']['to'])) {
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
        'username'=>$event['event']['to']
    )));
    // resolve the "to" address to instances
    $q = array(
      'table'=>'instances'
    );
    if (($to !== null) && ($event['event']['to'] !== 'all')) {
      $q = array(
        'table'=>'instances',
        'where'=>array(
          'uid'=>$to['uid']
      ));
    }
    $instances = $pf->readRows($q);
    // send an event to each instance
    for ($i=0; $i < count($instances); ++$i) {
      $sent = true;
      // clone the event so we can safely modify it
      $evt = $event['event'];
      // "to" is an instance ID in events table
      $instanceId = $instances[$i]['instance'];
      // overwrite "from" and add "fromid" field
      if ($from !== null) {
        $evt['from'] = $from['username'];
        $evt['fromid'] = $from['uid'];
      }
      $hub->send($evt, $evt['to'], true);
    }
    if (!$sent) {
      $event['e'] = 'unimplemented';
    }
  } else {
    $event['e'] = 'unimplemented';
  }
  return $event;
});
?>
