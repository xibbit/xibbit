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
 * Add a resolve() function to an array of
 * promises that will resolve all promises in
 * parallel.
 *
 * @param a array The array of promise functions.
 * @return array The array of promise functions.
 *
 * @author DanielWHoward
 **/
function promise_map(a) {
  a.resolve = function(f) {
    var a = this;
    if (f) a.resolved = f;
    if (!a.length) a.resolved([]);
    a.forEach(function(p) {
      p.resolve = function(v) {
        p.r = v;
        // fiddle here to modify resolver
        if (a.every(function(p) {
          return typeof p.r !== 'undefined';
        })) a.resolved(a.map(function(p) {
          return p.r;
        }));
      };
      p.call(a);
    });
  };
  return a;
}
exports.map = promise_map;
/**
 * Add a resolve() function to an array of
 * promises that will resolve all promises in
 * serially, that is, one by one in order.
 *
 * @param a array The array of promise functions.
 * @return array The array of promise functions.
 *
 * @author DanielWHoward
 **/
function promise_mapSeries(a) {
  a.resolve = function(f) {
    var a = this;
    if (f) a.resolved = f;
    if (!a.length) a.resolved([]);
    a.forEach(function(p, i) {
      p.resolve = function(v) {
        p.r = v;
        if (i === (a.length - 1)) {
          a.resolved(a.map(function(p) {
            return p.r;
          }));
        } else {
          a[i+1].call(a);
        }
      };
    });
    if (a.length) a[0].call(a);
  };
  return a;
}
exports.mapSeries = promise_mapSeries;
