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
package pwd

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/sha512"
	"encoding/hex"
	"errors"
	"golang.org/x/crypto/bcrypt"
	"math"
	"math/big"
	"os"
	"strconv"
	"strings"
	"time"

	"publicfigure/config"
)

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
func Pwd_verify(pwd string, shadow string) (interface{}, error) {
	var verified interface{} = false
	var upgrade interface{} = false
	// test the password
	verify, e := Pwd_hash(pwd, shadow, config.Pwd_scheme, true)
	if v, ok := verify.(bool); ok && v {
		// test to see if the hash algorithm should change
		upgrade, e = Pwd_hash(pwd, shadow, config.Pwd_scheme, false)
		if upgrade == shadow {
			verified = true
		} else {
			verified = upgrade
		}
	}
	return verified, e
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
func Pwd_hash(pwd string, shadow string, scheme string, verify bool) (interface{}, error) {
	var ret interface{} = false
	var e error = nil
	hash := ""
	new_scheme := scheme
	// find the hash algorithm to use
	scheme = config.Pwd_scheme
	if (len(shadow) > len("$5$")) && (shadow[0:len("$5$")] == "$5$") {
		scheme = "$5$"
	} else if (len(shadow) > len("$6$")) && (shadow[0:len("$6$")] == "$6$") {
		scheme = "$6$"
	} else if (len(shadow) > len("$2y$")) && ((shadow[0:len("$2y$")] == "$2y$") || (shadow[0:len("$2b$")] == "$2b$") || (shadow[0:len("$2a$")] == "$2a$")) {
		parts := strings.Split(shadow, "$")
		scheme = "$" + parts[1] + "$" + parts[2] + "$"
	}
	if scheme == "fast" {
		scheme = "$5$"
	}
	if new_scheme == "fast" {
		new_scheme = "$5$"
	}
	if scheme == "good" {
		scheme = "$2a$11$"
	}
	if new_scheme == "good" {
		new_scheme = "$2a$11$"
	}
	if verify {
		// use the correct verification function
		verified := false
		scheme_args := strings.Split(scheme, "$")
		switch scheme_args[1] {
		case "2y":
			fallthrough
		case "2b":
			fallthrough
		case "2a":
			// verification API
			hash = shadow
			err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(pwd))
			if err == nil {
				verified = true
			}
		default:
			// generic verification
			hash, e := Pwd_hash(pwd, shadow, "", false)
			if e == nil {
				if pwd_slowEquals(hash.(string), shadow) {
					verified = true
				}
			}
		}
		ret = verified
	} else if new_scheme != "" {
		// rehash if there are 2 different hash algorithms
		if new_scheme != scheme {
			return Pwd_hash(pwd, "", "", false)
		} else {
			return shadow, nil
		}
	} else {
		// create the shadow password format value
		salt := ""
		scheme_args := strings.Split(scheme, "$")
		switch scheme_args[1] {
		case "5":
			// SHA-256
			if shadow == "" {
				salt = pwd_salt()
			} else {
				salt = strings.Split(shadow, "$")[2]
			}
			cryptVal := sha256.Sum256([]byte(salt + pwd))
			shadow = hex.EncodeToString(cryptVal[:])
			shadow = "$5$" + salt + "$" + shadow
			ret = shadow
		case "6":
			// SHA-512
			if shadow == "" {
				salt = pwd_salt()
			} else {
				salt = strings.Split(shadow, "$")[2]
			}
			cryptVal := sha512.Sum512([]byte(salt + pwd))
			shadow = hex.EncodeToString(cryptVal[:])
			shadow = "$6$" + salt + "$" + shadow
			ret = shadow
		case "2y":
			fallthrough
		case "2b":
			fallthrough
		case "2a":
			// bcrypt
			cost, _ := strconv.Atoi(scheme_args[2])
			pwdBytes, _ := bcrypt.GenerateFromPassword([]byte(pwd), cost)
			shadow = string(pwdBytes)
			ret = shadow
		default:
			e = errors.New("Warning: unknown hashing algorithm: " + scheme + " in pwd.go on line 177")
		}
	}
	return ret, e
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
func pwd_salt() string {
	var length = 32
	var a = "0123456789abcdef"
	var salt = ""
	for i := 0; i < (length * 2); i++ {
		salt += string(a[Pwd_rand_secure(0, len(a))])
	}
	return salt
}

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
func pwd_slowEquals(a string, b string) bool {
	diff := uint32(len(a)) ^ uint32(len(b))
	for i := 0; (i < len(a)) && (i < len(b)); i++ {
		diff |= uint32(a[i]) ^ uint32(b[i])
	}
	return diff == 0
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
func pwd_uuid() string {
	var length = 25
	var a = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
	var id = ""
	for i := 0; i < length; i++ {
		id += string(a[Pwd_rand_secure(0, len(a))])
	}
	return id
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
func Pwd_cuid(slug bool, iteration int) string {
	const strPad = "000000000000000000000000000000000000"
	sum := 0
	blockSize := 2
	if !slug {
		blockSize = 4
	}
	prefix := "c"
	if blockSize != 4 {
		prefix = ""
	}
	utc, _ := time.LoadLocation("UTC")
	now := time.Now().In(utc)
	mt := uint64(now.UnixNano() / 1000000)
	hash := strconv.FormatUint(mt, 36)
	timestamp := hash
	if blockSize != 4 {
		timestamp = hash[len(hash)-2:]
	}
	count := strconv.FormatUint(uint64(iteration), 36)
	count = strPad[:len(strPad)-len(count)] + count
	count = count[len(count)-blockSize:]
	pidInt := os.Getpid()
	pid := strconv.FormatUint(uint64(pidInt), 36)
	pid = strPad[:len(strPad)-len(pid)] + pid
	pid = pid[len(pid)-2:]
	hostname, _ := os.Hostname()
	sum = len(hostname) + 36
	for _, c := range hostname {
		sum += int(c)
	}
	hostname = strconv.FormatUint(uint64(sum), 36)
	hostname = strPad[:len(strPad)-len(hostname)] + hostname
	hostname = hostname[len(hostname)-2:]
	hostname = pid + hostname
	if blockSize != 4 {
		hostname = pid[0:1] + hostname[len(hostname)-1:]
	}
	modifier := math.Pow(36, 4)
	random1Int, _ := rand.Int(rand.Reader, big.NewInt(math.MaxInt64))
	random1Num := float64(random1Int.Int64()) / math.MaxInt64
	random1Num = random1Num * modifier
	random1 := strconv.FormatUint(uint64(random1Num), 36)
	random1 = strPad[:len(strPad)-len(random1)] + random1
	random1 = random1[len(random1)-4:]
	if blockSize != 4 {
		random1 = random1[len(random1)-2:]
	}
	random2 := ""
	if blockSize == 4 {
		random2Int, _ := rand.Int(rand.Reader, big.NewInt(math.MaxInt64))
		random2Num := float64(random2Int.Int64()) / math.MaxInt64
		random2Num = random2Num * modifier
		random2 = strconv.FormatUint(uint64(random2Num), 36)
		random2 = strPad[:len(strPad)-len(random2)] + random2
		random2 = random2[len(random2)-4:]
	}
	return prefix + timestamp + count + hostname + random1 + random2
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
func Pwd_rand_secure(min int, max int) int {
	var log = math.Log2(float64(max - min))
	var bytes = int(math.Floor((log / 8) + 1))
	var bits = int(math.Floor(log + 1))
	var filter = uint(math.Floor(float64(int(1)<<bits - 1)))
	var rnd = uint(0)
	for {
		b := make([]byte, bytes)
		rand.Read(b)
		n, _ := strconv.ParseUint(hex.EncodeToString(b), 16, 64)
		rnd = uint(n)
		rnd = rnd & filter // discard irrelevant bits
		if !(rnd >= uint(max-min)) {
			break
		}
	}
	return int(math.Floor(float64(min + int(rnd))))
}
