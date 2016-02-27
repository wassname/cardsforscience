/**
 * Define the angular app
 */
'use strict';
var app = (function () {
    Helpers.validateSaveVersion();

    var app = angular.module('scienceAlchemy', ['ngDragDrop', 'ui.grid']);

    // directives
    /**
     * Provides an easy way to toggle a checkboxes indeterminate property
     *
     * @example <input type="checkbox" ui-indeterminate="isUnkown">
     */
    // app.directive('uiIndeterminate', [
    //     function () {
    //
    //         return {
    //             compile: function (tElm, tAttrs) {
    //                 if (!tAttrs.type || tAttrs.type.toLowerCase() !== 'checkbox') {
    //                     return angular.noop;
    //                 }
    //
    //                 return function ($scope, elm, attrs) {
    //                     $scope.$watch(attrs.uiIndeterminate, function (newVal) {
    //                         elm[0].indeterminate = !!newVal;
    //                     });
    //                 };
    //             }
    //         };
    //     }
    // ]);


    /**
     * Directive to render a rule and bind it's option with select boxes
     * This expects ng-model="rule" as an attribute
     */
    function cfsRule($compile) {
        return {
            link: function (scope, element, attrs) {
                scope.$eval("$index");
                var rule = scope.$eval(attrs.ngModel);

                // first generate a select box for each option (using lodash templating)
                _.templateSettings.interpolate = /<%=([\s\S]+?)%>/g;
                var optionTmpl = '' +
                    '<select \n' +
                    '   name="<%=option%>" \n' +
                    '   convert-to-number="{{rule.optionDesc.<%=option%>.type===\'Number\'}}" \n' +
                    '   ng-model="rule.options.<%=option%>" \n' +
                    '   class="form-control input-sm" \n' +
                    '   ng-options="v for v in rule.optionDesc.<%=option%>.possibleVals track by v" \n' +
                    '>\n' +
                    '</select>\n';

                var tmplParams = _.defaults({},rule.options,rule.otherOptions);
                for (var option in rule.optionDesc) {
                    if (rule.optionDesc.hasOwnProperty(option)) {
                        var vals = rule.optionDesc[option].possibleVals;
                        if (vals) {
                            tmplParams[option] = _.template(optionTmpl)({
                                option: option
                            });
                        } else {
                            // if there are no options replace '{{color}}' with 'color'
                            tmplParams[option] = option;
                        }
                    }
                }
                // now put each select box into description
                // replace '{{color}}' with '<select name="color"...'
                var template = _.template(rule.description)(tmplParams);

                // now compile with angular
                element.html(template).show();
                $compile(element.contents())(scope);
            }
        };
    };
    cfsRule.$inject = ['$compile'];
    app.directive('cfsRule', cfsRule);


    // factories to provide services. They serve shared game objects
    // app.factory('elements', function () {
    //     var elements = Helpers.loadFile('json/elements.json');
    //     elements = elements.map(
    //         function (r) {
    //             return new GameObjects.Card(r);
    //         });
    //     // put in extended array with helper methods
    //     Card = new GameObjects.Cards();
    //     Card.push.apply(Card,elements);
    //     return Card;
    // });


    function game($http, $q, lab) {
        var game = new Game();
        game.lab = lab;
        game.allObjects.lab = lab;
        var promise = game.load($http, $q);
        game.init();
        // return promise;
        return game;
    };
    game.$inject = ['$http', '$q', 'lab'];
    app.factory('game', game);

    function lab() {
        if (!this.lab) this.lab = new GameObjects.Lab();
        return this.lab;
    };
    app.factory('lab', lab);

    // add helpers as filters
    function niceNumber($filter) {
        return Helpers.formatNumberPostfix;
    };
    niceNumber.$inject = ['$filter'];
    app.filter('niceNumber', niceNumber);

    function transpose($filter) {
        return function (input) {
            return _.zip(input);
        };
    };
    transpose.$inject = ['$filter'];
    app.filter('transpose', transpose);

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
    ElementController.$inject = ['$scope', '$compile', 'game', 'lab'];

    function ElementController($scope, $compile, game, lab) {
        var vm = this;
        vm.dragOptions = {
            revert: true, //"invalid",
            zIndex: 100,
            cancel: false,
        };
        vm.onClick = function (card) {
            game.play(card);
        };
        vm.elements = game.elements;
        vm.isVisible = function (item) {
            return item.isVisible(lab);
        };
        vm.isAvailable = function (item) {
            return item.isAvailable(lab);
        };
    };


    function DetectorController($scope, game, lab, $filter) {
        var vm = this;
        vm.elements = detector.elements;
        vm.rule = '';
        vm.hints = [];
        vm.limit = -12;
        vm.hintCost = 10;
        vm.ruleCost = 300;
        vm.lastCards = game.lastCards;
        vm.incorrectCards = game.incorrectCards;
        vm.dropOptions = {
            //   accept: ".rune",
            addClasses: true,
            // greedy: true,
            // tolerance: "pointer",
            activeClass: "ui-state-hover",
            hoverClass: "ui-state-active",
        };
        vm.onDrop = function (event, ui) {
            var result = game.onDrop(event, ui, game);
        };
        vm.revealRule = function () {
            vm.rule = game.rule.describe();
            lab.state.score -= vm.ruleCost;
        };
        vm.revealHint = function () {
            var hint = game.rule.nextHint();
            if (hint) {
                vm.hints.push(hint);
                lab.state.score -= vm.hintCost;
            }
        };
    };
    DetectorController.$inject = ['$scope', 'game', 'lab', '$filter'];
    app.controller('DetectorController', DetectorController);


    function LabController($interval, game, lab) {
        // todo give workers instead of game
        var vm = this;
        vm.lab = lab;
        vm.showDetectorInfo = function () {
            if (!vm._detectorInfo) {
                vm._detectorInfo = Helpers.loadFile('html/detector.html');
            }
            UI.showModal('Detector', vm._detectorInfo);
        };
    };
    LabController.$inject = ['$interval', 'game', 'lab'];
    app.controller('LabController', LabController);


    function UpgradesController($scope, game, lab) {
        var vm = this;
        // present just a few hypothesis
        var rules = Rules.rules.map(function (r) {
            return angular.copy(r);
        });
        rules = _.sampleSize(rules, 2);
        if (!_.find(rules, {
                description: game.rule.description
            })) {
            var rule = angular.copy(game.rule);
            rule.setOptions({}); // reset the value of this copy to not give away;
            rules.push(rule);
        } else {
            rules.push(angular.copy(_.sample(Rules.rules)));
        }
        vm.rules = _.shuffle(rules);

        // or present them without options?
        var rules2 = Rules.rules.map(function (r) {
            var rule = angular.copy(r);
            rule.randomize();
            return rule;
        });
        rules2 = _.sampleSize(rules, 4);

        // add the real rule and a couple of variations
        var rule = angular.copy(game.rule);
        rules2.push(rule);
        var rule = angular.copy(game.rule);
        rule.randomize();
        rules2.push(rule);
        var rule = angular.copy(game.rule);
        rule.randomize();
        rules2.push(rule);

        // clean and add to controller
        rules2 = _.uniq(rules2);
        rules2 = _.shuffle(rules2);
        vm.rules2 = rules2;

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
        /** return a class based on none right or wrong guessed **/
        vm.isGuessed = function(rule){
            if (rule.state.guessed===true)  return 'bg-success';
            else if (rule.state.guessed===false) return 'bg-danger';
            else return '';

        };
        vm.guess = function (e, rule) {
            var params = angular.element(e.target).parent('form').serializeArray();

            var sameRule = rule.description == game.rule.description;
            var sameOpts = angular.equals(rule.options, game.rule.options);
            if (sameRule && sameOpts) {
                // right!
                lab.state.score += 200;
                if (!rule.state) rule.state={};
                rule.state.guessed=true;
            } else {
                lab.state.score -= 200;
                rule.state.guessed=false;
            }

            console.log('guess', arguments);
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
