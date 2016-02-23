
/**
 * @name Flame
 * @description jquery plugin to generate flame on a canvas element..
 * Based on http://codepen.io/jackrugile/pen/Jbnpv
 * @copyright (c) 2015 wassname
 * @license: MIT
 */
;(function ( $, window, document, undefined ) {
    var pluginName = "flame";

    var defaults = {
            hueRange: 50,
        };

    var defaultState = {
        parts: [],
        partCount: 200,
        partsFull: false,
        on: true,
        rendering: false,
        globalTick: 0,
        width: null,
        height: null,
    }

    var Part = function(flame){
        this.flame=flame;
        this.ctx=this.flame.ctx;
        this.reset();
    };


    Part.prototype.reset = function(){
      this.startRadius = this.rand(1, 25);
      this.radius = this.startRadius;
      this.width = this.flame.state.width;
      this.height = this.flame.state.height;
      this.x = this.width/2 + (this.rand(0, 6) - 3);
      this.y = 250;
      this.vx = 0;
      this.vy = 0;
      this.hue = this.rand(this.flame.state.globalTick - this.flame.options.hueRange, this.flame.state.globalTick + this.flame.options.hueRange);
      this.saturation = this.rand(50, 100);
      this.lightness = this.rand(20, 70);
      this.startAlpha = this.rand(1, 10) / 100;
      this.alpha = this.startAlpha;
      this.decayRate = 0.1;
      this.startLife = 7;
      this.life = this.startLife;
      this.lineWidth = this.rand(1, 3);
    }

    Part.prototype.update = function(){
      this.vx += (this.rand(0, 200) - 100) / 1500;
      this.vy -= this.life/50;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha = this.startAlpha * (this.life / this.startLife);
      this.radius = this.startRadius * (this.life / this.startLife);
      this.life -= this.decayRate;
      if(
        this.x > this.width + this.radius ||
        this.x < -this.radius ||
        this.y > this.height + this.radius ||
        this.y < -this.radius ||
        this.life <= this.decayRate
      ){
        this.reset();
      }
    };

    Part.prototype.render = function(){
      this.ctx.beginPath();
      this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
      this.ctx.fillStyle = this.ctx.strokeStyle = 'hsla('+this.hue+', '+this.saturation+'%, '+this.lightness+'%, '+this.alpha+')';
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.fill();
      this.ctx.stroke();
    };

    Part.prototype.rand = function(min, max){
            return Math.floor( (Math.random() * (max - min + 1) ) + min);
        };

    var Flame = function(element, options){
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this.init();
    };

    Flame.prototype.init = function (arguments) {
        if(this.element.getContext) {
            this.ctx = this.element.getContext("2d");
        } else {
            return;
        }
        if (this.state) this.stop();
        this.state = $.extend( {parts: [],partsFull: false,globalTick: 0,}, defaultState, this.state);
        // this.state = {
        //     parts: [],
        //     partCount: 200,
        //     partsFull: false,
        //     on: true,
        //     rendering: false,
        //     globalTick: 0,
        //     width: null,
        //     height: null,
        // }
        this.state.width = $(this.element).outerWidth();
        this.state.height = $(this.element).outerWidth();
        this.start();
    }

    /** If needed: $(window).on('resize',this.onResize.bind(this) **/
    Flame.prototype.onResize = function (arguments) {
        this.init();
    }

    Flame.prototype.createParts = function(){
        if(this.state.parts.length > this.state.partCount){
          this.state.partsFull = true;
        } else {
          this.state.parts.push(new Part(this));
        }
    };

    Flame.prototype.updateParts = function(){
      var i = this.state.parts.length;
      while(i--){
        this.state.parts[i].update();
      }
    };

    Flame.prototype.renderParts = function(){
      var i = this.state.parts.length;
      while(i--){
        this.state.parts[i].render();
      }
    };

    Flame.prototype.clear = function (arguments) {
          this.ctx.globalAlpha = 1;
          this.ctx.fillStyle = 'hsla(0, 0%, 0%, .0)';
          this.ctx.clearRect(0,0,this.state.width, this.state.height);
    }

    /** Fades the previous flames into opacity to product a blur **/
    Flame.prototype.fade = function(){
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.fillStyle = 'hsla(0, 0%, 0%, .3)';
      this.ctx.fillRect(0, 0, this.state.width, this.state.height);
      this.ctx.globalCompositeOperation = 'lighter';
    };

    Flame.prototype.draw = function (arguments) {
        this.fade();
        if (this.state.on){
            this.createParts();
        } else if (this.state.parts.length>1){
            this.state.parts.pop();
        }
        this.updateParts();
        this.renderParts();
    }

    Flame.prototype.start = function (arguments) {
        if (!this.state.rendering){
            this.state.rendering=true
            this.animate();
            return this
        } else {return;}
    }

    Flame.prototype.stop = function (arguments) {
        this.state.rendering=false;
        this.clear();
        return this;
    }

    /** Toggle fuel and the flame will burn down or up again **/
    Flame.prototype.toggleFuel = function (state) {
        if (state===undefined)
            this.state.on=!this.state.on;
        else
            this.state.on=state;
        return this.state.on;
    }

    Flame.prototype.animate = function(){
        window.requestAnimFrame(this.animate.bind(this),this.element);
        this.state.globalTick++;
        if (this.state.rendering) this.draw();
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                new Flame( this, options ));
            }
        });
    }

    // shim for requestAnimFrame
    window.requestAnimFrame = (function(){
        return window.requestAnimationFrame       ||
               window.webkitRequestAnimationFrame ||
               window.mozRequestAnimationFrame    ||
               window.oRequestAnimationFrame      ||
               window.msRequestAnimationFrame     ||
               function(/* function */ callback, /* DOMElement */ element){
                   window.setTimeout(callback, 1000 / 60);
               };
    })();


})( jQuery, window, document );
