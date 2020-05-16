<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
require_once('./asserte.php');
require_once('./pwd.php');
/**
 * Handle user_create event.  Create a new user.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('user_create', function($event, $vars) {
  $pf = $vars['pf'];

  asserte(isset($event['username']), 'missing:username');
  asserte(is_string($event['username']), 'typeof:username');
  asserte(!in_array($event['username'], $pf->usernamesNotAllowed), 'invalid:username');
  asserte(preg_match('/^[a-z][a-z0-9]{2,11}$/', $event['username']) === 1, 'regexp:username');
  asserte(isset($event['email']), 'missing:email');
  asserte(is_string($event['email']), 'invalid:email');
  asserte(preg_match('/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/', $event['email']) === 1, 'regexp:email');
  asserte(isset($event['pwd']), 'missing:pwd');
  asserte(is_string($event['pwd']), 'typeof:pwd');

  $username = $event['username'];
  $email = $event['email'];
  $hashedPwd = pwd_hash($event['pwd']);

  $now = date('Y-m-d H:i:s');
  $nullDateTime = '1970-01-01 00:00:00';
  // see if the user is already in the database
  $me = $pf->readOneRow(array(
    'table'=>'users',
    'where'=>array(
      'or'=>'or',
      'username'=>$username,
      'email'=>$email)
  ));
  // insert the user into the database
  if ($me === null) {
    // insert the user
    $user = $pf->insertRow(array(
    'table'=>'users',
    'values'=>array(
      'id'=>0,
      'uid'=>0,
      'username'=>$username,
      'email'=>$email,
      'pwd'=>$hashedPwd,
      'created'=>$now,
      'connected'=>$nullDateTime,
      'touched'=>$nullDateTime
    )));
    $id = $user['id'];
    $uid = $user['id'];
    // update the uid
    $values = array(
      'uid'=>$uid
    );
    $pf->updateRow(array(
      'table'=>'users',
      'values'=>$values,
      'where'=>array(
        'id'=>$id
    )));  
    unset($event['pwd']);
    $event['i'] = 'created';
  } else {
    unset($event['pwd']);
    $event['e'] = 'already exists';
  }
  return $event;
});
?>
