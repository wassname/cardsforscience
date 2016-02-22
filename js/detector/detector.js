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

    bubblr: undefined,

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


        detector.initBubbles();
        // TODO refactor flame animation and put it here
        // this.flame = $('#detector-flame').flame();

        detector.animate();
    },

    initBubbles: function(){
        // init the test tube animation
        var bubblrElem = $('#detector-core').bubblr({
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
        detector.bubblr = bubblrElem.data('plugin_bubblr');
    },

    animate: function(time)
    {
        // var duration = typeof time !== 'undefined' ? time - detector.lastRender : 16;
        // detector.lastRender = time;
        //
        // requestAnimFrame(detector.animate);
        // detector.draw(duration);
    },

    /** When a user clicks the detector **/
    addEvent: function()
    {
        detector.bubblr.start(500); // bubble for 500ms, TODO make one bubble
    },

    /** When a worker clicks the detector **/
    addEventExternal: function(numWorkers)
    {
        // detector.bubblr.start(500*numWorkers);
    },

    /** Draw current events **/
    draw: function(duration)
    {
        detector.bubblr.start(duration);
    },

    onDrop: function(event, ui, lab){
        // TODO tidy this, attach new runes to something better
        // FIXME at the moment it duplicates runes, but we need a better system
        var self=this;
        console.debug('onDrop',arguments);
        var $draggable = $(ui.draggable),
            $droppable = $(event.target);
        var draggableTop    = $draggable.offset().top;
        var draggableHeight = $draggable.height();
        var draggableBottom = draggableTop + draggableHeight;
        var draggableLeft    = $draggable.offset().left;
        var draggableWidth = $draggable.height();
        var draggableRight = draggableLeft + draggableWidth;
        var $droppables = $(".ui-droppable");
        var $droppablesCoveredByDraggable = $droppables.filter( function() {
            var $droppable      = $(this);
            var top             = $droppable.offset().top;
            var height          = $droppable.height();
            var bottom          = top + height;

            var left             = $droppable.offset().left;
            var width          = $droppable.width();
            var right          = left + width;

            var isCoveredByDraggable = top <= draggableBottom && bottom >= draggableTop
                && left <= draggableRight && right >= draggableLeft;
            return isCoveredByDraggable;
        });
        for (var i = 0; i < $droppablesCoveredByDraggable.length; i++) {
            this.experiment($draggable,$droppablesCoveredByDraggable[i]);
        }
        console.log('droppables', $droppablesCoveredByDraggable.length);

        // duplicate
        var newRune = this.runeElem(ui.draggable.data('id'),$draggable.parent().parent());
        newRune.position({my:'center', at:'center',of: $draggable})

        // var newRune = ui.draggable.clone(true,true);
        // $draggable.parent().append(newRune);
    },
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
