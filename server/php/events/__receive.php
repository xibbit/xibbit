<?php
// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
require_once('./asserte.php');
/**
 * Handle __receive event.  Change event queue to
 * use instances instead of usernames.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->on('api', '__receive', function($event, $vars) {
  $pf = $vars['pf'];
  $useInstances = isset($vars['useInstances']) && $vars['useInstances'];

  // assume that this event does not need special handling
  $event['e'] = 'unimplemented';

  if ($useInstances) {
    if (!isset($event['_session']) || !isset($event['_session']['instance_id'])) {
      print '__receive did not get _session.instance_id';
    }
    $instance = $event['_session']['instance_id'];
    $event['eventQueue'] = array();
    // get the events from the events table
    $events = $pf->readRows(array(
      'table'=>'sockets_events',
      'where'=>array(
        'sid'=>$instance
    )));
    // this is intentionally not ACID; the client will handle dups
    for ($f=0; $f < count($events); ++$f) {
      $evt = $events[$f]['event'];
      // delete the event from the events table
      $pf->deleteRow(array(
        'table'=>'sockets_events',
        'where'=>array(
          'id'=>$events[$f]['id']
      )));
      $event['eventQueue'][] = $evt;
    }
    unset($event['e']);
  }
  return $event;
});
?>
