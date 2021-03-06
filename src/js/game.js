/**
 * Game object load/saves game resources and stores game objects
 */
import ObjectStorage from 'js/storage.js';
import * as Helpers from './helpers'
import GameObjects from './gameobjects';
import * as Rules from './rules.js';
import cards from 'json/cards.json';
import achievements from 'json/achievements.json';
import ruleSimulations from 'json/simulations.json';

var Game = (function (Helpers, GameObjects, ObjectStorage,Rules,cards,achievements) {
    'use strict';

    var Game = function () {
        this.lab = null;
        this.cards = null;
        this.workers = null;
        this.upgrades = null;
        this.achievements = null;
        this.allObjects = {
            // lab: this.lab
        };
        this.loaded = false;

        this.hypotheses = [];
        this.lastCards= [];
        this.hints=[];
        this.ruleInfo=[];
        this.incorrectCards= [];
        this.rule=undefined;
        this.rules=Rules.rules;
        this.Rule=Rules.Rule;
    };

    Game.prototype.load = function ($http, $q) {
        var self = this;
        if (this.loaded) {
            return;
        }

        this.cards = cards; //Helpers.loadFile('json/cards.json');
        this.achievements = require("json/achievements.json"); //Helpers.loadFile('./json/achievements.json');

        // Turn JSON files into actual game objects and fill map of all objects
        var makeGameObject = function (type, object) {
            // It's okay to define this function here since load is only called
            // once anyway...
            var o = new type(object);
            self.allObjects[o.key] = o;
            return o;
        };
        self.cards = self.cards.map(
            function (r) {
                return makeGameObject(GameObjects.Card, r);
            });
        self.achievements = self.achievements.map(
            function (a) {
                return makeGameObject(GameObjects.Achievement, a);
            });


        // put cards in extended array with utility methods
        self.Card = new GameObjects.Cards();
        self.Card.push.apply(self.Card, self.cards);
        self.cards = self.Card;

        // add rules to load and save states
        self.rules.map(function(o){
            self.allObjects[o.key] = o;
        });

        // TODO save and load lastCards and incorrectCards

        // Load states from local store
        for (var key in self.allObjects) {
            var o = self.allObjects[key];
            o.loadState(ObjectStorage.load(key));
        }

        self.loaded = true;
        return self;
    };

    Game.prototype.reset = function () {
        // setup game
        this.rule = this.newRule();

        this.dealHand();

        // deal new initial cards that follow the rule
        function getInitialCards(rule,cards){
            function _getInitialCards(rule,cards){
                var lastCards = [angular.copy(_.sample(cards))]
                var error,i;
                for (i = 0; i < 52; i++) {
                    if (lastCards.length>2) break; // stop here
                    var card = angular.copy(_.sample(cards));
                    var res;
                    try{
                        res = rule.test(card,lastCards,cards);
                    } catch(e){
                        error=e;
                        // in case of an error just add a random card
                        // this is probobly because it is looking back 2 or 3 cards
                        // yet we only have 1
                        if (e instanceof TypeError && e.message.endsWith("of undefined"))
                        lastCards.push(card);
                        else
                        throw e
                    }
                    if (res) lastCards.push(angular.copy(card));
                }
                if (lastCards.length<3) {
                    console.warn(
                        'Could not deal cards for rule after:',
                        i,
                        rule.key,
                        rule.options,
                        rule.describe(),
                        _.map(lastCards,'key'),
                        error?error.message:''
                    );
                    // feck, just deal 3 random then
                    return null

                } else {
                    return lastCards
                }
            }
            for (var i = 0; i < 100; i++) {
                var initialCards = _getInitialCards(rule,cards)
                if (initialCards) break
            }
            if (!initialCards) {
                throw new Error('Could not deal cards for rule after:' +' ' +
                    i +' ' +
                    this.rule.key +' ' +
                    this.rule.options +' ' +
                    this.rule.describe() +' ' +
                    _.map(this.lastCards,'key') +' ' +
                    error?error.message:'')
            }
            return initialCards
        }

        let initialCards = getInitialCards(this.rule,this.cards)
        this.lastCards.splice(0,this.lastCards.length);
        this.lastCards.push.apply(this.lastCards,initialCards);

        this.ruleInfo.splice(0,this.ruleInfo.length);
        this.hints.splice(0,this.hints.length);

        // empty incorrect cards
        this.incorrectCards.splice(0,this.incorrectCards.length);
        this.incorrectCards.push([]);
        this.incorrectCards.push([]);
        this.incorrectCards.push([]);

        // reset score
        this.lab.state.score = 200;

        // new set of hypothes
        this.hypotheses=this.genHypotheses();

        return this;
    };

    Game.prototype.genHypotheses = function () {
        // get some hypotheses
        var hypo=[];

        // a random 2, 2 variations of each
        for (var i = 0; i < 1; i++) {
            var rule = _.sample(this.rules);
            rule = angular.copy(rule);
            rule.randomize();
            hypo.push(rule);
            rule = angular.copy(rule);
            rule.randomize();
            hypo.push(rule);
        }

        // add the real rule
        var rule = angular.copy(this.rule);
        hypo.push(rule);

        // and a variation of the real rule
        var rule = angular.copy(this.rule);
        rule.randomize();
        hypo.push(rule);

        // clean and remember
        hypo = _.uniq(hypo);
        hypo = _.shuffle(hypo);

        // empty old ones
        this.hypotheses.splice(0,this.hypotheses.length);
        // put in new ones
        for (var i = 0; i < hypo.length; i++) {
            this.hypotheses.push(hypo[i]);
        }
        return this.hypotheses;
    };

    Game.prototype.newRule = function () {
        // FIXME
        var okRules = _.filter(ruleSimulations,function(s){
            return s.ratioRight>0.1&&s.ratioRight<0.6;
        });
        // var okRules = this.rules;
        // _.map(this.rules,function(r){return r.randomize();});
        // choose and ok rule
        var ruleConfig = _.sample(okRules);
        // now find the rule and set these options
        var rule = _.find(this.rules,{key:ruleConfig.key});
        var options = ruleConfig.options;
        if (typeof options==="string") options = JSON.parse(options);
        rule.setOptions(options);
        return this.rule = rule;
    };

    Game.prototype.dealHand = function (n) {
        n=n||12;

        var sample=_.sampleSize(this.cards,n);

        // empty all cards
        this.cards.map(function(card){
            card.state.amount=0;
        });
        // now increase the value of our sample
        for (var i = 0; i < sample.length; i++) {
            var card = sample[i];
            this.cards.get(card.key).state.amount++;
        }
    };
    Game.prototype.onClick = function (event, ui) {
        var self=this;
        console.debug('onClick',arguments);

        var cardType = angular.element(ui.draggable).data('cards');
        var card = _.find(this.cards,{key:cardType});
        return this.play(card);
    };
    Game.prototype.onDrop = function (event, ui) {
        var self=this;
        console.debug('onDrop',arguments);

        var cardType = angular.element(ui.draggable).data('cards');
        var card = _.find(this.cards,{key:cardType});
        return this.play(card);
    };
    Game.prototype.play = function (card) {
        var self=this;
        card.state.amount-=1;

        var turn = this.lastCards.length-1;
        var correct = this.test(card);
        if (correct){
            if(!this.incorrectCards[turn]) this.incorrectCards[turn]=[];
            this.lastCards.push(angular.copy(card));
            if(!this.incorrectCards[turn+1]) this.incorrectCards[turn+1]=[];
            this.lab.state.score+=1;
        } else {
            // add incorrect one to sidelines
            if (!this.incorrectCards[turn]) this.incorrectCards[turn]=[];
            this.incorrectCards[turn].push(angular.copy(card));

            // deal 2 random cards
            _.sample(this.cards).state.amount+=1;
            _.sample(this.cards).state.amount+=1;
            this.lab.state.score-=2;
        }
        return correct;
    };
    /** Test the rule **/
    Game.prototype.test = function (card) {
        return this.rule.test(card,this.lastCards,this.cards);
    };
    Game.prototype.save = function () {
        // Save every object's state to local storage
        for (var key in this.allObjects) {
            ObjectStorage.save(key, this.allObjects[key].state);
        }
    };

    return Game;
}(Helpers, GameObjects, ObjectStorage,Rules,cards,achievements));

export default Game
