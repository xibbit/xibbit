<?php
// The MIT License (MIT)
//
// cuid Copyright (c) 2014 Endy Jasmi
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
/**
 * Return true (verified), false (unverified) or a shadow
 * password record value as a string (verified but hash
 * algorithm should be upgraded).
 *
 * The shadow password record is a Linux semi-standard for
 * storing passwords, salt, algorithms and algorithm arguments
 * in a single string.
 *
 * @param $pwd string The password to hash.
 * @param $shadow string The hash algorithm to use in the hash.
 * @return boolean True, false or a string to upgrade the hash to.
 *
 * @author DanielWHoward
 **/
function pwd_verify($pwd, $shadow) {
  global $pwd_scheme;
  $verified = false;
  $upgrade = false;
  // test the password
  if (pwd_hash($pwd, $shadow, $pwd_scheme, true)) {
    // test to see if the hash algorithm should change
    $upgrade = pwd_hash($pwd, $shadow, $pwd_scheme);
    if ($upgrade === $shadow) {
      $verified = true;
    } else {
      $verified = $upgrade;
    }
  }
  return $verified;
}

/**
 * Return the shadow password record format value for a password.
 *
 * The shadow password record is a Linux semi-standard for storing
 * passwords, salt, algorithms and algorithm arguments in a single
 * string.
 *
 * This function is engineered such that hashing algorithms can be
 * updated by only modifying this function.  That is why it is weird.
 *
 * For one argument, it hashes the password using the hash algorithm
 * in the $pwd_scheme global variable.  This is the usual call from
 * client code.
 *
 * For two arguments, it hashes the password using the algorithm
 * in second argument.
 *
 * For three arguments, it compares the second argument and the
 * third argument.  If they have the same algorithm, it returns
 * the second argument.  If the algorithms are different, it hashes
 * the password using the hash algorithm in the $pwd_scheme global
 * variable.  So, it either returns the existing hash or a new
 * hash.
 *
 * For four arguments, it hashes the password and compares it to
 * the second argument.  If the password is verified against the
 * the second argument, it returns true.  If it is not verified,
 * it returns false.
 *
 * @param $pwd string The password to hash.
 * @param $shadow string The arguments to use in the hash.
 * @param $scheme string The scheme to compare to the shadow.
 * @param $verify boolean Verify and return a boolean.
 * @return string A shadow password record value.
 *
 * @author DanielWHoward
 **/
function pwd_hash($pwd, $shadow='', $scheme='', $verify=false) {
  global $pwd_scheme;
  $ret = false;
  $hash = '';
  $new_scheme = $scheme;
  // find the hash algorithm to use
  $scheme = $pwd_scheme;
  if (substr($shadow, 0, strlen('$5$')) === '$5$') {
    $scheme = '$5$';
  } elseif (substr($shadow, 0, strlen('$6$')) === '$6$') {
    $scheme = '$6$';
  } elseif ((substr($shadow, 0, strlen('$2y$')) === '$2y$')
      || (substr($shadow, 0, strlen('$2b$')) === '$2b$')
      || (substr($shadow, 0, strlen('$2a$')) === '$2a$')) {
    $scheme = explode('$', $shadow);
    $scheme = '$'.$scheme[1].'$'.$scheme[2].'$';
  }
  if ($scheme === 'fast') {
    $scheme = '$5$';
  }
  if ($new_scheme === 'fast') {
    $new_scheme = '$5$';
  }
  if ($scheme === 'good') {
    $scheme = '$2y$11$';
  }
  if ($new_scheme === 'good') {
    $new_scheme = '$2y$11$';
  }
  if ($verify) {
    // use the correct verification function
    $verified = false;
    $scheme_args = explode('$', $scheme);
    switch ($scheme_args[1]) {
      case '2y':
      case '2b':
      case '2a':
        // verification API
        $hash = $shadow;
        $verified = password_verify($pwd, $hash);
        break;
      default:
        // generic verification
        $hash = pwd_hash($pwd, $shadow);
        $verified = pwd_slowEquals($hash, $shadow);
        break;
    }
    $ret = $verified;
  } elseif ($new_scheme !== '') {
    // rehash if there are 2 different hash algorithms
    if ($new_scheme !== $scheme) {
      $shadow = pwd_hash($pwd);
    }
    $ret = $shadow;
  } else {
    // create the shadow password format value
    $salt = '';
    $scheme_args = explode('$', $scheme);
    switch ($scheme_args[1]) {
      case '5':
        // SHA-256
        $salt = ($shadow === '')? pwd_salt(): explode('$', $shadow);
        $salt = is_array($salt)? $salt[2]: $salt;
        $shadow = hash('sha256', $salt.$pwd);
        $shadow = '$5$'.$salt.'$'.$shadow;
        break;
      case '6':
        // SHA-512
        $salt = ($shadow === '')? pwd_salt(): explode('$', $shadow);
        $salt = is_array($salt)? $salt[2]: $salt;
        $shadow = hash('sha512', $salt.$pwd);
        $shadow = '$6$'.$salt.'$'.$shadow;
        break;
      case '2y':
      case '2b':
      case '2a':
        // bcrypt
        $shadow = password_hash($pwd, PASSWORD_DEFAULT, array(
          'cost'=>$scheme_args[2]
        ));
        break;
      default:
        pwd_fail('Warning: unknown hashing algorithm: ', $scheme, ' in pwd.php on line 181');
        break;
    }
    $ret = $shadow;
  }
  return $ret;
}

/**
 * Return a 32-bit salt value as a hex string.
 *
 * A 32-bit random salt value is very unlikely to repeat.
 *
 * @return string A hexidecimal string that is 64 characters long.
 *
 * @author DanielWHoward
 **/
