'use strict';

(function() {
	function require2() { return this; } // pseudo
 
	function extend(o) { // o, a...
		var a;

		for (var j = 1, m = arguments.length; j < m; ++j) {
			a = arguments[j];

			var keys = Object.keys(a);

			for (var i = 0, n = keys.length, key; i < n; ++i) {
				key = keys[i];
				o[key] = a[key];
			}
		}

		return o;
	}

	function extendDes(o, a, exclusions) {
		var keys = Object.getOwnPropertyNames(a), exclusions = exclusions || o;
		var hasOwnProperty = Object.hasOwnProperty;

		for (var i = 0, n = keys.length, key; i < n; ++i) {
			key = keys[i];
			if (!hasOwnProperty.call(exclusions, key))
				Object.defineProperty(o, key, Object.getOwnPropertyDescriptor(a, key));
		}
	}

	function extendWith(o, a, keyObj) {
		if (a === void 0)
			return;
		
		var keys = keyObj?Object.keys(keyObj):Object.keys(a);

		for (var i = 0, n = keys.length; i < n; ++i) {
			var key = keys[i];

			if (a[key] !== void 0)
				o[key] = a[key];
		}
	}

	function descriptor(o) {
		var keys = Object.keys(o), b = {};

		for (var i = 0, n = keys.length, key; i < n; ++i) {
			key = keys[i];

			b[key] = {value: o[key], writable: true};
		}

		return b;
	}

	function nameFn(fn, name) {
		// if (typeof name !== 'string')
			return fn;
		return new Function("return function(fn){return function "+(name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)||[""])[0]+"(){return fn.apply(this, arguments)}}")()(fn);
	}

	function inherit(Class, Super, protoOnly) {
		var Klass = nameFn(function() {
			if (!protoOnly)
				Super.apply(this, arguments);
			return Class.apply(this, arguments);
		}, Class.name);

		extendDes(Klass, Class);

		Klass.super = Super;

		Klass.prototype = extend(Object.create(Super.prototype, descriptor({
			constructor: Class
		})));

		extendDes(Klass.prototype, Class.prototype);

		return Klass;
	}

	extend(this, {
		require: require2.bind(this),
		extend: extend,
		extendWith: extendWith,
		descriptor: descriptor,
		nameFn: nameFn,
		inherit: inherit
	});
}.call(this));
