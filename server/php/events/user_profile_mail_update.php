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
