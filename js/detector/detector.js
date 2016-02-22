/** Manages the detector animation in the canvas of the detector pane **/

var detector =
{
    core:
    {
        canvas: null,
        ctx: null
    },

    events:
    {
        canvas: null,
        ctx: null,
        list: [],
    },

    visible: true,

    width: 400,
    height: 400,

    ratio: 1,

    lastRender: 0,

    animate: function(time)
    {
        // var duration = typeof time !== 'undefined' ? time - detector.lastRender : 16;
        // detector.lastRender = time;
        //
        // requestAnimFrame(detector.animate);
        // detector.draw(duration);
    },

    init: function(baseSize)
    {
        // get canvas
        detector.core.canvas = document.getElementById('detector-core');
        detector.core.ctx = detector.core.canvas.getContext('2d');
        //detector.core.ctx = new C2S(400,400);

        detector.events.canvas = document.getElementById('detector-events');
        detector.events.ctx = detector.events.canvas.getContext('2d');

        // set size
        // TODO resize "#detector-flame" too
        var devicePixelRatio = window.devicePixelRatio || 1;
        var backingStoreRatio = detector.core.ctx.webkitBackingStorePixelRatio ||
                                detector.core.ctx.mozBackingStorePixelRatio ||
                                detector.core.ctx.msBackingStorePixelRatio ||
                                detector.core.ctx.oBackingStorePixelRatio ||
                                detector.core.ctx.backingStorePixelRatio || 1;

        var ratio = devicePixelRatio / backingStoreRatio;

        detector.ratio = baseSize / 400;

        detector.width = baseSize;
        detector.height = baseSize;

        detector.core.canvas.width = baseSize;
        detector.core.canvas.height = baseSize;

        detector.events.canvas.width = baseSize;
        detector.events.canvas.height = baseSize;

        if (devicePixelRatio !== backingStoreRatio) {
            var oldWidth = detector.core.canvas.width;
            var oldHeight = detector.core.canvas.height;

            detector.core.canvas.width = oldWidth * ratio;
            detector.core.canvas.height = oldHeight * ratio;
            detector.core.canvas.style.width = oldWidth + 'px';
            detector.core.canvas.style.height = oldHeight + 'px';

            detector.events.canvas.width = oldWidth * ratio;
            detector.events.canvas.height = oldHeight * ratio;
            detector.events.canvas.style.width = oldWidth + 'px';
            detector.events.canvas.style.height = oldHeight + 'px';

            // now scale the context to counter
            // the fact that we've manually scaled
            // our canvas element
            detector.core.ctx.scale(ratio, ratio);
            detector.events.ctx.scale(ratio, ratio);
        }

        // init the test tube animation
        var bubblrElem = $('detector-core').bubblr({
            backgroundColor: '#e8e8e8',
            bubbleColor: "#bfbfbf",
            bubbleMinSize: 3,
            bubbleMaxSize: 5,
            bubbleMaxSpeed: 2,
            bubbleMinSpeed: 1,
            animationSpeed: 20,
            // bubbleXposMultiplier allows us to position bubbles on the x-axis
            bubbleXposMultiplier: 2,
            // bubbleYpopLimit determines how far in pixels from the canvas's
            // top edge bubbles will disappear
            bubbleYpopLimit: 10
        });
        this.bubblr = bubblrElem.data('plugin_bubblr');

        // TODO refactor flame animation and put it here
        // this.flame = $('#detector-flame').flame();

        // detector.coreDraw();
        detector.animate();
    },

    /** draw a static core on background **/
    // coreDraw: function()
    // {
    //
    // },

    addEvent: function()
    {

    },

    addEventExternal: function(numWorkers)
    {

    },

    /** Draw current events **/
    draw: function(duration)
    {

    }
};

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

// start detector at this height
(function() { detector.init(400); $('#detector').width(400).height(400); })();
