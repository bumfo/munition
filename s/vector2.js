'use strict';

(function() {
	// mutable version
	var Vector = function() {
		var Vector = function(x, y) {
			this.x = x;
			this.y = y;
		};

		Vector.prototype = {
			__proto__: null,
			constructor: Vector,

			clone: function() {
				return new Vector(this.x, this.y);
			},
			unit: function() {
				return this.clone().normalize();
			},
			copy: function(v) {
				this.x = v.x;
				this.y = v.y;

				return this;
			},

			equals: function(v) {
				return this.x === v.x && this.y === v.y;
			},
			negative: function() {
				this.x = -this.x;
				this.y = -this.y;

				return this;
			},
			add: function(v) {
				this.x += v.x;
				this.y += v.y;

				return this;
			},
			subtract: function(v) {
				this.x -= v.x;
				this.y -= v.y;

				return this;
			},
			multiply: function(v) {
				this.x *= v.x;
				this.y *= v.y;

				return this;
			},
			divide: function(v) {
				this.x /= v.x;
				this.y /= v.y;

				return this;
			},
			add1: function(x) {
				this.x += x;
				this.y += x;

				return this;
			},
			subtract1: function(x) {
				this.x -= x;
				this.y -= x;

				return this;
			},
			multiply1: function(x) {
				this.x *= x;
				this.y *= x;

				return this;
			},
			divide1: function(x) {
				this.x /= x;
				this.y /= x;

				return this;
			},
			normalize: function() {
				var x = this.x, y = this.y, length = Math.sqrt(x*x+y*y);
				this.x = x/length;
				this.y = y/length;

				return this;
			},
			mix: function(v, k) {
				this.x = (1-k)*this.x+k*v.x;
				this.y = (1-k)*this.y+k*v.y;
			},
			mixX: function(v, k) {
				this.x = (1-k)*this.x+k*v.x;
			},
			mixY: function(v, k) {
				this.y = (1-k)*this.y+k*v.y;
			},

			dot: function(v) {
				return this.x*v.x + this.y*v.y;
			},
			cross: function(v) {
				return this.x*v.y - this.y*v.x;
			},
			angleBetween: function(v) {
				var x = this.x, y = this.y, w = v.y, v = v.x;
				return Math.acos((x*v+y*w) / (Math.sqrt(x*x+y*y)*Math.sqrt(v*v+w*w)));
			},
			angleTo: function(v) {
				return this.angleBetween(v) * (this.cross(v)>=0?1:-1);
			},
			angleFrom: function(v) {
				return -this.angleTo(v);
			},

			distanceTo: function(v) {
				var a = v.x-this.x, b = v.y-this.y;
				return Math.sqrt(a*a+b*b);
			},

			get length() {
				var x = this.x, y = this.y;
				return Math.sqrt(x*x+y*y);
			},
			set length(value) {
				var fraction = value/this.length;
				this.x *= fraction;
				this.y *= fraction;
			},
			get square() {
				var x = this.x, y = this.y;
				return x*x+y*y;
			},
			get angle() {
				return Math.atan2(this.y, this.x); 
			},
			set angle(theta) {
				var r = this.length;
				this.x = r*Math.cos(theta);
				this.y = r*Math.sin(theta);
			},
			get horizontalAngle() {
				return this.angle;
			},
			set horizontalAngle(theta) {
				this.angle = theta;
			},
			get verticalAngle() {
				return Math.atan2(this.x, this.y);
			},
			set verticalAngle(theta) {
				var r = this.length;
				this.x = r*Math.sin(theta);
				this.y = r*Math.cos(theta);
			},
			get min() {
				return Math.min(this.x, this.y);
			},
			get max() {
				return Math.max(this.x, this.y);
			}
		};

		return Vector;
	}();

	Vector.from = function(v, w) {
		if (typeof v === 'number') {
			return new Vector(v, w);
		} else if (v && typeof v === 'object') {
			if (Array.isArray(v))
				return new Vector(v[0], v[1]);
			else
				return new Vector(v.x, v.y);
		} else {
			return new Vector(0, 0);
		}
	};

	this.Vector = Vector;
}.call(this));
