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
            var rule = new Rule('1','1',function(){return false;},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(false);
        });
        it('should test false on assertion error', function () {
            var rule = new Rule('2','2',function(){return chai.expect(1).to.equal(0);},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(false);
        });
        it('should test true on assertion', function () {
            var rule = new Rule('3','3',function(){return chai.expect(1).to.equal(1);},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(true);
        });
        it('should test true on true', function () {
            var rule = new Rule('4','4',function(){return true;},{},{},[]);
            var res = rule.test(card,lastCards,allCards);
            expect(res).toBe(true);
        });
        it('should throw test on error', function () {
            var rule = new Rule('5','5',function(){throw new Error('test');return true;},{},{},[]);
            expect(function(){
                rule.test(card,lastCards,allCards);
            }).toThrow();
        });
    });
    describe('Each rule', function () {
        Rules.rules.forEach(function(rule){
            describe('rule: "'+rule.key+'"', function () {

                it('should describeVariations', function () {
                    var desc = rule.describeVariations();
                    expect(desc instanceof Array).toBe(true);
                    expect(desc).not.toContain(/[{}]+/);
                });

                it('should describeOptions', function () {
                    var desc = rule.describeOptions();
                    expect(typeof desc).toBe('string');
                    expect(desc).not.toContain(/[{}]+/);
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

                for (var option in rule.optionDefaults) {
                    if (rule.optionDefaults.hasOwnProperty(option)) {
                        var def = rule.optionDefaults[option];
                        var vals = rule.optionDesc[option].possibleVals;
                        it('defaults should be in possible vals '+option,function(){
                            expect(vals).toEqual(jasmine.arrayContaining([def]));
                        });
                    }
                }

            });

            // now check each rule permutation
            rule.optionsPossible.forEach(function(options){

                describe('rule: "'+rule.describe()+'"', function () {
                    beforeEach(function () {
                        rule.setOptions(options);
                    });
                    it('should describe itself', function () {
                        var desc = rule.describe();
                        expect(typeof desc).toBe('string');
                        expect(desc).not.toContain(/[{}]+/);
                    });
                    it('should test', function () {
                        var res = rule.test(card,lastCards,allCards);
                        Boolean(res);
                    });
                    it('should genHints', function () {
                        var hints = rule.genHints();
                        expect(hints instanceof Array).toBe(true);
                        expect(hints.length).toBeGreaterThan(0);
                        expect(hints.join('')).not.toContain(/[{}]+/);
                    });
                    describe('simulation',function(){

                        it('should have more than 10% right and less than 60%',function(){
                            var simulation=rule.simulateOne(options,allCards,52*2);
                            expect(simulation).not.toEqual(undefined);
                            expect(simulation.ratioRight).toBeLessThan(0.6);
                            expect(simulation.ratioRight).toBeGreaterThan(0.1);
                            expect(simulation.error).toBe(0);
                            // if (simulation.wrong){
                            //     expect(_.uniq(simulation.wrongs)[0].length).toBeGreaterThan(0);
                            // }
                        });
                    });
                    // it should give reasons
                    // it should not give errors
                });
            });
        });
    });
});
