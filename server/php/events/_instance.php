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
/**
 * Handle _instance event.  Save instance so
 * events can be broadcast to it later.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('api', '_instance', function($event, $vars) {
  $hub = $vars['hub'];
  $pf = $vars['pf'];
  $useInstances = isset($vars['useInstances']) && $vars['useInstances'];

  if ($useInstances) {
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
        'uid'=>$uid,
        'instance'=>$instance,
        'touched'=>$now
      );
      if ($localSid !== '') {
        $values['sid'] = $localSid;
      }
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
