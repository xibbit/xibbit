<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
/**
 * Handle __receive event.  Change event queue to
 * use instances instead of usernames.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('__receive', function($event, $vars) {
  $pf = $vars['pf'];

  // assume that this event does not need special handling
  $event['e'] = 'unimplemented';

  if (isset($vars['useInstances']) && $vars['useInstances']) {
    if (isset($event['_session']) && isset($event['_session']['instance'])) {
      $instance = $event['_session']['instance'];
      $event['eventQueue'] = array();
      // get the events from the events table
      $events = $pf->readRows(array(
        'table'=>'sockets_events',
        'where'=>array(
          'sid'=>$instance
      )));
      for ($f=0; $f < count($events); ++$f) {
        $evt = $events[$f]['event'];
        // delete the event from the events table
        $pf->deleteRow(array(
          'table'=>'sockets_events',
          'where'=>array(
            'id'=>$events[$f]['id']
        )));
        $event['eventQueue'][] = $evt;
      }
      unset($event['e']);
    }
  }
  return $event;
});
?>
