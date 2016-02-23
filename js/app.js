/**
 * Define the angular app
 */
'use strict';
var app = (function () {
    Helpers.validateSaveVersion();

    // init game
    // var game = new Game();
    //
    //
    // var lab = game.lab;
    // var elements = game.elements;
    // var workers = game.workers;
    // var upgrades = game.upgrades;
    // var achievements = game.achievements;
    // var allObjects = game.allObjects;
    // var lastSaved;

    var app = angular.module('scienceAlchemy', ['ngDragDrop']);

    // directives

    /** Change scope values on window resize **/
    app.directive('resize', function ($window) {
        return function (scope, element, attr) {
            // make window into an angular element
            var w = angular.element($window);
            // watch window h&w, onchange scope
            scope.$watch(
                function () {
                    return {
                        'h': w.height(),
                        'w': w.width()
                    };
                },
                function (newValue, oldValue) {
                    // update scope values
                    scope.windowHeight = newValue.h;
                    scope.windowWidth = newValue.w;

                    // new function
                    scope.resizeWithOffset = function (offsetH) {
                        scope.$eval(attr.notifier);
                        return {
                            'height': (newValue.h - offsetH) + 'px'
                                //,'width': (newValue.w - 100) + 'px'
                        };
                    };

                },
                true
            );

            // update scope on resize event
            w.bind('resize', function () {
                scope.$apply();
            });
        }
    });


    // factories to provide game objects
    app.factory('elements', function () {
        var elements = Helpers.loadFile('json/elements.json');
        elements = elements.map(
            function (r) {
                return new GameObjects.Element(r);
            });
        return elements
    });

    app.factory('game', function () {
        var game = new Game();
        game.load();
        return game;
    });

    app.factory('detector', function () {
        var detector = new Detector();
        detector.init(400);
        return detector;
    });

    // add helpers as filters
    app.filter('niceNumber', ['$filter', function ($filter) {
        return Helpers.formatNumberPostfix;
    }]);

    app.filter('niceTime', ['$filter', function ($filter) {
        return Helpers.formatTime;
    }]);

    app.filter('currency', ['$filter', function ($filter) {
        return function (input) {
            return 'JTN ' + $filter('niceNumber')(input);
        };
    }]);

    app.filter('reverse', ['$filter', function ($filter) {
        return function (items) {
            return items.slice().reverse();
        };
    }]);



    // controllers
    app.controller('DetectorController', ['$scope','game','detector', function ($scope,game,detector) {
        // this.detector.init(400);
        this.dropOptions = {
            //   accept: ".rune",
            addClasses: true,
            // greedy: true,
            // tolerance: "pointer",
            activeClass: "ui-state-hover",
            hoverClass: "ui-state-active",
        }
        this.onDrop = function (event, ui) {
            detector.onDrop(event, ui, game);
        }
        this.click = function () {
            game.lab.clickDetector();
            detector.addEvent();
            UI.showUpdateValue("#update-data", game.lab.state.detector);
            return false;
        };
        this.toggleFlameFuel = function () {
            console.log('toggleFlameFuel');
            detector.flame.toggleFuel();
        }
    }]);

    app.controller('ElementController', ['$scope', '$compile','game','detector', function ($scope, $compile,game,detector) {
        this.dragOptions = {
            revert: true, //"invalid",
            zIndex: 100,
            // helper: "clone", // drags a clone
            // opacity: 0.75,
            // start: this.onRuneDrop.bind(this),
            // stop: this.onRuneDrop.bind(this),
            cancel: false,
            // containment:false
        };
        this.elements = game.elements;
        this.isVisible = function (item) {
            return item.isVisible(game.lab);
        };
        this.isAvailable = function (item) {
            return item.isAvailable(game.lab);
        };
        this.doElement = function (item) {
            var cost = item.element(game.lab);
            if (cost > 0) {
                UI.showUpdateValue("#update-data", -cost);
                UI.showUpdateValue("#update-reputation", item.state.reputation);
            }
        };
        this.showInfo = function (r) {
            UI.showModal(r.name, r.getInfo());
            UI.showLevels(r.state.level);
        };
    }]);

    app.controller('LabController', ['$interval','game','detector', function ($interval,game,detector) {
        this.lab = game.lab;
        this.showDetectorInfo = function () {
            if (!this._detectorInfo) {
                this._detectorInfo = Helpers.loadFile('html/detector.html');
            }
            UI.showModal('Detector', this._detectorInfo);
        };
        $interval(function () { // one tick
            var grant = game.lab.getGrant();
            UI.showUpdateValue("#update-funding", grant);
            var sum = 0;
            for (var i = 0; i < game.workers.length; i++) {
                sum += game.workers[i].state.hired * game.workers[i].state.rate;
            }
            if (sum > 0) {
                game.lab.acquireData(sum);
                UI.showUpdateValue("#update-data", sum);
                detector.addEventExternal(game.workers.map(function (w) {
                    return w.state.hired;
                }).reduce(function (a, b) {
                    return a + b
                }, 0));
            }
        }, 1000);
    }]);

    app.controller('HRController', ['$scope','game', function ($scope,game) {
        this.workers = game.workers;
        this.isVisible = function (worker) {
            return worker.isVisible(game.lab);
        };
        this.isAvailable = function (worker) {
            return worker.isAvailable(game.lab);
        };
        this.hire = function (worker) {
            var cost = worker.hire(game.lab);
            if (cost > 0) {
                UI.showUpdateValue("#update-funding", -cost);
            }
        };
    }]);

    app.controller('UpgradesController', ['$scope','game', function ($scope,game) {
        this.upgrades = game.upgrades;
        this.isVisible = function (upgrade) {
            return upgrade.isVisible(game.lab, game.allObjects);
        };
        this.isAvailable = function (upgrade) {
            return upgrade.isAvailable(game.lab, game.allObjects);
        };
        this.upgrade = function (upgrade) {
            if (upgrade.buy(game.lab, game.allObjects)) {
                UI.showUpdateValue("#update-funding", upgrade.cost);
            }
        }
    }]);

    app.controller('AchievementsController', function ($scope,game) {
        $scope.achievements = game.achievements;
        $scope.progress = function () {
            return game.achievements.filter(function (a) {
                return a.validate(game.lab, game.allObjects, game.lastSaved);
            }).length;
        };
    });

    app.controller('SaveController', ['$scope', '$interval','game', function ($scope, $interval,game) {
        game.lastSaved = new Date().getTime();
        $scope.lastSaved = game.lastSaved;
        $scope.saveNow = function () {
            var saveTime = new Date().getTime();
            game.lab.state.time += saveTime - game.lastSaved;
            game.save();
            game.lastSaved = saveTime;
            $scope.lastSaved = game.lastSaved;
        };
        $scope.restart = function () {
            if (window.confirm(
                    'Do you really want to restart the game? All progress will be lost.'
                )) {
                ObjectStorage.clear();
                window.location.reload(true);
            }
        };
        $interval($scope.saveNow, 10000);
    }]);

    app.controller('StatsController', ['$scope','game',function ($scope, game) {
        $scope.lab = game.lab;
    }]);

    analytics.init();
    analytics.sendScreen(analytics.screens.main);
})();
