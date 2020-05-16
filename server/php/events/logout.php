<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
/**
 * Handle logout event.  Sign out a user.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('logout', function($event, $vars) {
  $hub = $vars['hub'];
  $pf = $vars['pf'];

  noAsserte($event);

  // broadcast this instance logged out
  $hub->send(array(
    'type'=>'notify_logout',
    'to'=>'all',
    'from'=>$event['from']
  ));
  // logout this instance
  $hub->connect($event, $event['_session']['username'], false);
  // remove UID from the instance
  $row = $pf->readOneRow(array(
    'table'=>'instances',
    'where'=>array(
      'instance'=>$event['_session']['instance']
  )));
  if ($row !== null) {
    $values = array(
      'uid'=>0
    );
    if (isset($_REQUEST['XIO'])) {
      $values['sid'] = '';
    }
    $pf->updateRow(array(
      'table'=>'instances',
      'values'=>$values,
      'where'=>array(
        'instance'=>$event['_session']['instance']
    )));
  }
  // remove UID and user info from the session
  unset($event['_session']['uid']);
  unset($event['_session']['user']);
  $event['i'] = 'logged out';

  return $event;
});
?>
