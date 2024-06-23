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
 * Handle login event.  Sign in a user.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('api', 'login', function($event, $vars) {
  $hub = $vars['hub'];
  $pf = $vars['pf'];

  asserte(isset($event['to']), 'missing:to');
  asserte(is_string($event['to']), 'typeof:to');
  asserte(preg_match('/^[_a-z0-9]+(\.[_a-z0-9]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$/', $event['to']) === 1, 'regexp:to');
  asserte(isset($event['pwd']), 'missing:pwd');
  asserte(is_string($event['pwd']), 'typeof:pwd');
  $to = $event['to'];
  $passwd = $event['pwd'];

  // save the password but remove it from the event
  unset($event['pwd']);
  $event['loggedIn'] = false;
  $verified = true;
  if ($verified) {
    // find user in the database
    $me = $pf->readOneRow(array(
      'table'=>'users',
      'where'=>array(
        'email'=>$to
    )));
    if ($me === null) {
      // if there is no user, force the password code to run
      //  with fake data so the user cannot guess usernames
      //  based on timing
      $me = array(
        'pwd'=>'$5$9f9b9bc83f164e1f1f392499e2561f05940c1d6c47bcad69e3bd311e620ab9d5$ee2334e03ba30379fb09cd1df0d4088ea8a853411062be0f83925ccdd2037aaf'
      );
    }
    // compare but do not allow user to guess hash string based on timing
    $verified = pwd_verify($passwd, $me['pwd']);
    if (is_string($verified)) {
      $upgradedPwd = $verified;
      $pf->updateRow(array(
        'table'=>'users',
        'values'=>array(
          'pwd'=>$upgradedPwd),
        'where'=>array(
          'id'=>$me['id']
      )));
      $verified = true;
    }
    if ($verified) {
      // find user in the database
      $me = $pf->readRows(array(
        'table'=>'users',
        'where'=>array(
          'uid'=>$me['uid']
      )));
      if ((count($me) === 1) && ($me[0]['username'] === 'user')) {
        $event['i'] = 'collect:username';
      }
      $me = $me[count($me)-1];
      // connect to this user
      $event['username'] = $me['username'];
      $event = $hub->connect($event, $me['username'], true);
      // add UID and user to the session variables
      $event['_session']['uid'] = $me['id'];
      $event['_session']['user'] = $me;
      // return user info
      $event['me'] = array(
        'username'=>$me['username'],
        'roles'=>isset($me['roles'])? $me['roles']: array()
      );
      $event['loggedIn'] = true;
      // update the instance with UID
      $row = $pf->readOneRow(array(
        'table'=>'instances',
        'where'=>array(
          'instance'=>$event['_session']['instance_id']
      )));
      if ($row !== null) {
        $values = array(
          'uid'=>$event['_session']['uid']
        );
        if (isset($_REQUEST['XIO'])) {
          $values['sid'] = $me['username'];
        }
        $pf->updateRow(array(
          'table'=>'instances',
          'values'=>$values,
          'where'=>array(
            'instance'=>$event['_session']['instance_id']
        )));
      }
      $hub->send(array(
        'type'=>'notify_login',
        'to'=>'all',
        'from'=>$me['username']
      ));
      // info: user logged in
      if (!isset($event['i'])) {
        $event['i'] = 'logged in';
      }
    } else {
      // error: user not found or wrong password
      $event['e'] = 'unauthenticated';
    }
  } else {
    // error: user not found or wrong password
    $event['e'] = 'unauthenticated';
  }
  return $event;
});
?>
