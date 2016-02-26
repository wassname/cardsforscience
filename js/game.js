/**
 * Game object load/saves game resources and stores game objects
 */
var Game = (function (Helpers, GameObjects, ObjectStorage) {
    'use strict';

    var Game = function () {
        // this.lab = new GameObjects.Lab();
        this.elements = null;
        this.workers = null;
        this.upgrades = null;
        this.achievements = null;
        this.allObjects = {
            // lab: this.lab
        };
        this.loaded = false;
        this.rules = null;
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
        this.workers = Helpers.loadFile('/json/workers.json');
        this.upgrades = Helpers.loadFile('./json/upgrades.json');
        this.achievements = Helpers.loadFile('./json/achievements.json');
        this.keywords = Helpers.loadFile('./json/keywords.json');

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
        self.workers = self.workers.map(
            function (w) {
                return makeGameObject(GameObjects.Worker, w);
            });
        self.upgrades = self.upgrades.map(
            function (u) {
                return makeGameObject(GameObjects.Upgrade, u);
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
        // var totalElements = _(self.elements).map('state.amount').sum();
        // if (totalElements<1) self.initialElements();


        self.rules = self.generateRules();

        self.loaded = true;
        return self;
        // });
    };

    Game.prototype.initialElements = function () {
        // if we are making new rules we will also reset element stores
        this.elements.map(function (element) {
            element.state.amount = 0;
            element.state.discovered = false;
            element.state.interesting = false;
        });
        // but give us a random 4 number cards of one suite
        var startSuit = _.sample(["Spades", "Hearts", "Diamonds", "Clubs"]);

        this.elements.map(function (element) {
            if (element.number && element.suit === startSuit) {
                element.state.amount = 5;
                element.state.discovered = true;
            }
        });
        console.log('Set initial cards');
        return startSuit;
    }

    /** Generate rules between runes **/
    Game.prototype.generateRules = function () {

            /**
             * Make the values sequential for given card names
             * @param  {Array} names - String names e.g. ['King','Queen']
             * @param  {Object} rules - Rules
             * @return {Object}       - modified Rules
             */
            function orderValues(names, rules, reverse) {
                var namedCards = _.filter(elements, function (c) {
                    return names.indexOf(c.name) > -1;
                });
                var uNamedCardVals = _.uniq(_.map(namedCards, 'value'));
                var maxVal = _.max(uNamedCardVals);
                var initialValue = rules.value[uNamedCardVals[0]];
                for (var i = 0; i < uNamedCardVals.length; i++) {
                    var v = uNamedCardVals[i];
                    if (reverse)
                        rules.value[v] = initialValue + maxVal - v;
                    else
                        rules.value[v] = initialValue + v;
                }
                return rules;
            }

            var rules = ObjectStorage.load('rules');
            if (!rules) {

                var startSuit = this.initialElements();

                var elements = this.elements;
                var attrs = ["key", "name", "value", "suit", "color", "royal", "face", "number"];
                var rules = {};

                // first lets apply random values to each attribute
                for (var i = 0; i < attrs.length; i++) {
                    var attr = attrs[i];
                    rules[attr] = {};
                    var uniqVals = _.uniq(_.map(elements, attr));
                    for (var j = 0; j < uniqVals.length; j++) {
                        var v = uniqVals[j];
                        // E.g. rules.suit.black=4, rules.name.Queen=10 etc
                        rules[attr][v] = Math.round(Math.random() * 104);
                    }
                }

                // now lets overide some attrbutes with a bit more order

                // number cards should be in sequence as should face cards
                // _.uniq(_.map(_.filter(cards,{face:'true'}),'value'))
                var royals = ["Jack", "Knight", "Queen", "King"];
                var numbers = ["Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
                // lets randomly add the ace to the top or bottom
                if (Math.random() > 0.5) {
                    royals.push("Ace");
                } else {
                    numbers.push("Ace");
                }
                orderValues(royals, rules);
                orderValues(numbers, rules);

                // and make the startingSuit 0 for a simpler set of initial rules
                rules.suit[startSuit] = 0;

                // and finally get the joker a change for a negative
                rules.value[16] = Math.random(Math.random() * 20 - 10);



                console.log('Reset and made new rules');

            }
            ObjectStorage.save('rules', rules);
            return rules;
        },
        /**
         * Test the rules
         * @param  {array} inputKeys - e.g ["🂤", "🂤"]
         * @return {Object}           rule with {inputs,reactants,results}
         */
        Game.prototype.testRules = function (inputKeys) {
            var self = this;
            var attrs = ["value", "suit"]; // attrs we use, possible expand later


            // work out total for this combo
            var total = 0;
            for (var i = 0; i < inputKeys.length; i++) {
                var key = inputKeys[i];
                var element = _.find(self.elements, {
                    key: key
                });
                for (var j = 0; j < attrs.length; j++) {
                    var attr = attrs[j];
                    // add appropriate value for this card's attribute
                    // e.g. total+=rules.suit["spade]
                    total += self.rules[attr][element[attr]];
                }
            }

            // you keep you results and thus get more cards unless the total is
            // <5
            var maxValue = 14; //=_(self.elements).map('value').map(function(v){return parseInt(v);}).max()
            var divisor = Math.round(maxValue * 3); // ~66% chance of dud if they don't understand rules
            var value = total % maxValue;
            var resultElem = _.find(self.elements, {
                value: value
            });
            var reactants = resultElem ? inputKeys : [];
            var results = resultElem ? [resultElem.key] : [];
            // TODO add penalty for duds? like more cards

            return {
                results: results,
                inputs: inputKeys,
                conditions: [],
                catalysts: [],
                reactants: reactants
            };
        };
    Game.prototype.save = function () {
        // Save every object's state to local storage
        for (var key in this.allObjects) {
            ObjectStorage.save(key, this.allObjects[key].state);
        }
    };

    return Game;
}(Helpers, GameObjects, ObjectStorage));
