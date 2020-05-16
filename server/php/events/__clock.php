<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
/**
 * Handle __clock event.  Remove saved instances if
 * they have not been heard from in a while.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('__clock', function($event, $vars) {
  $hub = &$vars['hub'];

  // use seconds since epoch instead of datetime string to demo how this is done
  $now = time();
  $globalVars = $event['globalVars'];

  if (!isset($globalVars['lastRandomEventTime']) ||
      ($now > ($globalVars['lastRandomEventTime'] + 10))) {
    $globalVars['lastRandomEventTime'] = $now;
    if (isset($globalVars['numRandom'])) {
      ++$globalVars['numRandom'];
    } else {
      $globalVars['numRandom'] = 1;
    }
    if (!isset($globalVars['lastRandomEventIndex'])) {
      $globalVars['lastRandomEventIndex'] = 0;
    }
    $globalVars['lastRandomEventIndex'] =
      ($globalVars['lastRandomEventIndex'] + 1) % 4;
    $eventIndex = $globalVars['lastRandomEventIndex'];

    $randomUsers = array(
      array('admin', 1),
      array('user1', 2)
    );
    $randomTypes = array(
      'notify_laughs',
      'notify_jumps'
    );
    $randomUser = $randomUsers[$eventIndex % 2][0];
    $randomType = $randomTypes[floor($eventIndex/2)];
    $hub->send(array(
      'type'=>$randomType,
      'to'=>'all',
      'from'=>$randomUser
    ));

    // delete all instances that are too old
    $hub->deleteExpired('instances', 2 * 60);
    // delete all events sent to instances that no longer exist
    $hub->deleteOrphans('sockets_events', 'sid', 'instances', 'instance');

    $event['globalVars'] = $globalVars;
  }

  return $event;
});
?>
