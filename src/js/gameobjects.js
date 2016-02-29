/**
 * Game objects such as workers, research, upgrades, and achievements.
 */

var GameObjects = module.exports = (function () {
    'use strict';
    var GLOBAL_VISIBILITY_THRESHOLD = 0.5;

    /** @class GameObject
     * Base class for all objects in the game. This works together with the
     * saving mechanism.
     */
    var GameObject = function (obj) {
        this.state = {};
        $.extend(this, obj);
        if (!this.key) {
            throw 'Error: GameObject has to have a key!';
        }
    };
    GameObject.prototype.loadState =
        function (state) {
            $.extend(this.state, state);
        };
    GameObject.prototype.guid = function () {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };

    /** @class Lab
     */
    var Lab = function () {
        GameObject.apply(this, [{
            key: 'lab',
            state: {
                name: 'Write your name here',
                detector: 1,
                factor: 5,
                data: 0,
                money: 0,
                reputation: 0,
                clicks: 0,
                moneyCollected: 0,
                moneySpent: 0,
                dataCollected: 0,
                dataSpent: 0,
                time: 0,
                observations: [],
                score: 0,
                highScore: 0,
                hints: 0,
                rulesGuessed: [],
                rulesFailed: [],
            }
        }]);

    };

    Lab.prototype = Object.create(GameObject.prototype);

    Lab.prototype.constructor = Lab;

    Lab.prototype.getGrant = function () {
        var addition = this.state.reputation * this.state.factor;
        this.state.money += addition;
        this.state.moneyCollected += addition;
        return addition;
    };

    Lab.prototype.acquireData = function (amount) {
        this.state.data += amount;
        this.state.dataCollected += amount;
    };

    Lab.prototype.clickDetector = function () {
        this.state.clicks += 1;
        this.acquireData(this.state.detector);
    };

    Lab.prototype.research = function (cost, reputation) {
        if (this.state.data >= cost) {
            this.state.data -= cost;
            this.state.dataSpent += cost;
            this.state.reputation += reputation;
            return true;
        }
        return false;
    };

    /**
     * Takes in a rule/observation object and records observation in journal
     * with reactants, inputs, catalysts, conditions, results
     **/
    Lab.prototype.observe = function (observation) {
        // join the arrays into strings for display
        var obsText = {};
        for (var k in observation) {
            if (observation.hasOwnProperty(k)) {
                obsText[k] = observation[k].sort().join('');
            }
        }
        obsText.amount=1;
        // check if an obs with all the attributes matching (extra attribs are ok)
        var index = _.findIndex(this.state.observations,obsText);
        if (index>-1)
            this.state.observations[index].amount+=1;
        else
            this.state.observations.push(obsText);
    };


    Lab.prototype.buy = function (cost) {
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.moneySpent += cost;
            return true;
        }
        return false;
    };

    var Cards = function (obj) {
        this.push.apply(this, obj);
    };

    Cards.prototype = Object.create(Array.prototype);

    Cards.prototype.constructor = Array.constructor;

    Cards.prototype.pushAll = function (items) {
        this.push.apply(this, items);
    };

    /** Add a random element or specify it's key **/
    Cards.prototype.addToStore = function (element) {
        if (element) this.get(element);
        if (!element) element = this.select();
        return element.state.amount += 1;
    };

    /** Add a random discovered element or specify it's key **/
    Cards.prototype.addKnownToStore = function (element) {
        var discovered = this.filter(function (e) {
            return e.state.discovered;
        });
        discovered = new GameObjects.Cards(discovered);
        if (element) discovered.get(element);
        if (!element) element = discovered.select();
        return element.state.amount += 1;
    };

    /** Select random element from store **/
    Cards.prototype.select = function () {
        var i = Math.round((this.length - 1) * Math.random());
        return this[i];
    };
    /** Get element by key **/
    Cards.prototype.get = function (key) {
        return this.filter(function (e) {
            return e.key === key;
        })[0];
    };

    /** Get element by hashid **/
    Cards.prototype.getByHashKey = function (hashKey) {
        if (hashKey === undefined) {
            console.warn('GetByHashKey given an undefined hashkey', hashKey)
            return;
        }
        var res = this.filter(function (e) {
            return e.$$hashKey === hashKey;
        });
        if (res.length == 1) return res[0];
        else if (res.length) {
            console.warn('Got multiple results when filtering on hashKey', hashKey);
            return res[0];
        } else {
            console.warn('Got no results when filtering on hashKey', hashKey);
            return;
        }
    };

    /** @class Card
     */
    var Card = function (obj) {
        // load from localStorage by obj.key
        GameObject.apply(this, [obj]);

        // apply defaults to undefined values
        this.state = _.defaults(this.state,{
            amount: 0,
            discovered: false,
            interesting: false,
        });

        // generate uuid
        this.uuid = this.uuid || this.guid();
    };

    Card.prototype = Object.create(GameObject.prototype);

    Card.prototype.constructor = Card;

    Card.prototype.isVisible = function (lab) {
        if (!lab) {
            return false;
        }
        return this.state.discovered;
    };

    Card.prototype.isAvailable = function (lab) {
        if (!lab) {
            return false;
        }
        return this.state.amount > 0;
    };

    Card.prototype.research = function (lab) {
        if (lab && lab.research(this.state.cost, this.state.reputation)) {
            this.state.level++;
            if (this.state.info_levels.length > 0 &&
                this.state.level === this.state.info_levels[0]) {
                this.state.interesting = true;
                this.state.info_levels.splice(0, 1);
            }
            var old_cost = this.state.cost;
            this.state.cost = Math.floor(this.state.cost * this.cost_increase);
            return old_cost;
        }
        return -1;
    };

    Card.prototype.getInfo = function () {
        if (!this._info) {
            this._info = Helpers.loadFile(this.info);
        }
        this.state.interesting = false;
        return this._info;
    };

    /** Create a new element for the test tube from this Card **/
    Card.prototype.spawn = function () {
        var element = angular.copy(this);
        element.uuid = element.guid();
        element.state = undefined;
        // this.state.amount -= 1;
        return element;
    };

    Card.prototype.decreaseStore = function () {
        return this.state.amount -= 1;
    };


    /** @class Achievement
     */
    var Achievement = function (obj) {
        GameObject.apply(this, [obj]);
        this.state.timeAchieved = null;
    };

    Achievement.prototype = Object.create(GameObject.prototype);

    Achievement.prototype.validate = function (lab, allObjects, saveTime) {
        if (this.state.timeAchieved) {
            return true;
        }
        if (allObjects.hasOwnProperty(this.targetKey) &&
            allObjects[this.targetKey].state.hasOwnProperty(this.targetProperty) &&
            allObjects[this.targetKey].state[this.targetProperty] >= this.threshold) {
            this.state.timeAchieved = lab.state.time + new Date().getTime() - saveTime;
            UI.showAchievement(this);
            return true;
        }
        return false;
    };

    Achievement.prototype.isAchieved = function () {
        if (this.state.timeAchieved) {
            return true;
        } else {
            return false;
        }
    };


    // Expose classes in module.
    return {
        Lab: Lab,
        Card: Card,
        Achievement: Achievement,
        Cards: Cards
    };
}());
