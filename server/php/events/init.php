<?php
// The MIT License (MIT)
//
// xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
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
// @version 1.5.2
// @copyright xibbit 1.5.2 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
require_once('./asserte.php');
require_once('./config.php');
/**
 * Handle init event.  Return information to
 * initialize this app.
 *
 * @author DanielWHoward
 **/
$self = $this;
$self->api('init', function($event, $vars) {
  $pf = $vars['pf'];

  noAsserte($event);

  // set the time zone to UTC
  if (@date_default_timezone_get() === 'UTC') {
    date_default_timezone_set('UTC');
  }

  // make many app.php duplicates to fake out Apache's mod_security
  if (isset($hacks['mod_security_1'])) {
    if (!file_exists('app0.php')) {
      $php = '<?php include(\'app.php\'); ?>'."\r\n";
      for ($f=0; $f < $hacks['mod_security_1']; ++$f) {
        $dup = fopen('app'.$f.'.php', 'w');
        fwrite($dup, $php);
        fclose($dup);
      }
    }
  }
  // info: initial values loaded
  $event['i'] = 'initialized';
  return $event;
});
?>
