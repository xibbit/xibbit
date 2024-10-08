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
/**
 * Return true if this array is numeric.
 *
 * @param $a array An array.
 * @return boolean True if it is a numeric array.
 *
 * @author DanielWHoward
 **/
function has_numeric_keys($a) {
  return is_array($a) // is_numeric_array
    && (count(array_filter(array_keys($a), 'is_string')) === 0);
}
/**
 * Return true if this array is associative.
 *
 * An associative array has at least one string key.
 *
 * @param $a array An array.
 * @return boolean True if it is an associative array.
 *
 * @author DanielWHoward
 **/
function has_string_keys($a) {
  return is_array($a) // is_map
    && (count(array_filter(array_keys($a), 'is_string')) > 0);
}
/**
 * Concatenate arrays with numerical indices.
 *
 * @param $a array An array to concentate.
 * @return array The concatenated array.
 *
 * @author DanielWHoward
 **/
function array_concat($a, $b, $c=array(), $d=array()) {
  return array_merge($a, $b, $c, $d);
}
?>
