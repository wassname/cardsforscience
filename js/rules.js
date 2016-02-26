/**
 * Rules objects for game
 * @param  {[type]} function functionName( [description]
 * @return {[type]}          [description]
 */
var Rules = (function functionName(_) {

    /**
     * Rule prototype
     * @param {String} description - Description of the rule using angular templating from options
     * @param {Function} ruleFunc  - A function returning a true or a failure
     *                             message or a error
     * @param {Object} options     - Options for the rule will be given on test and description rendering
     */

    /**
     * Rule prototype
     * @param {String} description          Description of the rule using angular templating from options
     * @param {Function} ruleFunc           A function returning a true or a failure message or a error
     * @param {Object} optionDefaults       Default options for the rule e.g. {n:1, parameter:'color'}.
     * @param {Object} optionDesc    Object with object for each option
     * @param {Array} optionDesc[].possibleVals  Array of possible values or empty if they are to many to be enumerated
     * @param {String} optionDesc[].description  Description of this option e.g. 'Property to compare to last card'
     * @param {String} optionDesc[].type         Type for this option e.g. 'String'
     * @param {Array} hintTmpls             Array of hint templates. Each should only contain one option e.g.
     *                                     `The rule uses {{parameter}}` and for every parameter you can
     *                                     use `The rule doesn't use {{parameterUnused}}` to have each unused param substituted in.
     */
    var Rule = function (description, ruleFunc, optionDefaults, optionDesc,hintTmpls) {
        if (!(typeof(description)==='string'||description instanceof String)|| !description.length)
            throw new TypeError('description should be a non empty string');
        this.description = description;
        if (!(ruleFunc instanceof Function))
           throw new TypeError('ruleFunc should be a function');

        this.ruleFunc = ruleFunc;
        this.optionDesc = optionDesc||{};
        this.options = this.optionDefaults = optionDefaults||{};
        this.hintTmpls=hintTmpls||[];

        // use angular and mustache templating
        _.templateSettings.interpolate = /{{([\s\S]+?)}}/g;

        // init
        this.hintsUsed = 0;
        this.hints=this.genHints();
    };
    Rule.prototype.setOptions = function (options) {
        this.options = _.defaults(options, this.optionDefaults);
        this.hints=this.genHints();
        return this.options;
    };
    /** Tests the rule and returns true, false, or an AssertionError **/
    Rule.prototype.testAndTell = function (card, lastCards, allCards) {
        chai.expect(card).to.be.a('object');
        chai.expect(lastCards).to.be.a('array');
        chai.expect(allCards).to.be.a('array');

        var result;
        var reason;
        try {
            result = this.ruleFunc(card, lastCards, allCards, this.options);
            if (result instanceof chai.Assertion){
                reason=result;
                result=true;
            }
        } catch (e) {
            if (e instanceof chai.AssertionError){
                result = false;
                reason=e;
            } else {throw(e);}
        }
        return {result:result,reason:reason};
    };
    Rule.prototype.test = function (card, lastCards, allCards) {
        var res = this.testAndTell(card,lastCards,allCards);
        return res.result;
    };
    /** Describe rule using set options **/
    Rule.prototype.describe = function () {
        return this.describeVariation(this.options);
    };
    /** Compile description using options to express rule**/
    Rule.prototype.describeVariation = function (options) {
        var compiled = _.template(this.description);
        return compiled(_.defaults(options,this.options));
    };
    /** Return options string for humans **/
    Rule.prototype.describeOptions = function () {
        var s = "";
        // explicit python style
        var template = '{{option}} \n\tDescription: {{description}}\n\tType {{type}} \n\tValues: current:{{current}}, default:{{defaultVal}}, all:[{{possibleVals}}]\n ';
        // jsdoc style I think
        // var template = '{{type}}\t[{{option}}={{defaultVal}}]\t{{description}}. ({{current}})[{{possibleVals}}]\n';
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                var tmplParams = _.defaults({option:option,defaultVal:this.optionDefaults[option],current:this.options[option]},this.optionDesc[option]);
                s+=_.template(template)(tmplParams);
            }
        }
        return s;
    };
    /** Describe all variations on the default options **/
    Rule.prototype.describeVariations = function () {
        var s="";
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                var vals = this.optionDesc[option].possibleVals;
                for (var i = 0; i < vals.length; i++) {
                    var options={};
                    options[option]=vals[i];
                    s+=this.describeVariation(options)+'\n';
                }

            }
        }
        return s;
    };
    /** Get next hint **/
    Rule.prototype.nextHint = function () {
        var hint = this.hints[this.hintsUsed];
        this.hintsUsed++;
        return hint||"";

    };
    /** Generate an automatic hint from params **/
    Rule.prototype.genHints = function () {
        // first manual hints
        this.hintsUsed=0;
        var hints = [];

        // compile hints for each unused property
        // this onl handles one unused property per hint

        // get all unused options
        var unusedOptions = {};
        for (var option in this.optionDesc) {
            if (this.optionDesc.hasOwnProperty(option)) {
                // for each option find any unused options
                var posVals = this.optionDesc[option].possibleVals;
                if (posVals){
                    var optionUnused = _.difference(posVals,[this.options[option]]);
                    unusedOptions[option+'Unused']=optionUnused;
                }
            }
        }

        // copy options
        var tmplParams = _.extend({},this.options);


        // make hint from unused options if there are hint templates for them
        for (var optionUnused in unusedOptions) {
            if (unusedOptions.hasOwnProperty(optionUnused)) {

                // find hint templats that take this unused option
                for (var i = 0; i < this.hintTmpls.length; i++) {
                    var tmpl = this.hintTmpls[i];
                    if (tmpl.indexOf(optionUnused)>=0){
                        var tmplCmp = _.template(tmpl);
                        var unused = unusedOptions[optionUnused];
                        // generate a hint for each unsed options
                        for (var j = 0; j < unused.length; j++) {
                            tmplParams[optionUnused]=unused[j];
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
        hints.push("That's all the hints for this rule. But don't forget to check for hints for the overall game. This is a game of inductive logic to try to disprove rules.");
        hints.push("You cheeky blighter. Feel free to restart the game to get a new rule if this one is no fun (it will happen).");

        // and finally remove duplicate hints
        hints=_.uniq(hints);

        return hints;
    };

    /** How many combination of this rule **/
    Rule.prototype.combinations = function (arguments) {
        var pos = _.map(this.optionDesc,'possibleVals');
        var c=0;
        for (var i = 0; i < pos.length; i++) {
            c*pos[i].length;
        }
        return c;
    };
    // TODO estimate hardness perhaps through simulation, combinatorics or hints


    // Now defined actual rules
    var rules = [];

    rules.push(
        // here is a example rule where the card must have differen't color etc from the last card
        // but it's abstracted to allow variations
        new Rule(
            "Next card must not have the same {{property}} as the last {{n}}'th card",
            function (card, lastCards, allCards, options) {
                var lastNCard = lastCards[this.options.n-1];
                var property = this.options.property;
                return chai.expect(card)
                    .to.have.property(property)
                    .not.equal(lastNCard[property]);
            },
            {
                property: 'color',
                n: 1
            },
            {
                property: {
                    description: 'The property to compare in last and current card',
                    possibleVals: ['color','face','number','value','suit'],
                    type: 'String'
                },
                n: {
                    description: 'Number for how many cards back. Start counting at 1',
                    possibleVals: [1,2,3],
                    type: 'Number'
                }
            },
            [
                'This rule does not involve {{propertyUnused}}',
                // 'This rule does not involve the {{nUnused}}th last card',
                'This rule does involve {{property}}',
                'This rule does involve the {{n}}th last card',
            ]
        )
    );


    return {
        Rule: Rule,
        rules: rules,
    };


})(_);
