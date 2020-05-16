<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
/**
 * Handle _instance event.  Save instance so
 * events can be broadcast to it later.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('_instance', function($event, $vars) {
  $hub = $vars['hub'];
  $pf = $vars['pf'];

  if (isset($vars['useInstances']) && $vars['useInstances']) {
    $now = date('Y-m-d H:i:s', time());
    $localSid = isset($_REQUEST['sid'])? $_REQUEST['sid']: '';
    $uid = isset($event['_session']['uid'])? $event['_session']['uid']: 0;
    $instance = $event['instance'];
    // see if the instance already exists
    $row = $pf->readOneRow(array(
      'table'=>'instances',
      'where'=>array(
        'instance'=>$instance
    )));
    // save the instance
    if ($row === null) {
      // this is a brand new instance/user
      $values = array(
        'id'=>0,
        'sid'=>$localSid,
        'uid'=>$uid,
        'instance'=>$instance,
        'connected'=>$now,
        'touched'=>$now
      );
      $event['_session']['instance'] = $instance;
      $pf->insertRow(array(
        'table'=>'instances',
        'values'=>$values
      ));
      $hub->send(array(
        'type'=>'notify_instance',
        'to'=>'all'
      ));
    } else {
      // if the browser page is reloaded, a new socket is
      //  created with an existing instance
      $values = array(
        'sid'=>$localSid,
        'uid'=>$uid,
        'instance'=>$instance,
        'touched'=>$now
      );
      $pf->updateRow(array(
        'table'=>'instances',
        'values'=>$values,
        'where'=>array(
          'instance'=>$event['_session']['instance']
      )));
    }
  }
  return $event;
});
?>
