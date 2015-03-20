'use strict';

(function() {
	var Initiable, Body, Mortal, Vehicle, Gun, Tank, Projectile, Missile, Explosion;

	var gravity = Vector(0, 0.0001);

	Initiable = function() {
		var Initiable = function Initiable(options) {
			this.init(options);
		};

		Initiable.prototype.init = function() {};

		return Initiable;
	}();

	Body = function() {
		var Body = function Body() {},
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

				// Drawings
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
				extendWith(this, defaults);
				extendWith(this, options, defaults);

				this.pos = Vector.from(this.pos);
				this.velocity = Vector.from(this.velocity);
				this.acceleration = Vector.from(this.acceleration);

				this.posNext = this.pos.clone();
			},
			update: function(dt, t, velocityOnly) {


				var unfriction = 1-this.friction, 
					k = (1-unfriction)/unfriction;

				if (!velocityOnly) {
					this.acceleration.subtract(this.velocity.unit().multiply(Math.min(this.velocity.length, this.velocity.squared * this.friction * this.massInv * this.radius * 0.00001)));
					this.acceleration.add(gravity);
				}

				// console.log(this.acceleration);

				this.velocity.add(this.acceleration);

				if (velocityOnly) {
					this.acceleration.zero();
					return;
				}

				this.pos.add(this.velocity.times(dt));
				// this.posNext = this.pos.clone();
				// this.posNext.add((this.velocity.plus(this.acceleration)).multiply(unfriction));

				this.acceleration.zero();


				var e = this.restitution;
				if (!(0 <= e && e <= 1))
					e = 1;

				if (!this.inFieldX(this.pos.x, this.radius)) {
					this.acceleration.x += -(1+e)*this.velocity.x;
				}
				if (!this.inFieldY(this.pos.y, this.radius)) {
					this.acceleration.y += -(1+e)*this.velocity.y;
				}
				this.limitField(this.pos, this.radius);
			},
			applyForce: function(f) {
				this.acceleration.add(f.times(this.massInv));
			},
			detectImpact: function(that, k) {
				var posA = this.pos, posB = that.pos;
				// if (k > 0) {
				// 	posA = posA.lerp(this.posNext, k);
				// 	posB = posB.lerp(that.posNext, k);
				// }
				var posAB = posB.minus(posA), dSq = posAB.squared, collideDSq = Math.pow(this.radius+that.radius, 2);
				if (dSq < collideDSq) {
					this.applyImpact(that, posAB.unit());

					// if (this.explode)
					// 	this.explode(this.target === that);
					// if (that.explode)
					// 	that.explode(that.target === this);

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

				var pACmcs = (vA.minus(vB)).over(mAInv+mBInv); // Satisfies pACmcs + pBCmcs === 0

				// var kInitial = 1/2*(1/mAInv*vA.squared+1/mBInv*vB.squared);

				var pANormal = normalAB.dot(pACmcs);
				if (pANormal <= 0)
					return;

				var impulse = normalAB.times(pANormal*(1+e));
				
				this.acceleration.add(impulse.times(-mAInv));
				if (that.acceleration)
					that.acceleration.add(impulse.times(mBInv));

				Body.prototype.update.call(this, 1, NaN, true);
				Body.prototype.update.call(that, 1, NaN, true);

				this.positionalCorrection(that, normalAB, this.radius+that.radius-(that.pos.minus(this.pos)).length);

				// var kFinal = 1/2*(1/mAInv*vA.squared+1/mBInv*vB.squared);
				// console.log(kFinal/kInitial);
			},
			positionalCorrection: function(that, normalAB, penetration) {
				var percent = 0.02;//0.2;//0.2 // usually 20% to 80%
				var slop = 0.01; // usually 0.01 to 0.1
				var correction = normalAB.times(percent*Math.pow(Math.max(penetration-slop, 0), 2)/(this.massInv + that.massInv));
				this.acceleration.add(correction.times(-this.massInv));
				that.acceleration.add(correction.times(that.massInv));
			},
			clear: function(ctx) {
				var radius = Math.ceil(this.radius + 1);
				ctx.clearRect(Math.floor(this.pos.x-radius), Math.floor(this.pos.y-radius), radius*2, radius*2);
				// ctx.strokeRect(this.pos.x-radius+1, this.pos.y-radius+1, radius*2-2, radius*2-2);
				
			},
			draw: function(ctx) {
				ctx.save();
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x, this.pos.y, this.radius-this.lineWidth/2, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			},
			remove: function() {},
			inFieldX: function(x, radius) {
				return true;
			},
			inFieldY: function(y, radius) {
				return true;
			},
			limitField: function(pos, radius) {}
		};

		return Body = inherit(Body, Initiable);
	}();

	Mortal = function() {
		var Mortal = function Mortal() {},
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
				if (!this.alive) {
					this.remove();
				}

				Mortal.super.prototype.update.call(this, dt, t);
			},
			kill: function() {
				this.alive = false;
			}
		};

		return Mortal = inherit(Mortal, Body);
	}();

	Vehicle = function() {
		var Vehicle = function Vehicle() {},
			defaults = {
				friction: 0.01,//0.03,//0.01,//1-0.97,
				restitution: 0.56,

				// mass: 400,

				heading: null
			};

		Vehicle.prototype = {
			init: function(options) {
				Vehicle.super.prototype.init.call(this, options);

				extendWith(this, defaults);

				this.heading = Vector.random();

				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				Vehicle.super.prototype.update.call(this, dt, t);

				if (!this.alive || !this.autoSpin) {
					// this.acceleration = Vector(0,0);
					return;
				}

				this.heading.length = 1;

				this.heading.angle += 0.4;//0.05;//*dt;
				this.acceleration.add(this.heading.times(2));

				
			}
		};

		return Vehicle = inherit(Vehicle, Mortal);
	}();

	Gun = function() {
		var Gun = function Gun() {},
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
				radius: 5,

				bodyMassInv: 1/25
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
				ctx.save();
				ctx.lineWidth = this.lineWidth;
				ctx.beginPath();
				ctx.arc(this.pos.x+this.heading.x/this.headingFix, this.pos.y+this.heading.y/this.headingFix, this.radius-this.lineWidth/2, 0, Math.PI*2, false);
				ctx.stroke();
				ctx.fill();
				ctx.restore();
			},
			clear: function(ctx) {
				var radius = this.radius + 1;
				// ctx.clearRect(this.pos.x+this.heading.x/this.headingFix-radius, this.pos.y+this.heading.y/this.headingFix-radius, radius*2, radius*2);
			},
			aim: function(dt, t) {
				this.heading = this.target.pos.minus(this.pos).unit().times(10/this.velocityFactor*this.headingFix).minus(this.velocity.over(this.velocityFactor));
				this.heading.angle += dt*(this.flutter*(Math.random()-Math.random()))/180*Math.PI;
			},
			fire: function() {
				if (this.heat < 0.1) {
					var shell = new Projectile({
						target: this.target,
						pos: this.pos.plus(this.heading),
						velocity: this.heading.multiply(this.velocityFactor).add(this.velocity),
						mass: 10,//0.1
					});
					this.shell(shell);
					// this.heat += 30;
					this.heat += this.heatfactor * shell.velocity.squared;
					// Vector.add(this.velocity, shell.velocity.times(-0.01));
					var impulseDM = (shell.velocity.minus(this.velocity)).times(shell.mass*this.bodyMassInv);
					this.acceleration.add(impulseDM.times(-1));

					shell.update(1, NaN);
				}
			},
			shell: function(shell) {}
		};

		return Gun = inherit(Gun, Initiable);
	}();

	Tank = function() {
		var Tank = function Tank() {},
			defaults = {
				gun: null,
				lineWidth: 4,
				toPos: null,

				special: false
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
				gun.acceleration = this.acceleration;
				gun.target = this.target;

				gun.bodyMassInv = this.massInv;

				gun.update(dt, t);

				if (this.autoFire)
					gun.fire();

				// if (!this.alive)
				// 	return;

				if (this.toPos)
					this.acceleration.add(this.velocity.lerp(this.toPos.minus(this.pos).multiply(0.02), 0.1).subtract(this.velocity));
			},
			clear: function(ctx) {
				Tank.super.prototype.clear.call(this, ctx);

				this.gun.clear(ctx);
			},
			draw: function(ctx) {
				// if (this.special) {
				// 	ctx.save();
				// 	// ctx.strokeStyle = "rgba(0,0,0,1)";
				// }
				Tank.super.prototype.draw.call(this, ctx);
				// if (this.special)
				// 	ctx.restore();

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

				restitution: 0.56,//0.14

				// friction: 1-0.9999999
			};

		Projectile.prototype = {
			init: function(options) {
				Projectile.super.prototype.init.call(this, options);

				extendWith(this, defaults);
				extendWith(this, options, defaults);
			},
			update: function(dt, t) {
				Projectile.super.prototype.update.call(this, dt, t);

				var target = this.target;
				if (target) {
					this.detectImpact(target);
				}

				if (this.velocity.squared < 0.01)
					this.explode();
				
				// for (var i = 0, n = 400; i < n; ++i) {
				if (!this.inFieldX(this.pos.x, this.radius*2)) {
					this.explode();
				}
				if (!this.inFieldY(this.pos.y, this.radius*2)) {
					this.explode();
				}

				if (this.exploding) {
					this.kill();

					this.shell(new Explosion({
						velocity: this.velocity.clone(),
						pos: this.pos.clone(),
						red: this.red
					}));
				}
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
					if (body === this.target) {
						this.explode(body === this.target);
						if (body.explode)
							body.explode();
						else if (body.kill)
							body.kill();
					}
					// else {
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

				this.exploding = true;
				this.red = red;
				
			},
			shell: function(shell) {}
		};

		return Projectile = inherit(Projectile, Mortal);
	}();

	Missile = function() {
		var Missile = function Missile() {};

		return Missile = inherit(Missile, Projectile);
	}();

	Explosion = function() {
		var Explosion = function Explosion() {},
			defaults = {
				friction: 0.9,//1-0.1,
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
				this.friction = 0.05;//(1-Math.max(0.5, 0.3+0.9*(1-factor)/1.5))/10;

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
			clear: function(ctx) {
				var radius = Math.ceil(this.radius + this.lineWidth/2 + 1);
				ctx.clearRect(Math.floor(this.pos.x-radius), Math.floor(this.pos.y-radius), radius*2, radius*2);
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
		Mortal: Mortal,
		Gun: Gun,
		Tank: Tank,
		Projectile: Projectile,
		Explosion: Explosion
	});
}.call(this));
