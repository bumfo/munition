var Vector = require('./s/vector2.js').Vector;
var Physis = require('./s/physis.js');

var body = new Physis.Body({velocity: [1,1], drag: 0.1});

console.log(body.pos);
body.update();
console.log(body.pos);
body.update();
console.log(body.pos);
body.update();
console.log(body.pos);
body.update();
