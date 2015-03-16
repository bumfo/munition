'use strict';

(function() {
	var Initiable, Body, Mortal, Vehicle, Gun, Tank, Projectile, Missile, Explosion;

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
				// Dynamics
				pos: null,
				velocity: null,
				acceleration: null,

				// Mechanics
				radius: 20,
				mass: 400,
				restitution: 1,
				friction: 1-0.99,

				lineWidth: 4
			};

		Body.prototype = {
			get mass() {
				return this._mass
			},
			set mass(val) {
				this._mass = val;
				this.massInv = 1/val;
			},
			init: function(options) {
				// Object.defineProperty(this, "mass", {
				// 	get: function() { return this._mass; },
				// 	set: function(val) { this._mass = val; this.massInv = 1/val; }
				// });

				extendWith(this, defaults);
				extendWith(this, options, defaults);

				this.pos = Vector.from(this.pos);
				this.velocity = Vector.from(this.velocity);
				this.acceleration = Vector.from(this.acceleration);

				this.posNext = this.pos.clone();
				
			},
			update: function(dt, t) {
				// dt = 1;
				var unfriction = 1-this.friction, 
					k = (1-unfriction)/unfriction;
				// var lnf = Math.log(unfriction);
				var vN = this.acceleration.divide(k), 
					unfriction_pow_dt = Math.pow(unfriction, dt);
				// var v0 = this.velocity.clone(),
					// v0_subtract_vN_divide_lnf = Vector.divide(v0.subtract(vN), lnf);

				// function nextPos(pos, dt, unfriction_pow_dt) {
				// 	var deltaPos = Vector.subtract(vN.multiply(dt), v0_subtract_vN_divide_lnf.multiply(1-unfriction_pow_dt));
				// 	Vector.add(pos, deltaPos);
				// }
				// // Vector.add(Vector.multiply(Vector.subtract(this.velocity, vN), unfriction_pow_dt), vN);
				Vector.mix(this.velocity, vN, 1-unfriction_pow_dt);
				// this.posNext = this.pos.clone();
				// nextPos(this.pos, dt, unfriction_pow_dt);
				// nextPos(this.posNext, dt*2, Math.pow(unfriction_pow_dt,2));

				// Vector.multiply(Vector.add(this.velocity, this.acceleration), unfriction);
				Vector.add(this.pos, this.velocity.multiply(dt));

				this.posNext = this.pos.clone();

				Vector.add(this.posNext, Vector.multiply(this.velocity.add(this.acceleration), unfriction));

				if (!this.inFieldX(this.pos.x, this.radius)) {
					this.velocity.x = -this.velocity.x;
				}
				if (!this.inFieldY(this.pos.y, this.radius)) {
					this.velocity.y = -this.velocity.y;
				}
				this.limitField(this.pos, this.radius);
			},
			clear: function(ctx) {
				var radius = this.radius + 1;
				ctx.clearRect(this.pos.x-radius, this.pos.y-radius, radius*2, radius*2);
			},
			draw: function(ctx) {
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.radius-this.lineWidth/2, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
			},
			remove: function() {},
			detectImpact: function(that, k) {
				var posA = this.pos, posB = that.pos;
				if (k > 0) {
					posA = posA.lerp(this.posNext, k);
					posB = posB.lerp(that.posNext, k);
				}
				var posAB = posB.subtract(posA), dSq = posAB.square, collideDSq = Math.pow(this.radius+that.radius, 2);
				if (dSq < collideDSq) {
					this.applyImpact(that, posAB.unit());

					return true;
				}
			},
			applyImpact: function(that, normalAB) {
				var vA = this.velocity, vB = that.velocity,
					mAInv = this.massInv, mBInv = that.massInv,
					e = Math.min(this.restitution, that.restitution);
				if (!vB) vB = Vector(0,0);
				if (!mBInv) mBInv = 0;
				if (!(0 <= e && e <= 1)) e = 1; // e: [0,1]

				var pACmcs = (vA.subtract(vB)).divide(mAInv+mBInv); // Satisfies pACmcs + pBCmcs === 0

				// var kInitial = 1/2*(mA*vA.square+mB*vB.square);

				var pANormal = normalAB.dot(pACmcs);
				if (pANormal <= 0)
					return;

				var impulse = normalAB.multiply(pANormal*(1+e));
				
				Vector.add(vA, impulse.multiply(-mAInv));
				Vector.add(vB, impulse.multiply(mBInv));

				// var kFinal = 1/2*(mA*vA.square+mB*vB.square);
				// console.log(kFinal/kInitial);
			},
			inFieldX: function(x, radius) {
				return true;
			},
			inFieldY: function(y, radius) {
				return true;
			},
			limitField: function(pos, radius) {

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
				friction: 1-0.97,
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
				radius: 5
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
				ctx.arc(this.pos.x+this.heading.x/this.headingFix, this.pos.y+this.heading.y/this.headingFix, this.radius-this.lineWidth/2, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
				// ctx.restore();
			},
			clear: function(ctx) {
				var radius = this.radius + 1;
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
						velocity: Vector.add(Vector.multiply(this.heading, this.velocityFactor), this.velocity),
						mass: 0.1
					});
					this.shell(shell);
					// this.heat += 30;
					this.heat += this.heatfactor * shell.velocity.square;
					// Vector.add(this.velocity, shell.velocity.multiply(-0.01));
					var impulseDM = (shell.velocity.subtract(this.velocity)).multiply(shell.mass/25);
					Vector.add(this.velocity, impulseDM.multiply(-1));
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
				lineWidth: 4,
				toPos: null
			};

		Tank.prototype = {
			init: function(options) {
				Tank.super.prototype.init.call(this, options);

				extendWith(this, defaults);
				extendWith(this, options, defaults);

				this.gun = new Gun(extend({}, this.gun||{}, {pos:this.pos}));
			},
			update: function(dt, t) {
				Tank.super.prototype.update.call(this, dt, t);

				var gun = this.gun;

				gun.pos = this.pos;
				gun.velocity = this.velocity;
				gun.target = this.target;

				gun.update(dt, t);

				gun.fire();

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
			},
			kill: function() { // immortal
				return false;
			}
		};

		return Tank = inherit(Tank, Vehicle);
	}();

	Projectile = function() {
		var Projectile = function() {},
			defaults = {
				target: null,
				lineWidth: 1.5,//1,
				radius: 5,
				mass: 25,

				// subdivision: 2

				// friction: 1-0.9999999
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
					this.detectImpact(target);
				}

				if (this.velocity.square < 0.01)
					this.explode();
				
				// for (var i = 0, n = 400; i < n; ++i) {
				if (!this.inFieldX(this.pos.x, this.radius*2)) {
					this.explode();
				}
				if (!this.inFieldY(this.pos.y, this.radius*2)) {
					this.explode();
				}

				Projectile.super.prototype.update.call(this, dt, t);
				// }
			},
			detectImpact: function(body) {
				if (!this.alive || !body.alive)
					return;

				var detectImpact = Projectile.super.prototype.detectImpact;
				var isImpact = false;

				// for (var i = 0, n = 1; i < n; ++i) {
				// 	if (isImpact)
				// 		break;
				isImpact = detectImpact.call(this, body, 0);//i/n);
				// }

				if (isImpact) {
					// if (body === this.target) {
					this.explode(body === this.target);
					if (body.explode)
						body.explode();
					else if (body.kill)
						body.kill();
					// } else {
					// 	// var rn = Math.random();
					// 	// if (rn<0.01)
					// 	// 	console.log(this.velocity+"", body.velocity+"");
					// 	this.explode();
					// 	if (body.explode)
					// 		body.explode();							
					// }
				}

				return isImpact;
			},
			draw: function(ctx) {
				ctx.save();
				ctx.globalAlpha = Math.max(0, Math.min(this.velocity.length/10, 1));
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				var rabbet = true ? 0 : 15/180 * Math.PI;
				var angle = this.velocity.angle;
				ctx.arc(this.pos.x, this.pos.y, this.radius-this.lineWidth/2, angle+rabbet, angle+Math.PI*2-rabbet, false);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			},
			// clear: function() {},
			explode: function(red) {
				if (!this.alive)
					return;

				this.kill();

				this.shell(new Explosion({
					velocity: this.velocity.clone(),
					pos: this.pos.clone(),
					red: red
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
				friction: 1-0.1,
				lifetime: 30,
				timespan: 0,

				radius: 0,
				lineWidth: 5,
				mass: 0.0001,

				red: false
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

				this.radius = 60*factor;
				this.lineWidth = Math.max(0.5, 5*(1-factor));
				this.friction = 1-Math.max(0.5, 0.3+0.9*(1-factor)/1.5);

				if (this.timespan < this.lifetime)
					this.timespan+=dt;
				else
					this.kill();
			},
			draw: function(ctx) {
				ctx.save();
				if (this.red) {
					ctx.strokeStyle = 'rgba(255,0,0,0.8)';
					ctx.fillStyle = 'rgba(255,200,200,0.25)';
				}
				ctx.globalAlpha = Math.max(0, Math.min(1-Math.sqrt(this.timespan/this.lifetime), 1));
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI*2, false);
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

	extend(this, {
		Body: Body,
		Gun: Gun,
		Tank: Tank,
		Projectile: Projectile,
		Explosion: Explosion
	});
}.call(this));
