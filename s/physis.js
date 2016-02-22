'use strict';

(function() {
	var module2 = require('./module2.js'),
		inherit = module2.inherit,
		extendWith = module2.extendWith;
	var Vector = require('./vector2.js').Vector;

	var Initiable, Body;

	Initiable = function() {
		var Initiable = function(options) {
			this.init(options);
		};

		Initiable.prototype.init = function() {};

		return Initiable;
	}();

	Body = function() {
		var Body = function() {},
			defaults = {
				mass: 1,

				pos: null,
				velocity: null,

				drag: 0, // Air resistance
				muSMax: 0, // Maximum static friction
				muK: 0, // Coefficient of kinetic friction
				vFlow: new Vector(0,0),

				radius: 0
			};

		Body.prototype = {
			init: function(options) {
				extendWith(this, defaults);
				extendWith(this, options, defaults);

				this.pos = Vector.from(this.pos);
				this.velocity = Vector.from(this.velocity);
			},
			update: function() {
				this.applyDrag(this.vFlow);
				this.pos.add(this.velocity);
			},
			applyDrag: function(vFlow) {
				var u = vFlow.clone().subtract(this.velocity);
				this.applyForce(u.unit().multiply(u.square*this.drag));
			},
			applyForce: function(force) {
				var dv = force.clone().divide(this.mass);
				this.velocity.add(dv); // dt = 1
			}

		};

		return Body = inherit(Body, Initiable);
	}();

	this.Body = Body;
}.call(this));
 
