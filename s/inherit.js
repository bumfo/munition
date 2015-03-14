'use strict';

(function() {
	function nameFn(fn, name) {
		if (typeof name !== 'string')
			return fn;
		return new Function("return function(fn){return function "+(name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)||[""])[0]+"(){return fn.apply(this, arguments)}}")()(fn);
	}

	function inherit(Class, Super, protoOnly) {
		var Klass = nameFn(function() {
			if (!protoOnly)
				Super.apply(this, arguments);
			return Class.apply(this, arguments);
		}, Class.name);

		Klass.super = Super;

		Klass.prototype = extend(Object.create(Super.prototype, descriptor({
			constructor: Class
		})), Class.prototype);

		return Klass;
	}

}.call(this));
