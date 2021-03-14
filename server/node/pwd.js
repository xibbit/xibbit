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
var os = require('os');
var crypto = require('crypto');
var TwinBcrypt = require('twin-bcrypt');
var path = require('path');
var config = require('./config');
/**
 * Return true (verified), false (unverified) or a shadow
 * password record value as a string (verified but hash
 * algorithm should be upgraded).
 *
 * The shadow password record is a Linux semi-standard for
 * storing passwords, salt, algorithms and algorithm arguments
 * in a single string.
 *
 * @param pwd string The password to hash.
 * @param shadow string The hash algorithm to use in the hash.
 * @return boolean True, false or a string to upgrade the hash to.
 *
 * @author DanielWHoward
 **/
function pwd_verify(pwd, shadow, callback) {
  var verified = false;
  // test the password
  pwd_hash(pwd, shadow, config.pwd_scheme, true, function(e, verify) {
    if (e) {
      callback(e);
    } else if (verify) {
      // test to see if the hash algorithm should change
      pwd_hash(pwd, shadow, config.pwd_scheme, false, function(e, upgrade) {
        if (upgrade === shadow) {
          verified = true;
        } else {
          verified = upgrade;
        }
        callback(e, verified);
      });
    } else {
      callback(e, verified);
    }
  });
};
exports.pwd_verify = pwd_verify;

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
 * in the pwd_scheme global variable.  This is the usual call from
 * client code.
 *
 * For two arguments, it hashes the password using the algorithm
 * in second argument.
 *
 * For three arguments, it compares the second argument and the
 * third argument.  If they have the same algorithm, it returns
 * the second argument.  If the algorithms are different, it hashes
 * the password using the hash algorithm in the pwd_scheme global
 * variable.  So, it either returns the existing hash or a new
 * hash.
 *
 * For four arguments, it hashes the password and compares it to
 * the second argument.  If the password is verified against the
 * the second argument, it returns true.  If it is not verified,
 * it returns false.
 *
 * @param pwd string The password to hash.
 * @param shadow string The arguments to use in the hash.
 * @param scheme string The scheme to compare to the shadow.
 * @param verify boolean Verify and return a boolean.
 * @return string A shadow password record value.
 *
 * @author DanielWHoward
 **/
function pwd_hash(pwd, shadow, scheme, verify, callback) {
  shadow = shadow || '';
  scheme = scheme || '';
  verify = verify || false;
  var ret = false;
  var hash = '';
  var new_scheme = scheme;
  // find the hash algorithm to use
  scheme = config.pwd_scheme;
  if (shadow.substring(0, '$5$'.length) === '$5$') {
    scheme = '$5$';
  } else if (shadow.substring(0, '$6$'.length) === '$6$') {
    scheme = '$6$';
  } else if ((shadow.substring(0, '$2y$'.length) === '$2y$')
      || (shadow.substring(0, '$2b$'.length) === '$2b$')
      || (shadow.substring(0, '$2a$'.length) === '$2a$')) {
    scheme = shadow.split('$');
    scheme = '$'+scheme[1]+'$'+scheme[2]+'$';
  }
  if (scheme === 'fast') {
    scheme = '$5$';
  }
  if (new_scheme === 'fast') {
    new_scheme = '$5$';
  }
  if (scheme === 'good') {
    scheme = '$2y$11$';
  }
  if (new_scheme === 'good') {
    new_scheme = '$2y$11$';
  }
  if (verify) {
    // use the correct verification function
    var verified = false;
    var scheme_args = scheme.split('$');
    switch (scheme_args[1]) {
      default:
        // generic verification
        pwd_hash(pwd, shadow, '', false, function(e, hash) {
          if (!e) {
            verified = pwd_slowEquals(hash, shadow);
          }
          ret = verified;
          callback(e, ret);
        });
    }
  } else if (new_scheme !== '') {
    // rehash if there are 2 different hash algorithms
    if (new_scheme !== scheme) {
      pwd_hash(pwd, '', '', false, callback);
    } else {
      callback(null, shadow);
    }
  } else {
    // create the shadow password format value
    var salt = '';
    var scheme_args = scheme.split('$');
    switch (scheme_args[1]) {
      case '5':
        // SHA-256
        salt = (shadow === '')? pwd_salt(): shadow.split('$');
        salt = Array.isArray(salt)? salt[2]: salt;
        shadow = crypto.createHash('sha256').update(salt+pwd).digest('hex');
        shadow = '$5$'+salt+'$'+shadow;
        callback(null, shadow);
        break;
      case '6':
        // SHA-512
        salt = (shadow === '')? pwd_salt(): shadow.split('$');
        salt = Array.isArray(salt)? salt[2]: salt;
        shadow = crypto.createHash('sha512').update(salt+pwd).digest('hex');
        shadow = '$6$'+salt+'$'+shadow;
        callback(null, shadow);
        break;
      case '2y':
      case '2b':
      case '2a':
        // bcrypt
        salt = (shadow === '')? TwinBcrypt.genSalt(parseInt(scheme_args[2])): shadow.substring(0, 29);
        TwinBcrypt.hash(pwd, salt, function() { return true }, function(shadow) {
          callback(null, shadow)
        });
        break;
      default:
        callback('Warning: unknown hashing algorithm: '+scheme+' in pwd.js on line 193');
        break;
    }
  }
}
exports.pwd_hash = pwd_hash;

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
  var length = 32;
  var a = '0123456789abcdef';
  var salt = '';
  for (var i=0; i < (length * 2); i++) {
    salt += a[pwd_rand_secure(0, a.length)];
  }
  return salt;
}
exports.pwd_salt = pwd_salt;

