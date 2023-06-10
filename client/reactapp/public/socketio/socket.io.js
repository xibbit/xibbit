/*!
 * Socket.IO v4.4.1
 * (c) 2014-2023 Guillermo Rauch
 * Released under the MIT License.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.io = {}));
})(this, (function (exports) { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _construct(Parent, args, Class) {
    if (_isNativeReflectConstruct()) {
      _construct = Reflect.construct;
    } else {
      _construct = function _construct(Parent, args, Class) {
        var a = [null];
        a.push.apply(a, args);
        var Constructor = Function.bind.apply(Parent, a);
        var instance = new Constructor();
        if (Class) _setPrototypeOf(instance, Class.prototype);
        return instance;
      };
    }

    return _construct.apply(null, arguments);
  }

  function _isNativeFunction(fn) {
    return Function.toString.call(fn).indexOf("[native code]") !== -1;
  }

  function _wrapNativeSuper(Class) {
    var _cache = typeof Map === "function" ? new Map() : undefined;

    _wrapNativeSuper = function _wrapNativeSuper(Class) {
      if (Class === null || !_isNativeFunction(Class)) return Class;

      if (typeof Class !== "function") {
        throw new TypeError("Super expression must either be null or a function");
      }

      if (typeof _cache !== "undefined") {
        if (_cache.has(Class)) return _cache.get(Class);

        _cache.set(Class, Wrapper);
      }

      function Wrapper() {
        return _construct(Class, arguments, _getPrototypeOf(this).constructor);
      }

      Wrapper.prototype = Object.create(Class.prototype, {
        constructor: {
          value: Wrapper,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
      return _setPrototypeOf(Wrapper, Class);
    };

    return _wrapNativeSuper(Class);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }

    return _assertThisInitialized(self);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }

    return object;
  }

  function _get(target, property, receiver) {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get;
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);

        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);

        if (desc.get) {
          return desc.get.call(receiver);
        }

        return desc.value;
      };
    }

    return _get(target, property, receiver || target);
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"];

    if (!it) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;

        var F = function () {};

        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var normalCompletion = true,
        didErr = false,
        err;
    return {
      s: function () {
        it = it.call(o);
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  var hasCors = {exports: {}};

  /**
   * Module exports.
   *
   * Logic borrowed from Modernizr:
   *
   *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
   */

  try {
    hasCors.exports = typeof XMLHttpRequest !== 'undefined' && 'withCredentials' in new XMLHttpRequest();
  } catch (err) {
    // if XMLHttp support is disabled in IE then it will throw
    // when trying to create
    hasCors.exports = false;
  }

  var hasCORS = hasCors.exports;

  var globalThis = (function () {
    if (typeof self !== "undefined") {
      return self;
    } else if (typeof window !== "undefined") {
      return window;
    } else {
      return Function("return this")();
    }
  })();

  // browser shim for xmlhttprequest module
  function XMLHttpRequest$2 (opts) {
    var xdomain = opts.xdomain; // XMLHttpRequest can be disabled on IE

    try {
      if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {}

    if (!xdomain) {
      try {
        return new globalThis[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
      } catch (e) {}
    }
  }

  function pick(obj) {
    for (var _len = arguments.length, attr = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      attr[_key - 1] = arguments[_key];
    }

    return attr.reduce(function (acc, k) {
      if (obj.hasOwnProperty(k)) {
        acc[k] = obj[k];
      }

      return acc;
    }, {});
  } // Keep a reference to the real timeout functions so they can be used when overridden

  var NATIVE_SET_TIMEOUT = setTimeout;
  var NATIVE_CLEAR_TIMEOUT = clearTimeout;
  function installTimerFunctions(obj, opts) {
    if (opts.useNativeTimers) {
      obj.setTimeoutFn = NATIVE_SET_TIMEOUT.bind(globalThis);
      obj.clearTimeoutFn = NATIVE_CLEAR_TIMEOUT.bind(globalThis);
    } else {
      obj.setTimeoutFn = setTimeout.bind(globalThis);
      obj.clearTimeoutFn = clearTimeout.bind(globalThis);
    }
  } // base64 encoded buffers are about 33% bigger (https://en.wikipedia.org/wiki/Base64)

  var BASE64_OVERHEAD = 1.33; // we could also have used `new Blob([obj]).size`, but it isn't supported in IE9

  function byteLength(obj) {
    if (typeof obj === "string") {
      return utf8Length(obj);
    } // arraybuffer or blob


    return Math.ceil((obj.byteLength || obj.size) * BASE64_OVERHEAD);
  }

  function utf8Length(str) {
    var c = 0,
        length = 0;

    for (var i = 0, l = str.length; i < l; i++) {
      c = str.charCodeAt(i);

      if (c < 0x80) {
        length += 1;
      } else if (c < 0x800) {
        length += 2;
      } else if (c < 0xd800 || c >= 0xe000) {
        length += 3;
      } else {
        i++;
        length += 4;
      }
    }

    return length;
  }

  /**
   * Expose `Emitter`.
   */

  var Emitter_1 = Emitter$2;
  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */

  function Emitter$2(obj) {
    if (obj) return mixin$2(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */


  function mixin$2(obj) {
    for (var key in Emitter$2.prototype) {
      obj[key] = Emitter$2.prototype[key];
    }

    return obj;
  }
  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter$2.prototype.on = Emitter$2.prototype.addEventListener = function (event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
    return this;
  };
  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter$2.prototype.once = function (event, fn) {
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };
  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter$2.prototype.off = Emitter$2.prototype.removeListener = Emitter$2.prototype.removeAllListeners = Emitter$2.prototype.removeEventListener = function (event, fn) {
    this._callbacks = this._callbacks || {}; // all

    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    } // specific event


    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this; // remove all handlers

    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    } // remove specific handler


    var cb;

    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];

      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    } // Remove event specific arrays for event types that no
    // one is subscribed for to avoid memory leak.


    if (callbacks.length === 0) {
      delete this._callbacks['$' + event];
    }

    return this;
  };
  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */


  Emitter$2.prototype.emit = function (event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1),
        callbacks = this._callbacks['$' + event];

    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }

    if (callbacks) {
      callbacks = callbacks.slice(0);

      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  }; // alias used for reserved events (protected method)


  Emitter$2.prototype.emitReserved = Emitter$2.prototype.emit;
  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */

  Emitter$2.prototype.listeners = function (event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };
  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */


  Emitter$2.prototype.hasListeners = function (event) {
    return !!this.listeners(event).length;
  };

  var PACKET_TYPES = Object.create(null); // no Map = no polyfill

  PACKET_TYPES["open"] = "0";
  PACKET_TYPES["close"] = "1";
  PACKET_TYPES["ping"] = "2";
  PACKET_TYPES["pong"] = "3";
  PACKET_TYPES["message"] = "4";
  PACKET_TYPES["upgrade"] = "5";
  PACKET_TYPES["noop"] = "6";
  var PACKET_TYPES_REVERSE = Object.create(null);
  Object.keys(PACKET_TYPES).forEach(function (key) {
    PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
  });
  var ERROR_PACKET$1 = {
    type: "error",
    data: "parser error"
  };

  var withNativeBlob$4 = typeof Blob === "function" || typeof Blob !== "undefined" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]";
  var withNativeArrayBuffer$5 = typeof ArrayBuffer === "function"; // ArrayBuffer.isView method is not defined in IE10

  var isView$4 = function isView(obj) {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj && obj.buffer instanceof ArrayBuffer;
  };

  var encodePacket$1 = function encodePacket(_ref, supportsBinary, callback) {
    var type = _ref.type,
        data = _ref.data;

    if (withNativeBlob$4 && data instanceof Blob) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(data, callback);
      }
    } else if (withNativeArrayBuffer$5 && (data instanceof ArrayBuffer || isView$4(data))) {
      if (supportsBinary) {
        return callback(data);
      } else {
        return encodeBlobAsBase64(new Blob([data]), callback);
      }
    } // plain string


    return callback(PACKET_TYPES[type] + (data || ""));
  };

  var encodeBlobAsBase64 = function encodeBlobAsBase64(data, callback) {
    var fileReader = new FileReader();

    fileReader.onload = function () {
      var content = fileReader.result.split(",")[1];
      callback("b" + content);
    };

    return fileReader.readAsDataURL(data);
  };

  /*
   * base64-arraybuffer 1.0.1 <https://github.com/niklasvh/base64-arraybuffer>
   * Copyright (c) 2021 Niklas von Hertzen <https://hertzen.com>
   * Released under MIT License
   */
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'; // Use a lookup table to find the index.

  var lookup$2 = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);

  for (var i$1 = 0; i$1 < chars.length; i$1++) {
    lookup$2[chars.charCodeAt(i$1)] = i$1;
  }

  var decode$1 = function decode(base64) {
    var bufferLength = base64.length * 0.75,
        len = base64.length,
        i,
        p = 0,
        encoded1,
        encoded2,
        encoded3,
        encoded4;

    if (base64[base64.length - 1] === '=') {
      bufferLength--;

      if (base64[base64.length - 2] === '=') {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i += 4) {
      encoded1 = lookup$2[base64.charCodeAt(i)];
      encoded2 = lookup$2[base64.charCodeAt(i + 1)];
      encoded3 = lookup$2[base64.charCodeAt(i + 2)];
      encoded4 = lookup$2[base64.charCodeAt(i + 3)];
      bytes[p++] = encoded1 << 2 | encoded2 >> 4;
      bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
      bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
    }

    return arraybuffer;
  };

  var withNativeArrayBuffer$4 = typeof ArrayBuffer === "function";

  var decodePacket$1 = function decodePacket(encodedPacket, binaryType) {
    if (typeof encodedPacket !== "string") {
      return {
        type: "message",
        data: mapBinary(encodedPacket, binaryType)
      };
    }

    var type = encodedPacket.charAt(0);

    if (type === "b") {
      return {
        type: "message",
        data: decodeBase64Packet$1(encodedPacket.substring(1), binaryType)
      };
    }

    var packetType = PACKET_TYPES_REVERSE[type];

    if (!packetType) {
      return ERROR_PACKET$1;
    }

    return encodedPacket.length > 1 ? {
      type: PACKET_TYPES_REVERSE[type],
      data: encodedPacket.substring(1)
    } : {
      type: PACKET_TYPES_REVERSE[type]
    };
  };

  var decodeBase64Packet$1 = function decodeBase64Packet(data, binaryType) {
    if (withNativeArrayBuffer$4) {
      var decoded = decode$1(data);
      return mapBinary(decoded, binaryType);
    } else {
      return {
        base64: true,
        data: data
      }; // fallback for old browsers
    }
  };

  var mapBinary = function mapBinary(data, binaryType) {
    switch (binaryType) {
      case "blob":
        return data instanceof ArrayBuffer ? new Blob([data]) : data;

      case "arraybuffer":
      default:
        return data;
      // assuming the data is already an ArrayBuffer
    }
  };

  var SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

  var encodePayload$1 = function encodePayload(packets, callback) {
    // some packets may be added to the array while encoding, so the initial length must be saved
    var length = packets.length;
    var encodedPackets = new Array(length);
    var count = 0;
    packets.forEach(function (packet, i) {
      // force base64 encoding for binary packets
      encodePacket$1(packet, false, function (encodedPacket) {
        encodedPackets[i] = encodedPacket;

        if (++count === length) {
          callback(encodedPackets.join(SEPARATOR));
        }
      });
    });
  };

  var decodePayload$1 = function decodePayload(encodedPayload, binaryType) {
    var encodedPackets = encodedPayload.split(SEPARATOR);
    var packets = [];

    for (var i = 0; i < encodedPackets.length; i++) {
      var decodedPacket = decodePacket$1(encodedPackets[i], binaryType);
      packets.push(decodedPacket);

      if (decodedPacket.type === "error") {
        break;
      }
    }

    return packets;
  };

  var protocol$5 = 4;

  var Transport$1 = /*#__PURE__*/function (_Emitter) {
    _inherits(Transport, _Emitter);

    var _super = _createSuper(Transport);

    /**
     * Transport abstract constructor.
     *
     * @param {Object} options.
     * @api private
     */
    function Transport(opts) {
      var _this;

      _classCallCheck(this, Transport);

      _this = _super.call(this);
      _this.writable = false;
      installTimerFunctions(_assertThisInitialized(_this), opts);
      _this.opts = opts;
      _this.query = opts.query;
      _this.readyState = "";
      _this.socket = opts.socket;
      return _this;
    }
    /**
     * Emits an error.
     *
     * @param {String} str
     * @return {Transport} for chaining
     * @api protected
     */


    _createClass(Transport, [{
      key: "onError",
      value: function onError(msg, desc) {
        var err = new Error(msg); // @ts-ignore

        err.type = "TransportError"; // @ts-ignore

        err.description = desc;

        _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "error", err);

        return this;
      }
      /**
       * Opens the transport.
       *
       * @api public
       */

    }, {
      key: "open",
      value: function open() {
        if ("closed" === this.readyState || "" === this.readyState) {
          this.readyState = "opening";
          this.doOpen();
        }

        return this;
      }
      /**
       * Closes the transport.
       *
       * @api public
       */

    }, {
      key: "close",
      value: function close() {
        if ("opening" === this.readyState || "open" === this.readyState) {
          this.doClose();
          this.onClose();
        }

        return this;
      }
      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       * @api public
       */

    }, {
      key: "send",
      value: function send(packets) {
        if ("open" === this.readyState) {
          this.write(packets);
        }
      }
      /**
       * Called upon open
       *
       * @api protected
       */

    }, {
      key: "onOpen",
      value: function onOpen() {
        this.readyState = "open";
        this.writable = true;

        _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "open");
      }
      /**
       * Called with data.
       *
       * @param {String} data
       * @api protected
       */

    }, {
      key: "onData",
      value: function onData(data) {
        var packet = decodePacket$1(data, this.socket.binaryType);
        this.onPacket(packet);
      }
      /**
       * Called with a decoded packet.
       *
       * @api protected
       */

    }, {
      key: "onPacket",
      value: function onPacket(packet) {
        _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "packet", packet);
      }
      /**
       * Called upon close.
       *
       * @api protected
       */

    }, {
      key: "onClose",
      value: function onClose() {
        this.readyState = "closed";

        _get(_getPrototypeOf(Transport.prototype), "emit", this).call(this, "close");
      }
    }]);

    return Transport;
  }(Emitter_1);

  var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split(''),
      length = 64,
      map$1 = {},
      seed = 0,
      i = 0,
      prev;
  /**
   * Return a string representing the specified number.
   *
   * @param {Number} num The number to convert.
   * @returns {String} The string representation of the number.
   * @api public
   */

  function encode(num) {
    var encoded = '';

    do {
      encoded = alphabet[num % length] + encoded;
      num = Math.floor(num / length);
    } while (num > 0);

    return encoded;
  }
  /**
   * Return the integer value specified by the given string.
   *
   * @param {String} str The string to convert.
   * @returns {Number} The integer value represented by the string.
   * @api public
   */


  function decode(str) {
    var decoded = 0;

    for (i = 0; i < str.length; i++) {
      decoded = decoded * length + map$1[str.charAt(i)];
    }

    return decoded;
  }
  /**
   * Yeast: A tiny growing id generator.
   *
   * @returns {String} A unique id.
   * @api public
   */


  function yeast() {
    var now = encode(+new Date());
    if (now !== prev) return seed = 0, prev = now;
    return now + '.' + encode(seed++);
  } //
  // Map each character to its index.
  //


  for (; i < length; i++) {
    map$1[alphabet[i]] = i;
  } //
  // Expose the `yeast`, `encode` and `decode` functions.
  //


  yeast.encode = encode;
  yeast.decode = decode;
  var yeast_1 = yeast;

  var parseqs$1 = {};

  /**
   * Compiles a querystring
   * Returns string representation of the object
   *
   * @param {Object}
   * @api private
   */

  parseqs$1.encode = function (obj) {
    var str = '';

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length) str += '&';
        str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
      }
    }

    return str;
  };
  /**
   * Parses a simple querystring into an object
   *
   * @param {String} qs
   * @api private
   */


  parseqs$1.decode = function (qs) {
    var qry = {};
    var pairs = qs.split('&');

    for (var i = 0, l = pairs.length; i < l; i++) {
      var pair = pairs[i].split('=');
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return qry;
  };

  var Polling$1 = /*#__PURE__*/function (_Transport) {
    _inherits(Polling, _Transport);

    var _super = _createSuper(Polling);

    function Polling() {
      var _this;

      _classCallCheck(this, Polling);

      _this = _super.apply(this, arguments);
      _this.polling = false;
      return _this;
    }
    /**
     * Transport name.
     */


    _createClass(Polling, [{
      key: "name",
      get: function get() {
        return "polling";
      }
      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @api private
       */

    }, {
      key: "doOpen",
      value: function doOpen() {
        this.poll();
      }
      /**
       * Pauses polling.
       *
       * @param {Function} callback upon buffers are flushed and transport is paused
       * @api private
       */

    }, {
      key: "pause",
      value: function pause(onPause) {
        var _this2 = this;

        this.readyState = "pausing";

        var pause = function pause() {
          _this2.readyState = "paused";
          onPause();
        };

        if (this.polling || !this.writable) {
          var total = 0;

          if (this.polling) {
            total++;
            this.once("pollComplete", function () {
              --total || pause();
            });
          }

          if (!this.writable) {
            total++;
            this.once("drain", function () {
              --total || pause();
            });
          }
        } else {
          pause();
        }
      }
      /**
       * Starts polling cycle.
       *
       * @api public
       */

    }, {
      key: "poll",
      value: function poll() {
        this.polling = true;
        this.doPoll();
        this.emit("poll");
      }
      /**
       * Overloads onData to detect payloads.
       *
       * @api private
       */

    }, {
      key: "onData",
      value: function onData(data) {
        var _this3 = this;

        var callback = function callback(packet) {
          // if its the first message we consider the transport open
          if ("opening" === _this3.readyState && packet.type === "open") {
            _this3.onOpen();
          } // if its a close packet, we close the ongoing requests


          if ("close" === packet.type) {
            _this3.onClose();

            return false;
          } // otherwise bypass onData and handle the message


          _this3.onPacket(packet);
        }; // decode payload


        decodePayload$1(data, this.socket.binaryType).forEach(callback); // if an event did not trigger closing

        if ("closed" !== this.readyState) {
          // if we got data we're not polling
          this.polling = false;
          this.emit("pollComplete");

          if ("open" === this.readyState) {
            this.poll();
          }
        }
      }
      /**
       * For polling, send a close packet.
       *
       * @api private
       */

    }, {
      key: "doClose",
      value: function doClose() {
        var _this4 = this;

        var close = function close() {
          _this4.write([{
            type: "close"
          }]);
        };

        if ("open" === this.readyState) {
          close();
        } else {
          // in case we're trying to close while
          // handshaking is in progress (GH-164)
          this.once("open", close);
        }
      }
      /**
       * Writes a packets payload.
       *
       * @param {Array} data packets
       * @param {Function} drain callback
       * @api private
       */

    }, {
      key: "write",
      value: function write(packets) {
        var _this5 = this;

        this.writable = false;
        encodePayload$1(packets, function (data) {
          _this5.doWrite(data, function () {
            _this5.writable = true;

            _this5.emit("drain");
          });
        });
      }
      /**
       * Generates uri for connection.
       *
       * @api private
       */

    }, {
      key: "uri",
      value: function uri() {
        var query = this.query || {};
        var schema = this.opts.secure ? "https" : "http";
        var port = ""; // cache busting is forced

        if (false !== this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        if (!this.supportsBinary && !query.sid) {
          query.b64 = 1;
        } // avoid port if default for schema


        if (this.opts.port && ("https" === schema && Number(this.opts.port) !== 443 || "http" === schema && Number(this.opts.port) !== 80)) {
          port = ":" + this.opts.port;
        }

        var encodedQuery = parseqs$1.encode(query);
        var ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + (encodedQuery.length ? "?" + encodedQuery : "");
      }
    }]);

    return Polling;
  }(Transport$1);

  /**
   * Empty function
   */

  function empty$2() {}

  var hasXHR2$1 = function () {
    var xhr = new XMLHttpRequest$2({
      xdomain: false
    });
    return null != xhr.responseType;
  }();

  var XHR$1 = /*#__PURE__*/function (_Polling) {
    _inherits(XHR, _Polling);

    var _super = _createSuper(XHR);

    /**
     * XHR Polling constructor.
     *
     * @param {Object} opts
     * @api public
     */
    function XHR(opts) {
      var _this;

      _classCallCheck(this, XHR);

      _this = _super.call(this, opts);

      if (typeof location !== "undefined") {
        var isSSL = "https:" === location.protocol;
        var port = location.port; // some user agents have empty `location.port`

        if (!port) {
          port = isSSL ? "443" : "80";
        }

        _this.xd = typeof location !== "undefined" && opts.hostname !== location.hostname || port !== opts.port;
        _this.xs = opts.secure !== isSSL;
      }
      /**
       * XHR supports binary
       */


      var forceBase64 = opts && opts.forceBase64;
      _this.supportsBinary = hasXHR2$1 && !forceBase64;
      return _this;
    }
    /**
     * Creates a request.
     *
     * @param {String} method
     * @api private
     */


    _createClass(XHR, [{
      key: "request",
      value: function request() {
        var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

        _extends(opts, {
          xd: this.xd,
          xs: this.xs
        }, this.opts);

        return new Request$1(this.uri(), opts);
      }
      /**
       * Sends data.
       *
       * @param {String} data to send.
       * @param {Function} called upon flush.
       * @api private
       */

    }, {
      key: "doWrite",
      value: function doWrite(data, fn) {
        var _this2 = this;

        var req = this.request({
          method: "POST",
          data: data
        });
        req.on("success", fn);
        req.on("error", function (err) {
          _this2.onError("xhr post error", err);
        });
      }
      /**
       * Starts a poll cycle.
       *
       * @api private
       */

    }, {
      key: "doPoll",
      value: function doPoll() {
        var _this3 = this;

        var req = this.request();
        req.on("data", this.onData.bind(this));
        req.on("error", function (err) {
          _this3.onError("xhr poll error", err);
        });
        this.pollXhr = req;
      }
    }]);

    return XHR;
  }(Polling$1);
  var Request$1 = /*#__PURE__*/function (_Emitter) {
    _inherits(Request, _Emitter);

    var _super2 = _createSuper(Request);

    /**
     * Request constructor
     *
     * @param {Object} options
     * @api public
     */
    function Request(uri, opts) {
      var _this4;

      _classCallCheck(this, Request);

      _this4 = _super2.call(this);
      installTimerFunctions(_assertThisInitialized(_this4), opts);
      _this4.opts = opts;
      _this4.method = opts.method || "GET";
      _this4.uri = uri;
      _this4.async = false !== opts.async;
      _this4.data = undefined !== opts.data ? opts.data : null;

      _this4.create();

      return _this4;
    }
    /**
     * Creates the XHR object and sends the request.
     *
     * @api private
     */


    _createClass(Request, [{
      key: "create",
      value: function create() {
        var _this5 = this;

        var opts = pick(this.opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
        opts.xdomain = !!this.opts.xd;
        opts.xscheme = !!this.opts.xs;
        var xhr = this.xhr = new XMLHttpRequest$2(opts);

        try {
          xhr.open(this.method, this.uri, this.async);

          try {
            if (this.opts.extraHeaders) {
              xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);

              for (var i in this.opts.extraHeaders) {
                if (this.opts.extraHeaders.hasOwnProperty(i)) {
                  xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                }
              }
            }
          } catch (e) {}

          if ("POST" === this.method) {
            try {
              xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (e) {}
          }

          try {
            xhr.setRequestHeader("Accept", "*/*");
          } catch (e) {} // ie6 check


          if ("withCredentials" in xhr) {
            xhr.withCredentials = this.opts.withCredentials;
          }

          if (this.opts.requestTimeout) {
            xhr.timeout = this.opts.requestTimeout;
          }

          xhr.onreadystatechange = function () {
            if (4 !== xhr.readyState) return;

            if (200 === xhr.status || 1223 === xhr.status) {
              _this5.onLoad();
            } else {
              // make sure the `error` event handler that's user-set
              // does not throw in the same tick and gets caught here
              _this5.setTimeoutFn(function () {
                _this5.onError(typeof xhr.status === "number" ? xhr.status : 0);
              }, 0);
            }
          };

          xhr.send(this.data);
        } catch (e) {
          // Need to defer since .create() is called directly from the constructor
          // and thus the 'error' event can only be only bound *after* this exception
          // occurs.  Therefore, also, we cannot throw here at all.
          this.setTimeoutFn(function () {
            _this5.onError(e);
          }, 0);
          return;
        }

        if (typeof document !== "undefined") {
          this.index = Request.requestsCount++;
          Request.requests[this.index] = this;
        }
      }
      /**
       * Called upon successful response.
       *
       * @api private
       */

    }, {
      key: "onSuccess",
      value: function onSuccess() {
        this.emit("success");
        this.cleanup();
      }
      /**
       * Called if we have data.
       *
       * @api private
       */

    }, {
      key: "onData",
      value: function onData(data) {
        this.emit("data", data);
        this.onSuccess();
      }
      /**
       * Called upon error.
       *
       * @api private
       */

    }, {
      key: "onError",
      value: function onError(err) {
        this.emit("error", err);
        this.cleanup(true);
      }
      /**
       * Cleans up house.
       *
       * @api private
       */

    }, {
      key: "cleanup",
      value: function cleanup(fromError) {
        if ("undefined" === typeof this.xhr || null === this.xhr) {
          return;
        }

        this.xhr.onreadystatechange = empty$2;

        if (fromError) {
          try {
            this.xhr.abort();
          } catch (e) {}
        }

        if (typeof document !== "undefined") {
          delete Request.requests[this.index];
        }

        this.xhr = null;
      }
      /**
       * Called upon load.
       *
       * @api private
       */

    }, {
      key: "onLoad",
      value: function onLoad() {
        var data = this.xhr.responseText;

        if (data !== null) {
          this.onData(data);
        }
      }
      /**
       * Aborts the request.
       *
       * @api public
       */

    }, {
      key: "abort",
      value: function abort() {
        this.cleanup();
      }
    }]);

    return Request;
  }(Emitter_1);
  Request$1.requestsCount = 0;
  Request$1.requests = {};
  /**
   * Aborts pending requests when unloading the window. This is needed to prevent
   * memory leaks (e.g. when using IE) and to ensure that no spurious error is
   * emitted.
   */

  if (typeof document !== "undefined") {
    // @ts-ignore
    if (typeof attachEvent === "function") {
      // @ts-ignore
      attachEvent("onunload", unloadHandler$1);
    } else if (typeof addEventListener === "function") {
      var terminationEvent$1 = "onpagehide" in globalThis ? "pagehide" : "unload";
      addEventListener(terminationEvent$1, unloadHandler$1, false);
    }
  }

  function unloadHandler$1() {
    for (var i in Request$1.requests) {
      if (Request$1.requests.hasOwnProperty(i)) {
        Request$1.requests[i].abort();
      }
    }
  }

  var nextTick = function () {
    var isPromiseAvailable = typeof Promise === "function" && typeof Promise.resolve === "function";

    if (isPromiseAvailable) {
      return function (cb) {
        return Promise.resolve().then(cb);
      };
    } else {
      return function (cb, setTimeoutFn) {
        return setTimeoutFn(cb, 0);
      };
    }
  }();
  var WebSocket$1 = globalThis.WebSocket || globalThis.MozWebSocket;
  var usingBrowserWebSocket = true;
  var defaultBinaryType = "arraybuffer";

  var isReactNative = typeof navigator !== "undefined" && typeof navigator.product === "string" && navigator.product.toLowerCase() === "reactnative";
  var WS$1 = /*#__PURE__*/function (_Transport) {
    _inherits(WS, _Transport);

    var _super = _createSuper(WS);

    /**
     * WebSocket transport constructor.
     *
     * @api {Object} connection options
     * @api public
     */
    function WS(opts) {
      var _this;

      _classCallCheck(this, WS);

      _this = _super.call(this, opts);
      _this.supportsBinary = !opts.forceBase64;
      return _this;
    }
    /**
     * Transport name.
     *
     * @api public
     */


    _createClass(WS, [{
      key: "name",
      get: function get() {
        return "websocket";
      }
      /**
       * Opens socket.
       *
       * @api private
       */

    }, {
      key: "doOpen",
      value: function doOpen() {
        if (!this.check()) {
          // let probe timeout
          return;
        }

        var uri = this.uri();
        var protocols = this.opts.protocols; // React Native only supports the 'headers' option, and will print a warning if anything else is passed

        var opts = isReactNative ? {} : pick(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");

        if (this.opts.extraHeaders) {
          opts.headers = this.opts.extraHeaders;
        }

        try {
          this.ws = usingBrowserWebSocket && !isReactNative ? protocols ? new WebSocket$1(uri, protocols) : new WebSocket$1(uri) : new WebSocket$1(uri, protocols, opts);
        } catch (err) {
          return this.emit("error", err);
        }

        this.ws.binaryType = this.socket.binaryType || defaultBinaryType;
        this.addEventListeners();
      }
      /**
       * Adds event listeners to the socket
       *
       * @api private
       */

    }, {
      key: "addEventListeners",
      value: function addEventListeners() {
        var _this2 = this;

        this.ws.onopen = function () {
          if (_this2.opts.autoUnref) {
            _this2.ws._socket.unref();
          }

          _this2.onOpen();
        };

        this.ws.onclose = this.onClose.bind(this);

        this.ws.onmessage = function (ev) {
          return _this2.onData(ev.data);
        };

        this.ws.onerror = function (e) {
          return _this2.onError("websocket error", e);
        };
      }
      /**
       * Writes data to socket.
       *
       * @param {Array} array of packets.
       * @api private
       */

    }, {
      key: "write",
      value: function write(packets) {
        var _this3 = this;

        this.writable = false; // encodePacket efficient as it uses WS framing
        // no need for encodePayload

        var _loop = function _loop(i) {
          var packet = packets[i];
          var lastPacket = i === packets.length - 1;
          encodePacket$1(packet, _this3.supportsBinary, function (data) {
            // always create a new object (GH-437)
            var opts = {};
            // have a chance of informing us about it yet, in that case send will
            // throw an error


            try {
              if (usingBrowserWebSocket) {
                // TypeError is thrown when passing the second argument on Safari
                _this3.ws.send(data);
              }
            } catch (e) {}

            if (lastPacket) {
              // fake drain
              // defer to next tick to allow Socket to clear writeBuffer
              nextTick(function () {
                _this3.writable = true;

                _this3.emit("drain");
              }, _this3.setTimeoutFn);
            }
          });
        };

        for (var i = 0; i < packets.length; i++) {
          _loop(i);
        }
      }
      /**
       * Closes socket.
       *
       * @api private
       */

    }, {
      key: "doClose",
      value: function doClose() {
        if (typeof this.ws !== "undefined") {
          this.ws.close();
          this.ws = null;
        }
      }
      /**
       * Generates uri for connection.
       *
       * @api private
       */

    }, {
      key: "uri",
      value: function uri() {
        var query = this.query || {};
        var schema = this.opts.secure ? "wss" : "ws";
        var port = ""; // avoid port if default for schema

        if (this.opts.port && ("wss" === schema && Number(this.opts.port) !== 443 || "ws" === schema && Number(this.opts.port) !== 80)) {
          port = ":" + this.opts.port;
        } // append timestamp to URI


        if (this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        } // communicate binary support capabilities


        if (!this.supportsBinary) {
          query.b64 = 1;
        }

        var encodedQuery = parseqs$1.encode(query);
        var ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return schema + "://" + (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) + port + this.opts.path + (encodedQuery.length ? "?" + encodedQuery : "");
      }
      /**
       * Feature detection for WebSocket.
       *
       * @return {Boolean} whether this transport is available.
       * @api public
       */

    }, {
      key: "check",
      value: function check() {
        return !!WebSocket$1 && !("__initialize" in WebSocket$1 && this.name === WS.prototype.name);
      }
    }]);

    return WS;
  }(Transport$1);

  var transports$1 = {
    websocket: WS$1,
    polling: XHR$1
  };

  /**
   * Parses an URI
   *
   * @author Steven Levithan <stevenlevithan.com> (MIT license)
   * @api private
   */
  var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;
  var parts = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'];

  var parseuri = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
      str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
      uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
      uri.source = src;
      uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
      uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
      uri.ipv6uri = true;
    }

    uri.pathNames = pathNames(uri, uri['path']);
    uri.queryKey = queryKey(uri, uri['query']);
    return uri;
  };

  function pathNames(obj, path) {
    var regx = /\/{2,9}/g,
        names = path.replace(regx, "/").split("/");

    if (path.substr(0, 1) == '/' || path.length === 0) {
      names.splice(0, 1);
    }

    if (path.substr(path.length - 1, 1) == '/') {
      names.splice(names.length - 1, 1);
    }

    return names;
  }

  function queryKey(uri, query) {
    var data = {};
    query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
      if ($1) {
        data[$1] = $2;
      }
    });
    return data;
  }

  var Socket$3 = /*#__PURE__*/function (_Emitter) {
    _inherits(Socket, _Emitter);

    var _super = _createSuper(Socket);

    /**
     * Socket constructor.
     *
     * @param {String|Object} uri or options
     * @param {Object} opts - options
     * @api public
     */
    function Socket(uri) {
      var _this;

      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      _classCallCheck(this, Socket);

      _this = _super.call(this);

      if (uri && "object" === _typeof(uri)) {
        opts = uri;
        uri = null;
      }

      if (uri) {
        uri = parseuri(uri);
        opts.hostname = uri.host;
        opts.secure = uri.protocol === "https" || uri.protocol === "wss";
        opts.port = uri.port;
        if (uri.query) opts.query = uri.query;
      } else if (opts.host) {
        opts.hostname = parseuri(opts.host).host;
      }

      installTimerFunctions(_assertThisInitialized(_this), opts);
      _this.secure = null != opts.secure ? opts.secure : typeof location !== "undefined" && "https:" === location.protocol;

      if (opts.hostname && !opts.port) {
        // if no port is specified manually, use the protocol default
        opts.port = _this.secure ? "443" : "80";
      }

      _this.hostname = opts.hostname || (typeof location !== "undefined" ? location.hostname : "localhost");
      _this.port = opts.port || (typeof location !== "undefined" && location.port ? location.port : _this.secure ? "443" : "80");
      _this.transports = opts.transports || ["polling", "websocket"];
      _this.readyState = "";
      _this.writeBuffer = [];
      _this.prevBufferLen = 0;
      _this.opts = _extends({
        path: "/engine.io",
        agent: false,
        withCredentials: false,
        upgrade: true,
        timestampParam: "t",
        rememberUpgrade: false,
        rejectUnauthorized: true,
        perMessageDeflate: {
          threshold: 1024
        },
        transportOptions: {},
        closeOnBeforeunload: true
      }, opts);
      _this.opts.path = _this.opts.path.replace(/\/$/, "") + "/";

      if (typeof _this.opts.query === "string") {
        _this.opts.query = parseqs$1.decode(_this.opts.query);
      } // set on handshake


      _this.id = null;
      _this.upgrades = null;
      _this.pingInterval = null;
      _this.pingTimeout = null; // set on heartbeat

      _this.pingTimeoutTimer = null;

      if (typeof addEventListener === "function") {
        if (_this.opts.closeOnBeforeunload) {
          // Firefox closes the connection when the "beforeunload" event is emitted but not Chrome. This event listener
          // ensures every browser behaves the same (no "disconnect" event at the Socket.IO level when the page is
          // closed/reloaded)
          addEventListener("beforeunload", function () {
            if (_this.transport) {
              // silently close the transport
              _this.transport.removeAllListeners();

              _this.transport.close();
            }
          }, false);
        }

        if (_this.hostname !== "localhost") {
          _this.offlineEventListener = function () {
            _this.onClose("transport close");
          };

          addEventListener("offline", _this.offlineEventListener, false);
        }
      }

      _this.open();

      return _this;
    }
    /**
     * Creates transport of the given type.
     *
     * @param {String} transport name
     * @return {Transport}
     * @api private
     */


    _createClass(Socket, [{
      key: "createTransport",
      value: function createTransport(name) {
        var query = clone$1(this.opts.query); // append engine.io protocol identifier

        query.EIO = protocol$5; // transport name

        query.transport = name; // session id if we already have one

        if (this.id) query.sid = this.id;

        var opts = _extends({}, this.opts.transportOptions[name], this.opts, {
          query: query,
          socket: this,
          hostname: this.hostname,
          secure: this.secure,
          port: this.port
        });

        return new transports$1[name](opts);
      }
      /**
       * Initializes transport to use and starts probe.
       *
       * @api private
       */

    }, {
      key: "open",
      value: function open() {
        var _this2 = this;

        var transport;

        if (this.opts.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1) {
          transport = "websocket";
        } else if (0 === this.transports.length) {
          // Emit error on next tick so it can be listened to
          this.setTimeoutFn(function () {
            _this2.emitReserved("error", "No transports available");
          }, 0);
          return;
        } else {
          transport = this.transports[0];
        }

        this.readyState = "opening"; // Retry with the next transport if the transport is disabled (jsonp: false)

        try {
          transport = this.createTransport(transport);
        } catch (e) {
          this.transports.shift();
          this.open();
          return;
        }

        transport.open();
        this.setTransport(transport);
      }
      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @api private
       */

    }, {
      key: "setTransport",
      value: function setTransport(transport) {
        var _this3 = this;

        if (this.transport) {
          this.transport.removeAllListeners();
        } // set up transport


        this.transport = transport; // set up transport listeners

        transport.on("drain", this.onDrain.bind(this)).on("packet", this.onPacket.bind(this)).on("error", this.onError.bind(this)).on("close", function () {
          _this3.onClose("transport close");
        });
      }
      /**
       * Probes a transport.
       *
       * @param {String} transport name
       * @api private
       */

    }, {
      key: "probe",
      value: function probe(name) {
        var _this4 = this;

        var transport = this.createTransport(name);
        var failed = false;
        Socket.priorWebsocketSuccess = false;

        var onTransportOpen = function onTransportOpen() {
          if (failed) return;
          transport.send([{
            type: "ping",
            data: "probe"
          }]);
          transport.once("packet", function (msg) {
            if (failed) return;

            if ("pong" === msg.type && "probe" === msg.data) {
              _this4.upgrading = true;

              _this4.emitReserved("upgrading", transport);

              if (!transport) return;
              Socket.priorWebsocketSuccess = "websocket" === transport.name;

              _this4.transport.pause(function () {
                if (failed) return;
                if ("closed" === _this4.readyState) return;
                cleanup();

                _this4.setTransport(transport);

                transport.send([{
                  type: "upgrade"
                }]);

                _this4.emitReserved("upgrade", transport);

                transport = null;
                _this4.upgrading = false;

                _this4.flush();
              });
            } else {
              var err = new Error("probe error"); // @ts-ignore

              err.transport = transport.name;

              _this4.emitReserved("upgradeError", err);
            }
          });
        };

        function freezeTransport() {
          if (failed) return; // Any callback called by transport should be ignored since now

          failed = true;
          cleanup();
          transport.close();
          transport = null;
        } // Handle any error that happens while probing


        var onerror = function onerror(err) {
          var error = new Error("probe error: " + err); // @ts-ignore

          error.transport = transport.name;
          freezeTransport();

          _this4.emitReserved("upgradeError", error);
        };

        function onTransportClose() {
          onerror("transport closed");
        } // When the socket is closed while we're probing


        function onclose() {
          onerror("socket closed");
        } // When the socket is upgraded while we're probing


        function onupgrade(to) {
          if (transport && to.name !== transport.name) {
            freezeTransport();
          }
        } // Remove all listeners on the transport and on self


        var cleanup = function cleanup() {
          transport.removeListener("open", onTransportOpen);
          transport.removeListener("error", onerror);
          transport.removeListener("close", onTransportClose);

          _this4.off("close", onclose);

          _this4.off("upgrading", onupgrade);
        };

        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);
        this.once("close", onclose);
        this.once("upgrading", onupgrade);
        transport.open();
      }
      /**
       * Called when connection is deemed open.
       *
       * @api private
       */

    }, {
      key: "onOpen",
      value: function onOpen() {
        this.readyState = "open";
        Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emitReserved("open");
        this.flush(); // we check for `readyState` in case an `open`
        // listener already closed the socket

        if ("open" === this.readyState && this.opts.upgrade && this.transport.pause) {
          var i = 0;
          var l = this.upgrades.length;

          for (; i < l; i++) {
            this.probe(this.upgrades[i]);
          }
        }
      }
      /**
       * Handles a packet.
       *
       * @api private
       */

    }, {
      key: "onPacket",
      value: function onPacket(packet) {
        if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
          this.emitReserved("packet", packet); // Socket is live - any packet counts

          this.emitReserved("heartbeat");

          switch (packet.type) {
            case "open":
              this.onHandshake(JSON.parse(packet.data));
              break;

            case "ping":
              this.resetPingTimeout();
              this.sendPacket("pong");
              this.emitReserved("ping");
              this.emitReserved("pong");
              break;

            case "error":
              var err = new Error("server error"); // @ts-ignore

              err.code = packet.data;
              this.onError(err);
              break;

            case "message":
              this.emitReserved("data", packet.data);
              this.emitReserved("message", packet.data);
              break;
          }
        }
      }
      /**
       * Called upon handshake completion.
       *
       * @param {Object} data - handshake obj
       * @api private
       */

    }, {
      key: "onHandshake",
      value: function onHandshake(data) {
        this.emitReserved("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this.upgrades = this.filterUpgrades(data.upgrades);
        this.pingInterval = data.pingInterval;
        this.pingTimeout = data.pingTimeout;
        this.maxPayload = data.maxPayload;
        this.onOpen(); // In case open handler closes socket

        if ("closed" === this.readyState) return;
        this.resetPingTimeout();
      }
      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @api private
       */

    }, {
      key: "resetPingTimeout",
      value: function resetPingTimeout() {
        var _this5 = this;

        this.clearTimeoutFn(this.pingTimeoutTimer);
        this.pingTimeoutTimer = this.setTimeoutFn(function () {
          _this5.onClose("ping timeout");
        }, this.pingInterval + this.pingTimeout);

        if (this.opts.autoUnref) {
          this.pingTimeoutTimer.unref();
        }
      }
      /**
       * Called on `drain` event
       *
       * @api private
       */

    }, {
      key: "onDrain",
      value: function onDrain() {
        this.writeBuffer.splice(0, this.prevBufferLen); // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`

        this.prevBufferLen = 0;

        if (0 === this.writeBuffer.length) {
          this.emitReserved("drain");
        } else {
          this.flush();
        }
      }
      /**
       * Flush write buffers.
       *
       * @api private
       */

    }, {
      key: "flush",
      value: function flush() {
        if ("closed" !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
          var packets = this.getWritablePackets();
          this.transport.send(packets); // keep track of current length of writeBuffer
          // splice writeBuffer and callbackBuffer on `drain`

          this.prevBufferLen = packets.length;
          this.emitReserved("flush");
        }
      }
      /**
       * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
       * long-polling)
       *
       * @private
       */

    }, {
      key: "getWritablePackets",
      value: function getWritablePackets() {
        var shouldCheckPayloadSize = this.maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1;

        if (!shouldCheckPayloadSize) {
          return this.writeBuffer;
        }

        var payloadSize = 1; // first packet type

        for (var i = 0; i < this.writeBuffer.length; i++) {
          var data = this.writeBuffer[i].data;

          if (data) {
            payloadSize += byteLength(data);
          }

          if (i > 0 && payloadSize > this.maxPayload) {
            return this.writeBuffer.slice(0, i);
          }

          payloadSize += 2; // separator + packet type
        }

        return this.writeBuffer;
      }
      /**
       * Sends a message.
       *
       * @param {String} message.
       * @param {Function} callback function.
       * @param {Object} options.
       * @return {Socket} for chaining.
       * @api public
       */

    }, {
      key: "write",
      value: function write(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }
    }, {
      key: "send",
      value: function send(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }
      /**
       * Sends a packet.
       *
       * @param {String} packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} callback function.
       * @api private
       */

    }, {
      key: "sendPacket",
      value: function sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
          fn = data;
          data = undefined;
        }

        if ("function" === typeof options) {
          fn = options;
          options = null;
        }

        if ("closing" === this.readyState || "closed" === this.readyState) {
          return;
        }

        options = options || {};
        options.compress = false !== options.compress;
        var packet = {
          type: type,
          data: data,
          options: options
        };
        this.emitReserved("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn) this.once("flush", fn);
        this.flush();
      }
      /**
       * Closes the connection.
       *
       * @api public
       */

    }, {
      key: "close",
      value: function close() {
        var _this6 = this;

        var close = function close() {
          _this6.onClose("forced close");

          _this6.transport.close();
        };

        var cleanupAndClose = function cleanupAndClose() {
          _this6.off("upgrade", cleanupAndClose);

          _this6.off("upgradeError", cleanupAndClose);

          close();
        };

        var waitForUpgrade = function waitForUpgrade() {
          // wait for upgrade to finish since we can't send packets while pausing a transport
          _this6.once("upgrade", cleanupAndClose);

          _this6.once("upgradeError", cleanupAndClose);
        };

        if ("opening" === this.readyState || "open" === this.readyState) {
          this.readyState = "closing";

          if (this.writeBuffer.length) {
            this.once("drain", function () {
              if (_this6.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            });
          } else if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        }

        return this;
      }
      /**
       * Called upon transport error
       *
       * @api private
       */

    }, {
      key: "onError",
      value: function onError(err) {
        Socket.priorWebsocketSuccess = false;
        this.emitReserved("error", err);
        this.onClose("transport error", err);
      }
      /**
       * Called upon transport close.
       *
       * @api private
       */

    }, {
      key: "onClose",
      value: function onClose(reason, desc) {
        if ("opening" === this.readyState || "open" === this.readyState || "closing" === this.readyState) {
          // clear timers
          this.clearTimeoutFn(this.pingTimeoutTimer); // stop event from firing again for transport

          this.transport.removeAllListeners("close"); // ensure transport won't stay open

          this.transport.close(); // ignore further transport communication

          this.transport.removeAllListeners();

          if (typeof removeEventListener === "function") {
            removeEventListener("offline", this.offlineEventListener, false);
          } // set ready state


          this.readyState = "closed"; // clear session id

          this.id = null; // emit close event

          this.emitReserved("close", reason, desc); // clean buffers after, so users can still
          // grab the buffers on `close` event

          this.writeBuffer = [];
          this.prevBufferLen = 0;
        }
      }
      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} server upgrades
       * @api private
       *
       */

    }, {
      key: "filterUpgrades",
      value: function filterUpgrades(upgrades) {
        var filteredUpgrades = [];
        var i = 0;
        var j = upgrades.length;

        for (; i < j; i++) {
          if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
        }

        return filteredUpgrades;
      }
    }]);

    return Socket;
  }(Emitter_1);
  Socket$3.protocol = protocol$5;

  function clone$1(obj) {
    var o = {};

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        o[i] = obj[i];
      }
    }

    return o;
  }

  // browser shim for xmlhttprequest module
  function XMLHttpRequest$1 (opts) {
    var xdomain = opts.xdomain; // scheme must be same when usign XDomainRequest
    // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx

    opts.xscheme; // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
    // https://github.com/Automattic/engine.io-client/pull/217

    opts.enablesXDR; // XMLHttpRequest can be disabled on IE

    try {
      if ('undefined' !== typeof XMLHttpRequest && (!xdomain || hasCORS)) {
        return new XMLHttpRequest();
      }
    } catch (e) {} // Use XDomainRequest for IE8 if enablesXDR is true

    if (!xdomain) {
      try {
        return new self[['Active'].concat('Object').join('X')]('Microsoft.XMLHTTP');
      } catch (e) {}
    }
  }

  /*! https://mths.be/utf8js v2.1.2 by @mathias */
  var stringFromCharCode = String.fromCharCode; // Taken from https://mths.be/punycode

  function ucs2decode(string) {
    var output = [];
    var counter = 0;
    var length = string.length;
    var value;
    var extra;

    while (counter < length) {
      value = string.charCodeAt(counter++);

      if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
        // high surrogate, and there is a next character
        extra = string.charCodeAt(counter++);

        if ((extra & 0xFC00) == 0xDC00) {
          // low surrogate
          output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
        } else {
          // unmatched surrogate; only append this code unit, in case the next
          // code unit is the high surrogate of a surrogate pair
          output.push(value);
          counter--;
        }
      } else {
        output.push(value);
      }
    }

    return output;
  } // Taken from https://mths.be/punycode


  function ucs2encode(array) {
    var length = array.length;
    var index = -1;
    var value;
    var output = '';

    while (++index < length) {
      value = array[index];

      if (value > 0xFFFF) {
        value -= 0x10000;
        output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
        value = 0xDC00 | value & 0x3FF;
      }

      output += stringFromCharCode(value);
    }

    return output;
  }

  function checkScalarValue(codePoint, strict) {
    if (codePoint >= 0xD800 && codePoint <= 0xDFFF) {
      if (strict) {
        throw Error('Lone surrogate U+' + codePoint.toString(16).toUpperCase() + ' is not a scalar value');
      }

      return false;
    }

    return true;
  }
  /*--------------------------------------------------------------------------*/


  function createByte(codePoint, shift) {
    return stringFromCharCode(codePoint >> shift & 0x3F | 0x80);
  }

  function encodeCodePoint(codePoint, strict) {
    if ((codePoint & 0xFFFFFF80) == 0) {
      // 1-byte sequence
      return stringFromCharCode(codePoint);
    }

    var symbol = '';

    if ((codePoint & 0xFFFFF800) == 0) {
      // 2-byte sequence
      symbol = stringFromCharCode(codePoint >> 6 & 0x1F | 0xC0);
    } else if ((codePoint & 0xFFFF0000) == 0) {
      // 3-byte sequence
      if (!checkScalarValue(codePoint, strict)) {
        codePoint = 0xFFFD;
      }

      symbol = stringFromCharCode(codePoint >> 12 & 0x0F | 0xE0);
      symbol += createByte(codePoint, 6);
    } else if ((codePoint & 0xFFE00000) == 0) {
      // 4-byte sequence
      symbol = stringFromCharCode(codePoint >> 18 & 0x07 | 0xF0);
      symbol += createByte(codePoint, 12);
      symbol += createByte(codePoint, 6);
    }

    symbol += stringFromCharCode(codePoint & 0x3F | 0x80);
    return symbol;
  }

  function utf8encode(string, opts) {
    opts = opts || {};
    var strict = false !== opts.strict;
    var codePoints = ucs2decode(string);
    var length = codePoints.length;
    var index = -1;
    var codePoint;
    var byteString = '';

    while (++index < length) {
      codePoint = codePoints[index];
      byteString += encodeCodePoint(codePoint, strict);
    }

    return byteString;
  }
  /*--------------------------------------------------------------------------*/


  function readContinuationByte() {
    if (byteIndex >= byteCount) {
      throw Error('Invalid byte index');
    }

    var continuationByte = byteArray[byteIndex] & 0xFF;
    byteIndex++;

    if ((continuationByte & 0xC0) == 0x80) {
      return continuationByte & 0x3F;
    } // If we end up here, it’s not a continuation byte


    throw Error('Invalid continuation byte');
  }

  function decodeSymbol(strict) {
    var byte1;
    var byte2;
    var byte3;
    var byte4;
    var codePoint;

    if (byteIndex > byteCount) {
      throw Error('Invalid byte index');
    }

    if (byteIndex == byteCount) {
      return false;
    } // Read first byte


    byte1 = byteArray[byteIndex] & 0xFF;
    byteIndex++; // 1-byte sequence (no continuation bytes)

    if ((byte1 & 0x80) == 0) {
      return byte1;
    } // 2-byte sequence


    if ((byte1 & 0xE0) == 0xC0) {
      byte2 = readContinuationByte();
      codePoint = (byte1 & 0x1F) << 6 | byte2;

      if (codePoint >= 0x80) {
        return codePoint;
      } else {
        throw Error('Invalid continuation byte');
      }
    } // 3-byte sequence (may include unpaired surrogates)


    if ((byte1 & 0xF0) == 0xE0) {
      byte2 = readContinuationByte();
      byte3 = readContinuationByte();
      codePoint = (byte1 & 0x0F) << 12 | byte2 << 6 | byte3;

      if (codePoint >= 0x0800) {
        return checkScalarValue(codePoint, strict) ? codePoint : 0xFFFD;
      } else {
        throw Error('Invalid continuation byte');
      }
    } // 4-byte sequence


    if ((byte1 & 0xF8) == 0xF0) {
      byte2 = readContinuationByte();
      byte3 = readContinuationByte();
      byte4 = readContinuationByte();
      codePoint = (byte1 & 0x07) << 0x12 | byte2 << 0x0C | byte3 << 0x06 | byte4;

      if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
        return codePoint;
      }
    }

    throw Error('Invalid UTF-8 detected');
  }

  var byteArray;
  var byteCount;
  var byteIndex;

  function utf8decode(byteString, opts) {
    opts = opts || {};
    var strict = false !== opts.strict;
    byteArray = ucs2decode(byteString);
    byteCount = byteArray.length;
    byteIndex = 0;
    var codePoints = [];
    var tmp;

    while ((tmp = decodeSymbol(strict)) !== false) {
      codePoints.push(tmp);
    }

    return ucs2encode(codePoints);
  }

  var version = '2.1.2';
  var utf8 = {
    version: version,
    encode: utf8encode,
    decode: utf8decode
  };

  /* global Blob File */
  var toString$3 = Object.prototype.toString;
  var withNativeBlob$3 = typeof Blob === 'function' || typeof Blob !== 'undefined' && toString$3.call(Blob) === '[object BlobConstructor]';
  var withNativeFile$3 = typeof File === 'function' || typeof File !== 'undefined' && toString$3.call(File) === '[object FileConstructor]';
  var withNativeArrayBuffer$3 = typeof ArrayBuffer === 'function'; // ArrayBuffer.isView method is not defined in IE10

  var isView$3 = function isView(obj) {
    return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  /**
   * Checks for binary data.
   *
   * Supports Buffer, ArrayBuffer, Blob and File.
   *
   * @param {Object} anything
   * @api public
   */


  function hasBinary$2(obj) {

    if (!obj || _typeof(obj) !== 'object') {
      return false;
    }

    if (Array.isArray(obj)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (hasBinary$2(obj[i])) {
          return true;
        }
      }

      return false;
    }

    if (withNativeArrayBuffer$3 && (obj instanceof ArrayBuffer || isView$3(obj)) || withNativeBlob$3 && obj instanceof Blob || withNativeFile$3 && obj instanceof File) {
      return true;
    } // see: https://github.com/Automattic/has-binary/pull/4


    if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
      return hasBinary$2(obj.toJSON(), true);
    }

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary$2(obj[key])) {
        return true;
      }
    }

    return false;
  }

  function after(count, callback) {
    var err_cb = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : noop;
    var bail = false;
    err_cb = err_cb || noop;
    proxy.count = count;
    return count === 0 ? callback() : proxy;

    function proxy(err, result) {
      if (proxy.count <= 0) {
        throw new Error('after called too many times');
      }

      --proxy.count; // after first error, rest are passed to err_cb

      if (err) {
        bail = true;
        callback(err); // future error callbacks will go to error handler

        callback = err_cb;
      } else if (proxy.count === 0 && !bail) {
        callback(null, result);
      }
    }
  }

  function noop() {}

  /**
   * Gets the keys for an object.
   *
   * @return {Array} keys
   * @api private
   */
  var keys = Object.keys || function keys(obj) {
    var arr = [];
    var has = Object.prototype.hasOwnProperty;

    for (var i in obj) {
      if (has.call(obj, i)) {
        arr.push(i);
      }
    }

    return arr;
  };

  var Buffer$1 = /*#__PURE__*/function (_Uint8Array) {
    _inherits(Buffer, _Uint8Array);

    var _super = _createSuper(Buffer);

    function Buffer(length) {
      var _this;

      var encoding = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';

      _classCallCheck(this, Buffer);

      _this = _super.call(this, length);
      _this.encoding = encoding;
      return _this;
    }

    _createClass(Buffer, [{
      key: "writeUInt8",
      value: function writeUInt8(v, i) {
        this[i] = v;
      }
    }], [{
      key: "isBuffer",
      value: function isBuffer(b) {
        return b instanceof Uint8Array;
      }
    }, {
      key: "concat",
      value: function concat(a) {
        return [].concat.apply([], a);
      }
    }]);

    return Buffer;
  }( /*#__PURE__*/_wrapNativeSuper(Uint8Array));
  /**
   * Current protocol version.
   */


  var protocol$4 = 3;
  /**
   * Packet types.
   */

  var packets = {
    open: 0 // non-ws
    ,
    close: 1 // non-ws
    ,
    ping: 2,
    pong: 3,
    message: 4,
    upgrade: 5,
    noop: 6
  };
  var packetslist = keys(packets);
  /**
   * Premade error packet.
   */

  var err = {
    type: 'error',
    data: 'parser error'
  };
  /**
   * Encodes a packet.
   *
   *     <packet type id> [ <data> ]
   *
   * Example:
   *
   *     5hello world
   *     3
   *     4
   *
   * Binary is encoded in an identical principle
   *
   * @api private
   */

  var encodePacket = function encodePacket(packet, supportsBinary, utf8encode, callback) {
    if (typeof supportsBinary === 'function') {
      callback = supportsBinary;
      supportsBinary = null;
    }

    if (typeof utf8encode === 'function') {
      callback = utf8encode;
      utf8encode = null;
    }

    if (Buffer$1.isBuffer(packet.data)) {
      return encodeBuffer(packet, supportsBinary, callback);
    } else if (packet.data && (packet.data.buffer || packet.data) instanceof ArrayBuffer) {
      return encodeBuffer({
        type: packet.type,
        data: arrayBufferToBuffer(packet.data)
      }, supportsBinary, callback);
    } // Sending data as a utf-8 string


    var encoded = packets[packet.type]; // data fragment is optional

    if (undefined !== packet.data) {
      encoded += utf8encode ? utf8.encode(String(packet.data), {
        strict: false
      }) : String(packet.data);
    }

    return callback('' + encoded);
  };
  /**
   * Encode Buffer data
   */


  function encodeBuffer(packet, supportsBinary, callback) {
    if (!supportsBinary) {
      return encodeBase64Packet(packet, callback);
    }

    var data = packet.data;
    var typeBuffer = new Buffer$1(1);
    typeBuffer[0] = packets[packet.type];
    return callback(Buffer$1.concat([typeBuffer, data]));
  }
  /**
   * Encodes a packet with binary data in a base64 string
   *
   * @param {Object} packet, has `type` and `data`
   * @return {String} base64 encoded message
   */


  var encodeBase64Packet = function encodeBase64Packet(packet, callback) {
    var data = Buffer$1.isBuffer(packet.data) ? packet.data : arrayBufferToBuffer(packet.data);
    var message = 'b' + packets[packet.type];
    message += data.toString('base64');
    return callback(message);
  };
  /**
   * Decodes a packet. Data also available as an ArrayBuffer if requested.
   *
   * @return {Object} with `type` and `data` (if any)
   * @api private
   */


  var decodePacket = function decodePacket(data, binaryType) {
    var utf8decode = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (data === undefined) {
      return err;
    }

    var type; // String data

    if (typeof data === 'string') {
      type = data.charAt(0);

      if (type === 'b') {
        return decodeBase64Packet(data.substr(1), binaryType);
      }

      if (utf8decode) {
        data = tryDecode(data);

        if (data === false) {
          return err;
        }
      }

      if (Number(type) != type || !packetslist[type]) {
        return err;
      }

      if (data.length > 1) {
        return {
          type: packetslist[type],
          data: data.substring(1)
        };
      } else {
        return {
          type: packetslist[type]
        };
      }
    } // Binary data


    if (binaryType === 'arraybuffer') {
      // wrap Buffer/ArrayBuffer data into an Uint8Array
      var intArray = new Uint8Array(data);
      type = intArray[0];
      return {
        type: packetslist[type],
        data: intArray.buffer.slice(1)
      };
    }

    if (data instanceof ArrayBuffer) {
      data = arrayBufferToBuffer(data);
    }

    type = data[0];
    return {
      type: packetslist[type],
      data: data.slice(1)
    };
  };

  function tryDecode(data) {
    try {
      data = utf8.decode(data, {
        strict: false
      });
    } catch (e) {
      return false;
    }

    return data;
  }
  /**
   * Decodes a packet encoded in a base64 string.
   *
   * @param {String} base64 encoded message
   * @return {Object} with `type` and `data` (if any)
   */


  var decodeBase64Packet = function decodeBase64Packet(msg, binaryType) {
    var type = packetslist[msg.charAt(0)];
    var data = new Buffer$1(msg.substr(1), 'base64');

    if (binaryType === 'arraybuffer') {
      var abv = new Uint8Array(data.length);

      for (var i = 0; i < abv.length; i++) {
        abv[i] = data[i];
      }

      data = abv.buffer;
    }

    return {
      type: type,
      data: data
    };
  };
  /**
   * Encodes multiple messages (payload).
   *
   *     <length>:data
   *
   * Example:
   *
   *     11:hello world2:hi
   *
   * If any contents are binary, they will be encoded as base64 strings. Base64
   * encoded strings are marked with a b before the length specifier
   *
   * @param {Array} packets
   * @api private
   */


  var encodePayload = function encodePayload(packets, supportsBinary, callback) {
    if (typeof supportsBinary === 'function') {
      callback = supportsBinary;
      supportsBinary = null;
    }

    if (supportsBinary && hasBinary$2(packets)) {
      return encodePayloadAsBinary(packets, callback);
    }

    if (!packets.length) {
      return callback('0:');
    }

    function encodeOne(packet, doneCallback) {
      encodePacket(packet, supportsBinary, false, function (message) {
        doneCallback(null, setLengthHeader(message));
      });
    }

    map(packets, encodeOne, function (err, results) {
      return callback(results.join(''));
    });
  };

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }
  /**
   * Async array map using after
   */


  function map(ary, each, done) {
    var result = new Array(ary.length);
    var next = after(ary.length, done);

    for (var i = 0; i < ary.length; i++) {
      each(ary[i], function (error, msg) {
        result[i] = msg;
        next(error, result);
      });
    }
  }
  /*
   * Decodes data when a payload is maybe expected. Possible binary contents are
   * decoded from their base64 representation
   *
   * @param {String} data, callback method
   * @api public
   */


  var decodePayload = function decodePayload(data, binaryType, callback) {
    if (typeof data !== 'string') {
      return decodePayloadAsBinary(data, binaryType, callback);
    }

    if (typeof binaryType === 'function') {
      callback = binaryType;
      binaryType = null;
    }

    if (data === '') {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }

    var length = '',
        n,
        msg,
        packet;

    for (var i = 0, l = data.length; i < l; i++) {
      var chr = data.charAt(i);

      if (chr !== ':') {
        length += chr;
        continue;
      }

      if (length === '' || length != (n = Number(length))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = decodePacket(msg, binaryType, false);

        if (err.type === packet.type && err.data === packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var more = callback(packet, i + n, l);
        if (false === more) return;
      } // advance cursor


      i += n;
      length = '';
    }

    if (length !== '') {
      // parser error - ignoring payload
      return callback(err, 0, 1);
    }
  };
  /**
   *
   * Converts a buffer to a utf8.js encoded string
   *
   * @api private
   */


  function bufferToString(buffer) {
    var str = '';

    for (var i = 0, l = buffer.length; i < l; i++) {
      str += String.fromCharCode(buffer[i]);
    }

    return str;
  }
  /**
   *
   * Converts a utf8.js encoded string to a buffer
   *
   * @api private
   */


  function stringToBuffer(string) {
    var buf = new Buffer$1(string.length);

    for (var i = 0, l = string.length; i < l; i++) {
      buf.writeUInt8(string.charCodeAt(i), i);
    }

    return buf;
  }
  /**
   *
   * Converts an ArrayBuffer to a Buffer
   *
   * @api private
   */


  function arrayBufferToBuffer(data) {
    // data is either an ArrayBuffer or ArrayBufferView.
    var array = new Uint8Array(data.buffer || data);
    var length = data.byteLength || data.length;
    var offset = data.byteOffset || 0;
    var buffer = new Buffer$1(length);

    for (var i = 0; i < length; i++) {
      buffer[i] = array[offset + i];
    }

    return buffer;
  }
  /**
   * Encodes multiple messages (payload) as binary.
   *
   * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
   * 255><data>
   *
   * Example:
   * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
   *
   * @param {Array} packets
   * @return {Buffer} encoded payload
   * @api private
   */


  var encodePayloadAsBinary = function encodePayloadAsBinary(packets, callback) {
    if (!packets.length) {
      return callback(new Buffer$1(0));
    }

    map(packets, encodeOneBinaryPacket, function (err, results) {
      return callback(Buffer$1.concat(results));
    });
  };

  function encodeOneBinaryPacket(p, doneCallback) {
    function onBinaryPacketEncode(packet) {
      var encodingLength = '' + packet.length;
      var sizeBuffer;

      if (typeof packet === 'string') {
        sizeBuffer = new Buffer$1(encodingLength.length + 2);
        sizeBuffer[0] = 0; // is a string (not true binary = 0)

        for (var i = 0; i < encodingLength.length; i++) {
          sizeBuffer[i + 1] = parseInt(encodingLength[i], 10);
        }

        sizeBuffer[sizeBuffer.length - 1] = 255;
        return doneCallback(null, Buffer$1.concat([sizeBuffer, stringToBuffer(packet)]));
      }

      sizeBuffer = new Buffer$1(encodingLength.length + 2);
      sizeBuffer[0] = 1; // is binary (true binary = 1)

      for (var i = 0; i < encodingLength.length; i++) {
        sizeBuffer[i + 1] = parseInt(encodingLength[i], 10);
      }

      sizeBuffer[sizeBuffer.length - 1] = 255;
      doneCallback(null, Buffer$1.concat([sizeBuffer, packet]));
    }

    encodePacket(p, true, true, onBinaryPacketEncode);
  }
  /*
   * Decodes data when a payload is maybe expected. Strings are decoded by
   * interpreting each byte as a key code for entries marked to start with 0. See
   * description of encodePayloadAsBinary

   * @param {Buffer} data, callback method
   * @api public
   */


  var decodePayloadAsBinary = function decodePayloadAsBinary(data, binaryType, callback) {
    if (typeof binaryType === 'function') {
      callback = binaryType;
      binaryType = null;
    }

    var bufferTail = typeof data.length === 'undefined' ? new Uint8Array(data) : data;
    var buffers = [];
    var i;

    while (bufferTail.length > 0) {
      var strLen = '';
      var isString = bufferTail[0] === 0;

      for (i = 1;; i++) {
        if (bufferTail[i] === 255) break; // 310 = char length of Number.MAX_VALUE

        if (strLen.length > 310) {
          return callback(err, 0, 1);
        }

        strLen += '' + bufferTail[i];
      }

      bufferTail = bufferTail.slice(strLen.length + 1);
      var msgLength = parseInt(strLen, 10);
      var msg = bufferTail.slice(1, msgLength + 1);
      buffers.push(isString ? bufferToString(msg) : msg);
      bufferTail = bufferTail.slice(msgLength + 1);
    }

    var total = buffers.length;

    for (i = 0; i < total; i++) {
      var buffer = buffers[i];
      callback(decodePacket(buffer, binaryType, true), i, total);
    }
  };

  var parser$3 = {
    protocol: protocol$4,
    packets: packets,
    encodePacket: encodePacket,
    encodeBase64Packet: encodeBase64Packet,
    decodePacket: decodePacket,
    decodeBase64Packet: decodeBase64Packet,
    encodePayload: encodePayload,
    decodePayload: decodePayload,
    encodePayloadAsBinary: encodePayloadAsBinary,
    decodePayloadAsBinary: decodePayloadAsBinary
  };

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */
  function Emitter$1(obj) {
    if (obj) return mixin$1(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin$1(obj) {
    for (var key in Emitter$1.prototype) {
      obj[key] = Emitter$1.prototype[key];
    }

    return obj;
  }
  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter$1.prototype.on = Emitter$1.prototype.addEventListener = function (event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
    return this;
  };
  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter$1.prototype.once = function (event, fn) {
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };
  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter$1.prototype.off = Emitter$1.prototype.removeListener = Emitter$1.prototype.removeAllListeners = Emitter$1.prototype.removeEventListener = function (event, fn) {
    this._callbacks = this._callbacks || {}; // all

    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    } // specific event


    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this; // remove all handlers

    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    } // remove specific handler


    var cb;

    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];

      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    } // Remove event specific arrays for event types that no
    // one is subscribed for to avoid memory leak.


    if (callbacks.length === 0) {
      delete this._callbacks['$' + event];
    }

    return this;
  };
  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */


  Emitter$1.prototype.emit = function (event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1),
        callbacks = this._callbacks['$' + event];

    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }

    if (callbacks) {
      callbacks = callbacks.slice(0);

      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };
  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */


  Emitter$1.prototype.listeners = function (event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };
  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */


  Emitter$1.prototype.hasListeners = function (event) {
    return !!this.listeners(event).length;
  };

  /**
   * Module dependencies.
   */
  /**
   * Transport abstract constructor.
   *
   * @param {Object} options.
   * @api private
   */

  function Transport(opts) {
    this.path = opts.path;
    this.hostname = opts.hostname;
    this.port = opts.port;
    this.secure = opts.secure;
    this.query = opts.query;
    this.timestampParam = opts.timestampParam;
    this.timestampRequests = opts.timestampRequests;
    this.readyState = '';
    this.agent = opts.agent || false;
    this.socket = opts.socket;
    this.enablesXDR = opts.enablesXDR; // SSL options for Node.js client

    this.pfx = opts.pfx;
    this.key = opts.key;
    this.passphrase = opts.passphrase;
    this.cert = opts.cert;
    this.ca = opts.ca;
    this.ciphers = opts.ciphers;
    this.rejectUnauthorized = opts.rejectUnauthorized;
    this.forceNode = opts.forceNode; // results of ReactNative environment detection

    this.isReactNative = opts.isReactNative; // other options for Node.js client

    this.extraHeaders = opts.extraHeaders;
    this.localAddress = opts.localAddress;
  }
  /**
   * Mix in `Emitter`.
   */


  Emitter$1(Transport.prototype);
  /**
   * Emits an error.
   *
   * @param {String} str
   * @return {Transport} for chaining
   * @api public
   */

  Transport.prototype.onError = function (msg, desc) {
    var err = new Error(msg);
    err.type = 'TransportError';
    err.description = desc;
    this.emit('error', err);
    return this;
  };
  /**
   * Opens the transport.
   *
   * @api public
   */


  Transport.prototype.open = function () {
    if ('closed' === this.readyState || '' === this.readyState) {
      this.readyState = 'opening';
      this.doOpen();
    }

    return this;
  };
  /**
   * Closes the transport.
   *
   * @api private
   */


  Transport.prototype.close = function () {
    if ('opening' === this.readyState || 'open' === this.readyState) {
      this.doClose();
      this.onClose();
    }

    return this;
  };
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   * @api private
   */


  Transport.prototype.send = function (packets) {
    if ('open' === this.readyState) {
      this.write(packets);
    } else {
      throw new Error('Transport not open');
    }
  };
  /**
   * Called upon open
   *
   * @api private
   */


  Transport.prototype.onOpen = function () {
    this.readyState = 'open';
    this.writable = true;
    this.emit('open');
  };
  /**
   * Called with data.
   *
   * @param {String} data
   * @api private
   */


  Transport.prototype.onData = function (data) {
    var packet = parser$3.decodePacket(data, this.socket.binaryType);
    this.onPacket(packet);
  };
  /**
   * Called with a decoded packet.
   */


  Transport.prototype.onPacket = function (packet) {
    this.emit('packet', packet);
  };
  /**
   * Called with out of band data.
   */


  Transport.prototype.outOfBand = function (data) {
    this.emit('outOfBand', data);
  };
  /**
   * Called upon close.
   *
   * @api private
   */


  Transport.prototype.onClose = function () {
    this.readyState = 'closed';
    this.emit('close');
  };

  function inherit (a, b) {
    var fn = function fn() {};

    fn.prototype = b.prototype;
    a.prototype = new fn();
    a.prototype.constructor = a;
  }

  var browser = {exports: {}};

  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  /**
   * Parse or format the given `val`.
   *
   * Options:
   *
   *  - `long` verbose formatting [false]
   *
   * @param {String|Number} val
   * @param {Object} [options]
   * @throws {Error} throw an error if val is not a non-empty string or a number
   * @return {String|Number}
   * @api public
   */

  var ms = function ms(val, options) {
    options = options || {};

    var type = _typeof(val);

    if (type === 'string' && val.length > 0) {
      return parse(val);
    } else if (type === 'number' && isFinite(val)) {
      return options["long"] ? fmtLong(val) : fmtShort(val);
    }

    throw new Error('val is not a non-empty string or a valid number. val=' + JSON.stringify(val));
  };
  /**
   * Parse the given `str` and return milliseconds.
   *
   * @param {String} str
   * @return {Number}
   * @api private
   */


  function parse(str) {
    str = String(str);

    if (str.length > 100) {
      return;
    }

    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);

    if (!match) {
      return;
    }

    var n = parseFloat(match[1]);
    var type = (match[2] || 'ms').toLowerCase();

    switch (type) {
      case 'years':
      case 'year':
      case 'yrs':
      case 'yr':
      case 'y':
        return n * y;

      case 'weeks':
      case 'week':
      case 'w':
        return n * w;

      case 'days':
      case 'day':
      case 'd':
        return n * d;

      case 'hours':
      case 'hour':
      case 'hrs':
      case 'hr':
      case 'h':
        return n * h;

      case 'minutes':
      case 'minute':
      case 'mins':
      case 'min':
      case 'm':
        return n * m;

      case 'seconds':
      case 'second':
      case 'secs':
      case 'sec':
      case 's':
        return n * s;

      case 'milliseconds':
      case 'millisecond':
      case 'msecs':
      case 'msec':
      case 'ms':
        return n;

      default:
        return undefined;
    }
  }
  /**
   * Short format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */


  function fmtShort(ms) {
    var msAbs = Math.abs(ms);

    if (msAbs >= d) {
      return Math.round(ms / d) + 'd';
    }

    if (msAbs >= h) {
      return Math.round(ms / h) + 'h';
    }

    if (msAbs >= m) {
      return Math.round(ms / m) + 'm';
    }

    if (msAbs >= s) {
      return Math.round(ms / s) + 's';
    }

    return ms + 'ms';
  }
  /**
   * Long format for `ms`.
   *
   * @param {Number} ms
   * @return {String}
   * @api private
   */


  function fmtLong(ms) {
    var msAbs = Math.abs(ms);

    if (msAbs >= d) {
      return plural(ms, msAbs, d, 'day');
    }

    if (msAbs >= h) {
      return plural(ms, msAbs, h, 'hour');
    }

    if (msAbs >= m) {
      return plural(ms, msAbs, m, 'minute');
    }

    if (msAbs >= s) {
      return plural(ms, msAbs, s, 'second');
    }

    return ms + ' ms';
  }
  /**
   * Pluralization helper.
   */


  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
  }

  /**
   * This is the common logic for both the Node.js and web browser
   * implementations of `debug()`.
   */

  function setup(env) {
    createDebug.debug = createDebug;
    createDebug["default"] = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = ms;
    createDebug.destroy = destroy;
    Object.keys(env).forEach(function (key) {
      createDebug[key] = env[key];
    });
    /**
    * The currently active debug mode names, and names to skip.
    */

    createDebug.names = [];
    createDebug.skips = [];
    /**
    * Map of special "%n" handling functions, for the debug "format" argument.
    *
    * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    */

    createDebug.formatters = {};
    /**
    * Selects a color for a debug namespace
    * @param {String} namespace The namespace string for the for the debug instance to be colored
    * @return {Number|String} An ANSI color code for the given namespace
    * @api private
    */

    function selectColor(namespace) {
      var hash = 0;

      for (var i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }

      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }

    createDebug.selectColor = selectColor;
    /**
    * Create a debugger with the given `namespace`.
    *
    * @param {String} namespace
    * @return {Function}
    * @api public
    */

    function createDebug(namespace) {
      var prevTime;
      var enableOverride = null;
      var namespacesCache;
      var enabledCache;

      function debug() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        // Disabled?
        if (!debug.enabled) {
          return;
        }

        var self = debug; // Set `diff` timestamp

        var curr = Number(new Date());
        var ms = curr - (prevTime || curr);
        self.diff = ms;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);

        if (typeof args[0] !== 'string') {
          // Anything else let's inspect with %O
          args.unshift('%O');
        } // Apply any `formatters` transformations


        var index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, function (match, format) {
          // If we encounter an escaped % then don't increase the array index
          if (match === '%%') {
            return '%';
          }

          index++;
          var formatter = createDebug.formatters[format];

          if (typeof formatter === 'function') {
            var val = args[index];
            match = formatter.call(self, val); // Now we need to remove `args[index]` since it's inlined in the `format`

            args.splice(index, 1);
            index--;
          }

          return match;
        }); // Apply env-specific formatting (colors, etc.)

        createDebug.formatArgs.call(self, args);
        var logFn = self.log || createDebug.log;
        logFn.apply(self, args);
      }

      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

      Object.defineProperty(debug, 'enabled', {
        enumerable: true,
        configurable: false,
        get: function get() {
          if (enableOverride !== null) {
            return enableOverride;
          }

          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }

          return enabledCache;
        },
        set: function set(v) {
          enableOverride = v;
        }
      }); // Env-specific initialization logic for debug instances

      if (typeof createDebug.init === 'function') {
        createDebug.init(debug);
      }

      return debug;
    }

    function extend(namespace, delimiter) {
      var newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    /**
    * Enables a debug mode by namespaces. This can include modes
    * separated by a colon and wildcards.
    *
    * @param {String} namespaces
    * @api public
    */


    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      var i;
      var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
      var len = split.length;

      for (i = 0; i < len; i++) {
        if (!split[i]) {
          // ignore empty strings
          continue;
        }

        namespaces = split[i].replace(/\*/g, '.*?');

        if (namespaces[0] === '-') {
          createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
        } else {
          createDebug.names.push(new RegExp('^' + namespaces + '$'));
        }
      }
    }
    /**
    * Disable debug output.
    *
    * @return {String} namespaces
    * @api public
    */


    function disable() {
      var namespaces = [].concat(_toConsumableArray(createDebug.names.map(toNamespace)), _toConsumableArray(createDebug.skips.map(toNamespace).map(function (namespace) {
        return '-' + namespace;
      }))).join(',');
      createDebug.enable('');
      return namespaces;
    }
    /**
    * Returns true if the given mode name is enabled, false otherwise.
    *
    * @param {String} name
    * @return {Boolean}
    * @api public
    */


    function enabled(name) {
      if (name[name.length - 1] === '*') {
        return true;
      }

      var i;
      var len;

      for (i = 0, len = createDebug.skips.length; i < len; i++) {
        if (createDebug.skips[i].test(name)) {
          return false;
        }
      }

      for (i = 0, len = createDebug.names.length; i < len; i++) {
        if (createDebug.names[i].test(name)) {
          return true;
        }
      }

      return false;
    }
    /**
    * Convert regexp to namespace
    *
    * @param {RegExp} regxep
    * @return {String} namespace
    * @api private
    */


    function toNamespace(regexp) {
      return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, '*');
    }
    /**
    * Coerce `val`.
    *
    * @param {Mixed} val
    * @return {Mixed}
    * @api private
    */


    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }

      return val;
    }
    /**
    * XXX DO NOT USE. This is a temporary stub function.
    * XXX It WILL be removed in the next major release.
    */


    function destroy() {
      console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    }

    createDebug.enable(createDebug.load());
    return createDebug;
  }

  var common = setup;

  /* eslint-env browser */

  (function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();

    exports.destroy = function () {
      var warned = false;
      return function () {
        if (!warned) {
          warned = true;
          console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
        }
      };
    }();
    /**
     * Colors.
     */


    exports.colors = ['#0000CC', '#0000FF', '#0033CC', '#0033FF', '#0066CC', '#0066FF', '#0099CC', '#0099FF', '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#3300CC', '#3300FF', '#3333CC', '#3333FF', '#3366CC', '#3366FF', '#3399CC', '#3399FF', '#33CC00', '#33CC33', '#33CC66', '#33CC99', '#33CCCC', '#33CCFF', '#6600CC', '#6600FF', '#6633CC', '#6633FF', '#66CC00', '#66CC33', '#9900CC', '#9900FF', '#9933CC', '#9933FF', '#99CC00', '#99CC33', '#CC0000', '#CC0033', '#CC0066', '#CC0099', '#CC00CC', '#CC00FF', '#CC3300', '#CC3333', '#CC3366', '#CC3399', '#CC33CC', '#CC33FF', '#CC6600', '#CC6633', '#CC9900', '#CC9933', '#CCCC00', '#CCCC33', '#FF0000', '#FF0033', '#FF0066', '#FF0099', '#FF00CC', '#FF00FF', '#FF3300', '#FF3333', '#FF3366', '#FF3399', '#FF33CC', '#FF33FF', '#FF6600', '#FF6633', '#FF9900', '#FF9933', '#FFCC00', '#FFCC33'];
    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */
    // eslint-disable-next-line complexity

    function useColors() {
      // NB: In an Electron preload script, document will be defined but not fully
      // initialized. Since we know we're in Chrome, we'll just detect this case
      // explicitly
      if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
        return true;
      } // Internet Explorer and Edge do not support colors.


      if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      } // Is webkit? http://stackoverflow.com/a/16459606/376773
      // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632


      return typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== 'undefined' && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */


    function formatArgs(args) {
      args[0] = (this.useColors ? '%c' : '') + this.namespace + (this.useColors ? ' %c' : ' ') + args[0] + (this.useColors ? '%c ' : ' ') + '+' + module.exports.humanize(this.diff);

      if (!this.useColors) {
        return;
      }

      var c = 'color: ' + this.color;
      args.splice(1, 0, c, 'color: inherit'); // The final "%c" is somewhat tricky, because there could be other
      // arguments passed either before or after the %c, so we need to
      // figure out the correct index to insert the CSS into

      var index = 0;
      var lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, function (match) {
        if (match === '%%') {
          return;
        }

        index++;

        if (match === '%c') {
          // We only are interested in the *last* %c
          // (the user may have provided their own)
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */


    exports.log = console.debug || console.log || function () {};
    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */


    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem('debug', namespaces);
        } else {
          exports.storage.removeItem('debug');
        }
      } catch (error) {// Swallow
        // XXX (@Qix-) should we be logging these?
      }
    }
    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */


    function load() {
      var r;

      try {
        r = exports.storage.getItem('debug');
      } catch (error) {// Swallow
        // XXX (@Qix-) should we be logging these?
      } // If debug isn't set in LS, and we're in Electron, try to load $DEBUG


      if (!r && typeof process !== 'undefined' && 'env' in process) {
        r = process.env.DEBUG;
      }

      return r;
    }
    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */


    function localstorage() {
      try {
        // TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
        // The Browser also has localStorage in the global context.
        return localStorage;
      } catch (error) {// Swallow
        // XXX (@Qix-) should we be logging these?
      }
    }

    module.exports = common(exports);
    var formatters = module.exports.formatters;
    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return '[UnexpectedJSONParseError]: ' + error.message;
      }
    };
  })(browser, browser.exports);

  var debugModule = browser.exports;

  /**
   * Module dependencies.
   */
  var debug$7 = debugModule("engine.io-client:polling");

  var hasXHR2 = function () {
    var xhr = XMLHttpRequest$1({
      xdomain: false
    });
    return null != xhr.responseType;
  }();
  /**
   * Polling interface.
   *
   * @param {Object} opts
   * @api private
   */


  function Polling(opts) {
    var forceBase64 = opts && opts.forceBase64;

    if (!hasXHR2 || forceBase64) {
      this.supportsBinary = false;
    }

    Transport.call(this, opts);
  }
  /**
   * Inherits from Transport.
   */


  inherit(Polling, Transport);
  /**
   * Transport name.
   */

  Polling.prototype.name = 'polling';
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @api private
   */

  Polling.prototype.doOpen = function () {
    this.poll();
  };
  /**
   * Pauses polling.
   *
   * @param {Function} callback upon buffers are flushed and transport is paused
   * @api private
   */


  Polling.prototype.pause = function (onPause) {
    var self = this;
    this.readyState = 'pausing';

    function pause() {
      debug$7('paused');
      self.readyState = 'paused';
      onPause();
    }

    if (this.polling || !this.writable) {
      var total = 0;

      if (this.polling) {
        debug$7('we are currently polling - waiting to pause');
        total++;
        this.once('pollComplete', function () {
          debug$7('pre-pause polling complete');
          --total || pause();
        });
      }

      if (!this.writable) {
        debug$7('we are currently writing - waiting to pause');
        total++;
        this.once('drain', function () {
          debug$7('pre-pause writing complete');
          --total || pause();
        });
      }
    } else {
      pause();
    }
  };
  /**
   * Starts polling cycle.
   *
   * @api public
   */


  Polling.prototype.poll = function () {
    debug$7('polling');
    this.polling = true;
    this.doPoll();
    this.emit('poll');
  };
  /**
   * Overloads onData to detect payloads.
   *
   * @api private
   */


  Polling.prototype.onData = function (data) {
    var self = this;
    debug$7('polling got data %s', data);

    var callback = function callback(packet, index, total) {
      // if its the first message we consider the transport open
      if ('opening' === self.readyState) {
        self.onOpen();
      } // if its a close packet, we close the ongoing requests


      if ('close' === packet.type) {
        self.onClose();
        return false;
      } // otherwise bypass onData and handle the message


      self.onPacket(packet);
    }; // decode payload


    self.decodePayload(data, this.socket.binaryType, callback); // if an event did not trigger closing

    if ('closed' !== this.readyState) {
      // if we got data we're not polling
      this.polling = false;
      this.emit('pollComplete');

      if ('open' === this.readyState) {
        this.poll();
      } else {
        debug$7('ignoring poll - transport state "%s"', this.readyState);
      }
    }
  };
  /**
   * For polling, send a close packet.
   *
   * @api private
   */


  Polling.prototype.doClose = function () {
    var self = this;

    function close() {
      debug$7('writing close packet');
      self.write([{
        type: 'close'
      }]);
    }

    if ('open' === this.readyState) {
      debug$7('transport open - closing');
      close();
    } else {
      // in case we're trying to close while
      // handshaking is in progress (GH-164)
      debug$7('transport not open - deferring close');
      this.once('open', close);
    }
  };
  /**
   * Removes out of band data and decodes the clean payload.
   *
   * @param {Array} data packets
   * @param {Object} typ type
   * @param {Function} callback parser callback
   * @api private
   */


  Polling.prototype.decodePayload = function (data, binaryType, callback) {
    var self = this;
    var cleanData = '';
    var outOfBand = '';
    var matchPos = [];

    if (typeof data === 'string') {
      data = data.substring(data.startsWith('ok') ? 2 : 0); // find packets

      var pos = data.indexOf(':');

      while (pos !== -1) {
        if (pos > 0 && pos < data.length - 1 && data[pos - 1] >= '0' && data[pos - 1] <= '9' && data[pos + 1] >= '0' && data[pos + 1] <= '9') {
          matchPos.push(pos);
        }

        pos = data.indexOf(':', pos + 1);
      } // separate packets from out of band data


      var prev = 0;
      var start = 0;
      var end = 0;
      var del = 0;
      var len = 0;
      var heur = 0;

      for (var m = 0; m < matchPos.length; ++m) {
        start = matchPos[m] - del - 1;
        end = start + 1;

        while (start >= 0 && data[start] >= '0' && data[start] <= '9') {
          len = parseInt(data.substring(start, end)); // heuristic to ignore extra outOfBand digit

          heur = data.length;

          if (m + 1 < matchPos.length) {
            heur = matchPos[m + 1] - del - 1;
          }

          if (end + len >= heur) {
            break;
          }

          --start;
        }

        ++start;

        if (start >= 2 && data.substring(start - 2, start) === 'ok') {
          data = data.substring(0, start - 2) + data.substring(start);
          del += 2;
          start -= 2;
        }

        end = matchPos[m] - del;
        len = parseInt(data.substring(start, end));
        cleanData += data.substring(start, end + len + 1);
        outOfBand += data.substring(prev, start);
        prev = end + len + 1;
      }

      if (prev < data.length) {
        outOfBand += data.substring(prev);
      } // decode packets


      if (cleanData) {
        parser$3.decodePayload(cleanData, binaryType, callback);
      }

      if (outOfBand) {
        self.outOfBand(outOfBand);
      }
    } else if (data) {
      parser$3.decodePayload(data, binaryType, callback);
    }
  };
  /**
   * Writes a packets payload.
   *
   * @param {Array} data packets
   * @param {Function} drain callback
   * @api private
   */


  Polling.prototype.write = function (packets) {
    var self = this;
    this.writable = false;

    var callback = function callback(packet, index, total) {
      // handle the message
      self.onPacket(packet);
    };

    var callbackfn = function callbackfn(data) {
      self.decodePayload(data, self.socket.binaryType, callback);
      self.writable = true;
      self.emit('drain');
    };

    parser$3.encodePayload(packets, this.supportsBinary, function (data) {
      self.doWrite(data, callbackfn);
    });
  };
  /**
   * Generates uri for connection.
   *
   * @api private
   */


  Polling.prototype.uri = function () {
    var query = this.query || {};
    var schema = this.secure ? 'https' : 'http';
    var port = '';
    var path = typeof this.path === 'function' ? this.path() : this.path; // cache busting is forced

    if (false !== this.timestampRequests) {
      query[this.timestampParam] = yeast_1();
    }

    if (!this.supportsBinary && !query.sid) {
      query.b64 = 1;
    }

    query = parseqs$1.encode(query); // avoid port if default for schema

    if (this.port && ('https' === schema && Number(this.port) !== 443 || 'http' === schema && Number(this.port) !== 80)) {
      port = ':' + this.port;
    } // prepend ? to query


    if (query.length) {
      query = '?' + query;
    }

    var ipv6 = this.hostname.indexOf(':') !== -1;
    return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + path + query;
  };

  /* global attachEvent */
  var debug$6 = debugModule("engine.io-client:polling-xhr");
  /**
   * Empty function
   */

  function empty$1() {}
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @api public
   */


  function XHR(opts) {
    Polling.call(this, opts);
    this.requestTimeout = opts.requestTimeout;
    this.extraHeaders = opts.extraHeaders;

    if (typeof location !== 'undefined') {
      var isSSL = 'https:' === location.protocol;
      var port = location.port; // some user agents have empty `location.port`

      if (!port) {
        port = isSSL ? 443 : 80;
      }

      this.xd = typeof location !== 'undefined' && opts.hostname !== location.hostname || port !== opts.port;
      this.xs = opts.secure !== isSSL;
    }
  }
  /**
   * Inherits from Polling.
   */


  inherit(XHR, Polling);
  /**
   * XHR supports binary
   */

  XHR.prototype.supportsBinary = true;
  /**
   * Creates a request.
   *
   * @param {String} method
   * @api private
   */

  XHR.prototype.request = function (opts) {
    opts = opts || {};
    opts.uri = this.uri();
    opts.xd = this.xd;
    opts.xs = this.xs;
    opts.agent = this.agent || false;
    opts.supportsBinary = this.supportsBinary;
    opts.enablesXDR = this.enablesXDR; // SSL options for Node.js client

    opts.pfx = this.pfx;
    opts.key = this.key;
    opts.passphrase = this.passphrase;
    opts.cert = this.cert;
    opts.ca = this.ca;
    opts.ciphers = this.ciphers;
    opts.rejectUnauthorized = this.rejectUnauthorized;
    opts.requestTimeout = this.requestTimeout; // other options for Node.js client

    opts.extraHeaders = this.extraHeaders;
    return new Request(opts);
  };
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @api private
   */


  XHR.prototype.doWrite = function (data, fn) {
    var isBinary = typeof data !== 'string' && data !== undefined;
    var req = this.request({
      method: 'POST',
      data: data,
      isBinary: isBinary
    });
    var self = this;
    req.on('data', fn);
    req.on('error', function (err) {
      self.onError('xhr post error', err);
    });
    this.sendXhr = req;
  };
  /**
   * Starts a poll cycle.
   *
   * @api private
   */


  XHR.prototype.doPoll = function () {
    debug$6('xhr poll');
    var req = this.request();
    var self = this;
    req.on('data', function (data) {
      self.onData(data);
    });
    req.on('error', function (err) {
      self.onError('xhr poll error', err);
    });
    this.pollXhr = req;
  };
  /**
   * Request constructor
   *
   * @param {Object} options
   * @api public
   */


  function Request(opts) {
    this.method = opts.method || 'GET';
    this.uri = opts.uri;
    this.xd = !!opts.xd;
    this.xs = !!opts.xs;
    this.async = false !== opts.async;
    this.data = undefined !== opts.data ? opts.data : null;
    this.agent = opts.agent;
    this.isBinary = opts.isBinary;
    this.supportsBinary = opts.supportsBinary;
    this.enablesXDR = opts.enablesXDR;
    this.requestTimeout = opts.requestTimeout; // SSL options for Node.js client

    this.pfx = opts.pfx;
    this.key = opts.key;
    this.passphrase = opts.passphrase;
    this.cert = opts.cert;
    this.ca = opts.ca;
    this.ciphers = opts.ciphers;
    this.rejectUnauthorized = opts.rejectUnauthorized; // other options for Node.js client

    this.extraHeaders = opts.extraHeaders;
    this.create();
  }
  /**
   * Mix in `Emitter`.
   */


  Emitter$1(Request.prototype);
  /**
   * Creates the XHR object and sends the request.
   *
   * @api private
   */

  Request.prototype.create = function () {
    var opts = {
      agent: this.agent,
      xdomain: this.xd,
      xscheme: this.xs,
      enablesXDR: this.enablesXDR
    }; // SSL options for Node.js client

    opts.pfx = this.pfx;
    opts.key = this.key;
    opts.passphrase = this.passphrase;
    opts.cert = this.cert;
    opts.ca = this.ca;
    opts.ciphers = this.ciphers;
    opts.rejectUnauthorized = this.rejectUnauthorized;
    var xhr = this.xhr = XMLHttpRequest$1(opts);
    var self = this;

    try {
      debug$6('xhr open %s: %s', this.method, this.uri);
      xhr.open(this.method, this.uri, this.async);

      try {
        if (this.extraHeaders) {
          xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);

          for (var i in this.extraHeaders) {
            if (this.extraHeaders.hasOwnProperty(i)) {
              xhr.setRequestHeader(i, this.extraHeaders[i]);
            }
          }
        }
      } catch (e) {}

      if ('POST' === this.method) {
        try {
          if (this.isBinary) {
            xhr.setRequestHeader('Content-type', 'application/octet-stream');
          } else {
            xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
          }
        } catch (e) {}
      }

      try {
        xhr.setRequestHeader('Accept', '*/*');
      } catch (e) {} // ie6 check


      if ('withCredentials' in xhr) {
        xhr.withCredentials = true;
      }

      if (this.requestTimeout) {
        xhr.timeout = this.requestTimeout;
      }

      if (this.hasXDR()) {
        xhr.onload = function () {
          self.onLoad();
        };

        xhr.onerror = function () {
          self.onError(xhr.responseText);
        };
      } else {
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 2) {
            try {
              var contentType = xhr.getResponseHeader('Content-Type');

              if (self.supportsBinary && contentType === 'application/octet-stream') {
                xhr.responseType = 'arraybuffer';
              }
            } catch (e) {}
          }

          if (4 !== xhr.readyState) return;

          if (200 === xhr.status || 1223 === xhr.status) {
            self.onLoad();
          } else {
            // make sure the `error` event handler that's user-set
            // does not throw in the same tick and gets caught here
            setTimeout(function () {
              self.onError(xhr.status);
            }, 0);
          }
        };
      }

      debug$6('xhr data %s', this.data);
      xhr.send(this.data);
    } catch (e) {
      // Need to defer since .create() is called directly fhrom the constructor
      // and thus the 'error' event can only be only bound *after* this exception
      // occurs.  Therefore, also, we cannot throw here at all.
      setTimeout(function () {
        self.onError(e);
      }, 0);
      return;
    }

    if (typeof document !== 'undefined') {
      this.index = Request.requestsCount++;
      Request.requests[this.index] = this;
    }
  };
  /**
   * Called upon successful response.
   *
   * @api private
   */


  Request.prototype.onSuccess = function () {
    this.emit('success');
    this.cleanup();
  };
  /**
   * Called if we have data.
   *
   * @api private
   */


  Request.prototype.onData = function (data) {
    this.emit('data', data);
    this.onSuccess();
  };
  /**
   * Called upon error.
   *
   * @api private
   */


  Request.prototype.onError = function (err) {
    this.emit('error', err);
    this.cleanup(true);
  };
  /**
   * Cleans up house.
   *
   * @api private
   */


  Request.prototype.cleanup = function (fromError) {
    if ('undefined' === typeof this.xhr || null === this.xhr) {
      return;
    } // xmlhttprequest


    if (this.hasXDR()) {
      this.xhr.onload = this.xhr.onerror = empty$1;
    } else {
      this.xhr.onreadystatechange = empty$1;
    }

    if (fromError) {
      try {
        this.xhr.abort();
      } catch (e) {}
    }

    if (typeof document !== 'undefined') {
      delete Request.requests[this.index];
    }

    this.xhr = null;
  };
  /**
   * Called upon load.
   *
   * @api private
   */


  Request.prototype.onLoad = function () {
    var data;

    try {
      var contentType;

      try {
        contentType = this.xhr.getResponseHeader('Content-Type');
      } catch (e) {}

      if (contentType === 'application/octet-stream') {
        data = this.xhr.response || this.xhr.responseText;
      } else {
        data = this.xhr.responseText;
      }
    } catch (e) {
      this.onError(e);
    }

    if (null != data) {
      this.onData(data);
    }
  };
  /**
   * Check if it has XDomainRequest.
   *
   * @api private
   */


  Request.prototype.hasXDR = function () {
    return false; //typeof XDomainRequest !== 'undefined' && !this.xs && this.enablesXDR;
  };
  /**
   * Aborts the request.
   *
   * @api public
   */


  Request.prototype.abort = function () {
    this.cleanup();
  };
  /**
   * Aborts pending requests when unloading the window. This is needed to prevent
   * memory leaks (e.g. when using IE) and to ensure that no spurious error is
   * emitted.
   */


  Request.requestsCount = 0;
  Request.requests = {};

  if (typeof document !== 'undefined') {
    /*if (typeof attachEvent === 'function') {
      attachEvent('onunload', unloadHandler);
    } else */
    if (typeof addEventListener === 'function') {
      var terminationEvent = 'onpagehide' in self ? 'pagehide' : 'unload';
      addEventListener(terminationEvent, unloadHandler, false);
    }
  }

  function unloadHandler() {
    for (var i in Request.requests) {
      if (Request.requests.hasOwnProperty(i)) {
        var obj = Request.requests[i];

        if (typeof obj !== 'undefined') {
          if (typeof obj.abort !== 'undefined') {
            obj.abort();
          }
        }
      }
    }
  }

  /**
   * Module requirements.
   */
  /**
   * Cached regular expressions.
   */

  var rNewline = /\n/g;
  var rEscapedNewline = /\\n/g;
  /**
   * Global JSONP callbacks.
   */

  var callbacks;
  /**
   * Noop.
   */

  function empty() {}
  /**
   * JSONP Polling constructor.
   *
   * @param {Object} opts.
   * @api public
   */


  function JSONPPolling(opts) {
    Polling.call(this, opts);
    this.query = this.query || {}; // define global callbacks array if not present
    // we do this here (lazily) to avoid unneeded global pollution

    /*
      if (!callbacks) {
        // we need to consider multiple engines in the same page
        var global = glob();
        callbacks = global.___eio = (global.___eio || []);
      }
    */
    // callback identifier

    this.index = callbacks.length; // add callback to jsonp global

    var self = this;
    callbacks.push(function (msg) {
      self.onData(msg);
    }); // append to query string

    this.query.j = this.index; // prevent spurious errors from being emitted when the window is unloaded

    if (typeof addEventListener === 'function') {
      addEventListener('beforeunload', function () {
        if (self.script) self.script.onerror = empty;
      }, false);
    }
  }
  /**
   * Inherits from Polling.
   */


  inherit(JSONPPolling, Polling);
  /*
   * JSONP only supports binary as base64 encoded strings
   */

  JSONPPolling.prototype.supportsBinary = false;
  /**
   * Closes the socket.
   *
   * @api private
   */

  JSONPPolling.prototype.doClose = function () {
    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    if (this.form) {
      this.form.parentNode.removeChild(this.form);
      this.form = null;
      this.iframe = null;
    }

    Polling.prototype.doClose.call(this);
  };
  /**
   * Starts a poll cycle.
   *
   * @api private
   */


  JSONPPolling.prototype.doPoll = function () {
    var self = this;
    var script = document.createElement('script');

    if (this.script) {
      this.script.parentNode.removeChild(this.script);
      this.script = null;
    }

    script.async = true;
    script.src = this.uri();

    script.onerror = function (e) {
      self.onError('jsonp poll error', e);
    };

    var insertAt = document.getElementsByTagName('script')[0];

    if (insertAt) {
      insertAt.parentNode.insertBefore(script, insertAt);
    } else {
      (document.head || document.body).appendChild(script);
    }

    this.script = script;
    var isUAgecko = 'undefined' !== typeof navigator && /gecko/i.test(navigator.userAgent);

    if (isUAgecko) {
      setTimeout(function () {
        var iframe = document.createElement('iframe');
        document.body.appendChild(iframe);
        document.body.removeChild(iframe);
      }, 100);
    }
  };
  /**
   * Writes with a hidden iframe.
   *
   * @param {String} data to send
   * @param {Function} called upon flush.
   * @api private
   */


  JSONPPolling.prototype.doWrite = function (data, fn) {
    var self = this;

    if (!this.form) {
      var form = document.createElement('form');
      var area = document.createElement('textarea');
      var id = this.iframeId = 'eio_iframe_' + this.index;
      var iframe;
      form.className = 'socketio';
      form.style.position = 'absolute';
      form.style.top = '-1000px';
      form.style.left = '-1000px';
      form.target = id;
      form.method = 'POST';
      form.setAttribute('accept-charset', 'utf-8');
      area.name = 'd';
      form.appendChild(area);
      document.body.appendChild(form);
      this.form = form;
      this.area = area;
    }

    this.form.action = this.uri();

    function complete() {
      initIframe();
      fn();
    }

    function initIframe() {
      if (self.iframe) {
        try {
          self.form.removeChild(self.iframe);
        } catch (e) {
          self.onError('jsonp polling iframe removal error', e);
        }
      }

      try {
        // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
        var html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
        iframe = document.createElement(html);
      } catch (e) {
        iframe = document.createElement('iframe');
        iframe.name = self.iframeId;
        iframe.src = 'javascript:0';
      }

      iframe.id = self.iframeId;
      self.form.appendChild(iframe);
      self.iframe = iframe;
    }

    initIframe(); // escape \n to prevent it from being converted into \r\n by some UAs
    // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side

    data = data.replace(rEscapedNewline, '\\\n');
    this.area.value = data.replace(rNewline, '\\n');

    try {
      this.form.submit();
    } catch (e) {}

    if (this.iframe.attachEvent) {
      this.iframe.onreadystatechange = function () {
        if (self.iframe.readyState === 'complete') {
          complete();
        }
      };
    } else {
      this.iframe.onload = complete;
    }
  };

  /**
   * Module dependencies.
   */
  var parser$2 = {
    encodePacket: encodePacket$1,
    encodePayload: encodePayload$1,
    decodePacket: decodePacket$1,
    decodePayload: decodePayload$1
  };
  var debug$5 = debugModule("engine.io-client:websocket");
  var BrowserWebSocket, NodeWebSocket;

  if (typeof WebSocket !== 'undefined') {
    BrowserWebSocket = WebSocket;
  } else if (typeof self !== 'undefined') {
    BrowserWebSocket = self.WebSocket; // || self.MozWebSocket;
  } else {
    try {
      NodeWebSocket = require('ws');
    } catch (e) {}
  }
  /**
   * Get either the `WebSocket` or `MozWebSocket` globals
   * in the browser or try to resolve WebSocket-compatible
   * interface exposed by `ws` for Node-like environment.
   */


  var WebSocketImpl = BrowserWebSocket || NodeWebSocket;
  /**
   * WebSocket transport constructor.
   *
   * @api {Object} connection options
   * @api public
   */

  function WS(opts) {
    var forceBase64 = opts && opts.forceBase64;

    if (forceBase64) {
      this.supportsBinary = false;
    }

    this.perMessageDeflate = opts.perMessageDeflate;
    this.usingBrowserWebSocket = BrowserWebSocket && !opts.forceNode;
    this.protocols = opts.protocols;

    if (!this.usingBrowserWebSocket) {
      WebSocketImpl = NodeWebSocket;
    }

    Transport.call(this, opts);
  }
  /**
   * Inherits from Transport.
   */


  inherit(WS, Transport);
  /**
   * Transport name.
   *
   * @api public
   */

  WS.prototype.name = 'websocket';
  /*
   * WebSockets support binary
   */

  WS.prototype.supportsBinary = true;
  /**
   * Opens socket.
   *
   * @api private
   */

  WS.prototype.doOpen = function () {
    if (!this.check()) {
      // let probe timeout
      return;
    }

    var uri = this.uri();
    var protocols = this.protocols;
    var opts = {
      agent: this.agent,
      perMessageDeflate: this.perMessageDeflate
    }; // SSL options for Node.js client

    opts.pfx = this.pfx;
    opts.key = this.key;
    opts.passphrase = this.passphrase;
    opts.cert = this.cert;
    opts.ca = this.ca;
    opts.ciphers = this.ciphers;
    opts.rejectUnauthorized = this.rejectUnauthorized;

    if (this.extraHeaders) {
      opts.headers = this.extraHeaders;
    }

    if (this.localAddress) {
      opts.localAddress = this.localAddress;
    }

    try {
      this.ws = this.usingBrowserWebSocket && !this.isReactNative ? protocols ? new WebSocketImpl(uri, protocols) : new WebSocketImpl(uri) : new WebSocketImpl(uri, protocols, opts);
    } catch (err) {
      return this.emit('error', err);
    }

    if (this.ws.binaryType === undefined) {
      this.supportsBinary = false;
    }

    if (this.ws.supports && this.ws.supports.binary) {
      this.supportsBinary = true;
      this.ws.binaryType = 'nodebuffer';
    } else {
      this.ws.binaryType = 'arraybuffer';
    }

    this.addEventListeners();
  };
  /**
   * Adds event listeners to the socket
   *
   * @api private
   */


  WS.prototype.addEventListeners = function () {
    var self = this;

    this.ws.onopen = function () {
      self.onOpen();
    };

    this.ws.onclose = function () {
      self.onClose();
    };

    this.ws.onmessage = function (ev) {
      self.onData(ev.data);
    };

    this.ws.onerror = function (e) {
      self.onError('websocket error', e);
    };
  };
  /**
   * Writes data to socket.
   *
   * @param {Array} array of packets.
   * @api private
   */


  WS.prototype.write = function (packets) {
    var self = this;
    this.writable = false; // encodePacket efficient as it uses WS framing
    // no need for encodePayload

    var total = packets.length;

    for (var i = 0, l = total; i < l; i++) {
      (function (packet) {
        parser$2.encodePacket(packet, self.supportsBinary, function (data) {
          if (!self.usingBrowserWebSocket) {
            // always create a new object (GH-437)
            var opts = {};

            if (packet.options) {
              opts.compress = packet.options.compress;
            }

            if (self.perMessageDeflate) {
              var len = 'string' === typeof data ? Buffer.byteLength(data) : data.length;

              if (len < self.perMessageDeflate.threshold) {
                opts.compress = false;
              }
            }
          } // Sometimes the websocket has already been closed but the browser didn't
          // have a chance of informing us about it yet, in that case send will
          // throw an error


          try {
            if (self.usingBrowserWebSocket) {
              // TypeError is thrown when passing the second argument on Safari
              self.ws.send(data);
            } else {
              self.ws.send(data, opts);
            }
          } catch (e) {
            debug$5('websocket closed before onclose event');
          }

          --total || done();
        });
      })(packets[i]);
    }

    function done() {
      self.emit('flush'); // fake drain
      // defer to next tick to allow Socket to clear writeBuffer

      setTimeout(function () {
        self.writable = true;
        self.emit('drain');
      }, 0);
    }
  };
  /**
   * Called upon close
   *
   * @api private
   */


  WS.prototype.onClose = function () {
    Transport.prototype.onClose.call(this);
  };
  /**
   * Closes socket.
   *
   * @api private
   */


  WS.prototype.doClose = function () {
    if (typeof this.ws !== 'undefined') {
      this.ws.close();
    }
  };
  /**
   * Generates uri for connection.
   *
   * @api private
   */


  WS.prototype.uri = function () {
    var query = this.query || {};
    var schema = this.secure ? 'wss' : 'ws';
    var port = '';
    var path = typeof this.path === 'function' ? this.path() : this.path; // avoid port if default for schema

    if (this.port && ('wss' === schema && Number(this.port) !== 443 || 'ws' === schema && Number(this.port) !== 80)) {
      port = ':' + this.port;
    } // append timestamp to URI


    if (this.timestampRequests) {
      query[this.timestampParam] = yeast_1();
    } // communicate binary support capabilities


    if (!this.supportsBinary) {
      query.b64 = 1;
    }

    query = parseqs$1.encode(query); // prepend ? to query

    if (query.length) {
      query = '?' + query;
    }

    var ipv6 = this.hostname.indexOf(':') !== -1;
    return schema + '://' + (ipv6 ? '[' + this.hostname + ']' : this.hostname) + port + path + query;
  };
  /**
   * Feature detection for WebSocket.
   *
   * @return {Boolean} whether this transport is available.
   * @api public
   */


  WS.prototype.check = function () {
    return !!WebSocketImpl && !('__initialize' in WebSocketImpl && this.name === WS.prototype.name);
  };

  /**
   * Module dependencies
   */
  /**
   * Polling transport polymorphic constructor.
   * Decides on xhr vs jsonp based on feature detection.
   *
   * @api private
   */

  function polling(opts) {
    var xhr;
    var xd = false;
    var xs = false;
    var jsonp = false !== opts.jsonp;

    if (typeof location !== 'undefined') {
      var isSSL = 'https:' === location.protocol;
      var port = parseInt(location.port); // some user agents have empty `location.port`

      if (!port) {
        port = isSSL ? 443 : 80;
      }

      xd = opts.hostname !== location.hostname || port !== opts.port;
      xs = opts.secure !== isSSL;
    }

    opts.xdomain = xd;
    opts.xscheme = xs;
    xhr = XMLHttpRequest$1(opts);

    if ('open' in xhr && !opts.forceJSONP) {
      return new XHR(opts);
    } else {
      if (!jsonp) throw new Error('JSONP disabled');
      return new JSONPPolling(opts);
    }
  }

  var transports = {
    polling: polling,
    websocket: WS
  };

  debugModule("engine.io-client:socket");
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri or options
   * @param {Object} options
   * @api public
   */

  function Socket$2(uri, opts) {
    //  if (!(this instanceof Socket)) return new Socket(uri, opts);
    opts = opts || {};

    this.outOfBand = opts.outOfBand || function () {};

    if (uri && 'object' === _typeof(uri)) {
      opts = uri;
      uri = null;
    }

    if (uri) {
      uri = parseuri(uri);
      opts.hostname = uri.host;
      opts.secure = uri.protocol === 'https' || uri.protocol === 'wss';
      opts.port = uri.port;
      if (uri.query) opts.query = uri.query;
    } else if (opts.host) {
      opts.hostname = parseuri(opts.host).host;
    }

    this.secure = null != opts.secure ? opts.secure : typeof location !== 'undefined' && 'https:' === location.protocol;

    if (opts.hostname && !opts.port) {
      // if no port is specified manually, use the protocol default
      opts.port = this.secure ? '443' : '80';
    }

    this.agent = opts.agent || false;
    this.hostname = opts.hostname || (typeof location !== 'undefined' ? location.hostname : 'localhost');
    this.port = opts.port || (typeof location !== 'undefined' && location.port ? location.port : this.secure ? 443 : 80);
    this.query = opts.query || {};
    if ('string' === typeof this.query) this.query = parseqs$1.decode(this.query);
    this.upgrade = false !== opts.upgrade;
    this.path = opts.path || '/engine.io';
    if ('string' === typeof this.path) this.path = this.path.replace(/\/$/, '') + '/';
    this.forceJSONP = !!opts.forceJSONP;
    this.jsonp = false !== opts.jsonp;
    this.forceBase64 = !!opts.forceBase64;
    this.enablesXDR = !!opts.enablesXDR;
    this.timestampParam = opts.timestampParam || 't';
    this.timestampRequests = opts.timestampRequests;
    this.transports = opts.transports || ['polling', 'websocket'];
    this.transportOptions = opts.transportOptions || {};
    this.readyState = '';
    this.writeBuffer = [];
    this.prevBufferLen = 0;
    this.policyPort = opts.policyPort || 843;
    this.rememberUpgrade = opts.rememberUpgrade || false;
    this.binaryType = null;
    this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;
    this.perMessageDeflate = false !== opts.perMessageDeflate ? opts.perMessageDeflate || {} : false;
    if (true === this.perMessageDeflate) this.perMessageDeflate = {};

    if (this.perMessageDeflate && null == this.perMessageDeflate.threshold) {
      this.perMessageDeflate.threshold = 1024;
    } // SSL options for Node.js client


    this.pfx = opts.pfx || null;
    this.key = opts.key || null;
    this.passphrase = opts.passphrase || null;
    this.cert = opts.cert || null;
    this.ca = opts.ca || null;
    this.ciphers = opts.ciphers || null;
    this.rejectUnauthorized = opts.rejectUnauthorized === undefined ? true : opts.rejectUnauthorized;
    this.forceNode = !!opts.forceNode; // detect ReactNative environment

    this.isReactNative = typeof navigator !== 'undefined' && typeof navigator.product === 'string' && navigator.product.toLowerCase() === 'reactnative'; // other options for Node.js or ReactNative client

    if (typeof self === 'undefined' || this.isReactNative) {
      if (opts.extraHeaders && Object.keys(opts.extraHeaders).length > 0) {
        this.extraHeaders = opts.extraHeaders;
      }

      if (opts.localAddress) {
        this.localAddress = opts.localAddress;
      }
    } // set on handshake


    this.id = null;
    this.upgrades = null;
    this.pingInterval = null;
    this.pingTimeout = null; // set on heartbeat

    this.pingIntervalTimer = null;
    this.pingTimeoutTimer = null;
    this.open();
  }

  Socket$2.priorWebsocketSuccess = false;
  /**
   * Mix in `Emitter`.
   */

  Emitter$1(Socket$2.prototype);
  /**
   * Protocol version.
   *
   * @api public
   */

  Socket$2.protocol = parser$3.protocol; // this is an int

  /**
   * Expose deps for legacy compatibility
   * and standalone browser access.
   */

  Socket$2.Socket = Socket$2;
  Socket$2.Transport = Transport;
  Socket$2.transports = transports;
  Socket$2.parser = parser$3;
  /**
   * Creates transport of the given type.
   *
   * @param {String} transport name
   * @return {Transport}
   * @api private
   */

  Socket$2.prototype.createTransport = function (name) {
    var query = clone(this.query); // append engine.io protocol identifier

    query.EIO = parser$3.protocol; // transport name

    query.transport = name; // per-transport options

    var options = this.transportOptions[name] || {}; // session id if we already have one

    if (this.id) query.sid = this.id;
    var transport = new transports[name]({
      query: query,
      socket: this,
      agent: options.agent || this.agent,
      hostname: options.hostname || this.hostname,
      port: options.port || this.port,
      secure: options.secure || this.secure,
      path: options.path || this.path,
      forceJSONP: options.forceJSONP || this.forceJSONP,
      jsonp: options.jsonp || this.jsonp,
      forceBase64: options.forceBase64 || this.forceBase64,
      enablesXDR: options.enablesXDR || this.enablesXDR,
      timestampRequests: options.timestampRequests || this.timestampRequests,
      timestampParam: options.timestampParam || this.timestampParam,
      policyPort: options.policyPort || this.policyPort,
      pfx: options.pfx || this.pfx,
      key: options.key || this.key,
      passphrase: options.passphrase || this.passphrase,
      cert: options.cert || this.cert,
      ca: options.ca || this.ca,
      ciphers: options.ciphers || this.ciphers,
      rejectUnauthorized: options.rejectUnauthorized || this.rejectUnauthorized,
      perMessageDeflate: options.perMessageDeflate || this.perMessageDeflate,
      extraHeaders: options.extraHeaders || this.extraHeaders,
      forceNode: options.forceNode || this.forceNode,
      localAddress: options.localAddress || this.localAddress,
      requestTimeout: options.requestTimeout || this.requestTimeout,
      protocols: options.protocols || void 0,
      isReactNative: this.isReactNative
    });
    return transport;
  };

  function clone(obj) {
    var o = {};

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        o[i] = obj[i];
      }
    }

    return o;
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @api private
   */


  Socket$2.prototype.open = function () {
    var transport;

    if (this.rememberUpgrade && Socket$2.priorWebsocketSuccess && this.transports.indexOf('websocket') !== -1) {
      transport = 'websocket';
    } else if (0 === this.transports.length) {
      // Emit error on next tick so it can be listened to
      var self = this;
      setTimeout(function () {
        self.emit('error', 'No transports available');
      }, 0);
      return;
    } else {
      transport = this.transports[0];
    }

    this.readyState = 'opening'; // Retry with the next transport if the transport is disabled (jsonp: false)

    try {
      transport = this.createTransport(transport);
    } catch (e) {
      this.transports.shift();
      this.open();
      return;
    }

    transport.open();
    this.setTransport(transport);
  };
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @api private
   */


  Socket$2.prototype.setTransport = function (transport) {
    var self = this;

    if (this.transport) {
      this.transport.removeAllListeners();
    } // set up transport


    this.transport = transport; // set up transport listeners

    transport.on('outOfBand', function (data) {
      self.onOutOfBand(data);
    }).on('drain', function () {
      self.onDrain();
    }).on('packet', function (packet) {
      self.onPacket(packet);
    }).on('error', function (e) {
      self.onError(e);
    }).on('close', function () {
      self.onClose('transport close');
    });
  };
  /**
   * Probes a transport.
   *
   * @param {String} transport name
   * @api private
   */


  Socket$2.prototype.probe = function (name) {
    var transport = this.createTransport(name, {
      probe: 1
    });
    var failed = false;
    var self = this;
    Socket$2.priorWebsocketSuccess = false;

    function onTransportOpen() {
      if (self.onlyBinaryUpgrades) {
        var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
        failed = failed || upgradeLosesBinary;
      }

      if (failed) return;
      transport.send([{
        type: 'ping',
        data: 'probe'
      }]);
      transport.once('packet', function (msg) {
        if (failed) return;

        if ('pong' === msg.type && 'probe' === msg.data) {
          self.upgrading = true;
          self.emit('upgrading', transport);
          if (!transport) return;
          Socket$2.priorWebsocketSuccess = 'websocket' === transport.name;
          self.transport.pause(function () {
            if (failed) return;
            if ('closed' === self.readyState) return;
            cleanup();
            self.setTransport(transport);
            transport.send([{
              type: 'upgrade'
            }]);
            self.emit('upgrade', transport);
            transport = null;
            self.upgrading = false;
            self.flush();
          });
        } else {
          var err = new Error('probe error');
          err.transport = transport.name;
          self.emit('upgradeError', err);
        }
      });
    }

    function freezeTransport() {
      if (failed) return; // Any callback called by transport should be ignored since now

      failed = true;
      cleanup();
      transport.close();
      transport = null;
    } // Handle any error that happens while probing


    function onerror(err) {
      var error = new Error('probe error: ' + err);
      error.transport = transport.name;
      freezeTransport();
      self.emit('upgradeError', error);
    }

    function onTransportClose() {
      onerror('transport closed');
    } // When the socket is closed while we're probing


    function onclose() {
      onerror('socket closed');
    } // When the socket is upgraded while we're probing


    function onupgrade(to) {
      if (transport && to.name !== transport.name) {
        freezeTransport();
      }
    } // Remove all listeners on the transport and on self


    function cleanup() {
      transport.removeListener('open', onTransportOpen);
      transport.removeListener('error', onerror);
      transport.removeListener('close', onTransportClose);
      self.removeListener('close', onclose);
      self.removeListener('upgrading', onupgrade);
    }

    transport.once('open', onTransportOpen);
    transport.once('error', onerror);
    transport.once('close', onTransportClose);
    this.once('close', onclose);
    this.once('upgrading', onupgrade);
    transport.open();
  };
  /**
   * Called when connection is deemed open.
   *
   * @api public
   */


  Socket$2.prototype.onOpen = function () {
    this.readyState = 'open';
    Socket$2.priorWebsocketSuccess = 'websocket' === this.transport.name;
    this.emit('open');
    this.flush(); // we check for `readyState` in case an `open`
    // listener already closed the socket

    if ('open' === this.readyState && this.upgrade && this.transport.pause) {
      for (var i = 0, l = this.upgrades.length; i < l; i++) {
        this.probe(this.upgrades[i]);
      }
    }
  };
  /**
   * Handles a packet.
   *
   * @api private
   */


  Socket$2.prototype.onPacket = function (packet) {
    if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
      this.emit('packet', packet); // Socket is live - any packet counts

      this.emit('heartbeat');

      switch (packet.type) {
        case 'open':
          this.onHandshake(JSON.parse(packet.data));
          break;

        case 'pong':
          this.setPing();
          this.emit('pong');
          break;

        case 'error':
          var err = new Error('server error');
          err.code = packet.data;
          this.onError(err);
          break;

        case 'message':
          this.emit('data', packet.data);
          this.emit('message', packet.data);
          break;
      }
    }
  };
  /**
   * Called upon handshake completion.
   *
   * @param {Object} handshake obj
   * @api private
   */


  Socket$2.prototype.onHandshake = function (data) {
    this.emit('handshake', data);
    this.id = data.sid;
    this.transport.query.sid = data.sid;
    this.upgrades = this.filterUpgrades(data.upgrades);
    this.pingInterval = data.pingInterval;
    this.pingTimeout = data.pingTimeout;
    this.onOpen(); // In case open handler closes socket

    if ('closed' === this.readyState) return;
    this.setPing(); // Prolong liveness of socket on heartbeat

    this.removeListener('heartbeat', this.onHeartbeat);
    this.on('heartbeat', this.onHeartbeat);
  };
  /**
   * Resets ping timeout.
   *
   * @api private
   */


  Socket$2.prototype.onHeartbeat = function (timeout) {
    clearTimeout(this.pingTimeoutTimer);
    var self = this;
    self.pingTimeoutTimer = setTimeout(function () {
      if ('closed' === self.readyState) return;
      self.onClose('ping timeout');
    }, timeout || self.pingInterval + self.pingTimeout);
  };
  /**
   * Pings server every `this.pingInterval` and expects response
   * within `this.pingTimeout` or closes connection.
   *
   * @api private
   */


  Socket$2.prototype.setPing = function () {
    var self = this;
    clearTimeout(self.pingIntervalTimer);
    self.pingIntervalTimer = setTimeout(function () {
      self.ping();
      self.onHeartbeat(self.pingTimeout);
    }, self.pingInterval);
  };
  /**
  * Sends a ping packet.
  *
  * @api private
  */


  Socket$2.prototype.ping = function () {
    var self = this;
    this.sendPacket('ping', function () {
      self.emit('ping');
    });
  };
  /**
   * Called on `outOfBand` event
   *
   * @api private
   */


  Socket$2.prototype.onOutOfBand = function (data) {
    this.outOfBand(data);
  };
  /**
   * Called on `drain` event
   *
   * @api private
   */


  Socket$2.prototype.onDrain = function () {
    this.writeBuffer.splice(0, this.prevBufferLen); // setting prevBufferLen = 0 is very important
    // for example, when upgrading, upgrade packet is sent over,
    // and a nonzero prevBufferLen could cause problems on `drain`

    this.prevBufferLen = 0;

    if (0 === this.writeBuffer.length) {
      this.emit('drain');
    } else {
      this.flush();
    }
  };
  /**
   * Flush write buffers.
   *
   * @api private
   */


  Socket$2.prototype.flush = function () {
    if ('closed' !== this.readyState && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      this.transport.send(this.writeBuffer); // keep track of current length of writeBuffer
      // splice writeBuffer and callbackBuffer on `drain`

      this.prevBufferLen = this.writeBuffer.length;
      this.emit('flush');
    }
  };
  /**
   * Sends a message.
   *
   * @param {String} message.
   * @param {Function} callback function.
   * @param {Object} options.
   * @return {Socket} for chaining.
   * @api public
   */


  Socket$2.prototype.write = Socket$2.prototype.send = function (msg, options, fn) {
    this.sendPacket('message', msg, options, fn);
    return this;
  };
  /**
   * Sends a packet.
   *
   * @param {String} packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} callback function.
   * @api private
   */


  Socket$2.prototype.sendPacket = function (type, data, options, fn) {
    if ('function' === typeof data) {
      fn = data;
      data = undefined;
    }

    if ('function' === typeof options) {
      fn = options;
      options = null;
    }

    if ('closing' === this.readyState || 'closed' === this.readyState) {
      return;
    }

    options = options || {};
    options.compress = false !== options.compress;
    var packet = {
      type: type,
      data: data,
      options: options
    };
    this.emit('packetCreate', packet);
    this.writeBuffer.push(packet);
    if (fn) this.once('flush', fn);
    this.flush();
  };
  /**
   * Closes the connection.
   *
   * @api private
   */


  Socket$2.prototype.close = function () {
    if ('opening' === this.readyState || 'open' === this.readyState) {
      this.readyState = 'closing';
      var self = this;

      if (this.writeBuffer.length) {
        this.once('drain', function () {
          if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        });
      } else if (this.upgrading) {
        waitForUpgrade();
      } else {
        close();
      }
    }

    function close() {
      self.onClose('forced close');
      self.transport.close();
    }

    function cleanupAndClose() {
      self.removeListener('upgrade', cleanupAndClose);
      self.removeListener('upgradeError', cleanupAndClose);
      close();
    }

    function waitForUpgrade() {
      // wait for upgrade to finish since we can't send packets while pausing a transport
      self.once('upgrade', cleanupAndClose);
      self.once('upgradeError', cleanupAndClose);
    }

    return this;
  };
  /**
   * Called upon transport error
   *
   * @api private
   */


  Socket$2.prototype.onError = function (err) {
    Socket$2.priorWebsocketSuccess = false;
    this.emit('error', err);
    this.onClose('transport error', err);
  };
  /**
   * Called upon transport close.
   *
   * @api private
   */


  Socket$2.prototype.onClose = function (reason, desc) {
    if ('opening' === this.readyState || 'open' === this.readyState || 'closing' === this.readyState) {
      var self = this; // clear timers

      clearTimeout(this.pingIntervalTimer);
      clearTimeout(this.pingTimeoutTimer); // stop event from firing again for transport

      this.transport.removeAllListeners('close'); // ensure transport won't stay open

      this.transport.close(); // ignore further transport communication

      this.transport.removeAllListeners(); // set ready state

      this.readyState = 'closed'; // clear session id

      this.id = null; // emit close event

      this.emit('close', reason, desc); // clean buffers after, so users can still
      // grab the buffers on `close` event

      self.writeBuffer = [];
      self.prevBufferLen = 0;
    }
  };
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} server upgrades
   * @api private
   *
   */


  Socket$2.prototype.filterUpgrades = function (upgrades) {
    var filteredUpgrades = [];

    for (var i = 0, j = upgrades.length; i < j; i++) {
      if (~this.transports.indexOf(upgrades[i])) filteredUpgrades.push(upgrades[i]);
    }

    return filteredUpgrades;
  };

  var eio$1 = {
    protocol: parser$3.protocol,
    Socket: Socket$2,
    parser: parser$3
  };

  var protocol$3 = Socket$3.protocol;
  var v4$1 = {
    Socket: Socket$3,
    protocol: protocol$3,
    installTimerFunctions: installTimerFunctions
  };

  //import { parse } from "engine.io-client";
  /**
   * URL parser.
   *
   * @param uri - url
   * @param path - the request path of the connection
   * @param loc - An object meant to mimic window.location.
   *        Defaults to window.location.
   * @public
   */

  function url$1(uri) {
    var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
    var loc = arguments.length > 2 ? arguments[2] : undefined;
    var obj = uri; // default to window.location

    loc = loc || typeof location !== "undefined" && location;
    if (null == uri) uri = loc.protocol + "//" + loc.host; // relative path support

    if (typeof uri === "string") {
      if ("/" === uri.charAt(0)) {
        if ("/" === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }

      if (!/^(https?|wss?):\/\//.test(uri)) {
        if ("undefined" !== typeof loc) {
          uri = loc.protocol + "//" + uri;
        } else {
          uri = "https://" + uri;
        }
      } // parse
      //obj = parse(uri) as ParsedUrl;


      obj = parseuri(uri);
    } // make sure we treat `localhost:80` and `localhost` equally


    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = "80";
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = "443";
      }
    }

    obj.path = obj.path || "/";
    var ipv6 = obj.host.indexOf(":") !== -1;
    var host = ipv6 ? "[" + obj.host + "]" : obj.host; // define unique id

    obj.id = obj.protocol + "://" + host + ":" + obj.port + path; // define href

    obj.href = obj.protocol + "://" + host + (loc && loc.port === obj.port ? "" : ":" + obj.port);
    return obj;
  }

  var withNativeArrayBuffer$2 = typeof ArrayBuffer === "function";

  var isView$2 = function isView(obj) {
    return typeof ArrayBuffer.isView === "function" ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };

  var toString$2 = Object.prototype.toString;
  var withNativeBlob$2 = typeof Blob === "function" || typeof Blob !== "undefined" && toString$2.call(Blob) === "[object BlobConstructor]";
  var withNativeFile$2 = typeof File === "function" || typeof File !== "undefined" && toString$2.call(File) === "[object FileConstructor]";
  /**
   * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
   *
   * @private
   */

  function isBinary(obj) {
    return withNativeArrayBuffer$2 && (obj instanceof ArrayBuffer || isView$2(obj)) || withNativeBlob$2 && obj instanceof Blob || withNativeFile$2 && obj instanceof File;
  }
  function hasBinary$1(obj, toJSON) {
    if (!obj || _typeof(obj) !== "object") {
      return false;
    }

    if (Array.isArray(obj)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (hasBinary$1(obj[i])) {
          return true;
        }
      }

      return false;
    }

    if (isBinary(obj)) {
      return true;
    }

    if (obj.toJSON && typeof obj.toJSON === "function" && arguments.length === 1) {
      return hasBinary$1(obj.toJSON(), true);
    }

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary$1(obj[key])) {
        return true;
      }
    }

    return false;
  }

  /**
   * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
   *
   * @param {Object} packet - socket.io event packet
   * @return {Object} with deconstructed packet and list of buffers
   * @public
   */

  function deconstructPacket$1(packet) {
    var buffers = [];
    var packetData = packet.data;
    var pack = packet;
    pack.data = _deconstructPacket$1(packetData, buffers);
    pack.attachments = buffers.length; // number of binary 'attachments'

    return {
      packet: pack,
      buffers: buffers
    };
  }

  function _deconstructPacket$1(data, buffers) {
    if (!data) return data;

    if (isBinary(data)) {
      var placeholder = {
        _placeholder: true,
        num: buffers.length
      };
      buffers.push(data);
      return placeholder;
    } else if (Array.isArray(data)) {
      var newData = new Array(data.length);

      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket$1(data[i], buffers);
      }

      return newData;
    } else if (_typeof(data) === "object" && !(data instanceof Date)) {
      var _newData = {};

      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          _newData[key] = _deconstructPacket$1(data[key], buffers);
        }
      }

      return _newData;
    }

    return data;
  }
  /**
   * Reconstructs a binary packet from its placeholder packet and buffers
   *
   * @param {Object} packet - event packet with placeholders
   * @param {Array} buffers - binary buffers to put in placeholder positions
   * @return {Object} reconstructed packet
   * @public
   */


  function reconstructPacket$1(packet, buffers) {
    packet.data = _reconstructPacket$1(packet.data, buffers);
    packet.attachments = undefined; // no longer useful

    return packet;
  }

  function _reconstructPacket$1(data, buffers) {
    if (!data) return data;

    if (data && data._placeholder) {
      return buffers[data.num]; // appropriate buffer (should be natural order anyway)
    } else if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket$1(data[i], buffers);
      }
    } else if (_typeof(data) === "object") {
      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          data[key] = _reconstructPacket$1(data[key], buffers);
        }
      }
    }

    return data;
  }

  /**
   * Protocol version.
   *
   * @public
   */

  var protocol$2 = 5;
  var PacketType;

  (function (PacketType) {
    PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
    PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
    PacketType[PacketType["EVENT"] = 2] = "EVENT";
    PacketType[PacketType["ACK"] = 3] = "ACK";
    PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
    PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
    PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
  })(PacketType || (PacketType = {}));
  /**
   * A socket.io Encoder instance
   */


  var Encoder$1 = /*#__PURE__*/function () {
    function Encoder() {
      _classCallCheck(this, Encoder);
    }

    _createClass(Encoder, [{
      key: "encode",
      value:
      /**
       * Encode a packet as a single string if non-binary, or as a
       * buffer sequence, depending on packet type.
       *
       * @param {Object} obj - packet object
       */
      function encode(obj) {
        if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
          if (hasBinary$1(obj)) {
            obj.type = obj.type === PacketType.EVENT ? PacketType.BINARY_EVENT : PacketType.BINARY_ACK;
            return this.encodeAsBinary(obj);
          }
        }

        return [this.encodeAsString(obj)];
      }
      /**
       * Encode packet as string.
       */

    }, {
      key: "encodeAsString",
      value: function encodeAsString(obj) {
        // first is type
        var str = "" + obj.type; // attachments if we have them

        if (obj.type === PacketType.BINARY_EVENT || obj.type === PacketType.BINARY_ACK) {
          str += obj.attachments + "-";
        } // if we have a namespace other than `/`
        // we append it followed by a comma `,`


        if (obj.nsp && "/" !== obj.nsp) {
          str += obj.nsp + ",";
        } // immediately followed by the id


        if (null != obj.id) {
          str += obj.id;
        } // json data


        if (null != obj.data) {
          str += JSON.stringify(obj.data);
        }

        return str;
      }
      /**
       * Encode packet as 'buffer sequence' by removing blobs, and
       * deconstructing packet into object with placeholders and
       * a list of buffers.
       */

    }, {
      key: "encodeAsBinary",
      value: function encodeAsBinary(obj) {
        var deconstruction = deconstructPacket$1(obj);
        var pack = this.encodeAsString(deconstruction.packet);
        var buffers = deconstruction.buffers;
        buffers.unshift(pack); // add packet info to beginning of data list

        return buffers; // write all the buffers
      }
    }]);

    return Encoder;
  }();
  /**
   * A socket.io Decoder instance
   *
   * @return {Object} decoder
   */

  var Decoder$1 = /*#__PURE__*/function (_Emitter) {
    _inherits(Decoder, _Emitter);

    var _super = _createSuper(Decoder);

    function Decoder() {
      _classCallCheck(this, Decoder);

      return _super.call(this);
    }
    /**
     * Decodes an encoded packet string into packet JSON.
     *
     * @param {String} obj - encoded packet
     */


    _createClass(Decoder, [{
      key: "add",
      value: function add(obj) {
        var packet;

        if (typeof obj === "string") {
          packet = this.decodeString(obj);

          if (packet.type === PacketType.BINARY_EVENT || packet.type === PacketType.BINARY_ACK) {
            // binary packet's json
            this.reconstructor = new BinaryReconstructor$1(packet); // no attachments, labeled binary but no binary data to follow

            if (packet.attachments === 0) {
              _get(_getPrototypeOf(Decoder.prototype), "emitReserved", this).call(this, "decoded", packet);
            }
          } else {
            // non-binary full packet
            _get(_getPrototypeOf(Decoder.prototype), "emitReserved", this).call(this, "decoded", packet);
          }
        } else if (isBinary(obj) || obj.base64) {
          // raw binary data
          if (!this.reconstructor) {
            throw new Error("got binary data when not reconstructing a packet");
          } else {
            packet = this.reconstructor.takeBinaryData(obj);

            if (packet) {
              // received final buffer
              this.reconstructor = null;

              _get(_getPrototypeOf(Decoder.prototype), "emitReserved", this).call(this, "decoded", packet);
            }
          }
        } else {
          throw new Error("Unknown type: " + obj);
        }
      }
      /**
       * Decode a packet String (JSON data)
       *
       * @param {String} str
       * @return {Object} packet
       */

    }, {
      key: "decodeString",
      value: function decodeString(str) {
        var i = 0; // look up type

        var p = {
          type: Number(str.charAt(0))
        };

        if (PacketType[p.type] === undefined) {
          throw new Error("unknown packet type " + p.type);
        } // look up attachments if type binary


        if (p.type === PacketType.BINARY_EVENT || p.type === PacketType.BINARY_ACK) {
          var start = i + 1;

          while (str.charAt(++i) !== "-" && i != str.length) {}

          var buf = str.substring(start, i);

          if (buf != Number(buf) || str.charAt(i) !== "-") {
            throw new Error("Illegal attachments");
          }

          p.attachments = Number(buf);
        } // look up namespace (if any)


        if ("/" === str.charAt(i + 1)) {
          var _start = i + 1;

          while (++i) {
            var c = str.charAt(i);
            if ("," === c) break;
            if (i === str.length) break;
          }

          p.nsp = str.substring(_start, i);
        } else {
          p.nsp = "/";
        } // look up id


        var next = str.charAt(i + 1);

        if ("" !== next && Number(next) == next) {
          var _start2 = i + 1;

          while (++i) {
            var _c = str.charAt(i);

            if (null == _c || Number(_c) != _c) {
              --i;
              break;
            }

            if (i === str.length) break;
          }

          p.id = Number(str.substring(_start2, i + 1));
        } // look up json data


        if (str.charAt(++i)) {
          var payload = tryParse$1(str.substr(i));

          if (Decoder.isPayloadValid(p.type, payload)) {
            p.data = payload;
          } else {
            throw new Error("invalid payload");
          }
        }

        return p;
      }
    }, {
      key: "destroy",
      value:
      /**
       * Deallocates a parser's resources
       */
      function destroy() {
        if (this.reconstructor) {
          this.reconstructor.finishedReconstruction();
        }
      }
    }], [{
      key: "isPayloadValid",
      value: function isPayloadValid(type, payload) {
        switch (type) {
          case PacketType.CONNECT:
            return _typeof(payload) === "object";

          case PacketType.DISCONNECT:
            return payload === undefined;

          case PacketType.CONNECT_ERROR:
            return typeof payload === "string" || _typeof(payload) === "object";

          case PacketType.EVENT:
          case PacketType.BINARY_EVENT:
            return Array.isArray(payload) && payload.length > 0;

          case PacketType.ACK:
          case PacketType.BINARY_ACK:
            return Array.isArray(payload);
        }
      }
    }]);

    return Decoder;
  }(Emitter_1);

  function tryParse$1(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }
  /**
   * A manager of a binary event's 'buffer sequence'. Should
   * be constructed whenever a packet of type BINARY_EVENT is
   * decoded.
   *
   * @param {Object} packet
   * @return {BinaryReconstructor} initialized reconstructor
   */


  var BinaryReconstructor$1 = /*#__PURE__*/function () {
    function BinaryReconstructor(packet) {
      _classCallCheck(this, BinaryReconstructor);

      this.packet = packet;
      this.buffers = [];
      this.reconPack = packet;
    }
    /**
     * Method to be called when binary data received from connection
     * after a BINARY_EVENT packet.
     *
     * @param {Buffer | ArrayBuffer} binData - the raw binary data received
     * @return {null | Object} returns null if more binary data is expected or
     *   a reconstructed packet object if all buffers have been received.
     */


    _createClass(BinaryReconstructor, [{
      key: "takeBinaryData",
      value: function takeBinaryData(binData) {
        this.buffers.push(binData);

        if (this.buffers.length === this.reconPack.attachments) {
          // done with buffer list
          var packet = reconstructPacket$1(this.reconPack, this.buffers);
          this.finishedReconstruction();
          return packet;
        }

        return null;
      }
      /**
       * Cleans up binary packet reconstruction variables.
       */

    }, {
      key: "finishedReconstruction",
      value: function finishedReconstruction() {
        this.reconPack = null;
        this.buffers = [];
      }
    }]);

    return BinaryReconstructor;
  }();

  var parser$1 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    protocol: protocol$2,
    get PacketType () { return PacketType; },
    Encoder: Encoder$1,
    Decoder: Decoder$1
  });

  function on$1(obj, ev, fn) {
    obj.on(ev, fn);
    return function subDestroy() {
      obj.off(ev, fn);
    };
  }

  /**
   * Internal events.
   * These events can't be emitted by the user.
   */

  var RESERVED_EVENTS = Object.freeze({
    connect: 1,
    connect_error: 1,
    disconnect: 1,
    disconnecting: 1,
    // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
    newListener: 1,
    removeListener: 1
  });
  /**
   * A Socket is the fundamental class for interacting with the server.
   *
   * A Socket belongs to a certain Namespace (by default /) and uses an underlying {@link Manager} to communicate.
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log("connected");
   * });
   *
   * // send an event to the server
   * socket.emit("foo", "bar");
   *
   * socket.on("foobar", () => {
   *   // an event was received from the server
   * });
   *
   * // upon disconnection
   * socket.on("disconnect", (reason) => {
   *   console.log(`disconnected due to ${reason}`);
   * });
   */

  var Socket$1 = /*#__PURE__*/function (_Emitter) {
    _inherits(Socket, _Emitter);

    var _super = _createSuper(Socket);

    /**
     * `Socket` constructor.
     */
    function Socket(io, nsp, opts) {
      var _this;

      _classCallCheck(this, Socket);

      _this = _super.call(this);
      /**
       * Whether the socket is currently connected to the server.
       *
       * @example
       * const socket = io();
       *
       * socket.on("connect", () => {
       *   console.log(socket.connected); // true
       * });
       *
       * socket.on("disconnect", () => {
       *   console.log(socket.connected); // false
       * });
       */

      _this.connected = false;
      /**
       * Whether the connection state was recovered after a temporary disconnection. In that case, any missed packets will
       * be transmitted by the server.
       */

      _this.recovered = false;
      /**
       * Buffer for packets received before the CONNECT packet
       */

      _this.receiveBuffer = [];
      /**
       * Buffer for packets that will be sent once the socket is connected
       */

      _this.sendBuffer = [];
      /**
       * The queue of packets to be sent with retry in case of failure.
       *
       * Packets are sent one by one, each waiting for the server acknowledgement, in order to guarantee the delivery order.
       * @private
       */

      _this._queue = [];
      _this.ids = 0;
      _this.acks = {};
      _this.flags = {};
      _this.io = io;
      _this.nsp = nsp;

      if (opts && opts.auth) {
        _this.auth = opts.auth;
      }

      _this._opts = _extends({}, opts);
      if (_this.io._autoConnect) _this.open();
      return _this;
    }
    /**
     * Whether the socket is currently disconnected
     *
     * @example
     * const socket = io();
     *
     * socket.on("connect", () => {
     *   console.log(socket.disconnected); // false
     * });
     *
     * socket.on("disconnect", () => {
     *   console.log(socket.disconnected); // true
     * });
     */


    _createClass(Socket, [{
      key: "disconnected",
      get: function get() {
        return !this.connected;
      }
      /**
       * Subscribe to open, close and packet events
       *
       * @private
       */

    }, {
      key: "subEvents",
      value: function subEvents() {
        if (this.subs) return;
        var io = this.io;
        this.subs = [on$1(io, "open", this.onopen.bind(this)), on$1(io, "packet", this.onpacket.bind(this)), on$1(io, "error", this.onerror.bind(this)), on$1(io, "close", this.onclose.bind(this))];
      }
      /**
       * Whether the Socket will try to reconnect when its Manager connects or reconnects.
       *
       * @example
       * const socket = io();
       *
       * console.log(socket.active); // true
       *
       * socket.on("disconnect", (reason) => {
       *   if (reason === "io server disconnect") {
       *     // the disconnection was initiated by the server, you need to manually reconnect
       *     console.log(socket.active); // false
       *   }
       *   // else the socket will automatically try to reconnect
       *   console.log(socket.active); // true
       * });
       */

    }, {
      key: "active",
      get: function get() {
        return !!this.subs;
      }
      /**
       * "Opens" the socket.
       *
       * @example
       * const socket = io({
       *   autoConnect: false
       * });
       *
       * socket.connect();
       */

    }, {
      key: "connect",
      value: function connect() {
        if (this.connected) return this;
        this.subEvents();
        if (!this.io["_reconnecting"]) this.io.open(); // ensure open

        if ("open" === this.io._readyState) this.onopen();
        return this;
      }
      /**
       * Alias for {@link connect()}.
       */

    }, {
      key: "open",
      value: function open() {
        return this.connect();
      }
      /**
       * Sends a `message` event.
       *
       * This method mimics the WebSocket.send() method.
       *
       * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
       *
       * @example
       * socket.send("hello");
       *
       * // this is equivalent to
       * socket.emit("message", "hello");
       *
       * @return self
       */

    }, {
      key: "send",
      value: function send() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        args.unshift("message");
        this.emit.apply(this, args);
        return this;
      }
      /**
       * Override `emit`.
       * If the event is in `events`, it's emitted normally.
       *
       * @example
       * socket.emit("hello", "world");
       *
       * // all serializable datastructures are supported (no need to call JSON.stringify)
       * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
       *
       * // with an acknowledgement from the server
       * socket.emit("hello", "world", (val) => {
       *   // ...
       * });
       *
       * @return self
       */

    }, {
      key: "emit",
      value: function emit(ev) {
        if (RESERVED_EVENTS.hasOwnProperty(ev)) {
          throw new Error('"' + ev.toString() + '" is a reserved event name');
        }

        for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        args.unshift(ev);

        if (this._opts.retries && !this.flags.fromQueue && !this.flags["volatile"]) {
          this._addToQueue(args);

          return this;
        }

        var packet = {
          type: PacketType.EVENT,
          data: args
        };
        packet.options = {};
        packet.options.compress = this.flags.compress !== false; // event ack callback

        if ("function" === typeof args[args.length - 1]) {
          var id = this.ids++;
          var ack = args.pop();

          this._registerAckCallback(id, ack);

          packet.id = id;
        }

        var isTransportWritable = this.io.engine && this.io.engine.transport && this.io.engine.transport.writable;
        var discardPacket = this.flags["volatile"] && (!isTransportWritable || !this.connected);

        if (discardPacket) ; else if (this.connected) {
          this.notifyOutgoingListeners(packet);
          this.packet(packet);
        } else {
          this.sendBuffer.push(packet);
        }

        this.flags = {};
        return this;
      }
      /**
       * @private
       */

    }, {
      key: "_registerAckCallback",
      value: function _registerAckCallback(id, ack) {
        var _this2 = this;

        var _a;

        var timeout = (_a = this.flags.timeout) !== null && _a !== void 0 ? _a : this._opts.ackTimeout;

        if (timeout === undefined) {
          this.acks[id] = ack;
          return;
        } // @ts-ignore


        var timer = this.io.setTimeoutFn(function () {
          delete _this2.acks[id];

          for (var i = 0; i < _this2.sendBuffer.length; i++) {
            if (_this2.sendBuffer[i].id === id) {
              _this2.sendBuffer.splice(i, 1);
            }
          }

          ack.call(_this2, new Error("operation has timed out"));
        }, timeout);

        this.acks[id] = function () {
          // @ts-ignore
          _this2.io.clearTimeoutFn(timer);

          for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
            args[_key3] = arguments[_key3];
          }

          ack.apply(_this2, [null].concat(args));
        };
      }
      /**
       * Emits an event and waits for an acknowledgement
       *
       * @example
       * // without timeout
       * const response = await socket.emitWithAck("hello", "world");
       *
       * // with a specific timeout
       * try {
       *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
       * } catch (err) {
       *   // the server did not acknowledge the event in the given delay
       * }
       *
       * @return a Promise that will be fulfilled when the server acknowledges the event
       */

    }, {
      key: "emitWithAck",
      value: function emitWithAck(ev) {
        var _this3 = this;

        for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
          args[_key4 - 1] = arguments[_key4];
        }

        // the timeout flag is optional
        var withErr = this.flags.timeout !== undefined || this._opts.ackTimeout !== undefined;
        return new Promise(function (resolve, reject) {
          args.push(function (arg1, arg2) {
            if (withErr) {
              return arg1 ? reject(arg1) : resolve(arg2);
            } else {
              return resolve(arg1);
            }
          });

          _this3.emit.apply(_this3, [ev].concat(args));
        });
      }
      /**
       * Add the packet to the queue.
       * @param args
       * @private
       */

    }, {
      key: "_addToQueue",
      value: function _addToQueue(args) {
        var _this4 = this;

        var ack;

        if (typeof args[args.length - 1] === "function") {
          ack = args.pop();
        }

        var packet = {
          id: this.ids++,
          tryCount: 0,
          pending: false,
          args: args,
          flags: _extends({
            fromQueue: true
          }, this.flags)
        };
        args.push(function (err) {
          if (packet !== _this4._queue[0]) {
            // the packet has already been acknowledged
            return;
          }

          var hasError = err !== null;

          if (hasError) {
            if (packet.tryCount > _this4._opts.retries) {
              _this4._queue.shift();

              if (ack) {
                ack(err);
              }
            }
          } else {
            _this4._queue.shift();

            if (ack) {
              for (var _len5 = arguments.length, responseArgs = new Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                responseArgs[_key5 - 1] = arguments[_key5];
              }

              ack.apply(void 0, [null].concat(responseArgs));
            }
          }

          packet.pending = false;
          return _this4._drainQueue();
        });

        this._queue.push(packet);

        this._drainQueue();
      }
      /**
       * Send the first packet of the queue, and wait for an acknowledgement from the server.
       * @private
       */

    }, {
      key: "_drainQueue",
      value: function _drainQueue() {
        if (this._queue.length === 0) {
          return;
        }

        var packet = this._queue[0];

        if (packet.pending) {
          return;
        }

        packet.pending = true;
        packet.tryCount++;
        var currentId = this.ids;
        this.ids = packet.id; // the same id is reused for consecutive retries, in order to allow deduplication on the server side

        this.flags = packet.flags;
        this.emit.apply(this, packet.args);
        this.ids = currentId; // restore offset
      }
      /**
       * Sends a packet.
       *
       * @param packet
       * @private
       */

    }, {
      key: "packet",
      value: function packet(_packet) {
        _packet.nsp = this.nsp;

        this.io._packet(_packet);
      }
      /**
       * Called upon engine `open`.
       *
       * @private
       */

    }, {
      key: "onopen",
      value: function onopen() {
        var _this5 = this;

        if (typeof this.auth == "function") {
          this.auth(function (data) {
            _this5._sendConnectPacket(data);
          });
        } else {
          this._sendConnectPacket(this.auth);
        }
      }
      /**
       * Sends a CONNECT packet to initiate the Socket.IO session.
       *
       * @param data
       * @private
       */

    }, {
      key: "_sendConnectPacket",
      value: function _sendConnectPacket(data) {
        this.packet({
          type: PacketType.CONNECT,
          data: this._pid ? _extends({
            pid: this._pid,
            offset: this._lastOffset
          }, data) : data
        });
      }
      /**
       * Called upon engine or manager `error`.
       *
       * @param err
       * @private
       */

    }, {
      key: "onerror",
      value: function onerror(err) {
        if (!this.connected) {
          this.emitReserved("connect_error", err);
        }
      }
      /**
       * Called upon engine `close`.
       *
       * @param reason
       * @param description
       * @private
       */

    }, {
      key: "onclose",
      value: function onclose(reason, description) {
        this.connected = false;
        delete this.id;
        this.emitReserved("disconnect", reason, description);
      }
      /**
       * Called with socket packet.
       *
       * @param packet
       * @private
       */

    }, {
      key: "onpacket",
      value: function onpacket(packet) {
        var sameNamespace = packet.nsp === this.nsp;
        if (!sameNamespace) return;

        switch (packet.type) {
          case PacketType.CONNECT:
            if (packet.data && packet.data.sid) {
              this.onconnect(packet.data.sid, packet.data.pid);
            } else {
              this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
            }

            break;

          case PacketType.EVENT:
          case PacketType.BINARY_EVENT:
            this.onevent(packet);
            break;

          case PacketType.ACK:
          case PacketType.BINARY_ACK:
            this.onack(packet);
            break;

          case PacketType.DISCONNECT:
            this.ondisconnect();
            break;

          case PacketType.CONNECT_ERROR:
            this.destroy();
            var err = new Error(packet.data.message); // @ts-ignore

            err.data = packet.data.data;
            this.emitReserved("connect_error", err);
            break;
        }
      }
      /**
       * Called upon a server event.
       *
       * @param packet
       * @private
       */

    }, {
      key: "onevent",
      value: function onevent(packet) {
        var args = packet.data || [];

        if (null != packet.id) {
          args.push(this.ack(packet.id));
        }

        if (this.connected) {
          this.emitEvent(args);
        } else {
          this.receiveBuffer.push(Object.freeze(args));
        }
      }
    }, {
      key: "emitEvent",
      value: function emitEvent(args) {
        if (this._anyListeners && this._anyListeners.length) {
          var listeners = this._anyListeners.slice();

          var _iterator = _createForOfIteratorHelper(listeners),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var listener = _step.value;
              listener.apply(this, args);
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }

        _get(_getPrototypeOf(Socket.prototype), "emit", this).apply(this, args);

        if (this._pid && args.length && typeof args[args.length - 1] === "string") {
          this._lastOffset = args[args.length - 1];
        }
      }
      /**
       * Produces an ack callback to emit with an event.
       *
       * @private
       */

    }, {
      key: "ack",
      value: function ack(id) {
        var self = this;
        var sent = false;
        return function () {
          // prevent double callbacks
          if (sent) return;
          sent = true;

          for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
            args[_key6] = arguments[_key6];
          }

          self.packet({
            type: PacketType.ACK,
            id: id,
            data: args
          });
        };
      }
      /**
       * Called upon a server acknowlegement.
       *
       * @param packet
       * @private
       */

    }, {
      key: "onack",
      value: function onack(packet) {
        var ack = this.acks[packet.id];

        if ("function" === typeof ack) {
          ack.apply(this, packet.data);
          delete this.acks[packet.id];
        }
      }
      /**
       * Called upon server connect.
       *
       * @private
       */

    }, {
      key: "onconnect",
      value: function onconnect(id, pid) {
        this.id = id;
        this.recovered = pid && this._pid === pid;
        this._pid = pid; // defined only if connection state recovery is enabled

        this.connected = true;
        this.emitBuffered();
        this.emitReserved("connect");
      }
      /**
       * Emit buffered events (received and emitted).
       *
       * @private
       */

    }, {
      key: "emitBuffered",
      value: function emitBuffered() {
        var _this6 = this;

        this.receiveBuffer.forEach(function (args) {
          return _this6.emitEvent(args);
        });
        this.receiveBuffer = [];
        this.sendBuffer.forEach(function (packet) {
          _this6.notifyOutgoingListeners(packet);

          _this6.packet(packet);
        });
        this.sendBuffer = [];
      }
      /**
       * Called upon server disconnect.
       *
       * @private
       */

    }, {
      key: "ondisconnect",
      value: function ondisconnect() {
        this.destroy();
        this.onclose("io server disconnect");
      }
      /**
       * Called upon forced client/server side disconnections,
       * this method ensures the manager stops tracking us and
       * that reconnections don't get triggered for this.
       *
       * @private
       */

    }, {
      key: "destroy",
      value: function destroy() {
        if (this.subs) {
          // clean subscriptions to avoid reconnections
          this.subs.forEach(function (subDestroy) {
            return subDestroy();
          });
          this.subs = undefined;
        }

        this.io["_destroy"](this);
      }
      /**
       * Disconnects the socket manually. In that case, the socket will not try to reconnect.
       *
       * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
       *
       * @example
       * const socket = io();
       *
       * socket.on("disconnect", (reason) => {
       *   // console.log(reason); prints "io client disconnect"
       * });
       *
       * socket.disconnect();
       *
       * @return self
       */

    }, {
      key: "disconnect",
      value: function disconnect() {
        if (this.connected) {
          this.packet({
            type: PacketType.DISCONNECT
          });
        } // remove socket from pool


        this.destroy();

        if (this.connected) {
          // fire events
          this.onclose("io client disconnect");
        }

        return this;
      }
      /**
       * Alias for {@link disconnect()}.
       *
       * @return self
       */

    }, {
      key: "close",
      value: function close() {
        return this.disconnect();
      }
      /**
       * Sets the compress flag.
       *
       * @example
       * socket.compress(false).emit("hello");
       *
       * @param compress - if `true`, compresses the sending data
       * @return self
       */

    }, {
      key: "compress",
      value: function compress(_compress) {
        this.flags.compress = _compress;
        return this;
      }
      /**
       * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
       * ready to send messages.
       *
       * @example
       * socket.volatile.emit("hello"); // the server may or may not receive it
       *
       * @returns self
       */

    }, {
      key: "volatile",
      get: function get() {
        this.flags["volatile"] = true;
        return this;
      }
      /**
       * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
       * given number of milliseconds have elapsed without an acknowledgement from the server:
       *
       * @example
       * socket.timeout(5000).emit("my-event", (err) => {
       *   if (err) {
       *     // the server did not acknowledge the event in the given delay
       *   }
       * });
       *
       * @returns self
       */

    }, {
      key: "timeout",
      value: function timeout(_timeout) {
        this.flags.timeout = _timeout;
        return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback.
       *
       * @example
       * socket.onAny((event, ...args) => {
       *   console.log(`got ${event}`);
       * });
       *
       * @param listener
       */

    }, {
      key: "onAny",
      value: function onAny(listener) {
        this._anyListeners = this._anyListeners || [];

        this._anyListeners.push(listener);

        return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback. The listener is added to the beginning of the listeners array.
       *
       * @example
       * socket.prependAny((event, ...args) => {
       *   console.log(`got event ${event}`);
       * });
       *
       * @param listener
       */

    }, {
      key: "prependAny",
      value: function prependAny(listener) {
        this._anyListeners = this._anyListeners || [];

        this._anyListeners.unshift(listener);

        return this;
      }
      /**
       * Removes the listener that will be fired when any event is emitted.
       *
       * @example
       * const catchAllListener = (event, ...args) => {
       *   console.log(`got event ${event}`);
       * }
       *
       * socket.onAny(catchAllListener);
       *
       * // remove a specific listener
       * socket.offAny(catchAllListener);
       *
       * // or remove all listeners
       * socket.offAny();
       *
       * @param listener
       */

    }, {
      key: "offAny",
      value: function offAny(listener) {
        if (!this._anyListeners) {
          return this;
        }

        if (listener) {
          var listeners = this._anyListeners;

          for (var i = 0; i < listeners.length; i++) {
            if (listener === listeners[i]) {
              listeners.splice(i, 1);
              return this;
            }
          }
        } else {
          this._anyListeners = [];
        }

        return this;
      }
      /**
       * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
       * e.g. to remove listeners.
       */

    }, {
      key: "listenersAny",
      value: function listenersAny() {
        return this._anyListeners || [];
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback.
       *
       * Note: acknowledgements sent to the server are not included.
       *
       * @example
       * socket.onAnyOutgoing((event, ...args) => {
       *   console.log(`sent event ${event}`);
       * });
       *
       * @param listener
       */

    }, {
      key: "onAnyOutgoing",
      value: function onAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];

        this._anyOutgoingListeners.push(listener);

        return this;
      }
      /**
       * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
       * callback. The listener is added to the beginning of the listeners array.
       *
       * Note: acknowledgements sent to the server are not included.
       *
       * @example
       * socket.prependAnyOutgoing((event, ...args) => {
       *   console.log(`sent event ${event}`);
       * });
       *
       * @param listener
       */

    }, {
      key: "prependAnyOutgoing",
      value: function prependAnyOutgoing(listener) {
        this._anyOutgoingListeners = this._anyOutgoingListeners || [];

        this._anyOutgoingListeners.unshift(listener);

        return this;
      }
      /**
       * Removes the listener that will be fired when any event is emitted.
       *
       * @example
       * const catchAllListener = (event, ...args) => {
       *   console.log(`sent event ${event}`);
       * }
       *
       * socket.onAnyOutgoing(catchAllListener);
       *
       * // remove a specific listener
       * socket.offAnyOutgoing(catchAllListener);
       *
       * // or remove all listeners
       * socket.offAnyOutgoing();
       *
       * @param [listener] - the catch-all listener (optional)
       */

    }, {
      key: "offAnyOutgoing",
      value: function offAnyOutgoing(listener) {
        if (!this._anyOutgoingListeners) {
          return this;
        }

        if (listener) {
          var listeners = this._anyOutgoingListeners;

          for (var i = 0; i < listeners.length; i++) {
            if (listener === listeners[i]) {
              listeners.splice(i, 1);
              return this;
            }
          }
        } else {
          this._anyOutgoingListeners = [];
        }

        return this;
      }
      /**
       * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
       * e.g. to remove listeners.
       */

    }, {
      key: "listenersAnyOutgoing",
      value: function listenersAnyOutgoing() {
        return this._anyOutgoingListeners || [];
      }
      /**
       * Notify the listeners for each packet sent
       *
       * @param packet
       *
       * @private
       */

    }, {
      key: "notifyOutgoingListeners",
      value: function notifyOutgoingListeners(packet) {
        if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
          var listeners = this._anyOutgoingListeners.slice();

          var _iterator2 = _createForOfIteratorHelper(listeners),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var listener = _step2.value;
              listener.apply(this, packet.data);
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
      }
    }]);

    return Socket;
  }(Emitter_1);

  /**
   * Initialize backoff timer with `opts`.
   *
   * - `min` initial timeout in milliseconds [100]
   * - `max` max timeout [10000]
   * - `jitter` [0]
   * - `factor` [2]
   *
   * @param {Object} opts
   * @api public
   */
  function Backoff$1(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 10000;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  /**
   * Return the backoff duration.
   *
   * @return {Number}
   * @api public
   */

  Backoff$1.prototype.duration = function () {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);

    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }

    return Math.min(ms, this.max) | 0;
  };
  /**
   * Reset the number of attempts.
   *
   * @api public
   */


  Backoff$1.prototype.reset = function () {
    this.attempts = 0;
  };
  /**
   * Set the minimum duration
   *
   * @api public
   */


  Backoff$1.prototype.setMin = function (min) {
    this.ms = min;
  };
  /**
   * Set the maximum duration
   *
   * @api public
   */


  Backoff$1.prototype.setMax = function (max) {
    this.max = max;
  };
  /**
   * Set the jitter
   *
   * @api public
   */


  Backoff$1.prototype.setJitter = function (jitter) {
    this.jitter = jitter;
  };

  var Manager$1 = /*#__PURE__*/function (_Emitter) {
    _inherits(Manager, _Emitter);

    var _super = _createSuper(Manager);

    function Manager(uri, opts) {
      var _this;

      _classCallCheck(this, Manager);

      var _a;

      _this = _super.call(this);
      _this.nsps = {};
      _this.subs = [];

      if (uri && "object" === _typeof(uri)) {
        opts = uri;
        uri = undefined;
      }

      opts = opts || {};
      opts.path = opts.path || "/socket.io";
      _this.opts = opts;
      installTimerFunctions(_assertThisInitialized(_this), opts);

      _this.reconnection(opts.reconnection !== false);

      _this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);

      _this.reconnectionDelay(opts.reconnectionDelay || 1000);

      _this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);

      _this.randomizationFactor((_a = opts.randomizationFactor) !== null && _a !== void 0 ? _a : 0.5);

      _this.backoff = new Backoff$1({
        min: _this.reconnectionDelay(),
        max: _this.reconnectionDelayMax(),
        jitter: _this.randomizationFactor()
      });

      _this.timeout(null == opts.timeout ? 20000 : opts.timeout);

      _this._readyState = "closed";
      _this.uri = uri;

      var _parser = opts.parser || parser$1;

      _this.encoder = new _parser.Encoder();
      _this.decoder = new _parser.Decoder();
      _this._autoConnect = opts.autoConnect !== false;
      if (_this._autoConnect) _this.open();
      return _this;
    }

    _createClass(Manager, [{
      key: "reconnection",
      value: function reconnection(v) {
        if (!arguments.length) return this._reconnection;
        this._reconnection = !!v;
        return this;
      }
    }, {
      key: "reconnectionAttempts",
      value: function reconnectionAttempts(v) {
        if (v === undefined) return this._reconnectionAttempts;
        this._reconnectionAttempts = v;
        return this;
      }
    }, {
      key: "reconnectionDelay",
      value: function reconnectionDelay(v) {
        var _a;

        if (v === undefined) return this._reconnectionDelay;
        this._reconnectionDelay = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
        return this;
      }
    }, {
      key: "randomizationFactor",
      value: function randomizationFactor(v) {
        var _a;

        if (v === undefined) return this._randomizationFactor;
        this._randomizationFactor = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
        return this;
      }
    }, {
      key: "reconnectionDelayMax",
      value: function reconnectionDelayMax(v) {
        var _a;

        if (v === undefined) return this._reconnectionDelayMax;
        this._reconnectionDelayMax = v;
        (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
        return this;
      }
    }, {
      key: "timeout",
      value: function timeout(v) {
        if (!arguments.length) return this._timeout;
        this._timeout = v;
        return this;
      }
      /**
       * Starts trying to reconnect if reconnection is enabled and we have not
       * started reconnecting yet
       *
       * @private
       */

    }, {
      key: "maybeReconnectOnOpen",
      value: function maybeReconnectOnOpen() {
        // Only try to reconnect if it's the first time we're connecting
        if (!this._reconnecting && this._reconnection && this.backoff.attempts === 0) {
          // keeps reconnection from firing twice for the same reconnection loop
          this.reconnect();
        }
      }
      /**
       * Sets the current transport `socket`.
       *
       * @param {Function} fn - optional, callback
       * @return self
       * @public
       */

    }, {
      key: "open",
      value: function open(fn) {
        var _this2 = this;

        if (~this._readyState.indexOf("open")) return this;
        this.engine = new Socket$3(this.uri, this.opts);
        var socket = this.engine;
        var self = this;
        this._readyState = "opening";
        this.skipReconnect = false; // emit `open`

        var openSubDestroy = on$1(socket, "open", function () {
          self.onopen();
          fn && fn();
        }); // emit `error`

        var errorSub = on$1(socket, "error", function (err) {
          self.cleanup();
          self._readyState = "closed";

          _this2.emitReserved("error", err);

          if (fn) {
            fn(err);
          } else {
            // Only do this if there is no fn to handle the error
            self.maybeReconnectOnOpen();
          }
        });

        if (false !== this._timeout) {
          var timeout = this._timeout;

          if (timeout === 0) {
            openSubDestroy(); // prevents a race condition with the 'open' event
          } // set timer


          var timer = this.setTimeoutFn(function () {
            openSubDestroy();
            socket.close(); // @ts-ignore

            socket.emit("error", new Error("timeout"));
          }, timeout);

          if (this.opts.autoUnref) {
            timer.unref();
          }

          this.subs.push(function subDestroy() {
            clearTimeout(timer);
          });
        }

        this.subs.push(openSubDestroy);
        this.subs.push(errorSub);
        return this;
      }
      /**
       * Alias for open()
       *
       * @return self
       * @public
       */

    }, {
      key: "connect",
      value: function connect(fn) {
        return this.open(fn);
      }
      /**
       * Called upon transport open.
       *
       * @private
       */

    }, {
      key: "onopen",
      value: function onopen() {
        // clear old subs
        this.cleanup(); // mark as open

        this._readyState = "open";
        this.emitReserved("open"); // add new subs

        var socket = this.engine;
        this.subs.push(on$1(socket, "ping", this.onping.bind(this)), on$1(socket, "data", this.ondata.bind(this)), on$1(socket, "error", this.onerror.bind(this)), on$1(socket, "close", this.onclose.bind(this)), on$1(this.decoder, "decoded", this.ondecoded.bind(this)));
      }
      /**
       * Called upon a ping.
       *
       * @private
       */

    }, {
      key: "onping",
      value: function onping() {
        this.emitReserved("ping");
      }
      /**
       * Called with data.
       *
       * @private
       */

    }, {
      key: "ondata",
      value: function ondata(data) {
        try {
          this.decoder.add(data);
        } catch (e) {
          this.onclose("parse error", e);
        }
      }
      /**
       * Called when parser fully decodes a packet.
       *
       * @private
       */

    }, {
      key: "ondecoded",
      value: function ondecoded(packet) {
        // the nextTick call prevents an exception in a user-provided event listener from triggering a disconnection due to a "parse error"
        //nextTick(() => {
        this.emitReserved("packet", packet); //}, this.setTimeoutFn);
      }
      /**
       * Called upon socket error.
       *
       * @private
       */

    }, {
      key: "onerror",
      value: function onerror(err) {
        this.emitReserved("error", err);
      }
      /**
       * Creates a new socket for the given `nsp`.
       *
       * @return {Socket}
       * @public
       */

    }, {
      key: "socket",
      value: function socket(nsp, opts) {
        var socket = this.nsps[nsp];

        if (!socket) {
          socket = new Socket$1(this, nsp, opts);
          this.nsps[nsp] = socket;
        }

        if (this._autoConnect) {
          socket.connect();
        }

        return socket;
      }
      /**
       * Called upon a socket close.
       *
       * @param socket
       * @private
       */

    }, {
      key: "_destroy",
      value: function _destroy(socket) {
        var nsps = Object.keys(this.nsps);

        for (var _i = 0, _nsps = nsps; _i < _nsps.length; _i++) {
          var nsp = _nsps[_i];
          var _socket = this.nsps[nsp];

          if (_socket.active) {
            return;
          }
        }

        this._close();
      }
      /**
       * Writes a packet.
       *
       * @param packet
       * @private
       */

    }, {
      key: "_packet",
      value: function _packet(packet) {
        var encodedPackets = this.encoder.encode(packet);

        for (var i = 0; i < encodedPackets.length; i++) {
          this.engine.write(encodedPackets[i], packet.options);
        }
      }
      /**
       * Clean up transport subscriptions and packet buffer.
       *
       * @private
       */

    }, {
      key: "cleanup",
      value: function cleanup() {
        this.subs.forEach(function (subDestroy) {
          return subDestroy();
        });
        this.subs.length = 0;
        this.decoder.destroy();
      }
      /**
       * Close the current socket.
       *
       * @private
       */

    }, {
      key: "_close",
      value: function _close() {
        this.skipReconnect = true;
        this._reconnecting = false;
        this.onclose("forced close");
        if (this.engine) this.engine.close();
      }
      /**
       * Alias for close()
       *
       * @private
       */

    }, {
      key: "disconnect",
      value: function disconnect() {
        return this._close();
      }
      /**
       * Called upon engine close.
       *
       * @private
       */

    }, {
      key: "onclose",
      value: function onclose(reason, description) {
        this.cleanup();
        this.backoff.reset();
        this._readyState = "closed";
        this.emitReserved("close", reason, description);

        if (this._reconnection && !this.skipReconnect) {
          this.reconnect();
        }
      }
      /**
       * Attempt a reconnection.
       *
       * @private
       */

    }, {
      key: "reconnect",
      value: function reconnect() {
        var _this3 = this;

        if (this._reconnecting || this.skipReconnect) return this;
        var self = this;

        if (this.backoff.attempts >= this._reconnectionAttempts) {
          this.backoff.reset();
          this.emitReserved("reconnect_failed");
          this._reconnecting = false;
        } else {
          var delay = this.backoff.duration();
          this._reconnecting = true;
          var timer = this.setTimeoutFn(function () {
            if (self.skipReconnect) return;

            _this3.emitReserved("reconnect_attempt", self.backoff.attempts); // check again for the case socket closed in above events


            if (self.skipReconnect) return;
            self.open(function (err) {
              if (err) {
                self._reconnecting = false;
                self.reconnect();

                _this3.emitReserved("reconnect_error", err);
              } else {
                self.onreconnect();
              }
            });
          }, delay);

          if (this.opts.autoUnref) {
            timer.unref();
          }

          this.subs.push(function subDestroy() {
            clearTimeout(timer);
          });
        }
      }
      /**
       * Called upon successful reconnect.
       *
       * @private
       */

    }, {
      key: "onreconnect",
      value: function onreconnect() {
        var attempt = this.backoff.attempts;
        this._reconnecting = false;
        this.backoff.reset();
        this.emitReserved("reconnect", attempt);
      }
    }]);

    return Manager;
  }(Emitter_1);

  /**
   * Managers cache.
   */

  var cache$1 = {};

  function lookup$1(uri, opts) {
    if (_typeof(uri) === "object") {
      opts = uri;
      uri = undefined;
    }

    opts = opts || {};
    var parsed = url$1(uri, opts.path || "/socket.io");
    var source = parsed.source;
    var id = parsed.id;
    var path = parsed.path;
    var sameNamespace = cache$1[id] && path in cache$1[id]["nsps"];
    var newConnection = opts.forceNew || opts["force new connection"] || false === opts.multiplex || sameNamespace;
    var io;

    if (newConnection) {
      io = new Manager$1(source, opts);
    } else {
      if (!cache$1[id]) {
        cache$1[id] = new Manager$1(source, opts);
      }

      io = cache$1[id];
    }

    if (parsed.query && !opts.query) {
      opts.query = parsed.queryKey;
    }

    return io.socket(parsed.path, opts);
  } // so that "lookup" can be used both as a function (e.g. `io(...)`) and as a
  // namespace (e.g. `io.connect(...)`), for backward compatibility


  _extends(lookup$1, {
    Manager: Manager$1,
    Socket: Socket$1,
    io: lookup$1,
    connect: lookup$1
  });

  /**
   * Module dependencies.
   */
  var debug$4 = debugModule('socket.io-client:url');
  /**
   * Module exports.
   */

  /**
   * URL parser.
   *
   * @param {String} url
   * @param {Object} An object meant to mimic window.location.
   *                 Defaults to window.location.
   * @api public
   */

  function url(uri, loc) {
    var obj = uri; // default to window.location

    loc = loc || typeof location !== 'undefined' && location;
    if (null == uri) uri = loc.protocol + '//' + loc.host; // relative path support

    if ('string' === typeof uri) {
      if ('/' === uri.charAt(0)) {
        if ('/' === uri.charAt(1)) {
          uri = loc.protocol + uri;
        } else {
          uri = loc.host + uri;
        }
      }

      if (!/^(https?|wss?):\/\//.test(uri)) {
        debug$4('protocol-less url %s', uri);

        if ('undefined' !== typeof loc) {
          uri = loc.protocol + '//' + uri;
        } else {
          uri = 'https://' + uri;
        }
      } // parse


      debug$4('parse %s', uri);
      obj = parseuri(uri);
    } // make sure we treat `localhost:80` and `localhost` equally


    if (!obj.port) {
      if (/^(http|ws)$/.test(obj.protocol)) {
        obj.port = '80';
      } else if (/^(http|ws)s$/.test(obj.protocol)) {
        obj.port = '443';
      }
    }

    obj.path = obj.path || '/';
    var ipv6 = obj.host.indexOf(':') !== -1;
    var host = ipv6 ? '[' + obj.host + ']' : obj.host; // define unique id

    obj.id = obj.protocol + '://' + host + ':' + obj.port; // define href

    obj.href = obj.protocol + '://' + host + (loc && loc.port === obj.port ? '' : ':' + obj.port);
    return obj;
  }

  /**
   * Initialize a new `Emitter`.
   *
   * @api public
   */
  function Emitter(obj) {
    if (obj) return mixin(obj);
  }
  /**
   * Mixin the emitter properties.
   *
   * @param {Object} obj
   * @return {Object}
   * @api private
   */

  function mixin(obj) {
    for (var key in Emitter.prototype) {
      obj[key] = Emitter.prototype[key];
    }

    return obj;
  }
  /**
   * Listen on the given `event` with `fn`.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter.prototype.on = Emitter.prototype.addEventListener = function (event, fn) {
    this._callbacks = this._callbacks || {};
    (this._callbacks['$' + event] = this._callbacks['$' + event] || []).push(fn);
    return this;
  };
  /**
   * Adds an `event` listener that will be invoked a single
   * time then automatically removed.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter.prototype.once = function (event, fn) {
    function on() {
      this.off(event, on);
      fn.apply(this, arguments);
    }

    on.fn = fn;
    this.on(event, on);
    return this;
  };
  /**
   * Remove the given callback for `event` or all
   * registered callbacks.
   *
   * @param {String} event
   * @param {Function} fn
   * @return {Emitter}
   * @api public
   */


  Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = Emitter.prototype.removeEventListener = function (event, fn) {
    this._callbacks = this._callbacks || {}; // all

    if (0 == arguments.length) {
      this._callbacks = {};
      return this;
    } // specific event


    var callbacks = this._callbacks['$' + event];
    if (!callbacks) return this; // remove all handlers

    if (1 == arguments.length) {
      delete this._callbacks['$' + event];
      return this;
    } // remove specific handler


    var cb;

    for (var i = 0; i < callbacks.length; i++) {
      cb = callbacks[i];

      if (cb === fn || cb.fn === fn) {
        callbacks.splice(i, 1);
        break;
      }
    } // Remove event specific arrays for event types that no
    // one is subscribed for to avoid memory leak.


    if (callbacks.length === 0) {
      delete this._callbacks['$' + event];
    }

    return this;
  };
  /**
   * Emit `event` with the given args.
   *
   * @param {String} event
   * @param {Mixed} ...
   * @return {Emitter}
   */


  Emitter.prototype.emit = function (event) {
    this._callbacks = this._callbacks || {};
    var args = new Array(arguments.length - 1),
        callbacks = this._callbacks['$' + event];

    for (var i = 1; i < arguments.length; i++) {
      args[i - 1] = arguments[i];
    }

    if (callbacks) {
      callbacks = callbacks.slice(0);

      for (var i = 0, len = callbacks.length; i < len; ++i) {
        callbacks[i].apply(this, args);
      }
    }

    return this;
  };
  /**
   * Return array of callbacks for `event`.
   *
   * @param {String} event
   * @return {Array}
   * @api public
   */


  Emitter.prototype.listeners = function (event) {
    this._callbacks = this._callbacks || {};
    return this._callbacks['$' + event] || [];
  };
  /**
   * Check if this emitter has `event` handlers.
   *
   * @param {String} event
   * @return {Boolean}
   * @api public
   */


  Emitter.prototype.hasListeners = function (event) {
    return !!this.listeners(event).length;
  };

  var toString$1 = {}.toString;
  var isArray = Array.isArray || function (arr) {
    return toString$1.call(arr) == '[object Array]';
  };

  var withNativeBuffer = typeof Buffer === 'function' && typeof Buffer.isBuffer === 'function';
  var withNativeArrayBuffer$1 = typeof ArrayBuffer === 'function';

  var isView$1 = function isView(obj) {
    return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  /**
   * Returns true if obj is a buffer or an arraybuffer.
   *
   * @api private
   */


  function isBuf(obj) {
    return withNativeBuffer && Buffer.isBuffer(obj) || withNativeArrayBuffer$1 && (obj instanceof ArrayBuffer || isView$1(obj));
  }

  var toStringFunc = Object.prototype.toString;
  var withNativeBlob$1 = typeof Blob === 'function' || typeof Blob !== 'undefined' && toStringFunc.call(Blob) === '[object BlobConstructor]';
  var withNativeFile$1 = typeof File === 'function' || typeof File !== 'undefined' && toStringFunc.call(File) === '[object FileConstructor]';
  /**
   * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
   * Anything with blobs or files should be fed through removeBlobs before coming
   * here.
   *
   * @param {Object} packet - socket.io event packet
   * @return {Object} with deconstructed packet and list of buffers
   * @api public
   */

  var deconstructPacket = function deconstructPacket(packet) {
    var buffers = [];
    var packetData = packet.data;
    var pack = packet;
    pack.data = _deconstructPacket(packetData, buffers);
    pack.attachments = buffers.length; // number of binary 'attachments'

    return {
      packet: pack,
      buffers: buffers
    };
  };

  function _deconstructPacket(data, buffers) {
    if (!data) return data;

    if (isBuf(data)) {
      var placeholder = {
        _placeholder: true,
        num: buffers.length
      };
      buffers.push(data);
      return placeholder;
    } else if (isArray(data)) {
      var newData = new Array(data.length);

      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i], buffers);
      }

      return newData;
    } else if (_typeof(data) === 'object' && !(data instanceof Date)) {
      var newData2 = {};

      for (var key in data) {
        newData2[key] = _deconstructPacket(data[key], buffers);
      }

      return newData2;
    }

    return data;
  }
  /**
   * Reconstructs a binary packet from its placeholder packet and buffers
   *
   * @param {Object} packet - event packet with placeholders
   * @param {Array} buffers - binary buffers to put in placeholder positions
   * @return {Object} reconstructed packet
   * @api public
   */


  var reconstructPacket = function reconstructPacket(packet, buffers) {
    packet.data = _reconstructPacket(packet.data, buffers);
    packet.attachments = undefined; // no longer useful

    return packet;
  };

  function _reconstructPacket(data, buffers) {
    if (!data) return data;

    if (data && data._placeholder) {
      return buffers[data.num]; // appropriate buffer (should be natural order anyway)
    } else if (isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i], buffers);
      }
    } else if (_typeof(data) === 'object') {
      for (var key in data) {
        data[key] = _reconstructPacket(data[key], buffers);
      }
    }

    return data;
  }
  /**
   * Asynchronously removes Blobs or Files from data via
   * FileReader's readAsArrayBuffer method. Used before encoding
   * data as msgpack. Calls callback with the blobless data.
   *
   * @param {Object} data
   * @param {Function} callback
   * @api private
   */


  var removeBlobs = function removeBlobs(data, callback) {
    function _removeBlobs(obj) {
      var curKey = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : undefined;
      var containingObject = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : undefined;
      if (!obj) return obj; // convert any blob

      if (withNativeBlob$1 && obj instanceof Blob || withNativeFile$1 && obj instanceof File) {
        pendingBlobs++; // async filereader

        var fileReader = new FileReader();

        fileReader.onload = function () {
          if (containingObject) {
            containingObject[curKey] = this.result;
          } else {
            bloblessData = this.result;
          } // if nothing pending its callback time


          if (! --pendingBlobs) {
            callback(bloblessData);
          }
        };

        fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
      } else if (isArray(obj)) {
        // handle array
        for (var i = 0; i < obj.length; i++) {
          _removeBlobs(obj[i], i, obj);
        }
      } else if (_typeof(obj) === 'object' && !isBuf(obj)) {
        // and object
        for (var key in obj) {
          _removeBlobs(obj[key], key, obj);
        }
      }
    }

    var pendingBlobs = 0;
    var bloblessData = data;

    _removeBlobs(bloblessData);

    if (!pendingBlobs) {
      callback(bloblessData);
    }
  };

  var binary = {
    deconstructPacket: deconstructPacket,
    reconstructPacket: reconstructPacket,
    removeBlobs: removeBlobs
  };

  /**
   * Module dependencies.
   */
  var debug$3 = debugModule('socket.io-parser');
  /**
   * Protocol version.
   *
   * @api public
   */

  var protocol$1 = 4;
  /**
   * Packet types.
   *
   * @api public
   */

  var types = ['CONNECT', 'DISCONNECT', 'EVENT', 'ACK', 'ERROR', 'BINARY_EVENT', 'BINARY_ACK'];
  /**
   * Packet type `connect`.
   *
   * @api public
   */

  var CONNECT = 0;
  /**
   * Packet type `disconnect`.
   *
   * @api public
   */

  var DISCONNECT = 1;
  /**
   * Packet type `event`.
   *
   * @api public
   */

  var EVENT = 2;
  /**
   * Packet type `ack`.
   *
   * @api public
   */

  var ACK = 3;
  /**
   * Packet type `error`.
   *
   * @api public
   */

  var ERROR = 4;
  /**
   * Packet type 'binary event'
   *
   * @api public
   */

  var BINARY_EVENT = 5;
  /**
   * Packet type `binary ack`. For acks with binary arguments.
   *
   * @api public
   */

  var BINARY_ACK = 6;
  /**
   * A socket.io Encoder instance
   *
   * @api public
   */

  function Encoder() {}

  var ERROR_PACKET = ERROR + '"encode error"';
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   * @param {Function} callback - function to handle encodings (likely engine.write)
   * @return Calls callback with Array of encodings
   * @api public
   */

  Encoder.prototype.encode = function (obj, callback) {
    debug$3('encoding packet %j', obj);

    if (BINARY_EVENT === obj.type || BINARY_ACK === obj.type) {
      encodeAsBinary(obj, callback);
    } else {
      var encoding = encodeAsString(obj);
      callback([encoding]);
    }
  };
  /**
   * Encode packet as string.
   *
   * @param {Object} packet
   * @return {String} encoded
   * @api private
   */


  function encodeAsString(obj) {
    // first is type
    var str = '' + obj.type; // attachments if we have them

    if (BINARY_EVENT === obj.type || BINARY_ACK === obj.type) {
      str += obj.attachments + '-';
    } // if we have a namespace other than `/`
    // we append it followed by a comma `,`


    if (obj.nsp && '/' !== obj.nsp) {
      str += obj.nsp + ',';
    } // immediately followed by the id


    if (null != obj.id) {
      str += obj.id;
    } // json data


    if (null != obj.data) {
      var payload = tryStringify(obj.data);

      if (payload !== false) {
        str += payload;
      } else {
        return ERROR_PACKET;
      }
    }

    debug$3('encoded %j as %s', obj, str);
    return str;
  }

  function tryStringify(str) {
    try {
      return JSON.stringify(str);
    } catch (e) {
      return false;
    }
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   *
   * @param {Object} packet
   * @return {Buffer} encoded
   * @api private
   */


  function encodeAsBinary(obj, callback) {
    function writeEncoding(bloblessData) {
      var deconstruction = binary.deconstructPacket(bloblessData);
      var pack = encodeAsString(deconstruction.packet);
      var buffers = deconstruction.buffers;
      buffers.unshift(pack); // add packet info to beginning of data list

      callback(buffers); // write all the buffers
    }

    binary.removeBlobs(obj, writeEncoding);
  }
  /**
   * A socket.io Decoder instance
   *
   * @return {Object} decoder
   * @api public
   */


  function Decoder() {
    this.reconstructor = null;
  }
  /**
   * Mix in `Emitter` with Decoder.
   */


  Emitter(Decoder.prototype);
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   * @return {Object} packet
   * @api public
   */

  Decoder.prototype.add = function (obj) {
    var packet;

    if (typeof obj === 'string') {
      packet = decodeString(obj);

      if (BINARY_EVENT === packet.type || BINARY_ACK === packet.type) {
        // binary packet's json
        this.reconstructor = new BinaryReconstructor(packet); // no attachments, labeled binary but no binary data to follow

        if (this.reconstructor.reconPack.attachments === 0) {
          this.emit('decoded', packet);
        }
      } else {
        // non-binary full packet
        this.emit('decoded', packet);
      }
    } else if (isBuf(obj) || obj.base64) {
      // raw binary data
      if (!this.reconstructor) {
        throw new Error('got binary data when not reconstructing a packet');
      } else {
        packet = this.reconstructor.takeBinaryData(obj);

        if (packet) {
          // received final buffer
          this.reconstructor = null;
          this.emit('decoded', packet);
        }
      }
    } else {
      throw new Error('Unknown type: ' + obj);
    }
  };
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   * @api private
   */


  function decodeString(str) {
    var i = 0; // look up type

    var p = {
      type: Number(str.charAt(0))
    };

    if (null == types[p.type]) {
      return error('unknown packet type ' + p.type);
    } // look up attachments if type binary


    if (BINARY_EVENT === p.type || BINARY_ACK === p.type) {
      var buf = '';

      while (str.charAt(++i) !== '-') {
        buf += str.charAt(i);
        if (i == str.length) break;
      }

      if (buf != Number(buf).toString() || str.charAt(i) !== '-') {
        throw new Error('Illegal attachments');
      }

      p.attachments = Number(buf);
    } // look up namespace (if any)


    if ('/' === str.charAt(i + 1)) {
      p.nsp = '';

      while (++i) {
        var c = str.charAt(i);
        if (',' === c) break;
        p.nsp += c;
        if (i === str.length) break;
      }
    } else {
      p.nsp = '/';
    } // look up id


    var next = str.charAt(i + 1);

    if ('' !== next && Number(next) == next) {
      p.id = '';

      while (++i) {
        var c = str.charAt(i);

        if (null == c || Number(c) != c) {
          --i;
          break;
        }

        p.id += str.charAt(i);
        if (i === str.length) break;
      }

      p.id = Number(p.id);
    } // look up json data


    if (str.charAt(++i)) {
      var payload = tryParse(str.substr(i));
      var isPayloadValid = payload !== false && (p.type === ERROR || isArray(payload));

      if (isPayloadValid) {
        p.data = payload;
      } else {
        return error('invalid payload');
      }
    }

    debug$3('decoded %s as %j', str, p);
    return p;
  }

  function tryParse(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }
  /**
   * Deallocates a parser's resources
   *
   * @api public
   */


  Decoder.prototype.destroy = function () {
    if (this.reconstructor) {
      this.reconstructor.finishedReconstruction();
    }
  };
  /**
   * A manager of a binary event's 'buffer sequence'. Should
   * be constructed whenever a packet of type BINARY_EVENT is
   * decoded.
   *
   * @param {Object} packet
   * @return {BinaryReconstructor} initialized reconstructor
   * @api private
   */


  function BinaryReconstructor(packet) {
    this.reconPack = packet;
    this.buffers = [];
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   * @api private
   */


  BinaryReconstructor.prototype.takeBinaryData = function (binData) {
    this.buffers.push(binData);

    if (this.buffers.length === this.reconPack.attachments) {
      // done with buffer list
      var packet = binary.reconstructPacket(this.reconPack, this.buffers);
      this.finishedReconstruction();
      return packet;
    }

    return null;
  };
  /**
   * Cleans up binary packet reconstruction variables.
   *
   * @api private
   */


  BinaryReconstructor.prototype.finishedReconstruction = function () {
    this.reconPack = null;
    this.buffers = [];
  };

  function error(msg) {
    return {
      type: ERROR,
      data: 'parser error: ' + msg
    };
  }

  var parser = {
    protocol: protocol$1,
    types: types,
    CONNECT: CONNECT,
    DISCONNECT: DISCONNECT,
    EVENT: EVENT,
    ACK: ACK,
    ERROR: ERROR,
    BINARY_EVENT: BINARY_EVENT,
    BINARY_ACK: BINARY_ACK,
    Encoder: Encoder,
    Decoder: Decoder
  };

  function toArray(list) {
    var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var array = [];
    index = index || 0;

    for (var i = index || 0; i < list.length; i++) {
      array[i - index] = list[i];
    }

    return array;
  }

  /**
   * Module exports.
   */

  /**
   * Helper for subscriptions.
   *
   * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
   * @param {String} event name
   * @param {Function} callback
   * @api public
   */
  function on(obj, ev, fn) {
    obj.on(ev, fn);
    return {
      destroy: function destroy() {
        obj.removeListener(ev, fn);
      }
    };
  }

  /**
   * Slice reference.
   */
  var slice = [].slice;
  /**
   * Bind `obj` to `fn`.
   *
   * @param {Object} obj
   * @param {Function|String} fn or string
   * @return {Function}
   * @api public
   */

  function bind (obj, fn) {
    if ('string' == typeof fn) fn = obj[fn];
    if ('function' != typeof fn) throw new Error('bind() requires a function');
    var args = slice.call(arguments, 2);
    return function () {
      return fn.apply(obj, args.concat(slice.call(arguments)));
    };
  }

  var parseqs = {};

  /**
   * Compiles a querystring
   * Returns string representation of the object
   *
   * @param {Object}
   * @api private
   */

  parseqs.encode = function (obj) {
    var str = '';

    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        if (str.length) str += '&';
        str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
      }
    }

    return str;
  };
  /**
   * Parses a simple querystring into an object
   *
   * @param {String} qs
   * @api private
   */


  parseqs.decode = function (qs) {
    var qry = {};
    var pairs = qs.split('&');

    for (var i = 0, l = pairs.length; i < l; i++) {
      var pair = pairs[i].split('=');
      qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
    }

    return qry;
  };

  /* global Blob File */
  var toString = Object.prototype.toString;
  var withNativeBlob = typeof Blob === 'function' || typeof Blob !== 'undefined' && toString.call(Blob) === '[object BlobConstructor]';
  var withNativeFile = typeof File === 'function' || typeof File !== 'undefined' && toString.call(File) === '[object FileConstructor]';
  var withNativeArrayBuffer = typeof ArrayBuffer === 'function'; // ArrayBuffer.isView method is not defined in IE10

  var isView = function isView(obj) {
    return typeof ArrayBuffer.isView === 'function' ? ArrayBuffer.isView(obj) : obj.buffer instanceof ArrayBuffer;
  };
  /**
   * Checks for binary data.
   *
   * Supports Buffer, ArrayBuffer, Blob and File.
   *
   * @param {Object} anything
   * @api public
   */


  function hasBinary(obj) {

    if (!obj || _typeof(obj) !== 'object') {
      return false;
    }

    if (Array.isArray(obj)) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (hasBinary(obj[i])) {
          return true;
        }
      }

      return false;
    }

    if (withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj)) || withNativeBlob && obj instanceof Blob || withNativeFile && obj instanceof File) {
      return true;
    } // see: https://github.com/Automattic/has-binary/pull/4


    if (obj.toJSON && typeof obj.toJSON === 'function' && arguments.length === 1) {
      return hasBinary(obj.toJSON(), true);
    }

    for (var key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
        return true;
      }
    }

    return false;
  }

  var debug$2 = debugModule('socket.io-client:socket');
  /**
   * Module exports.
   */

  /**
   * Internal events (blacklisted).
   * These events can't be emitted by the user.
   *
   * @api private
   */

  var events = {
    connect: 1,
    connect_error: 1,
    connect_timeout: 1,
    connecting: 1,
    disconnect: 1,
    error: 1,
    reconnect: 1,
    reconnect_attempt: 1,
    reconnect_failed: 1,
    reconnect_error: 1,
    reconnecting: 1,
    ping: 1,
    pong: 1
  };
  /**
   * Shortcut to `Emitter#emit`.
   */

  var emit = Emitter.prototype.emit;
  /**
   * `Socket` constructor.
   *
   * @api public
   */

  function Socket(io, nsp, opts) {
    this.io = io;
    this.nsp = nsp;
    this.json = this; // compat

    this.ids = 0;
    this.acks = {};
    this.receiveBuffer = [];
    this.sendBuffer = [];
    this.connected = false;
    this.disconnected = true;
    this.flags = {};

    if (opts && opts.query) {
      this.query = opts.query;
    }

    if (this.io.autoConnect) this.open();
  }
  /**
   * Mix in `Emitter`.
   */


  Emitter(Socket.prototype);
  /**
   * Subscribe to open, close and packet events
   *
   * @api private
   */

  Socket.prototype.subEvents = function () {
    if (this.subs) return;
    var io = this.io;
    this.subs = [on(io, 'open', bind(this, 'onopen')), on(io, 'packet', bind(this, 'onpacket')), on(io, 'close', bind(this, 'onclose'))];
  };
  /**
   * "Opens" the socket.
   *
   * @api public
   */


  Socket.prototype.open = Socket.prototype.connect = function () {
    if (this.connected) return this;
    this.subEvents();
    this.io.open(); // ensure open

    if ('open' === this.io.readyState) this.onopen();
    this.emit('connecting');
    return this;
  };
  /**
   * Sends a `message` event.
   *
   * @return {Socket} self
   * @api public
   */


  Socket.prototype.send = function () {
    var args = toArray(arguments);
    args.unshift('message');
    this.emit.apply(this, args);
    return this;
  };
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @param {String} event name
   * @return {Socket} self
   * @api public
   */


  Socket.prototype.emit = function (ev) {
    if (events.hasOwnProperty(ev)) {
      emit.apply(this, arguments);
      return this;
    }

    var args = toArray(arguments);
    var packet = {
      type: (this.flags.binary !== undefined ? this.flags.binary : hasBinary(args)) ? parser.BINARY_EVENT : parser.EVENT,
      data: args
    };
    packet.options = {};
    packet.options.compress = !this.flags || false !== this.flags.compress; // event ack callback

    if ('function' === typeof args[args.length - 1]) {
      debug$2('emitting packet with ack id %d', this.ids);
      this.acks[this.ids] = args.pop();
      packet.id = this.ids++;
    }

    if (this.connected) {
      this.packet(packet);
    } else {
      this.sendBuffer.push(packet);
    }

    this.flags = {};
    return this;
  };
  /**
   * Sends a packet.
   *
   * @param {Object} packet
   * @api private
   */


  Socket.prototype.packet = function (packet) {
    packet.nsp = this.nsp;
    this.io.packet(packet);
  };
  /**
   * Called upon engine `open`.
   *
   * @api private
   */


  Socket.prototype.onopen = function () {
    debug$2('transport is open - connecting'); // write connect packet if necessary

    if ('/' !== this.nsp) {
      if (this.query) {
        var query = _typeof(this.query) === 'object' ? parseqs.encode(this.query) : this.query;
        debug$2('sending connect packet with query %s', query);
        this.packet({
          type: parser.CONNECT,
          query: query
        });
      } else {
        this.packet({
          type: parser.CONNECT
        });
      }
    }
  };
  /**
   * Called upon engine `close`.
   *
   * @param {String} reason
   * @api private
   */


  Socket.prototype.onclose = function (reason) {
    debug$2('close (%s)', reason);
    this.connected = false;
    this.disconnected = true;
    delete this.id;
    this.emit('disconnect', reason);
  };
  /**
   * Called with socket packet.
   *
   * @param {Object} packet
   * @api private
   */


  Socket.prototype.onpacket = function (packet) {
    var sameNamespace = packet.nsp === this.nsp;
    var rootNamespaceError = packet.type === parser.ERROR && packet.nsp === '/';
    if (!sameNamespace && !rootNamespaceError) return;

    switch (packet.type) {
      case parser.CONNECT:
        this.onconnect();
        break;

      case parser.EVENT:
        this.onevent(packet);
        break;

      case parser.BINARY_EVENT:
        this.onevent(packet);
        break;

      case parser.ACK:
        this.onack(packet);
        break;

      case parser.BINARY_ACK:
        this.onack(packet);
        break;

      case parser.DISCONNECT:
        this.ondisconnect();
        break;

      case parser.ERROR:
        this.emit('error', packet.data);
        break;
    }
  };
  /**
   * Called upon a server event.
   *
   * @param {Object} packet
   * @api private
   */


  Socket.prototype.onevent = function (packet) {
    var args = packet.data || [];
    debug$2('emitting event %j', args);

    if (null != packet.id) {
      debug$2('attaching ack callback to event');
      args.push(this.ack(packet.id));
    }

    if (this.connected) {
      emit.apply(this, args);
    } else {
      this.receiveBuffer.push(args);
    }
  };
  /**
   * Produces an ack callback to emit with an event.
   *
   * @api private
   */


  Socket.prototype.ack = function (id) {
    var self = this;
    var sent = false;
    return function () {
      // prevent double callbacks
      if (sent) return;
      sent = true;
      var args = toArray(arguments);
      debug$2('sending ack %j', args);
      self.packet({
        type: hasBinary(args) ? parser.BINARY_ACK : parser.ACK,
        id: id,
        data: args
      });
    };
  };
  /**
   * Called upon a server acknowlegement.
   *
   * @param {Object} packet
   * @api private
   */


  Socket.prototype.onack = function (packet) {
    var ack = this.acks[packet.id];

    if ('function' === typeof ack) {
      debug$2('calling ack %s with %j', packet.id, packet.data);
      ack.apply(this, packet.data);
      delete this.acks[packet.id];
    } else {
      debug$2('bad ack %s', packet.id);
    }
  };
  /**
   * Called upon server connect.
   *
   * @api private
   */


  Socket.prototype.onconnect = function () {
    this.connected = true;
    this.disconnected = false;
    this.emit('connect');
    this.emitBuffered();
  };
  /**
   * Emit buffered events (received and emitted).
   *
   * @api private
   */


  Socket.prototype.emitBuffered = function () {
    var i;

    for (i = 0; i < this.receiveBuffer.length; i++) {
      emit.apply(this, this.receiveBuffer[i]);
    }

    this.receiveBuffer = [];

    for (i = 0; i < this.sendBuffer.length; i++) {
      this.packet(this.sendBuffer[i]);
    }

    this.sendBuffer = [];
  };
  /**
   * Called upon server disconnect.
   *
   * @api private
   */


  Socket.prototype.ondisconnect = function () {
    debug$2('server disconnect (%s)', this.nsp);
    this.destroy();
    this.onclose('io server disconnect');
  };
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @api private.
   */


  Socket.prototype.destroy = function () {
    if (this.subs) {
      // clean subscriptions to avoid reconnections
      for (var i = 0; i < this.subs.length; i++) {
        this.subs[i].destroy();
      }

      this.subs = null;
    }

    this.io.destroy(this);
  };
  /**
   * Disconnects the socket manually.
   *
   * @return {Socket} self
   * @api public
   */


  Socket.prototype.close = Socket.prototype.disconnect = function () {
    if (this.connected) {
      debug$2('performing disconnect (%s)', this.nsp);
      this.packet({
        type: parser.DISCONNECT
      });
    } // remove socket from pool


    this.destroy();

    if (this.connected) {
      // fire events
      this.onclose('io client disconnect');
    }

    return this;
  };
  /**
   * Sets the compress flag.
   *
   * @param {Boolean} if `true`, compresses the sending data
   * @return {Socket} self
   * @api public
   */


  Socket.prototype.compress = function (compress) {
    this.flags.compress = compress;
    return this;
  };
  /**
   * Sets the binary flag
   *
   * @param {Boolean} whether the emitted data contains binary
   * @return {Socket} self
   * @api public
   */


  Socket.prototype.binary = function (binary) {
    this.flags.binary = binary;
    return this;
  };

  var indexOf = [].indexOf;
  function indexOf$1 (arr, obj) {
    if (indexOf) return arr.indexOf(obj);

    for (var i = 0; i < arr.length; ++i) {
      if (arr[i] === obj) return i;
    }

    return -1;
  }

  /**
   * Initialize backoff timer with `opts`.
   *
   * - `min` initial timeout in milliseconds [100]
   * - `max` max timeout [10000]
   * - `jitter` [0]
   * - `factor` [2]
   *
   * @param {Object} opts
   * @api public
   */
  function Backoff(opts) {
    opts = opts || {};
    this.ms = opts.min || 100;
    this.max = opts.max || 10000;
    this.factor = opts.factor || 2;
    this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
    this.attempts = 0;
  }
  /**
   * Return the backoff duration.
   *
   * @return {Number}
   * @api public
   */

  Backoff.prototype.duration = function () {
    var ms = this.ms * Math.pow(this.factor, this.attempts++);

    if (this.jitter) {
      var rand = Math.random();
      var deviation = Math.floor(rand * this.jitter * ms);
      ms = (Math.floor(rand * 10) & 1) == 0 ? ms - deviation : ms + deviation;
    }

    return Math.min(ms, this.max) | 0;
  };
  /**
   * Reset the number of attempts.
   *
   * @api public
   */


  Backoff.prototype.reset = function () {
    this.attempts = 0;
  };
  /**
   * Set the minimum duration
   *
   * @api public
   */


  Backoff.prototype.setMin = function (min) {
    this.ms = min;
  };
  /**
   * Set the maximum duration
   *
   * @api public
   */


  Backoff.prototype.setMax = function (max) {
    this.max = max;
  };
  /**
   * Set the jitter
   *
   * @api public
   */


  Backoff.prototype.setJitter = function (jitter) {
    this.jitter = jitter;
  };

  var eio = eio$1.Socket;
  var debug$1 = debugModule('socket.io-client:manager');
  /**
   * IE6+ hasOwnProperty
   */

  var has = Object.prototype.hasOwnProperty;
  /**
   * Module exports
   */

  /**
   * `Manager` constructor.
   *
   * @param {String} engine instance or engine uri/opts
   * @param {Object} options
   * @api public
   */

  function Manager(uri, opts) {
    //  if (!(this instanceof Manager)) return new Manager(uri, opts);
    if (!(this instanceof Manager)) console.error('socket.io-client:Is not a Manager');

    if (uri && 'object' === _typeof(uri)) {
      opts = uri;
      uri = undefined;
    }

    opts = opts || {};
    opts.path = opts.path || '/socket.io';
    this.nsps = {};
    this.subs = [];
    this.opts = opts;
    this.reconnection(opts.reconnection !== false);
    this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
    this.reconnectionDelay(opts.reconnectionDelay || 1000);
    this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
    this.randomizationFactor(opts.randomizationFactor || 0.5);
    this.backoff = new Backoff({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    });
    this.timeout(null == opts.timeout ? 20000 : opts.timeout);
    this.readyState = 'closed';
    this.uri = uri;
    this.connecting = [];
    this.lastPing = null;
    this.encoding = false;
    this.packetBuffer = [];

    var _parser = opts.parser || parser;

    this.encoder = new _parser.Encoder();
    this.decoder = new _parser.Decoder();
    this.autoConnect = opts.autoConnect !== false;
    if (this.autoConnect) this.open();
  }
  /**
   * Propagate given event to sockets and emit on `this`
   *
   * @api private
   */


  Manager.prototype.emitAll = function () {
    this.emit.apply(this, arguments);

    for (var nsp in this.nsps) {
      if (has.call(this.nsps, nsp)) {
        this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
      }
    }
  };
  /**
   * Update `socket.id` of all sockets
   *
   * @api private
   */


  Manager.prototype.updateSocketIds = function () {
    for (var nsp in this.nsps) {
      if (has.call(this.nsps, nsp)) {
        this.nsps[nsp].id = this.generateId(nsp);
      }
    }
  };
  /**
   * generate `socket.id` for the given `nsp`
   *
   * @param {String} nsp
   * @return {String}
   * @api private
   */


  Manager.prototype.generateId = function (nsp) {
    return (nsp === '/' ? '' : nsp + '#') + this.engine.id;
  };
  /**
   * Mix in `Emitter`.
   */


  Emitter(Manager.prototype);
  /**
   * Sets the `reconnection` config.
   *
   * @param {Boolean} true/false if it should automatically reconnect
   * @return {Manager} self or value
   * @api public
   */

  Manager.prototype.reconnection = function (v) {
    if (!arguments.length) return this._reconnection;
    this._reconnection = !!v;
    return this;
  };
  /**
   * Sets the reconnection attempts config.
   *
   * @param {Number} max reconnection attempts before giving up
   * @return {Manager} self or value
   * @api public
   */


  Manager.prototype.reconnectionAttempts = function (v) {
    if (!arguments.length) return this._reconnectionAttempts;
    this._reconnectionAttempts = v;
    return this;
  };
  /**
   * Sets the delay between reconnections.
   *
   * @param {Number} delay
   * @return {Manager} self or value
   * @api public
   */


  Manager.prototype.reconnectionDelay = function (v) {
    if (!arguments.length) return this._reconnectionDelay;
    this._reconnectionDelay = v;
    this.backoff && this.backoff.setMin(v);
    return this;
  };

  Manager.prototype.randomizationFactor = function (v) {
    if (!arguments.length) return this._randomizationFactor;
    this._randomizationFactor = v;
    this.backoff && this.backoff.setJitter(v);
    return this;
  };
  /**
   * Sets the maximum delay between reconnections.
   *
   * @param {Number} delay
   * @return {Manager} self or value
   * @api public
   */


  Manager.prototype.reconnectionDelayMax = function (v) {
    if (!arguments.length) return this._reconnectionDelayMax;
    this._reconnectionDelayMax = v;
    this.backoff && this.backoff.setMax(v);
    return this;
  };
  /**
   * Sets the connection timeout. `false` to disable
   *
   * @return {Manager} self or value
   * @api public
   */


  Manager.prototype.timeout = function (v) {
    if (!arguments.length) return this._timeout;
    this._timeout = v;
    return this;
  };
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @api private
   */


  Manager.prototype.maybeReconnectOnOpen = function () {
    // Only try to reconnect if it's the first time we're connecting
    if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
      // keeps reconnection from firing twice for the same reconnection loop
      this.reconnect();
    }
  };
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} optional, callback
   * @return {Manager} self
   * @api public
   */


  Manager.prototype.open = Manager.prototype.connect = function (fn, opts) {
    debug$1('readyState %s', this.readyState);
    if (~this.readyState.indexOf('open')) return this;
    debug$1('opening %s', this.uri);
    this.engine = new eio(this.uri, this.opts);
    var socket = this.engine;
    var self = this;
    this.readyState = 'opening';
    this.skipReconnect = false; // emit `open`

    var openSub = on(socket, 'open', function () {
      self.onopen();
      fn && fn();
    }); // emit `connect_error`

    var errorSub = on(socket, 'error', function (data) {
      debug$1('connect_error');
      self.cleanup();
      self.readyState = 'closed';
      self.emitAll('connect_error', data);

      if (fn) {
        var err = new Error('Connection error');
        err.data = data;
        fn(err);
      } else {
        // Only do this if there is no fn to handle the error
        self.maybeReconnectOnOpen();
      }
    }); // emit `connect_timeout`

    if (false !== this._timeout) {
      var timeout = this._timeout;
      debug$1('connect attempt will timeout after %d', timeout); // set timer

      var timer = setTimeout(function () {
        debug$1('connect attempt timed out after %d', timeout);
        openSub.destroy();
        socket.close();
        socket.emit('error', 'timeout');
        self.emitAll('connect_timeout', timeout);
      }, timeout);
      this.subs.push({
        destroy: function destroy() {
          clearTimeout(timer);
        }
      });
    }

    this.subs.push(openSub);
    this.subs.push(errorSub);
    return this;
  };
  /**
   * Called upon transport open.
   *
   * @api private
   */


  Manager.prototype.onopen = function () {
    debug$1('open'); // clear old subs

    this.cleanup(); // mark as open

    this.readyState = 'open';
    this.emit('open'); // add new subs

    var socket = this.engine;
    this.subs.push(on(socket, 'data', bind(this, 'ondata')));
    this.subs.push(on(socket, 'ping', bind(this, 'onping')));
    this.subs.push(on(socket, 'pong', bind(this, 'onpong')));
    this.subs.push(on(socket, 'error', bind(this, 'onerror')));
    this.subs.push(on(socket, 'close', bind(this, 'onclose')));
    this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
  };
  /**
   * Called upon a ping.
   *
   * @api private
   */


  Manager.prototype.onping = function () {
    this.lastPing = new Date();
    this.emitAll('ping');
  };
  /**
   * Called upon a packet.
   *
   * @api private
   */


  Manager.prototype.onpong = function () {
    var now = new Date();
    this.emitAll('pong', now - this.lastPing);
  };
  /**
   * Called with data.
   *
   * @api private
   */


  Manager.prototype.ondata = function (data) {
    this.decoder.add(data);
  };
  /**
   * Called when parser fully decodes a packet.
   *
   * @api private
   */


  Manager.prototype.ondecoded = function (packet) {
    this.emit('packet', packet);
  };
  /**
   * Called upon socket error.
   *
   * @api private
   */


  Manager.prototype.onerror = function (err) {
    debug$1('error', err);
    this.emitAll('error', err);
  };
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @api public
   */


  Manager.prototype.socket = function (nsp, opts) {
    var socket = this.nsps[nsp];

    if (!socket) {
      socket = new Socket(this, nsp, opts);
      this.nsps[nsp] = socket;
      var self = this;
      socket.on('connecting', onConnecting);
      socket.on('connect', function () {
        socket.id = self.generateId(nsp);
      });

      if (this.autoConnect) {
        // manually call here since connecting event is fired before listening
        onConnecting();
      }
    }

    function onConnecting() {
      if (!~indexOf$1(self.connecting, socket)) {
        self.connecting.push(socket);
      }
    }

    return socket;
  };
  /**
   * Called upon a socket close.
   *
   * @param {Socket} socket
   */


  Manager.prototype.destroy = function (socket) {
    var index = indexOf$1(this.connecting, socket);
    if (~index) this.connecting.splice(index, 1);
    if (this.connecting.length) return;
    this.close();
  };
  /**
   * Writes a packet.
   *
   * @param {Object} packet
   * @api private
   */


  Manager.prototype.packet = function (packet) {
    debug$1('writing packet %j', packet);
    var self = this;
    if (packet.query && packet.type === 0) packet.nsp += '?' + packet.query;

    if (!self.encoding) {
      // encode, then write to engine with result
      self.encoding = true;
      this.encoder.encode(packet, function (encodedPackets) {
        for (var i = 0; i < encodedPackets.length; i++) {
          self.engine.write(encodedPackets[i], packet.options);
        }

        self.encoding = false;
        self.processPacketQueue();
      });
    } else {
      // add packet to the queue
      self.packetBuffer.push(packet);
    }
  };
  /**
   * If packet buffer is non-empty, begins encoding the
   * next packet in line.
   *
   * @api private
   */


  Manager.prototype.processPacketQueue = function () {
    if (this.packetBuffer.length > 0 && !this.encoding) {
      var pack = this.packetBuffer.shift();
      this.packet(pack);
    }
  };
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @api private
   */


  Manager.prototype.cleanup = function () {
    debug$1('cleanup');
    var subsLength = this.subs.length;

    for (var i = 0; i < subsLength; i++) {
      var sub = this.subs.shift();
      sub.destroy();
    }

    this.packetBuffer = [];
    this.encoding = false;
    this.lastPing = null;
    this.decoder.destroy();
  };
  /**
   * Close the current socket.
   *
   * @api private
   */


  Manager.prototype.close = Manager.prototype.disconnect = function () {
    debug$1('disconnect');
    this.skipReconnect = true;
    this.reconnecting = false;

    if ('opening' === this.readyState) {
      // `onclose` will not fire because
      // an open event never happened
      this.cleanup();
    }

    this.backoff.reset();
    this.readyState = 'closed';
    if (this.engine) this.engine.close();
  };
  /**
   * Called upon engine close.
   *
   * @api private
   */


  Manager.prototype.onclose = function (reason) {
    debug$1('onclose');
    this.cleanup();
    this.backoff.reset();
    this.readyState = 'closed';
    this.emit('close', reason);

    if (this._reconnection && !this.skipReconnect) {
      this.reconnect();
    }
  };
  /**
   * Attempt a reconnection.
   *
   * @api private
   */


  Manager.prototype.reconnect = function () {
    if (this.reconnecting || this.skipReconnect) return this;
    var self = this;

    if (this.backoff.attempts >= this._reconnectionAttempts) {
      debug$1('reconnect failed');
      this.backoff.reset();
      this.emitAll('reconnect_failed');
      this.reconnecting = false;
    } else {
      var delay = this.backoff.duration();
      debug$1('will wait %dms before reconnect attempt', delay);
      this.reconnecting = true;
      var timer = setTimeout(function () {
        if (self.skipReconnect) return;
        debug$1('attempting reconnect');
        self.emitAll('reconnect_attempt', self.backoff.attempts);
        self.emitAll('reconnecting', self.backoff.attempts); // check again for the case socket closed in above events

        if (self.skipReconnect) return;
        self.open(function (err) {
          if (err) {
            debug$1('reconnect attempt error');
            self.reconnecting = false;
            self.reconnect();
            self.emitAll('reconnect_error', err.data);
          } else {
            debug$1('reconnect success');
            self.onreconnect();
          }
        });
      }, delay);
      this.subs.push({
        destroy: function destroy() {
          clearTimeout(timer);
        }
      });
    }
  };
  /**
   * Called upon successful reconnect.
   *
   * @api private
   */


  Manager.prototype.onreconnect = function () {
    var attempt = this.backoff.attempts;
    this.reconnecting = false;
    this.backoff.reset();
    this.updateSocketIds();
    this.emitAll('reconnect', attempt);
  };

  var debug = debugModule('socket.io-client');
  /**
   * Module exports.
   */

  /**
   * Managers cache.
   */

  var cache = {};
  /**
   * Looks up an existing `Manager` for multiplexing.
   * If the user summons:
   *
   *   `io('http://localhost/a');`
   *   `io('http://localhost/b');`
   *
   * We reuse the existing instance based on same scheme/port/host,
   * and we initialize sockets for each namespace.
   *
   * @api public
   */

  function lookup(uri, opts) {
    if (_typeof(uri) === 'object') {
      opts = uri;
      uri = undefined;
    }

    opts = opts || {};
    var parsed = url(uri, null);
    var source = parsed.source;
    var id = parsed.id;
    var path = parsed.path;
    var sameNamespace = cache[id] && path in cache[id].nsps;
    var newConnection = opts.forceNew || opts['force new connection'] || false === opts.multiplex || sameNamespace;
    var io;

    if (newConnection) {
      debug('ignoring socket cache for %s', source);
      io = new Manager(source, opts);
    } else {
      if (!cache[id]) {
        debug('new io instance for %s', source);
        cache[id] = new Manager(source, opts);
      }

      io = cache[id];
    }

    if (parsed.query && !opts.query) {
      opts.query = parsed.query;
    }

    return io.socket(parsed.path, opts);
  }
  /**
   * Protocol version.
   *
   * @api public
   */


  var protocol = parser.protocol;
  var v4 = {
    eio: eio$1,
    name: 'socket.io-client',
    managers: cache,
    protocol: protocol,
    Manager: Manager,
    Socket: Socket,
    io: lookup,
    connect: lookup,
    "default": lookup
  };

  /**
   These versions are super confusing and obnoxious.
   socket.io-client protocol 5 uses engine.io protocol 4
   socket.io-client protocol 4 uses engine.io protocol 3
   Internally, just call it by the engine.io version
   On export, rename v4 to v5 and v3 to v4
   */

  var v5 = {
    eio: v4$1,
    protocol: protocol$2,
    Manager: Manager$1,
    Socket: Socket$1,
    io: lookup$1,
    connect: lookup$1
  };
  var versions = [v5, v4];

  function getEioProtocolVersion(v) {
    return versions.find(function (el) {
      return el.eio.protocol === v;
    });
  }

  exports.getEioProtocolVersion = getEioProtocolVersion;
  exports.v4 = v4;
  exports.v5 = v5;
  exports.versions = versions;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=socket.io.js.map
