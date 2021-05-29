<?php
// The MIT License (MIT)
//
// xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @copyright xibbit 1.50 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
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

  $username = $event['_session']['username'];
  $instance = $event['_session']['instance'];

  // broadcast this instance logged out
  $hub->send(array(
    'type'=>'notify_logout',
    'to'=>'all',
    'from'=>$username
  ));
  // logout this instance
  $hub->connect($event, $username, false);
  // remove UID from the instance
  $row = $pf->readOneRow(array(
    'table'=>'instances',
    'where'=>array(
      'instance'=>$instance
  )));
  if ($row !== null) {
    if (isset($_REQUEST['XIO'])) {
      $values['sid'] = '';
    }
    $values = array(
      'uid'=>0
    );
    if ($row['sid'] === $username) {
      $values['sid'] = '';
    }
    $pf->updateRow(array(
      'table'=>'instances',
      'values'=>$values,
      'where'=>array(
        'instance'=>$instance
    )));
  }
  // remove UID and user info from the session
  unset($event['_session']['uid']);
  unset($event['_session']['user']);
  $event['i'] = 'logged out';

  return $event;
});
?>
