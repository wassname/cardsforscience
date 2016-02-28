/**
 * Define the angular app
 */
'use strict';

//deps
var jquery = require("jquery");
var jqueryUi = require("jquery-ui");
var jqueryUiTouchPunch = require("jquery-ui-touch-punch");
var jqueryCookie = require("js-cookie");

var angular = require("angular");
var angularDragdrop = require("angular-dragdrop");
var angularAnimate = require("angular-animate");
var angulartics = require('angulartics');
var angularticsGoogleAnalytics = require('angulartics-google-analytics');

//app
var ObjectStorage = require("js/storage");
var Helpers = require("js/helpers");
var GameObjects = require("js/gameobjects");
var analytics = require("js/analytics");
var Game = require("js/game");
var Rules = require("js/rules.js");

var app = (function (Helpers,analytics,Game,Rules) {
    Helpers.validateSaveVersion();

    var app = angular.module('cardsForScience', ['ngDragDrop','ngAnimate','angulartics', angularticsGoogleAnalytics]);

    // config
    app.config(function ($analyticsProvider) {
            $analyticsProvider.firstPageview(true); /* Records pages that don't use $state or $route */
            $analyticsProvider.withAutoBase(true);  /* Records full path */
    });

    // directives


    /**
     * Make little "+2" "-1" score animations when score changes requires ng-model="score"
     * Associated css:
     * ```
     * .update-value { // set constant height, and the position
       position: relative;
       right: -2em;
       top: -1.42857em;
       height: 1.42857em;
     }
     .update-plus { // if the change is +ve
       color: green;
       position: relative;
     }
     .update-minus {
       color: red;
       position: relative;
     }
     */
    function cfsScoreChange($compile) {
        return {
            link: function (scope, element, attrs) {
                scope.$watch(attrs.ngModel, function (newValue, oldValue) {
                    // showUpdateValue
                    var num = newValue-oldValue;
                    var formatted = Helpers.formatNumberPostfix(num);
                    var insert;
                    if (num > 0) {
                      insert = angular.element("<div class=''></div>")
                                .attr("class", "update-plus")
                                .html("+" + formatted);
                    } else {
                      insert = angular.element("<div></div>")
                                .attr("class", "update-minus")
                                .html(formatted);
                    }

                    // TODO it would be better to use an ::after element for this
                    // showUpdate
                    element.append(insert);
                    insert.animate({
                      "bottom":"+=30px",
                      "opacity": 0
                    }, { duration: 500, complete: function() {
                      angular.element(this).remove();
                    }});
                });

            }
        };
    };
    cfsScoreChange.$inject = ['$compile'];
    app.directive('cfsScoreChange', cfsScoreChange);


    /**
     * Directive to render a rule and bind it's option with select boxes
     * This expects ng-model="rule" as an attribute
     */
    function cfsRule($compile) {
        return {
            link: function (scope, element, attrs) {
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
    // app.factory('cards', function () {
    //     var cards = Helpers.loadFile('json/cards.json');
    //     cards = cards.map(
    //         function (r) {
    //             return new GameObjects.Card(r);
    //         });
    //     // put in extended array with helper methods
    //     Cards = new GameObjects.Cards();
    //     Cards.push.apply(Cards,cards);
    //     return Cards;
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
    app.controller('CardController', CardController);
    CardController.$inject = ['$scope', '$compile', 'game', 'lab'];

    function CardController($scope, $compile, game, lab) {
        var vm = this;
        vm.dataJqyouiOptions = {
            revert: "invalid",
            zIndex: 100,
            cancel: false,
        };
        vm.jqyouiDraggable = {
            containment:'offset',
            onStart:'rc.dragStart(r)',
            onStop:'rc.dragStop(r)',
            animate:true,
        };
        vm.onClick = function (card) {
            // don't click if it was dragged within .222 seconds
            // (to prevent double firing)
            if (!card.state.lastDragged || new Date()-new Date(card.state.lastDragged)>300)
                game.play(card);
            else
                console.log('clickprevent',card.state.lastDragged);
        };
        vm.dragStart = function(event, ui,card){
            card.state.lastDragged=new Date();
            console.log('startDrag');
        };
        vm.dragStop = function(event, ui,card){
            card.state.lastDragged=new Date();
            console.log('endDrag');
        };
        vm.cards = game.cards;
        vm.isVisible = function (item) {
            return item.isVisible(lab);
        };
        vm.isAvailable = function (item) {
            return item.isAvailable(lab);
        };
    };


    function TableController($scope, game, lab, $filter) {
        var vm = this;
        vm.cards = detector.cards;
        vm.rule = '';
        vm.hints = [];
        vm.limit = -12;
        vm.hintCost = 10;
        vm.ruleCost = 300;
        vm.lastCards = game.lastCards;
        vm.incorrectCards = game.incorrectCards;
        vm.dataJqyouiOptions = {
            //   accept: ".rune",
            addClasses: true,
            // greedy: true,
            // tolerance: "pointer",
            activeClass: "ui-state-hover",
            hoverClass: "ui-state-active",
        };
        vm.jqyouiDroppable={onDrop: 'dc.onDrop',multiple:true};
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
    TableController.$inject = ['$scope', 'game', 'lab', '$filter'];
    app.controller('TableController', TableController);


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


    function RulesController($scope, game, lab) {
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
    RulesController.$inject = ['$scope', 'game', 'lab'];
    app.controller('RulesController', RulesController);

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
})(Helpers,analytics,Game,Rules);
module.exports=app;
