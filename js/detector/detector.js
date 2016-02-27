/** Manages the detector animation in the canvas of the detector pane **/

var Detector = function(){


    return {
        elements: new GameObjects.Cards(),
        lastCards: new GameObjects.Cards(),
        incorrectCards: new GameObjects.Cards(),

        visible: true,

        width: 400,
        height: 400,

        ratio: 1,

        lastRender: 0,

        bubblr: undefined,

        init: function(game)
        {
            // deal first card
            this.lastCards.push(_.sample(game.elements));
        },

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
                this.elements.push(newElement);
            }

            var observation = game.test
            console.log('intersectingElements', intersectingElements.length, observation);
            return observation;
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
