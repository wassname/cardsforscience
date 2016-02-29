


// polyfill and conditional import so this will load in the browser too
if (!module) module=function(){};
var chai;
if (!chai){
    chai = require("chai");
}

/**
 * Rules objects for game
 * @param  {[type]} function functionName( [description]
 * @return {[type]}          [description]
 */
var Rules = module.exports = (function functionName(_,chai) {


    /** Generate all combination of arguments from array using functional programming instead of recursive
    * @param {Object} opts    - An array or arrays with keys describing options  [['Ben','Jade','Darren'],['Smith','Miller']]
    * @returns {Array}        - An array of arrays e.g. [['Ben','Smith'],[..]]
    **/
    function cartesianProductOf(opts) {
        if (arguments.length>1) opts=arguments;
        return _.reduce(opts, function(a, b) {
            return _.flatten(_.map(a, function(x) {
                return _.map(b, function(y) {
                    return x.concat([y]);
                });
            }), true);
        }, [ [] ]);
    };


    /** Generate all combination of arguments from objects using functional programming instead of recursive
      * @param {Object} opts    - An object or arrays with keys describing options  {firstName:['Ben','Jade','Darren'],lastName:['Smith','Miller']}
      * @returns {Array}        - An array of objects e.g. [{firstName:'Ben',LastName:'Smith'},{..]
      **/
    function cartesianProductObj(optObj){
        var opts = _.values(optObj);
        var keys = _.keys(optObj);
        var combs = cartesianProductOf(opts);
        return _.map(combs,function(comb){
            return _.zipObject(keys,comb);
        });
    }


    /**
     * Rule prototype
     * @param {String} key                  A short key
     * @param {String} description          Description of the rule using angular templating from options
     * @param {Function} ruleFunc           A function returning a true or a failure message or a assertion error
     * @param {Object} optionDefaults       Default options for the rule e.g. {n:1, parameter:'color'}.
     * @param {Object} optionDesc    Object with object for each option
     * @param {Array} optionDesc[].possibleVals  Array of possible values or empty if they are to many to be enumerated
     * @param {String} optionDesc[].description  Description of this option e.g. 'Property to compare to last card'
     * @param {String} optionDesc[].type         Type for this option e.g. 'String'
     * @param {Array} hintTmpls             Array of hint templates. Each should only contain one option e.g.
     *                                     `The rule uses <%= parameter %>` and for every parameter you can
     *                                     use `The rule doesn't use <%= parameterUnused %>` to have each unused param substituted in.
     */
    var Rule = function (key, description, ruleFunc, optionDefaults, optionDesc, hintTmpls) {

        // check inputs
        if (!(typeof (description) === 'string' || description instanceof String) || !description.length)
            throw new TypeError('Description should be a non empty string');
        this.description = description;
        if (!(ruleFunc instanceof Function))
            throw new TypeError('ruleFunc should be a function');

        this.key=key;
        this.ruleFunc = ruleFunc;
        this.optionDesc = optionDesc || {};
        this.options = this.optionDefaults = optionDefaults || {};
        this.hintTmpls = hintTmpls || [];

        // init
        this.state = {
            hintsUsed: 0,
            wrongCards: 0,
            rightCards: 0,
            wrongGuesses: 0,
            rightGuesses: 0,
        };
        // used for template rendering
        this.otherOptions={nth:this.nth,lastn:this.lastn};
        // render hint templates
        this.hints = this.genHints();
        // work out all option combos, only takes a second
        this.optionsPossible=this.genOptions();
    };
    Rule.prototype.genOptions = function () {
        var possibleVals={};
        for (var prop in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(prop)) {
                possibleVals[prop]=this.optionDesc[prop].possibleVals;
            }
        }
        return this.optionsPossible=cartesianProductObj(possibleVals);
    };
    Rule.prototype.setOptions = function (options) {
        this.options = _.defaults(options, this.optionDefaults);
        this.hints = this.genHints();
        return this.options;
    };
    Rule.prototype.randomize = function (options) {
        var options = {};
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                var vals = this.optionDesc[option].possibleVals;
                options[option] = _.sample(vals);
            }
        }
        return this.setOptions(options);
    };
    /** Tests the rule and returns true, false, or an AssertionError **/
    Rule.prototype.testAndTell = function (card, lastCards, allCards) {
        // chai.expect(card).to.be.a('object');
        // chai.expect(lastCards).to.be.a('array');
        // chai.expect(allCards).to.be.a('array');

        var result;
        var reason;
        try {
            result = this.ruleFunc(card, lastCards, allCards, this.options);
            if ((chai&&result instanceof chai.Assertion)||result.name==='Assertion'||result.constructor.name==='Assertion') {
                reason = result;
                result = true;
            }
        } catch (e) {
            if ((chai&&e instanceof chai.AssertionError)||e.name=='AssertionError') {
                result = false;
                reason = e;
            } else {
                throw (e);
            }
        }
        return {
            result: result,
            reason: reason
        };
    };
    Rule.prototype.test = function (card, lastCards, allCards) {
        var res = this.testAndTell(card, lastCards, allCards);
        return res.result;
    };
    /** Describe rule using set options **/
    Rule.prototype.describe = function () {
        return this.describeVariation(this.options);
    };
    /** Compile description using options to express rule**/
    Rule.prototype.describeVariation = function (options) {
        var compiled = _.template(this.description);
        return compiled(_.defaults(options, this.options, this.otherOptions));
    };
    /** Return options string for humans **/
    Rule.prototype.describeOptions = function () {
        var s = "";
        // explicit python style
        var template = '<%= option %> \n\tDescription: <%= description %>\n\tType <%= type %> \n\tValues: current:<%= current %>, default:<%= defaultVal %>, all:[<%= possibleVals %>]\n ';
        // jsdoc style I think
        // var template = '<%= type %>\t[<%= option %>=<%= defaultVal %>]\t<%= description %>. (<%= current %>)[<%= possibleVals %>]\n';
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                var tmplParams = _.defaults({
                    option: option,
                    defaultVal: this.optionDefaults[option],
                    current: this.options[option]
                }, this.optionDesc[option]);
                s += _.template(template)(tmplParams);
            }
        }
        return s;
    };
    /** Describe all variations on the default options **/
    Rule.prototype.describeVariations = function () {
        var s = [];
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                var vals = this.optionDesc[option].possibleVals;
                for (var i = 0; i < vals.length; i++) {
                    var options = {};
                    options[option] = vals[i];
                    var v = this.describeVariation(options) + '\n';
                    s.push(v);
                }

            }
        }
        return s;
    };
    /** Get next hint **/
    Rule.prototype.nextHint = function () {
        var hint = this.hints[this.state.hintsUsed];
        this.state.hintsUsed++;
        return hint || "";

    };
    /** Generate an automatic hint from params **/
    Rule.prototype.genHints = function () {
        // first manual hints
        this.state.hintsUsed = 0;
        var hints = [];

        // compile hints for each unused property
        // this onl handles one unused property per hint

        // get all unused options
        var unusedOptions = {};
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                // for each option find any unused options
                var posVals = this.optionDesc[option].possibleVals;
                if (posVals) {
                    var optionUnused = _.difference(posVals, [this.options[option]]);
                    unusedOptions[option + 'Unused'] = optionUnused;
                }
            }
        }

        // copy options
        var tmplParams = _.defaults({}, this.options, this.otherOptions);


        // make hint from unused options if there are hint templates for them
        for (var optionUnused in unusedOptions) {
            if (unusedOptions.hasOwnProperty(optionUnused)) {

                // find hint templates that take this unused option
                for (var i = 0; i < this.hintTmpls.length; i++) {
                    var tmpl = this.hintTmpls[i];
                    if (tmpl.indexOf(optionUnused) >= 0) {
                        var tmplCmp = _.template(tmpl);
                        var unused = unusedOptions[optionUnused];
                        // generate a hint for each unsed options
                        for (var j = 0; j < unused.length; j++) {
                            tmplParams[optionUnused] = unused[j];
                            var hint = tmplCmp(tmplParams);
                            hints.push(hint);
                        }
                    }
                }
            }
        }

        // now make other hints for used params
        for (var i = 0; i < this.hintTmpls.length; i++) {
            var hint = _.template(this.hintTmpls[i])(tmplParams);
            hints.push(hint);
        }

        // on on a last hint
        hints.push("That's all the hints. But this is a game of inductive logic so try to disprove rules instead of proving them.");
        hints.push("No more hints you cheeky blighter!");

        // and finally remove duplicate hints
        hints = _.uniq(hints);

        return hints;
    };

    /** How many combination of this rule **/
    Rule.prototype.combinations = function () {
        var pos = _.map(this.optionDesc, 'possibleVals');
        var c = 0;
        for (var i = 0; i < pos.length; i++) {
            c * pos[i].length;
        }
        return c;
    };
    // TODO estimate hardness perhaps through simulation, combinatorics or hints

    /** Helper to format numbers **/
    Rule.prototype.nth = function (d) {
        if (d > 3 && d < 21) return 'th'; // thanks kennebec
        switch (d % 10) {
        case 1:
            return "st";
        case 2:
            return "nd";
        case 3:
            return "rd";
        default:
            return "th";
        }
    };
    /** Helper to format numbers **/
    Rule.prototype.lastn = function (d) {
        if (d > 3 && d < 21) return d+'th to last'; // thanks kennebec
        switch (d % 10) {
        case 1:
            return "last";
        case 2:
            return d+"nd to last";
        case 3:
            return d+"rd to last";
        default:
            return d+"th to last";
        }
    };

    Rule.prototype.loadState =
        function (state) {
            $.extend(this.state, state);
        };


    // Now defined actual rules
    var rules = [];

    rules.push(
        // here is a example rule where the card must have differen't color etc from the last card
        // but it's abstracted to allow variations
        new Rule(
            "d4a2f61a-0fb9-4eb6-9258-3e14ae4cd512",
            "Next card must not have the same <%= property %> as the <%= lastn(n) %> card",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - this.options.n];
                var property = this.options.property;
                return chai.expect(card)
                    .to.have.property(property)
                    .not.equal(lastNCard[property]);
            }, {
                property: 'color',
                n: 1
            }, {
                property: {
                    description: 'The property to compare in last and current card',
                    possibleVals: ['color', 'face', 'number', 'value', 'suit'],
                    type: 'String'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                }
            }, [
                'This rule does not involve <%= propertyUnused %>',
                'This rule does involve <%= property %>',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
                'This rule does not involve the <%= nUnused %><%=nth(n)%> last card', // only indirectly
            ]
        ),
        new Rule(
            "2b70bd6a-8bdd-49d4-bec7-bfb9de090e78",
            "If <%= lastn(n) %> cards value was between <%= min %> and <%= max %> play a card that isn't and vice versa.",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - this.options.n];
                var lastWasbetween = options.min < lastNCard.value && lastNCard.value < options.max;
                if (lastWasbetween)
                    return chai.expect(card)
                        .to.have.property('value')
                        .not.within(options.min, options.max);
                else
                    return chai.expect(card)
                        .to.have.property('value')
                        .within(options.min, options.max);
            }, {
                n: 1,
                min: 0,
                max: 7
            }, {
                min: {
                    description: 'The min bounds to compare value to',
                    possibleVals: [0, 1, 2, 3, 4, 5],
                    type: 'Number'
                },
                max: {
                    description: 'The max bounds to compare value to',
                    possibleVals: [7, 8, 9, 10, 11, 12, 13, 14, 15],
                    type: 'Number'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                }
            }, [
                'This rule does not involve color',
                'This rule does not involve if it\'s a face card',
                'This rule does not involve royalty',
                'This rule does not involve color',
                'This rule does not involve suit',
                'This rule does not involve the <%= nUnused %><%=nth(nUnused)%> last card',
                'This rule does involve value',
                'This rule does involve a value cuttoff',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
            ]
        ),
        new Rule(
            "3e12d713-335a-42e7-81ed-7064442f628a",
            "Play a card with a value <%= min %> to <%= max %> higher than the value of the <%= lastn(n) %> card. The numbers wrap around once they reach the max",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - this.options.n];
                var val =  card.value%16;
                return chai.expect(val).to.be
                    .within(lastNCard.value+options.min, lastNCard.value+options.max);
            }, {
                n: 1,
                min: 1,
                max: 4
            }, {
                min: {
                    description: 'The min difference to the last nth card',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                },
                max: {
                    description: 'The max difference to the last nth card',
                    possibleVals: [4, 5, 6, 7, 8],
                    type: 'Number'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                }
            }, [
                'This rule does not involve color',
                'This rule does not involve if it\'s a face card',
                'This rule does not involve royalty',
                'This rule does not involve color',
                'This rule does not involve suit',
                'This rule does not involve the <%= nUnused %><%=nth(nUnused)%> last card',
                'This rule does involve value',
                'This rule does involve the difference in value to the last card',
                'This rule does involve the difference in values that wraps around',
                'This rule does involve the difference in values of at least <%= min %>',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
            ]
        ),



        new Rule(
            "99b1d408-000d-41e6-8a0c-886a5d21d06f",
            "If the <%= lastn(n) %> card is an even-valued card, play a <%= evenColor %> card. Otherwise play the other color",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - this.options.n];
                var lastWasEven = lastNCard % 2 == 0;
                if (lastWasEven)
                    return chai.expect(card)
                        .to.have.property('color')
                        .equals(options.evenColor);
                else
                    return chai.expect(card)
                        .to.have.property('color')
                        .not.equals(options.evenColor);
            }, {
                n: 1,
                evenColor: 'red',
            }, {
                evenColor: {
                    description: 'The color to play if lastNCard was even',
                    possibleVals: ['red', 'black'],
                    type: 'String'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                }
            }, [
                'This rule does not involve if it\'s a face card',
                'This rule does not involve royalty',
                'This rule does not involve suit',
                'This rule does not involve the <%= nUnused %><%=nth(nUnused)%> last card',
                'This rule does not involve the difference in value to the last card',
                'This rule does involve color',
                'This rule does involve value',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
            ]
        ),

        new Rule(
            "4014c459-a7a7-4a49-98f5-302a1b7b89e7",
            "Play a card that has the same <%= property %> or color as the <%= lastn(n) %> card but not both.",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - options.n];
                var matchesColor = lastNCard.color === card.color;
                var matches2 = lastNCard.suit === lastNCard.suit;
                return ((matchesColor && !matches2) || (!matchesColor && matches2));
            }, {
                n: 1,
                property: 'suit',
            }, {
                property: {
                    description: 'The property to compare to the lastNCard',
                    possibleVals: ['suit', 'value', 'face', 'royal'],
                    type: 'String'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                }
            }, [
                'This rule does not involve the <%= nUnused %><%=nth(nUnused)%> last card',
                'This rule does involve color',
                'This rule does not involve <%= propertyUnused %>',
                'This rule does involve <%= property %>',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
            ]
        ),

        new Rule(
            "793d93cb-ca09-4cda-8781-6fce02edf09c",
            "If the <%= lastn(n) %> card's number is higher than <%= min %>, change <%= property %>, and if lower, keep it the same.",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - options.n];
                var lastWasHigher = lastNCard.value > options.min;
                if (lastWasHigher) {
                    return chai.expect(card)
                        .to.have.property(options.property)
                        .not.equals(lastNCard[options.property]);
                } else {
                    return chai.expect(card)
                        .to.have.property(options.property)
                        .equals(lastNCard[options.property]);
                }
                var matches2 = lastNCard.suit === lastNCard.suit;
                return ((matchesColor && !matches2) || (!matchesColor && matches2));
            }, {
                n: 1,
                min: 7,
                property: 'suit',
            }, {
                property: {
                    description: 'The property to compare to the lastNCard',
                    possibleVals: ['suit', 'face', 'royal', 'color'],
                    type: 'String'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                },
                min: {
                    description: 'The min difference to the last nth card',
                    possibleVals: [5, 6, 7, 8, 9],
                    type: 'Number'
                },
            }, [
                'This rule does not involve the <%= nUnused %><%=nth(nUnused)%> last card',
                'This rule does not involve <%= propertyUnused %>',
                'This rule does involve value',
                'This rule does a minimum value',
                'This rule does involve <%= property %>',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
            ]
        ),
        new Rule(
            "f4fba793-f886-4db8-9853-240002bb112e",
            "If the <%= lastn(n) %> card was a <%= property %> card, play a higher value card otherwise lower.",
            //TODO what if we have a high card? we can only go higher
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[lastCards.length - options.n];
                var lastHadProperty = lastNCard[options.property];
                if (lastHadProperty) {
                    return chai.expect(card)
                        .to.have.property('value')
                        .above(lastNCard[options.value]);
                } else {
                    return chai.expect(card)
                        .to.have.property('value')
                        .lessThan(lastNCard[options.value]);
                }
            }, {
                n: 1,
                property: 'face',
            }, {
                property: {
                    description: 'The property to compare to the lastNCard',
                    possibleVals: ['face', 'royal', 'spade', 'club', 'diamond', 'heart', 'red', 'black'],
                    type: 'String'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1, 2, 3],
                    type: 'Number'
                },
            }, [
                'This rule does not involve the <%= nUnused %><%=nth(nUnused)%> last card',
                'This rule does not check for <%= propertyUnused %> cards',
                'This rule does involve <%= property %>',
                'This rule wants you to play a higher card in some circumstances',
                'This rule does involve the <%= n %><%=nth(n)%> last card',
            ]
        )



    );

    return {
        Rule: Rule,
        rules: rules,
    };


})(_,chai);
