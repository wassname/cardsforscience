'use strict';

/* jasmine specs for filters go here */
var allCards;
beforeEach(function(){
    allCards = Helpers.loadFile('json/elements.json');
});

describe('Rules', function () {
    var card, lastCards;

    beforeEach(
        module('Rules')
    );

    beforeEach(function(){
        lastCards = _.sampleSize(allCards,4);
        card = _.sample(allCards);
    });

    describe('Rule', function () {
        it('should test false on false', function () {
            var rule = new Rules.Rule('1',function(){return false;},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(false);
        });
        it('should test false on assertion error', function () {
            var rule = new Rules.Rule('2',function(){return chai.expect(1).to.equal(0);},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(false);
        });
        it('should test true on assertion', function () {
            var rule = new Rules.Rule('3',function(){return chai.expect(1).to.equal(1);},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(true);
        });
        it('should test true on true', function () {
            var rule = new Rules.Rule('4',function(){return true;},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(true);
        });
        it('should throw test on error', function () {
            var rule = new Rules.Rule('5',function(){throw new Error('test');return true;},{},{},[]);
            expect(function(){
                rule.test(card,lastCards,allCards);
            }).toThrow();
        });
    });
    Rules.rules.forEach(function(rule){
        describe('rule: "'+rule.describe()+'"', function () {
            it('should test', function () {
                var res = rule.test(card,lastCards,allCards);
                Boolean(res);
            });
            it('should describe itself', function () {
                var desc = rule.describe();
                expect(typeof desc).toBe('string');
                expect(desc).not.toContain(/[{}]+/);
            });
            it('should describeOptions', function () {
                var desc = rule.describeOptions();
                expect(typeof desc).toBe('string');
                expect(desc).not.toContain(/[{}]+/);
            });
            it('should describeVariations', function () {
                var desc = rule.describeVariations();
                expect(desc instanceof Array).toBe(true);
                expect(desc).not.toContain(/[{}]+/);
            });
            it('should genHints', function () {
                var hints = rule.genHints();
                expect(hints instanceof Array).toBe(true);
                expect(hints.length).toBeGreaterThan(0);
                expect(hints.join('')).not.toContain(/[{}]+/);
            });
            it('should set options', function () {
                var opts1 = rule.options;
                var opts = rule.setOptions({a24tgsdgtg43t5fd:1});
                expect(typeof opts).toBe('object');
                expect(opts).not.toEqual(opts1);
            });
            it('should randomize', function () {
                var opts1 = rule.options;
                var opts = rule.randomize();
                expect(typeof opts).toBe('object');
                expect(opts).not.toEqual(opts1);
            });


            // now check each rule permutation
            var options=Object.keys(rule.optionDesc);
            options.forEach(function(option){
                var vals = rule.optionDesc[option].possibleVals;
                var def = rule.optionDefaults[option];
                describe('option: '+option, function () {
                    for (var i = 0; i < vals.length; i++) {
                        it('should test with val: '+vals[i],function(){
                            var options={};
                            options[option]=vals[i];
                            rule.setOptions(options);
                            var res = rule.test(card,lastCards,allCards);
                            expect(typeof res).toBe('boolean');
                        });
                    }

                    it('default should be in possible vals '+option+' = '+vals[i],function(){
                        expect(vals).toEqual(jasmine.arrayContaining([def]));
                    });
                });

            });


        });
    });
});

describe('Rules compilation', function () {
    var $compile,
        $rootScope;

    beforeEach(
        module('scienceAlchemy')
    );

    // Store references to $rootScope and $compile
    // so they are available to all tests in this describe block
    beforeEach(inject(function (_$compile_, _$rootScope_) {
        // The injector unwraps the underscores (_) from around the parameter names when matching
        $compile = _$compile_;
        $rootScope = _$rootScope_;
    }));

    Rules.rules.forEach(function(rule){
        describe('rule: "'+rule.describe()+'"', function () {
            it('should render using cfs-rule directive', function () {

                // define a rule for testing
                $rootScope.rule = Rules.rules[0];

                // Compile a piece of HTML containing the directive
                var element = $compile('<div cfs-rule="rule" ng-model="rule"></div>')($rootScope);

                // fire all the watches, so the scope expressions will be evaluated
                // $rootScope.$digest();
                $rootScope.$apply();

                // Check that the compiled element contains the templated content
                var html = element.html();
                expect(html).toContain("<select");
                expect(html).toContain("<option");
                expect(html).toContain("Next card must not have the same");
            });
        });
    });
});
