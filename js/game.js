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
            self.elements = self.elements.slice(0, 20).map(
                function (r) {
                    return makeGameObject(GameObjects.ElementStore, r);
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
            self.elementStore = new GameObjects.ElementStores();
            self.elementStore.push.apply(self.elementStore, self.elements);
            self.elements = self.elementStore;

            self.rules = self.generateRules();

            self.loaded = true;
            return self;
        // });
    };

    /** Generate rules between runes **/
    Game.prototype.generateRules = function () {
            var rules = ObjectStorage['rules'];
            if (!rules) {
                var elements = this.elements;
                // generate rules and store them with a hash of inredients
                // the rule will be an object with reactants, catalysts, conditions, results
                // todo make a strcture that's more like a tree with progression etc
                // todo add duds, misleading ones, explosions wildcards
                // todo make this theory based?
                // todo simulation
                var rules = {};
                for (var k = 0; k < this.elements.length * 20; k++) {
                    // make a rules
                    var rule = {
                        reactants: [],
                        catalysts: [],
                        conditions: [],
                        results: [],
                        inputs: []
                    }
                    var numOfIngredients = 2 + Math.round(Math.random() * 2);
                    for (var i = 0; i < numOfIngredients; i++) {
                        var j = Math.round(Math.random() * (elements.length - 1));
                        rule.reactants.push(elements[j].key);
                    }

                    if (Math.random() < 0.1) {
                        var j = Math.round(Math.random() * (elements.length - 1));
                        rule.catalysts.push(elements[j].key);
                    }
                    var numOfresults = Math.round(Math.random() * 3);
                    for (var i = 0; i < numOfresults; i++) {
                        var j = Math.round(Math.random() * (elements.length - 1));
                        rule.results.push(elements[j].key);
                    }
                    rule.inputs = [].concat(rule.reactants, rule.catalysts)
                    rule.reactants.sort()
                    rule.results.sort()
                    rule.catalysts.sort()
                    rule.inputs.sort();
                    // index byhash of sorted array of reactants
                    rules[rule.inputs] = rule
                }

            }
            ObjectStorage['rules'] = rules;
            return rules;
        },
        Game.prototype.save = function () {
            // Save every object's state to local storage
            for (var key in this.allObjects) {
                ObjectStorage.save(key, this.allObjects[key].state);
            }
        };

    return Game;
}(Helpers, GameObjects, ObjectStorage));
