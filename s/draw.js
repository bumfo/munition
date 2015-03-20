'use strict';

(function() {
	var Draw = function(width, height) {
		var canvas = document.querySelector('canvas'), ctx = canvas.getContext('2d');
		var ratio = (window.devicePixelRatio||1)/(ctx.webkitBackingStorePixelRatio||ctx.backingStorePixelRatio||1);

		canvas.width = width*ratio; canvas.height = height*ratio;
		canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
		ctx.scale(ratio, ratio);

		// ctx.globalAlpha = 0.5;
		// ctx.globalCompositeOperation = 'lighten';
		ctx.lineWidth = 1;//0.5;
		ctx.strokeStyle = 'rgba(0,0,0,0.8)';
		ctx.fillStyle = 'rgba(255,255,255,0.25)';
		ctx.font = '48px avenir next';

		this.ctx = ctx;
	};

	extend(Draw.prototype, {
		clearFps: function() {
			this.ctx.clearRect(15, 15, 100, 48 + 15);
		},
		fps: function(fps) {
			var txt = Math.round(fps), x = 15, y = 48+15;
			// this.ctx.strokeText(txt, x, y);
			this.ctx.fillText(txt, x, y);
			
		}
	});

	this.Draw = Draw;
}.call(this));

