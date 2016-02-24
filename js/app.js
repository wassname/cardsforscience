/**
 * Define the angular app
 */
'use strict';
var app = (function () {
    Helpers.validateSaveVersion();

    var app = angular.module('scienceAlchemy', ['ngDragDrop', 'ui.grid']);

    // directives

    // factories to provide services. They serve shared game objects
    // app.factory('elements', function () {
    //     var elements = Helpers.loadFile('json/elements.json');
    //     elements = elements.map(
    //         function (r) {
    //             return new GameObjects.ElementStore(r);
    //         });
    //     // put in extended array with helper methods
    //     elementStore = new GameObjects.ElementStores();
    //     elementStore.push.apply(elementStore,elements);
    //     return elementStore;
    // });


    function game($http, $q, lab) {
        var game = new Game();
        game.lab=lab;
        var promise = game.load($http, $q);
        // return promise;
        return game;
    };
    game.$inject = ['$http', '$q'];
    app.factory('game', game);

    function lab() {
        if (!this.lab) this.lab = new GameObjects.Lab();
        return this.lab;
    };
    app.factory('lab', lab);

    function detector() {
        var detector = new Detector();
        detector.init(400);
        return detector;
    }
    app.factory('detector', detector);

    // add helpers as filters

    function niceNumber($filter) {
        return Helpers.formatNumberPostfix;
    };
    niceNumber.$inject = ['$filter'];
    app.filter('niceNumber', niceNumber);

    function niceTime($filter) {
        return Helpers.formatTime;
    };
    niceTime.$inject = ['$filter'];
    app.filter('niceTime', niceTime);

    function currency($filter) {
        return function (input) {
            return 'JTN ' + $filter('niceNumber')(input);
        };
    };
    currency.$inject = ['$filter'];
    app.filter('currency', currency);

    function reverse($filter) {
        return function (items) {
            if (items instanceof Array)
                return items.slice().reverse();
            else
                return items;
        };
    };
    reverse.$inject = ['$filter'];
    app.filter('reverse', reverse);

    // controllers
    app.controller('ElementController', ElementController);
    ElementController.$inject = ['$scope', '$compile', 'game', 'detector', 'lab'];

    function ElementController($scope, $compile, game, detector, lab) {
        var vm = this;
        vm.dragOptions = {
            revert: true, //"invalid",
            zIndex: 100,
            // helper: "clone", // drags a clone
            // opacity: 0.75,
            // start: vm.onRuneDrop.bind(vs),
            // stop: vm.onRuneDrop.bind(vs),
            cancel: false,
            // containment:false
        };
        vm.elements = game.elements;
        vm.isVisible = function (item) {
            return item.isVisible(lab);
        };
        vm.isAvailable = function (item) {
            return item.isAvailable(lab);
        };
        vm.onDrop = function (event, ui) {
            // store the dropped element
            var draggable = angular.element(ui.draggable);
            var key = draggable.data('element');
            if (!draggable.hasClass('element-store')) {
                var elementStore = vm.elements.get(key);
                var i = _.findIndex(vm.elements,{$$hashKey:draggable.data('hashkey')});
                detector.elements.splice(i, 1);
                elementStore.state.amount += 1;
            }
        };
    };


    function DetectorController($scope, game, detector, lab) {
        var vm = this;
        vm.elements = detector.elements;
        vm.dropOptions = {
            //   accept: ".rune",
            addClasses: true,
            // greedy: true,
            // tolerance: "pointer",
            activeClass: "ui-state-hover",
            hoverClass: "ui-state-active",
        };
        vm.dragOptions = {
            revert: "invalid",
            zIndex: 100,
            // helper: "clone", // drags a clone
            // opacity: 0.75,
            // start: this.onRuneDrop.bind(this),
            // stop: this.onRuneDrop.bind(this),
            cancel: false,
            // containment:false
        };
        vm.onDrop = function (event, ui) {
            var result = detector.onDrop(event, ui, game);
            if (result)
                lab.observe(result);
        };
        vm.click = function () {
            lab.clickDetector();
            detector.addEvent();
            UI.showUpdateValue("#update-data", lab.state.detector);
            game.elements.addKnownToStore();
            return false;
        };
        vm.toggleFlameFuel = function () {
            console.log('toggleFlameFuel');
            detector.flamer.toggleFuel();
        };
        vm.clearAll = function () {
            detector.clearAll(game);
        };
    };
    DetectorController.$inject = ['$scope', 'game', 'detector', 'lab'];
    app.controller('DetectorController', DetectorController);


    function LabController($interval, game, detector, lab) {
        // todo give workers instead of game
        var vm = this;
        vm.lab = lab;
        vm.showDetectorInfo = function () {
            if (!vm._detectorInfo) {
                vm._detectorInfo = Helpers.loadFile('html/detector.html');
            }
            UI.showModal('Detector', vm._detectorInfo);
        };
        $interval(function () { // one tick
            var grant = lab.getGrant();
            UI.showUpdateValue("#update-funding", grant);
            var sum = 0;
            for (var i = 0; i < game.workers.length; i++) {
                sum += game.workers[i].state.hired * game.workers[i].state.rate;
            }
            if (sum > 0) {
                lab.acquireData(sum);
                UI.showUpdateValue("#update-data", sum);
                detector.addEventExternal(game.workers.map(function (w) {
                    return w.state.hired;
                }).reduce(function (a, b) {
                    return a + b;
                }, 0));
            }
        }, 1000);
    };
    LabController.$inject = ['$interval', 'game', 'detector', 'lab'];
    app.controller('LabController', LabController);


    function ObservationsController($scope, game, lab) {
        var vm = this;
        vm.observations = lab.state.observations;
        vm.gridOptions = {
            enableFiltering: true,
            columnDefs: [{
                field: 'inputs',
                filter: {},
                visible: true
            }, {
                field: 'reactants',
                visible: false
            }, {
                field: 'results',
                visible: true,
                sort: {
                    direction: 'asc'
                }
            }, {
                field: 'catalysts',
                visible: false
            }, {
                field: 'conditions',
                visible: false
            }, ],
            data: vm.observations
        };
    };
    ObservationsController.$inject = ['$scope', 'game', 'lab'];
    app.controller('ObservationsController', ObservationsController);

    function UpgradesController($scope, game, lab) {
        var vm = this;
        vm.upgrades = game.upgrades;
        vm.isVisible = function (upgrade) {
            return upgrade.isVisible(lab, game.allObjects);
        };
        vm.isAvailable = function (upgrade) {
            return upgrade.isAvailable(lab, game.allObjects);
        };
        vm.upgrade = function (upgrade) {
            if (upgrade.buy(lab, game.allObjects)) {
                UI.showUpdateValue("#update-funding", upgrade.cost);
            }
        };
    };
    UpgradesController.$inject = ['$scope', 'game', 'lab'];
    app.controller('UpgradesController', UpgradesController);

    function AchievementsController($scope, game, lab) {
        var vm = this;
        vm.achievements = game.achievements;
        vm.progress = function () {
            return game.achievements.filter(function (a) {
                return a.validate(lab, game.allObjects, game.lastSaved);
            }).length;
        };
    };
    AchievementsController.$inject = ['$scope', 'game', 'lab'];
    app.controller('AchievementsController', AchievementsController);

    function SaveController($scope, $interval, $window, game, lab) {
        var vm = this;
        game.lastSaved = new Date().getTime();
        vm.lastSaved = game.lastSaved;
        vm.saveNow = function () {
            var saveTime = new Date().getTime();
            lab.state.time += saveTime - game.lastSaved;
            game.save();
            game.lastSaved = saveTime;
            vm.lastSaved = game.lastSaved;
        };
        vm.restart = function () {
            if ($window.confirm(
                    'Do you really want to restart the game? All progress will be lost.'
                )) {
                ObjectStorage.clear();
                $window.location.reload(true);
            }
        };
        $interval(vm.saveNow, 10000);
    };
    SaveController.$inject = ['$scope', '$interval', '$window', 'game', 'lab'];
    app.controller('SaveController', SaveController);

    function StatsController($scope, lab) {
        var vm = this;
        vm.lab = lab;
    };
    StatsController.$inject = ['$scope', 'lab'];
    app.controller('StatsController', StatsController);

    analytics.init();
    analytics.sendScreen(analytics.screens.main);
})();