function pwd_salt() {
  $length = 32;
  $a = '0123456789abcdef';
  $salt = '';
  for ($i=0; $i < ($length * 2); $i++) {
    $salt .= $a[pwd_rand_secure(0, strlen($a))];
  }
  return $salt;
}

/**
 * Compare two strings but make similar and different strings
 * take about the same amount of time to prevent timing attacks.
 *
 * @param $a string A string.
 * @param $b string Another string.
 * @return boolean True if equal or false if not equal.
 *
 * @author DanielWHoward
 **/
function pwd_slowEquals($a, $b) {
  $diff = pack('L', strlen($a)) ^ pack('L', strlen($b));
  for ($i=0; ($i < strlen($a)) && ($i < strlen($b)); $i++) {
    $diff |= pack('L', ord($a[$i])) ^ pack('L', ord($b[$i]));
  }
  return $diff === pack('L', 0);
}

/**
 * Return a long, random string, very time consuming to guess
 * and meant to be unguessable.  This is kept for reference;
 * pwd_cuid(false, 1) is preferred.
 *
 * @return string A long, random string.
 *
 * @author DanielWHoward
 **/
function pwd_uuid() {
  $length = 25;
  $a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  $id = '';
  for($i=0; $i < $length; $i++) {
    $id .= $a[pwd_rand_secure(0, strlen($a))];
  }
  return $id;
}

/**
 * Generate short or long collision resistant identifier
 * (aka very random UUID).  A short CUID is called a slug
 * and is a great solution for URL shortening.  A long
 * CUID is for session IDs, unsubscribe URLs and such.
 *
 * The $iteration should be stored and incremented by the
 * caller.  It should start at 1 and be incremented each
 * time that this function is called.  It provides added
 * collision avoidance for the server.
 *
 * @param $slug boolean True if short cuid.
 * @param $iteration integer An integer starting at 1.
 * @return string Return generated cuid string.
 */
function pwd_cuid($slug, $iteration)
{
  $strPad = '000000000000000000000000000000000000';
  $sum = 0;
  $blockSize = $slug? 2: 4;
  $prefix = ($blockSize == 4)? 'c': '';
  $hash = base_convert(floor(microtime(true) * 1000), 10, 36);
  $timestamp = ($blockSize == 4)? $hash: substr($hash, -2);
  $count = base_convert($iteration, 10, 36);
  $count = substr($strPad, 0, strlen($strPad) - strlen($count)) . $count;
  $count = substr($count, strlen($count) - $blockSize);
  $pid = getmypid();
  $pid = base_convert($pid, 10, 36);
  $pid = substr($strPad, 0, strlen($strPad) - strlen($pid)) . $pid;
  $pid = substr($pid, strlen($pid) - 2);
  $hostname = gethostname();
  $hostname = array_reduce(str_split($hostname), function ($carry, $char) { return $carry + ord($char); }, strlen($hostname) + 36);
  $hostname = base_convert($hostname, 10, 36);
  $hostname = substr($strPad, 0, strlen($strPad) - strlen($hostname)) . $hostname;
  $hostname = substr($hostname, strlen($hostname) - 2);
  $hostname = ($blockSize == 4)? $pid.$hostname: substr($pid, 0, 1).substr($hostname, -1);
  $modifier = pow(36, 4);
  $random1 = mt_rand() / mt_getrandmax();
  $random1 = $random1 * $modifier;
  $random1 = base_convert($random1, 10, 36);
  $random1 = substr($strPad, 0, strlen($strPad) - strlen($random1)) . $random1;
  $random1 = substr($random1, strlen($random1) - 4);
  $random1 = ($blockSize == 4)? $random1: substr($random1, -2);
  $random2 = '';
  if ($blockSize === 4) {
    $random2 = mt_rand() / mt_getrandmax();
    $random2 = $random2 * $modifier;
    $random2 = base_convert($random2, 10, 36);
    $random2 = substr($strPad, 0, strlen($strPad) - strlen($random2)) . $random2;
    $random2 = substr($random2, strlen($random2) - 4);
  }
  return $prefix.$timestamp.$count.$hostname.$random1.$random2;
}

/**
 * Return a random number in a range.
 *
 * @param $min int The minimum value.
 * @param $max int The maximum value.
 * @return int A random value.
 *
 * @author DanielWHoward
 **/
function pwd_rand_secure($min, $max) {
  $log = log(($max - $min), 2);
  $bytes = (int) ($log / 8) + 1;
  $bits = (int) $log + 1;
  $filter = (int) (1 << $bits) - 1;
  do {
    $rnd = hexdec(bin2hex(openssl_random_pseudo_bytes($bytes)));
    $rnd = $rnd & $filter; // discard irrelevant bits
  } while ($rnd >= ($max - $min));
  return $min + $rnd;
}

/**
 * Throw an exception to create a stack trace.
 *
 * @author DanielWHoward
 */
function pwd_fail() {
  $args = func_get_args();
  $msg = implode(' ', $args);
  throw new Exception($msg);
}

/**
 * Implement password_hash() for PHP 5.3.7 to 5.5.0.
 *
 * @author DanielWHoward
 **/
if (!function_exists('password_hash')) {
  function password_hash($password, $algo, $options) {
    $salt = substr(base64_encode(openssl_random_pseudo_bytes(17)), 0, 22);
    $salt = str_replace('+', '.', $salt);
    $param = str_pad($options['cost'], 2, '0', STR_PAD_LEFT);
    $param = '$'.implode('$', array('2y', $param, $salt));
    return crypt($password, $param);
  }
}

/**
 * Implement password_verify() for PHP 5.3.7 to 5.5.0.
 *
 * @author DanielWHoward
 **/
if (!function_exists('password_verify')) {
  function password_verify($password, $hash) {
    return crypt($password, $hash) === $hash;
  }
}
?>
