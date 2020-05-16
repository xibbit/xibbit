<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
/**
 * Handle user_profile event.  Get this user's
 * profile.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('user_profile', function($event, $vars) {
  $pf = $vars['pf'];

  noAsserte($event);

  // get the current user
  $uid = $event['_session']['uid'];
  $me = $pf->readOneRow(array(
    'table'=>'users',
    'where'=>array(
      'uid'=>$uid
  )));
  asserte($me !== null, 'current user not found');
  // set default values for missing values
  $me = array_merge(array(
    'name'=>'',
    'address'=>'',
    'address2'=>'',
    'city'=>'',
    'state'=>'',
    'zip'=>''
  ), $me);
  // return the profile
  $event['profile'] = array(
    'name'=>$me['name'],
    'address'=>$me['address'],
    'address2'=>$me['address2'],
    'city'=>$me['city'],
    'state'=>$me['state'],
    'zip'=>$me['zip']
  );
  // info: profile returned
  $event['i'] = 'profile found';
  return $event;
});
?>
