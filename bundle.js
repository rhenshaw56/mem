'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var mimicFn = require('mimic-fn');
var isPromise = require('p-is-promise');

var cacheStore = new WeakMap();

var defaultCacheKey = function defaultCacheKey(x) {
	if (arguments.length === 1 && (x === null || x === undefined || typeof x !== 'function' && (typeof x === 'undefined' ? 'undefined' : _typeof(x)) !== 'object')) {
		return x;
	}

	return JSON.stringify(arguments);
};

module.exports = function (fn, opts) {
	opts = Object.assign({
		cacheKey: defaultCacheKey,
		cache: new Map(),
		cachePromiseRejection: false
	}, opts);

	var memoized = function memoized() {
		var cache = cacheStore.get(memoized);
		var key = opts.cacheKey.apply(null, arguments);

		if (cache.has(key)) {
			var c = cache.get(key);

			if (typeof opts.maxAge !== 'number' || Date.now() < c.maxAge) {
				return c.data;
			}
		}

		var ret = fn.apply(this, arguments);

		var setData = function setData(key, data) {
			cache.set(key, {
				data: data,
				maxAge: Date.now() + (opts.maxAge || 0)
			});
		};

		setData(key, ret);

		if (isPromise(ret) && opts.cachePromiseRejection === false) {
			// Remove rejected promises from cache unless `cachePromiseRejection` is set to `true`
			ret.catch(function () {
				return cache.delete(key);
			});
		}

		return ret;
	};

	mimicFn(memoized, fn);

	cacheStore.set(memoized, opts.cache);

	return memoized;
};

module.exports.clear = function (fn) {
	var cache = cacheStore.get(fn);

	if (cache && typeof cache.clear === 'function') {
		cache.clear();
	}
};
