'use strict';

var Body, Mortal, Vehicle, Gun, Tank, Projectile, Missile, Explosion;

(function() {
	var Initiable;

	Initiable = function() {
		var Initiable = function(options) {
			this.init(options);
		};

		Initiable.prototype = {
			init: function() {}
		}

		return Initiable;
	}();

	Body = function() {
		var Body = function() {},
			defaults = {
				friction: 0.99,
				pos: null,
				velocity: null,
				acceleration: null,
				size: 20,
				mass: 400,
				lineWidth: 4
			};

		Body.prototype = {
			init: function(options) {
				extendWith(this, defaults);

				this.pos = Vector(0,0);
				this.velocity = Vector(0,0);
				this.acceleration = Vector(0,0);

				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				// dt = 0.1*dt;
				// dt = 1;
				// Vector.multiply(Vector.add(this.velocity, this.acceleration), this.friction);
				// Vector.add(this.pos, 5*dt);
				var k = (1-this.friction)/this.friction, c = this.acceleration.divide(k), lnf = Math.log(this.friction), deltaPos;
				var v0 = this.velocity.clone();
				Vector.add(Vector.multiply(Vector.subtract(this.velocity, c), Math.pow(this.friction, dt)), c);
				// Vector.add(this.pos, this.velocity);
				deltaPos = Vector.add(Vector.add(Vector.multiply(v0.subtract(c), 1/lnf*Math.pow(this.friction, dt)),c.multiply(dt)),Vector.divide(c.subtract(v0),lnf));
				Vector.add(this.pos, deltaPos);
				// this.pos = this.velocity.subtract(c).multiply(1/lnf*Math.pow(this.friction, t)).add(c.multiply(t)).add(c.subtract(this.velocity).divide(lnf));

				if (!this.inFieldX(this.pos.x, this.size)) {
					this.velocity.x = -this.velocity.x;
				}
				if (!this.inFieldY(this.pos.y, this.size)) {
					this.velocity.y = -this.velocity.y;
				}
				this.limitField(this.pos, this.size);
			},
			clear: function(ctx) {
				var radius = this.size + 1 + this.lineWidth/2;
				ctx.clearRect(this.pos.x-radius, this.pos.y-radius, radius*2, radius*2);
			},
			draw: function(ctx) {
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
			},
			remove: function() {},
			detectImpact: function(body) {
				var p = body.pos.subtract(this.pos), dSq = p.square, collideDSq = Math.pow(this.size+this.lineWidth/2+body.size+body.lineWidth/2, 2);
				if (dSq < collideDSq) {
					this.applyImpact(body, p.unit());

					return true;
				}
			},
			applyImpact: function(body, direction) {
				var thisV = this.velocity, bodyV = body.velocity,
					thisM = this.mass, bodyM = body.mass;
				if (!bodyV) bodyV = Vector(0,0);

				// var centerV = thisV.multiply(thisM).add(bodyV.multiply(bodyM)).divide(thisM+bodyM),
					// thisAbsV = thisV.subtract(centerV);
				var thisAbsV = (thisV.subtract(bodyV)).multiply(bodyM/(thisM+bodyM)); // Relative to CMCS

				var initialK = (1/2*thisM*thisV.square+1/2*bodyM*bodyV.square);

				var dot = direction.dot(thisAbsV);
				if (dot > 0) {
					var impulseDM = direction.multiply(dot);
					var e = 1; // e in [0,1]
					Vector.add(thisV, impulseDM.multiply(-1*(1+e)));
					Vector.add(bodyV, impulseDM.multiply(this.mass/body.mass*(1+e)));
				}

				var finalK = (1/2*thisM*thisV.square+1/2*bodyM*bodyV.square);

				console.log(finalK/initialK);
			},
			inFieldX: function(x, size) {
				return true;
			},
			inFieldY: function(y, size) {
				return true;
			},
			limitField: function(pos, size) {

			}
		};

		return Body = inherit(Body, Initiable);
	}();

	Mortal = function() {
		var Mortal = function() {},
			defaults = {
				alive: true
			};

		Mortal.prototype = {
			init: function(options) {
				Mortal.super.prototype.init.call(this, options);

				extendWith(this, defaults);
				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				Mortal.super.prototype.update.call(this, dt, t);

				if (!this.alive)
					this.remove();
			},
			kill: function() {
				this.alive = false;
				
			}
		};

		return Mortal = inherit(Mortal, Body);
	}();

	Vehicle = function() {
		var Vehicle = function() {},
			defaults = {
				friction: 0.97,
				heading: null
			};

		Vehicle.prototype = {
			init: function(options) {
				Vehicle.super.prototype.init.call(this, options);

				extendWith(this, defaults);

				this.pos = Vector.random().multiply(10).add(200, 300);
				this.heading = Vector.random();

				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				Vehicle.super.prototype.update.call(this, dt, t);

				if (!this.alive) {
					this.acceleration = Vector(0,0);
					return;
				}

				this.heading.angle += 0.05*dt;
				this.acceleration = this.heading.unit().multiply(0.2);
			}
		};

		return Vehicle = inherit(Vehicle, Mortal);
	}();

	Gun = function() {
		var Gun = function() {},
			defaults = {
				pos: null,
				velocity: null,
				heading: null,
				heat: 3,
				heatfactor: 1.158,
				cooldown: 0.96, // frameCount = ln(0.1/heatPerShot)/ln(coolDown)
				velocityFactor: 2,
				headingFix: 1,
				flutter: 0,

				target: null,

				lineWidth: 1,//0.5,
				size: 5
			};

		Gun.prototype = {
			init: function(options) {
				Gun.super.prototype.init.call(this, options);

				extendWith(this, defaults);

				this.pos = Vector(0,0);
				this.velocity = Vector(0,0);
				this.heading = Vector(8,0);

				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				this.heat *= Math.pow(this.cooldown, dt);

				this.aim(dt, t);
			},
			draw: function(ctx) {
				// ctx.save();
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x+this.heading.x/this.headingFix, this.pos.y+this.heading.y/this.headingFix, this.size, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
				// ctx.restore();
			},
			clear: function(ctx) {
				var radius = this.size + 1 + this.lineWidth/2;
				// ctx.clearRect(this.pos.x+this.heading.x/this.headingFix-radius, this.pos.y+this.heading.y/this.headingFix-radius, radius*2, radius*2);
			},
			aim: function(dt, t) {
				this.heading = this.target.pos.subtract(this.pos).unit().multiply(10/this.velocityFactor*this.headingFix).subtract(this.velocity.divide(this.velocityFactor));
				this.heading.angle += dt*(this.flutter*(Math.random()-Math.random()))/180*Math.PI;
			},
			fire: function() {
				if (this.heat < 0.1) {
					var shell = new Projectile({
						target: this.target,
						pos: this.pos.add(this.heading),
						velocity: Vector.add(Vector.multiply(this.heading, this.velocityFactor), this.velocity)
					});
					this.shell(shell);
					// this.heat += 30;
					this.heat += this.heatfactor * shell.velocity.square;
					Vector.add(this.velocity, shell.velocity.multiply(-0.01));
				}
			},
			shell: function(shell) {}
		};

		return Gun = inherit(Gun, Initiable);
	}();

	Tank = function() {
		var Tank = function() {},
			defaults = {
				gun: null,
				lineWidth: 4
			};

		Tank.prototype = {
			init: function(options) {
				Tank.super.prototype.init.call(this, options);

				extendWith(this, defaults);

				this.gun = new Gun({pos:this.pos});

				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				Tank.super.prototype.update.call(this, dt, t);

				this.gun.pos = this.pos;
				this.gun.velocity = this.velocity;
				this.gun.target = this.target;

				this.gun.update(dt, t);

				this.gun.fire();

				// if (!this.alive)
				// 	return;

				if (this.toPos)
					Vector.mix(this.velocity, this.toPos.subtract(this.pos).multiply(0.02), 0.1);
			},
			clear: function(ctx) {
				Tank.super.prototype.clear.call(this, ctx);

				this.gun.clear(ctx);
			},
			draw: function(ctx) {
				Tank.super.prototype.draw.call(this, ctx);

				this.gun.draw(ctx);
			}
		};

		return Tank = inherit(Tank, Vehicle);
	}();

	Projectile = function() {
		var Projectile = function() {},
			defaults = {
				target: null,
				lineWidth: 1.5,//1,
				size: 5,
				mass: 25,
			};

		Projectile.prototype = {
			init: function(options) {
				Projectile.super.prototype.init.call(this, options);

				extendWith(this, defaults);
				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				var target = this.target;
				if (target) {
					if (this.detectImpact(target)) {
						// this.explode();
						// if (target.kill)
						// 	target.kill();
					}
				}

				if (!this.inFieldX(this.pos.x, this.size*2)) {
					this.explode();
				}
				if (!this.inFieldY(this.pos.y, this.size*2)) {
					this.explode();
				}

				if (this.velocity.square < 0.01)
					this.explode();
				
				Projectile.super.prototype.update.call(this, dt, t);
			},
			detectImpact: function(body) {
				var isImpact = Projectile.super.prototype.detectImpact.call(this, body);

				if (isImpact) {
					this.explode();
					if (body.explode)
						body.explode();
					else if (body.kill)
						body.kill();
				}

				return isImpact;
			},
			draw: function(ctx) {
				ctx.save();
				ctx.globalAlpha = Math.max(0, Math.min(this.velocity.length/10, 1));
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			},
			// clear: function() {},
			explode: function() {
				if (!this.alive)
					return;

				this.kill();

				this.shell(new Explosion({
					velocity: this.velocity.clone(),
					pos: this.pos.clone()
				}));
			},
			shell: function(shell) {}
		};

		return Projectile = inherit(Projectile, Mortal);
	}();

	Missile = function() {
		var Missile = function() {};

		return Missile = inherit(Missile, Projectile);
	}();

	Explosion = function() {
		var Explosion = function() {},
			defaults = {
				friction: 0.5,
				lifetime: 30,
				timespan: 0,

				size: 0,
				lineWidth: 5,
				mass: 0.0001
			};

		Explosion.prototype = {
			init: function(options) {
				Explosion.super.prototype.init.call(this, options);

				extendWith(this, defaults);
				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				Explosion.super.prototype.update.call(this, dt, t);

				var factor = Math.sqrt(this.timespan/this.lifetime);

				this.size = 60*factor;
				this.lineWidth = Math.max(0.5, 5*(1-factor));
				this.friction = Math.max(0.5, 0.3+0.9*(1-factor)/1.5);

				if (this.timespan < this.lifetime)
					this.timespan+=dt;
				else
					this.kill();
			},
			draw: function(ctx) {
				ctx.save();
				ctx.globalAlpha = Math.max(0, Math.min(1-Math.sqrt(this.timespan/this.lifetime), 1));
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.size, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			},
			kill: function() {
				this.remove();
			},
			remove: function() {}
		};

		return Explosion = inherit(Explosion, Body);
	}();

	exports.Missile = Missile;
}());
