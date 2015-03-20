'use strict';

(function() {
	var Vector;

	function square(x) {
		return x*x;
	}

	Vector = function() {
		var Vector = function(x, y) {
			this.x = 1*x;
			this.y = 1*y;
		};

		Vector.prototype = {
			__proto__: null,
			constructor: Vector,

			clone: function() {
				return new Vector(this.x, this.y);
			},
			negative: function() {
				return new Vector(-this.x, -this.y);
			},
			negativeX: function() {
				return new Vector(-this.x, this.y);
			},
			negativeY: function() {
				return new Vector(this.x, -this.y);
			},
			plus: function(v) {
				return new Vector(this.x+v.x, this.y+v.y);
			},
			minus: function(v) {
				return new Vector(this.x-v.x, this.y-v.y);
			},
			times: function(n) {
				return new Vector(this.x*n, this.y*n);
			},
			over: function(n) {
				return new Vector(this.x/n, this.y/n);
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
			multiply: function(n) {
				this.x *= n;
				this.y *= n;

				return this;
			},
			divide: function(n) {
				this.x /= n;
				this.y /= n;

				return this;
			},
			unit: function() {
				return this.over(this.length);
			},

			equals: function(v, w) {
				if (typeof v !== 'number') {
					w = v.y; v = v.x;
				} else if (typeof w !== 'number')
					w = v;
				return this.x === v && this.y === w;
			},
			dot: function(v, w) {
				if (typeof v !== 'number') {
					w = v.y; v = v.x;
				} else if (typeof w !== 'number')
					w = v;
				return this.x*v + this.y*w;
			},
			cross: function(v, w) {
				if (typeof v !== 'number') {
					w = v.y; v = v.x;
				} else if (typeof w !== 'number')
					w = v;
				return this.x*w - this.y*v;
			},
			angleBetween: function(v, w) {
				if (typeof v !== 'number') {
					w = v.y; v = v.x;
				} else if (typeof w !== 'number')
					w = v;
				return Math.acos(this.dot(v, w) / (this.length*Math.sqrt(v*v+w*w)));
			},
			angleTo: function(v) {
				return this.angleBetween(v) * (this.cross(v)>=0?1:-1);
			},
			angleFrom: function(v) {
				return -this.angleTo(v);
			},
			distanceTo: function(v) {
				return this.minus(v).length;
			},
			lerp: function(b, k) {
				return new Vector((1-k)*this.x+k*b.x, (1-k)*this.y+k*b.y);
			},
			mix: function(v, k) {
				this.x = (1-k)*this.x+k*v.x;
				this.y = (1-k)*this.y+k*v.y;

				return this;
			},
			
			toString: function() {
				return 'x: ' + this.x + ', y: ' + this.y;
			},

			get length() {
				return Math.sqrt(this.dot(this));
			},
			set length(value) {
				var fraction = value/this.length;
				this.x *= fraction;
				this.y *= fraction;
			},
			get squared() {
				return this.dot(this);
			},
			get angle() {
				return Math.atan2(this.y, this.x); 
			},
			set angle(theta) {
				var length = this.length;
				this.x = length*Math.cos(theta);
				this.y = length*Math.sin(theta);
			},
			get horizontalAngle() {
				return this.angle;
			},
			get verticalAngle() {
				return Math.atan2(this.x, this.y);
			},
			get min() {
				return Math.min(this.x, this.y);
			},
			get max() {
				return Math.max(this.x, this.y);
			}
		};

		function vector(x, y) {
			return new Vector(x, y);
		}

		extend(vector, {
			from: function(o) {
				return !o ? new Vector(0, 0) : o.length === 2 ? new Vector(o[0], o[1]) : new Vector(o.x, o.y);
			},
			fromTheta: function(theta) {
				return new Vector(Math.cos(theta), Math.sin(theta));
			},
			randomUnit: function() {
				return vector.fromTheta(Math.random() * Math.PI * 2);
			},
			random: function() {
				return vector.randomUnit().times(Math.random());
			},
			min: function(a, b) {
				return new Vector(Math.min(a.x, b.x), Math.min(a.y, b.y))
			},
			max: function(a, b) {
				return new Vector(Math.max(a.x, b.x), Math.max(a.y, b.y))
			},
			mix: function(a, b, k) {
				// return new Vector((1-k)*a.x+k*b.x, (1-k)*a.y+k*b.y);
				a.x = (1-k)*a.x+k*b.x;
				a.y = (1-k)*a.y+k*b.y;
			},
			lengthOf: function(a) {
				return Math.sqrt(a.x*a.x+a.y*a.y);
			},
			angleBetween: function(a, b) {
				// return Math.abs(-Math.PI + (Math.PI + Math.abs(Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x))) % (Math.PI * 2));
				var x = a.x, y = a.y, v = b.x, w = b.y;
				return Math.acos((x * v + y * w) / (Math.sqrt(x * x + y * y) * Math.sqrt(v * v + w * w)));
			},
			distance: function(a, b) {
				return Math.sqrt(square(b.x-a.x)+square(b.y-a.y));
			},
			distanceSq: function(a, b) {
				return square(b.x-a.x)+square(b.y-a.y);
			},
			negative: function(a, b) {
				if (b === void 0) { b = a; }
				a.x = -b.x; a.y = -b.y;
				return a;
			},
			normalize: function(a, b) {
				if (b === void 0) { b = a; }
				var length = b.length; a.x = b.x/length; a.y = b.y/length;
				return a;
			},
			add: function(a, b, c) {
				if (c === void 0) { c = b; b = a; } if (typeof b === 'number') b = new Vector(b, b); if (typeof c === 'number') c = new Vector(c, c);
				a.x = b.x+c.x; a.y = b.y+c.y;
				return a;
			},
			subtract: function(a, b, c) {
				if (c === void 0) { c = b; b = a; } if (typeof b === 'number') b = new Vector(b, b); if (typeof c === 'number') c = new Vector(c, c);
				a.x = b.x-c.x; a.y = b.y-c.y;
				return a;
			},
			multiply: function(a, b, c) {
				if (c === void 0) { c = b; b = a; } if (typeof b === 'number') b = new Vector(b, b); if (typeof c === 'number') c = new Vector(c, c);
				a.x = b.x*c.x; a.y = b.y*c.y;
				return a;
			},
			divide: function(a, b, c) {
				if (c === void 0) { c = b; b = a; } if (typeof b === 'number') b = new Vector(b, b); if (typeof c === 'number') c = new Vector(c, c);
				a.x = b.x/c.x; a.y = b.y/c.y;
				return a;
			}
		});

		return vector;
	}();

	this.Vector = Vector;
}.call(this));
