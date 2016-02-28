/**
 * Game object load/saves game resources and stores game objects
 */
var ObjectStorage = require("js/storage");
var Helpers = require("js/helpers");
var GameObjects = require("js/gameobjects");
var Rules = require("js/rules.js");
var Game = module.exports =(function (Helpers, GameObjects, ObjectStorage,Rules) {
    'use strict';

    var Game = function () {
        this.lab = null;
        this.elements = null;
        this.workers = null;
        this.upgrades = null;
        this.achievements = null;
        this.allObjects = {
            // lab: this.lab
        };
        this.loaded = false;
        this.rules = Rules.rules;
        this.rule=undefined;

        this.lastCards= [];
        this.incorrectCards= [];
    };

    Game.prototype.load = function ($http, $q) {
        var self = this;
        if (this.loaded) {
            return;
        }

        // I know synchronous requests are bad as they will block the browser.
        // However, I don't see any other reasonable way to do this in order to
        // make it work with Angular. If you know a way, let me know, and I'll
        // give you a beer. - Kevin
        this.elements = Helpers.loadFile('json/elements.json');
        this.achievements = Helpers.loadFile('./json/achievements.json');

        // function successCallback(response) {
        //     return angular.fromJson(response.data);
        // }
        //
        // function errorCallback(response) {
        //     return console.error('Could not get url', response.statusText, response);
        // }
        // return $q.all(
        //     $http.get('json/elements.json', {
        //         transformResponse: angular.fromJson
        //     })
        //     .then(function (response) {
        //         return self.elements = response.data;
        //     }),
        //     $http.get('json/workers.json', {
        //         transformResponse: angular.fromJson
        //     })
        //     .then(function (response) {
        //         return self.workers = response.data;
        //     }),
        //     $http.get('json/upgrades.json', {
        //         transformResponse: angular.fromJson
        //     })
        //     .then(
        //         function (response) {
        //             return self.upgrades = response.data;
        //         }),
        //     $http.get('json/achievements.json', {
        //         transformResponse: angular.fromJson
        //     })
        //     .then(
        //         function (response) {
        //             return self.achievements = response.data;
        //         }),
        //     $http.get('json/keywords.json', {
        //         transformResponse: angular.fromJson
        //     })
        //     .then(
        //         function (response) {
        //             return self.keywords = response.data;
        //         })
        // ).then(function () {

        // Turn JSON files into actual game objects and fill map of all objects
        var makeGameObject = function (type, object) {
            // It's okay to define this function here since load is only called
            // once anyway...
            var o = new type(object);
            self.allObjects[o.key] = o;
            return o;
        };
        self.elements = self.elements.map(
            function (r) {
                return makeGameObject(GameObjects.Card, r);
            });
        self.achievements = self.achievements.map(
            function (a) {
                return makeGameObject(GameObjects.Achievement, a);
            });
        // Load states from local store
        for (var key in self.allObjects) {
            var o = self.allObjects[key];
            o.loadState(ObjectStorage.load(key));
        }

        // put elements in extended array with utility methods
        self.Card = new GameObjects.Cards();
        self.Card.push.apply(self.Card, self.elements);
        self.elements = self.Card;

        self.loaded = true;
        return self;
    };

    Game.prototype.init = function () {
        // setup game
        this.rule = _.sample(Rules.rules);
        this.rule.randomize();

        // check if we have any cards in hand
        // var totalElements = _(self.elements).map('state.amount').sum();
        // if (totalElements<1) self.dealHand();
        this.dealHand();

        // deal first card
        // TODO make sure these follow rule
        this.lastCards.push.apply(this.lastCards,_.sampleSize(this.elements,3));
        for (var i = 0; i < this.lastCards.length; i++) {
            this.incorrectCards[i]=[];
        }

        // reset score
        this.lab.state.score = 200;
        return self;
    };

    Game.prototype.dealHand = function (n) {
        n=n||12;
        var hand=_.sampleSize(this.elements,n);
        this.elements.map(function(card){
            card.state.amount=0;
        });
        for (var i = 0; i < hand.length; i++) {
            var card = hand[i];
            this.elements.get(card.key).state.amount++;
        }

    };
    Game.prototype.onClick = function (event, ui) {
        var self=this;
        console.debug('onClick',arguments);

        var cardType = angular.element(ui.draggable).data('element');
        var card = _.find(this.elements,{key:cardType});
        return this.play(card);
    };
    Game.prototype.onDrop = function (event, ui) {
        var self=this;
        console.debug('onDrop',arguments);

        var cardType = angular.element(ui.draggable).data('element');
        var card = _.find(this.elements,{key:cardType});
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
            _.sample(this.elements).state.amount+=1;
            _.sample(this.elements).state.amount+=1;
            this.lab.state.score-=2;
        }
        return correct;
    };
    /** Test the rule **/
    Game.prototype.test = function (card) {
        return this.rule.test(card,this.lastCards,this.elements);
    };
    Game.prototype.save = function () {
        // Save every object's state to local storage
        for (var key in this.allObjects) {
            ObjectStorage.save(key, this.allObjects[key].state);
        }
    };

    return Game;
}(Helpers, GameObjects, ObjectStorage,Rules));
