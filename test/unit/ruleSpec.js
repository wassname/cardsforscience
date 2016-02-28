'use strict';

/* jasmine specs for filters go here */
var allCards;


describe('Rules', function () {
    var card, lastCards,Rule,rules;
    beforeEach(module('cardsForScience'));
    beforeEach(inject(function (game) {
        allCards=game.cards;
        lastCards = _.sampleSize(allCards,4);
        card = _.sample(allCards);
        Rule=game.Rule;
        rules=game.rules;
    }));

    describe('Rule', function () {
        it('should test false on false', function () {
            var rule = new Rule('1',function(){return false;},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(false);
        });
        it('should test false on assertion error', function () {
            var rule = new Rule('2',function(){return chai.expect(1).to.equal(0);},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(false);
        });
        it('should test true on assertion', function () {
            var rule = new Rule('3',function(){return chai.expect(1).to.equal(1);},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(true);
        });
        it('should test true on true', function () {
            var rule = new Rule('4',function(){return true;},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(true);
        });
        it('should throw test on error', function () {
            var rule = new Rule('5',function(){throw new Error('test');return true;},{},{},[]);
            expect(function(){
                rule.test(card,lastCards,allCards);
            }).toThrow();
        });
    });
    describe('Each rule', function () {
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
});
