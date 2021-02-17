///////////////////////////////////////////////////////
//                     xibbit 1.50                   //
//    This source code is a trade secret owned by    //
// Daniel W. Howard and Sanjana A. Joshi Partnership //
//              Do not remove this notice            //
///////////////////////////////////////////////////////
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
