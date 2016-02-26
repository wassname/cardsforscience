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
        describe('rule', function () {
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
                expect(typeof desc).toBe('string');
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

            // now check each rule permutation
            var options=Object.keys(rule.optionDesc);
            options.forEach(function(option){
                var vals = rule.optionDesc[option].possibleVals;
                for (var i = 0; i < vals.length; i++) {
                    it('should test with option: '+option+' = '+vals[i],function(){
                        var options={};
                        options[option]=vals[i];
                        rule.setOptions(options);
                        var res = rule.test(card,lastCards,allCards);
                        Boolean(res);
                    });
                }

            });


        });
    });
});
