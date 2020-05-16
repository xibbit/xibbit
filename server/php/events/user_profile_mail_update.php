<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
require_once('./array.php');
/**
 * Handle user_profile_mail_update event.  Change
 * this user's mailing address and other values.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('user_profile_mail_update', function($event, $vars) {
  $pf = $vars['pf'];

  asserte(isset($event['user']), 'missing:user');
  asserte(has_string_keys($event['user']), 'typeof:user');

  // get the current user
  $uid = $event['_session']['uid'];
  $me = $pf->readOneRow(array(
    'table'=>'users',
    'where'=>array(
      'uid'=>$uid
  )));
  asserte($me !== null, 'current user not found');
  // remove all uneditable fields
  $readonly = array(
    'id',
    'roles',
    'json',
    'n',
    'password'
  );
  foreach ($readonly as $key) {
    if (isset($event['user'][$key])) {
      unset($event['user'][$key]);
    }
  }
  // update the profile
  $pf->updateRow(array(
    'table'=>'users',
    'values'=>$event['user'],
    'where'=>array(
      'uid'=>$uid
  )));
  // info: profile updated
  $event['i'] = 'profile updated';
  return $event;
});
?>
