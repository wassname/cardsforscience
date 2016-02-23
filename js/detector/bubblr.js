/*
    Bubblr v1.0 - http://mikeyhogarth.wordpress.com/2012/04/15/bubblr-jquery-bubbles-plugin/
    Copyright (c) 2012 Mikey Hogarth
	template based on original jquery lightweight plugin biolerplate: @ajpiano, @addyosmani
    This plugin available for use in all personal or commercial projects under both MIT and GPL licenses.
*/

(function ($, window, document, undefined) {

    var pluginName = "bubblr";

    /** default options **/
    var defaults = {
        numberOfBubbles: 10,
        backgroundColor: "transparent",
        bubbleColor: "White",
        bubbleOpacity: 0.7,
        bubbleMinSize: 1,
        bubbleMaxSize: 2,
        bubbleMaxSpeed: 2,
        bubbleMinSpeed: 1,
        animationSpeed: 10
    };

    /**
     * Create the bubblr
     * @param {dom element} element - dom canvas element
     * @param {object} options - options see Bubblr._defaults for options
     */
    function Bubblr(element, options) {
        this.element = element;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this.state = {
            bubbles: [],
            started: false,
            globalTick: 0,
            genBubbles: false,
        }
        this.init();
        this.start();
    }

    Bubblr.prototype.init = function () {

        if (this.element.getContext) {
            this.ctx = this.element.getContext("2d");
        } else {
            return;
        }

        $canvas = $(this.element);

        this.width = $canvas.width();
        this.height = $canvas.height();

        $canvas.css("background-color", this.options.backgroundColor)

        // initial bubbles
        for (i = 0; i < this.options.numberOfBubbles; i++) {
            this.state.bubbles[i] = this.generateBubble();
        }
        for (i in this.state.bubbles) {
            this.drawBubble(this.state.bubbles[i]);
        }

    };

    /**
     * Recenter on resize,
     * bind this to $(window).on('resize',bubblr.onResize.bind(bubblr);) if needed
     **/
    Bubblr.prototype.onResize = function () {
        this.clear();
        this.width = $(this.element).outerWidth();
        this.height = $(this.element).outerWidth();
    };

    /** Start animation loop if not started **/
    Bubblr.prototype.start = function () {
        if (!this.state.started) {
            this.state.started = true;
            this.animationLoop();
        }
    };

    /** Stop animation loop **/
    Bubblr.prototype.stop = function () {
        this.state.started = false;
        this.clear();
    };

    /** Animation loop run Bubblr.stop and start control this **/
    Bubblr.prototype.animationLoop = function () {
        window.requestAnimFrame(this.animationLoop.bind(this));
        this.state.globalTick++;
        if (this.state.started) this.animate();
    };

    Bubblr.prototype.animate = function (arguments) {
        this.clear();
        for (i in this.state.bubbles) {
            this.update(i, this.state.bubbles[i]);
            this.draw(i, this.state.bubbles[i]);
        }

        // clear bubbles where y<0 (pop em)
        var toRemove = this.state.bubbles.findIndex(function (b) {
            return b.y < 0;
        });
        for (var i = 0; i < toRemove.length; i++) {
            var bubble = this.state.bubbles.splice(toRemove[i], 1)[0];
            //bubble.pop();
        }

    };

    Bubblr.prototype.clear = function () {
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.clearRect(0, 0, this.width, this.height);
    };


    Bubblr.prototype.draw = function (index, bubble) {
        this.ctx.globalAlpha = this.options.bubbleOpacity;
        this.drawBubble(bubble);
    };

    /** Update bubble position **/
    Bubblr.prototype.update = function (index, bubble) {
        bubble.y = bubble.y - bubble.speed

        if (bubble.y < 0 && this.state.continuous)
        // reset to bottom if continuous running is on
            this.state.bubbles[index] = this.generateBubble(true);
        else {}

    };

    /**
     * Generate a single bubble
     * @param {object} options    - options for the bubble
     * @param {Number} options.x  - Starting x position. Defaults to a random
     *                              location.
     * @param  {Number} options.y - starting y level. Default to the bottom or
     *                            	null for random position, a number sets a
     *                            	specific level. Note the top is 0, while the
     *                            	bottom is `-$(element).height()`
     */
    Bubblr.prototype.bubble = function (options) {
        this.state.bubbles.push(this.generateBubble(options));
    };

    /**
     * 	Helper to generate multiple bubble
     * @param  {[type]} amount  - amount of bubbles to create
     * @param  {[type]} options - see Bubblr.bubble for description
     */
    Bubblr.prototype.genBubbles = function (amount, options) {
        for (var i = 0; i < amount; i++) {
            this.state.bubbles.push(this.generateBubble(options));
        }
    }

    Bubblr.prototype.drawBubble = function (bubble) {
        this.ctx.fillStyle = this.options.bubbleColor;
        this.ctx.beginPath();
        this.ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.fill();
    };

    Bubblr.prototype.generateBubble = function (options) {
        options = options || {};
        var bubble = new Object();


        if (options.x === undefined || options.x === null)
            bubble.x = this.randomize(1, this.width);
        else
            bubble.x = options.x

        if (options.y === undefined)
            bubble.y = this.height;
        else if (options.y === null)
            bubble.y = this.randomize(1, this.height);
        else
            bubble.y = options.y

        if (options.radius)
            bubble.radius = options.radius
        else
            bubble.radius = this.randomize(this.options.bubbleMinSize, this.options.bubbleMaxSize);

        if (options.speed)
            bubble.speed = options.speed;
        else
            bubble.speed = this.randomize(this.options.bubbleMinSpeed, this.options.bubbleMaxSpeed);

        return bubble;
    };

    Bubblr.prototype.randomize = function (min, max) {
        return Math.floor((Math.random() * max) + min);
    };

    // $.flame will create or return the bubblr element
    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName,
                    new Bubblr(this, options));
            }
        });
    }

})(jQuery, window, document);

// shim for requestAnimFrame
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function ( /* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
