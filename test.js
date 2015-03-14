var Vector = require('./s/vector.js').Vector;

var body = {
	friction: 0.99,
	pos: Vector(0,0),
	velocity: Vector(5,5),
	acceleration: Vector(0,0)
};

function update(dt) {
	var k = (1-this.friction)/this.friction, c = this.acceleration.divide(k);

	var v0 = this.velocity.clone(), lnf = Math.log(this.friction);
	Vector.add(Vector.multiply(Vector.subtract(this.velocity, c), Math.pow(this.friction, dt)), c);
	// Vector.add(this.pos, this.velocity.multiply(dt));

	var deltaPos = v0.subtract(c).multiply(1/lnf*Math.pow(this.friction, dt)).add(c.multiply(dt)).add(c.subtract(v0).divide(lnf));

	Vector.add(this.pos, deltaPos);

	console.log(this.pos);
}

update.call(body, 1);
update.call(body, 1);

// update.call(body, 2);
