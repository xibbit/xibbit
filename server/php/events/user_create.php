<?php
// The MIT License (MIT)
//
// xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.3
// @copyright xibbit 1.5.3 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
require_once('./asserte.php');
require_once('./pwd.php');
/**
 * Handle user_create event.  Create a new user.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('api', 'user_create', function($event, $vars) {
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

  $now = date('Y-m-d H:i:s', time());
  $now = DateTime::createFromFormat('Y-m-d H:i:s', $now);
  $nullDateTime = '1970-01-01 00:00:00';
  $nullDateTime = DateTime::createFromFormat('Y-m-d H:i:s', $nullDateTime);
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
