<?php
///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
define('AES_256_CBC', 'aes-256-cbc');
/**
 * Return a random encryption key.
 *
 * @return string A random set of bytes.
 *
 * @author DanielWHoward
 **/
function crypt_key() {
  return openssl_random_pseudo_bytes(32);
}

/**
 * Return a random initialization vector for encryption.
 *
 * @return string A random set of bytes.
 *
 * @author DanielWHoward
 **/
function crypt_iv() {
  return openssl_random_pseudo_bytes(openssl_cipher_iv_length(AES_256_CBC));
}

/**
 * Encrypt data using a key and an initialization vector.
 *
 * @param $data string The binary or text data to encrypt.
 * @param $key string The binary encryption key.
 * @param $iv string The binary initialization vector.
 * @return string Base64-encoded encrypted data.
 *
 * @author DanielWHoward
 **/
function crypt_encrypt($data, $key, $iv) {
  return openssl_encrypt($data, AES_256_CBC, $key, 0, $iv);
}

/**
 * Encrypt data using a key and an initialization vector.
 *
 * @param $encrypted_data string The Base64-encoded encrypted data.
 * @param $key string The binary encryption key.
 * @param $iv string The binary initialization vector.
 * @return string The binary or string data.
 *
 * @author DanielWHoward
 **/
function crypt_decrypt($encrypted_data, $key, $iv) {
  return openssl_decrypt($encrypted_data, AES_256_CBC, $key, 0, $iv);
}

/**
 * Return the pseudo-shadow format for encrypted data.
 *
 * @param $encrypted_data string The Base64-encoded encrypted data.
 * @param $iv string The binary initialization vector.
 * @return string The pseudo-shadow text format.
 *
 * @author DanielWHoward
 **/
function crypt_shadow($encrypted_data, $iv) {
  return '$'.AES_256_CBC.'$'.strtoupper(bin2hex($iv)).'$'.$encrypted_data;
}

/**
 * Encrypt data using a random initialization vector and return in
 * pseudo shadow format.
 *
 * @param $data string The binary or text data to encrypt.
 * @param $key string The binary encryption key.
 * @return string The pseudo-shadow text format.
 *
 * @author DanielWHoward
 **/
function crypt_shadow_encrypt($data, $key) {
  $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length(AES_256_CBC));
  $encrypted_data = openssl_encrypt($data, AES_256_CBC, $key, 0, $iv);
  return '$'.AES_256_CBC.'$'.strtoupper(bin2hex($iv)).'$'.$encrypted_data;
}

/**
 * Decrypt a pseudo shadow format string.
 *
 * @return $shadow string A pseudo shadow format encrypted string.
 * @param $key string The binary encryption key.
 * @return string The binary or string data.
 *
 * @author DanielWHoward
 **/
function crypt_shadow_decrypt($shadow, $key) {
  $fields = explode('$', $shadow);
  return openssl_decrypt($fields[3], AES_256_CBC, $key, 0, hex2bin($fields[2]));
}

/**
 * Return a command line.
 *
 * @param $encrypted_data string The Base64-encoded encrypted data.
 * @param $key string The binary encryption key.
 * @param $iv string The binary initialization vector.
 * @return string The command line to run to decrypt the data.
 *
 * @author DanielWHoward
 **/
function crypt_commandline($encrypted_data, $key, $iv) {
  return 'echo "'.$encrypted_data.'" | base64 -d | openssl aes-256-cbc -d -nosalt -K '.strtoupper(bin2hex($key)).' -iv '.strtoupper(bin2hex($iv)).' -out publicfigure_`date \'+%Y%m%d%H%M%S\'`.sql.txt'."\n";
}
/*
// demonstration data
$encryption_key = crypt_key();
$data = 'A piece of text to encrypt and decrypt.'."\n";
print 'Plain: '.$data;

// encrypt
$iv = crypt_iv();
$encrypted_data = crypt_encrypt($data, $encryption_key, $iv);
print 'Encrypted into Base64: '.$encrypted_data."\n";

// convert to pseudo-shadow format
$shadow = crypt_shadow($encrypted_data, $iv);
// $shadow = crypt_shadow_encrypt($data, $encryption_key);
print 'Shadow: '.$shadow."\n";

// decrypt
$decrypted = crypt_decrypt($encrypted_data, $encryption_key, $iv);
print 'Decrypted: '.$decrypted;

// decrypt from pseudo-shadow format
$decrypted = crypt_shadow_decrypt($shadow, $encryption_key);
print 'Decrypted from shadow: '.$decrypted;

// show command line
print "\n".'Command line:'."\n";
print crypt_commandline($encrypted_data, $encryption_key, $iv);
*/
?>