/**
 * Compare two strings but make similar and different strings
 * take about the same amount of time to prevent timing attacks.
 *
 * @param a string A string.
 * @param b string Another string.
 * @return boolean True if equal or false if not equal.
 *
 * @author DanielWHoward
 **/
function pwd_slowEquals(a, b) {
  var diff = (a.length << 24) ^ (b.length << 24);
  for (var i=0; (i < a.length) && (i < b.length); i++) {
    diff |= (a[i] << 24) ^ (b[i] << 24);
  }
  return diff === 0;
}
exports.pwd_slowEquals = pwd_slowEquals;

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
  var length = 25;
  var a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var id = '';
  for(var i=0; i < length; i++) {
    id += a[pwd_rand_secure(0, a.length)];
  }
  return id;
}
exports.pwd_uuid = pwd_uuid;

/**
 * Generate short or long collision resistant identifier
 * (aka very random UUID).  A short CUID is called a slug
 * and is a great solution for URL shortening.  A long
 * CUID is for session IDs, unsubscribe URLs and such.
 *
 * The iteration should be stored and incremented by the
 * caller.  It should start at 1 and be incremented each
 * time that this function is called.  It provides added
 * collision avoidance for the server.
 *
 * @param slug boolean True if short cuid.
 * @param iteration integer An integer starting at 1.
 * @return string Return generated cuid string.
 */
function pwd_cuid(slug, iteration)
{
  var strPad = '000000000000000000000000000000000000';
  var sum = 0;
  var blockSize = slug? 2: 4;
  var prefix = (blockSize == 4)? 'c': '';
  var mt = process.hrtime();
  mt = mt[0]
  var hash = new Date().getTime().toString(36);
  var timestamp = (blockSize == 4)? hash: hash.substring(-2);
  var count = iteration.toString(36);
  count = strPad.substring(0, strPad.length - count.length) + count;
  count = count.substring(count.length - blockSize);
  var pid = process.pid;
  pid = pid.toString(36);
  pid = strPad.substring(0, strPad.length - pid.length) + pid;
  pid = pid.substring(pid.length - 2);
  var hostname = os.hostname();
  sum = hostname.length + 36;
  for (var i=0; i < hostname.length; ++i) {
    sum += hostname.charCodeAt(i);
  }
  hostname = sum.toString(36);
  hostname = strPad.substring(0, strPad.length - hostname.length) + hostname;
  hostname = hostname.substring(hostname.length - 2);
  hostname = pid + hostname;
  hostname = (blockSize == 4)? hostname: pid.substring( 0, 1)+hostname.substring(hostname.length-1);
  var modifier = Math.pow(36, 4);
  var random1 = Math.random();
  random1 = random1 * modifier;
  random1 = random1.toString(36);
  random1 = strPad.substring(0, strPad.length - random1.length) + random1;
  random1 = random1.substring(random1.length - 4);
  random1 = (blockSize == 4)? random1: random.substring(-2);
  var random2 = '';
  if (blockSize === 4) {
    random2 = Math.random();
    random2 = random2 * modifier;
    random2 = random2.toString(36);
    random2 = strPad.substring(0, strPad.length - random2.length) + random2;
    random2 = random2.substring(random2.length - 4);
  }
  return prefix + timestamp + count + hostname + random1 + random2;
}

/**
 * Return a random number in a range.
 *
 * @param min int The minimum value.
 * @param max int The maximum value.
 * @return int A random value.
 *
 * @author DanielWHoward
 **/
function pwd_rand_secure(min, max) {
  var log = Math.log2(max - min);
  var bytes = Math.floor((log / 8) + 1);
  var bits = Math.floor(log + 1);
  var filter = Math.floor((1 << bits) - 1);
  var rnd = 0;
  do {
    rnd = parseInt(crypto.randomBytes(bytes).toString('hex'), 16);
    rnd = rnd & filter; // discard irrelevant bits
  } while (rnd >= (max - min));
  return Math.floor(min + rnd);
}
exports.pwd_rand_secure = pwd_rand_secure;
