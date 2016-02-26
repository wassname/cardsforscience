/** Manages the detector animation in the canvas of the detector pane **/

var Detector = function(){


    return {
        elements: new GameObjects.Cards(),

        visible: true,

        width: 400,
        height: 400,

        ratio: 1,

        lastRender: 0,

        bubblr: undefined,

        init: function()
        {
            // this.initBubbles();
            // this.initFlame();
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

        // initFlame: function(){
        //     var flameElem = $('#detector-flame').flame();
        //     this.flamer = flameElem.data('plugin_flame')
        // },

        bindOnResize: function(){
            // HACK
            $(window).on('resize',this.onResize.bind(this));
        },

        // onResize: function(){
        //     // TODO, do one, schedule a check and then prevent firing until then
        //     if ($(window).width() >= 1200) {
        //       if (this.width != 500) {
        //         $('#detector').width(500).height(500);
        //         this.init(500);
        //       }
        //     } else if ($(window).width() < 768 && $(window).height() - 90 < 300) {
        //       var newWidth = $(window).width() - Math.max($(window).width() - ($(window).height() - 90 + 10), 300) - 10;
        //       if (this.width != newWidth) {
        //         $('#detector').width(newWidth).height(newWidth);
        //         this.init(newWidth);
        //       }
        //     } else if ($(window).width() < 992) {
        //       if (this.width != 300) {
        //         $('#detector').width(300).height(300);
        //         this.init(300);
        //       }
        //     } else {
        //       if (this.width != 400) {
        //         $('#detector').width(400).height(400);
        //         this.init(400);
        //       }
        //     }
        //
        //     this.bubblr.onResize();
        //     this.flamer.onResize();
        // },

        /** When a user clicks the detector **/
        addEvent: function()
        {
            // this.bubblr.bubble(); // bubble for 500ms, TODO make one bubble
        },

        /** When a worker clicks the detector **/
        addEventExternal: function(numWorkers)
        {
            // this.bubblr.genBubbles(numWorkers);
        },

        /** Draw current events **/
        draw: function(duration)
        {
            // this.bubblr.bubble();
        },

        /** Clear an element back to element Store **/
        storeElementBy: function(qObject,game){
            var i = _.findIndex(this.elements,qObject);
            var removedElement = this.elements.splice(i,1)[0];
            return game.elements.get(removedElement.key).state.amount+=1;
        },

        clearAll: function(game){
            var hashKeys = this.elements.map(function(e){return e.$$hashKey;});
            for (var i = 0; i < hashKeys.length; i++) {
                this.storeElementBy({'$$hashKey': hashKeys[i]}, game);
            }
        },

        onDrop: function(event, ui, game){
            var self=this;
            console.debug('onDrop',arguments);
            var $draggable = angular.element(ui.draggable),
                $droppable = angular.element(event.target);

            // if the dragger came from the elements panels, clone it to here
            var newElement;
            if ($draggable.hasClass('element-store')){

                var elementStore = game.elements.filter(function(e){return e.key==$draggable.data('element');})[0];
                elementStore.state.amount-=1;
                newElement = angular.copy(elementStore);
                newElement.state.top=$draggable.offset().top;
                newElement.state.left=$draggable.offset().left;
                this.elements.push(newElement);
            }


            // get everything intersecting the drop
            var draggableTop    = $draggable.offset().top;
            var draggableHeight = $draggable.height();
            var draggableBottom = draggableTop + draggableHeight;
            var draggableLeft    = $draggable.offset().left;
            var draggableWidth = $draggable.height();
            var draggableRight = draggableLeft + draggableWidth;
            var detectorDOMElems = angular.element('#detector').find('.element').not('.element-store'); // replace with detector.elements
            var intersectingDOMElems = detectorDOMElems.filter( function() {
                var $elem           = angular.element(this);
                var top             = $elem.offset().top;
                var height          = $elem.height();
                var bottom          = top + height;

                var left             = $elem.offset().left;
                var width          = $elem.width();
                var right          = left + width;

                var isCoveredByDraggable = top <= draggableBottom && bottom >= draggableTop
                    && left <= draggableRight && right >= draggableLeft;
                return isCoveredByDraggable;
            });

            // We have the DOM's in the area (maybe missing the newly dropped one)
            // var droppedModel = game.elements.getByHashKey($draggable.data('hashkey'));
            var intersectingElements = intersectingDOMElems.toArray().map(function(input){
                return self.elements.getByHashKey(angular.element(input).data('hashkey'));
            });

            // make sure we include the dropped element as in some cases
            // it wont have DOM object yet so it wont be picked up as intersecting
            if (newElement && intersectingElements.indexOf(newElement)===-1) intersectingElements.push(newElement);


            var uniqueElems = _(intersectingElements).map('key').uniq().value().length;
            if (intersectingElements.length==2 && uniqueElems>1){
                var observation = this.experiment({inputs:intersectingElements,location:$draggable.offset()},game);
                console.log('intersectingElements', intersectingElements.length, observation);
                return observation;
            } else {
                return;
            }


        },

        /** Run an experiment depending on reactants and conditions **/
        experiment: function(options,game) {
            var inputs = options.inputs || [];
            var inputKeys = inputs.map(function(e){return e.key;});
            inputKeys.sort(); // this makes reaction be independant of order

            var result = game.testRules(inputKeys);
            if (result) {
                this.reaction(inputs,result.reactants,result.results, options.location, game);
            } else {
                result = {
                    reactants: [],
                    catalysts: [],
                    conditions: [],
                    results: [],
                    inputs: inputKeys
                };
            }
            return result;
        },

        /** Remove reactants and make results with animations **/
        reaction: function(inputs,reactants,results,location,game){

            // remove reactants from detector
            for (var i = 0; i < reactants.length; i++) {
                // get the uuid from inputs
                var ingredient = inputs.filter(function(e){return e.key===reactants[i];})[0];
                var j = _.findIndex(this.elements,{uuid:ingredient.uuid});
                var removed = this.elements.splice(j,1);
            }

            // TODO use angular effects to remove in puff of fade

            // add results and discover them
            for (var i = 0; i < results.length; i++) {
                var resultKey = results[i];

                // make sure it's discovered
                var elementStore = game.elements.get(resultKey);
                if (!elementStore.state.discovered){
                    // old discoveries are not interesting
                    game.elements.map(function(e){e.state.interesting=false;});
                    // a new discovery is interesting
                    elementStore.state.interesting=true;
                    elementStore.state.discovered=true;
                }

                // add new element to beaker
                var newElem = elementStore.spawn();
                newElem.state=location;

                this.elements.push(newElem);
            }

            // effects
            // this.bubblr.bubble();

        },
    };
};
