/** Manages the detector animation in the canvas of the detector pane **/

var Detector = function(){


    return {
        core:
        {
            canvas: null,
            ctx: null
        },
        //
        // events:
        // {
        //     canvas: null,
        //     ctx: null,
        //     list: [],
        // },

        flame:
        {
            canvas: null,
            ctx: null
        },

        visible: true,

        width: 400,
        height: 400,

        ratio: 1,

        lastRender: 0,

        bubblr: undefined,

        init: function(baseSize,element)
        {
            // get canvas
            this.core.canvas = document.getElementById('detector-core');
            if (!this.core.canvas) {
                this.core.canvas=$('<canvas id="detector-core"></canvas>');
                $(element).append(this.core.canvas);
            }
            this.core.ctx = this.core.canvas.getContext('2d');

            this.flame.canvas = document.getElementById('detector-flame');
            this.flame.ctx = this.flame.canvas.getContext('2d');

            this.initBubbles();
            this.initFlame();
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
            this.bubblr = bubblrElem.data('plugin_bubblr');
        },

        initFlame: function(){
            var flameElem = $('#detector-flame').flame();
            this.flamer = flameElem.data('plugin_flame')
        },

        bindOnResize: function(){
            // HACK
            $(window).on('resize',this.onResize.bind(this));
        },

        onResize: function(){
            // TODO, do one, schedule a check and then prevent firing until then
            if ($(window).width() >= 1200) {
              if (this.width != 500) {
                $('#detector').width(500).height(500);
                this.init(500);
              }
            } else if ($(window).width() < 768 && $(window).height() - 90 < 300) {
              var newWidth = $(window).width() - Math.max($(window).width() - ($(window).height() - 90 + 10), 300) - 10;
              if (this.width != newWidth) {
                $('#detector').width(newWidth).height(newWidth);
                this.init(newWidth);
              }
            } else if ($(window).width() < 992) {
              if (this.width != 300) {
                $('#detector').width(300).height(300);
                this.init(300);
              }
            } else {
              if (this.width != 400) {
                $('#detector').width(400).height(400);
                this.init(400);
              }
            }

            this.bubblr.onResize();
            this.flamer.onResize();
        },

        /** When a user clicks the detector **/
        addEvent: function()
        {
            this.bubblr.bubble(); // bubble for 500ms, TODO make one bubble
        },

        /** When a worker clicks the detector **/
        addEventExternal: function(numWorkers)
        {
            // this.bubblr.bubble(numWorkers);
        },

        /** Draw current events **/
        draw: function(duration)
        {
            this.bubblr.bubble();
        },

        onDrop: function(event, ui, game){
            // TODO tidy this, attach new runes to something better
            // FIXME at the moment it duplicates runes, but we need a better system
            var self=this;
            console.debug('onDrop',arguments);
            var $draggable = $(ui.draggable),
                $droppable = $(event.target);

            // if the dragger came from the elements panels, clone it to here
            var newElement = $draggable.clone();
            var $detector = $droppable.parent()
            $detector.append(newElement);
            // also set position to that of droppable
            newElement.offset($draggable.offset())


            var elementStore = game.elements.filter(function(e){return e.key==$draggable.data('element')});
            elementStore[0].state.amount-=1;

            // get everything intersecting the drop

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
            // TODO also get draggable covered by droppable
            for (var i = 0; i < $droppablesCoveredByDraggable.length; i++) {

            }
            // just get one thes with a data-element attribute
            var inputs = $droppablesCoveredByDraggable.filter(function(e){
                return $(e).data('element');
            })
            inputs.push($draggable);
            var reaction = game.experiment({inputs:inputs});
            console.log('droppables', $droppablesCoveredByDraggable.length);


        },
    }
};
