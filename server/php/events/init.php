<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
