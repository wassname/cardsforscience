/**
 * Game objects such as workers, research, upgrades, and achievements.
 */

var GameObjects = (function () {
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
    }

    /** @class Lab
     */
    var Lab = function () {
        GameObject.apply(this, [{
            key: 'lab',
            state: {
                name: 'Click here to give your lab an awesome name!',
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
     ***/
    Lab.prototype.observe = function (observation) {
        this.state.observations.push(observation);
    };


    Lab.prototype.buy = function (cost) {
        if (this.state.money >= cost) {
            this.state.money -= cost;
            this.state.moneySpent += cost;
            return true;
        }
        return false;
    };

    var ElementStore = function (obj) {
        Array.apply(this, [obj]);
    };

    ElementStore.prototype = Object.create(Array.prototype);

    ElementStore.prototype.constructor = ElementStore;

    /** Add a random element or specify it's key **/
    ElementStore.prototype.addToStore = function (element) {
        if (!element) this.get(element);
        if (!element) element = this.select();
        return element.state.amount += 1;
    };

    /** Select random element from store **/
    ElementStore.prototype.select = function () {
        var i = Math.floor((this.length - 1) * Math.random());
        return this[i];
    };
    /** Get element by hashid **/
    ElementStore.prototype.get = function (key) {
        return this.filter(function (e) {
            return e.key === key;
        })[0];
    }

    /** Get element by hashid **/
    ElementStore.prototype.getByHashKey = function (hashKey) {
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
    }

    /** Get element by hashid **/
    ElementStore.prototype.findIndexByHashKey = function (hashKey) {
        if (hashKey === undefined) {
            console.warn('FindIndexByHashKey given an undefined hashkey', hashKey)
            return;
        }
        return this.findIndex(function (e) {
            return e.$$hashKey === hashKey;
        })[0];
    }

    /** @class Element
     */
    var Element = function (obj) {
        GameObject.apply(this, [obj]);
        this.state.amount = Math.round(Math.random() * 2);
        this.state.discovered = Math.random() < 0.1;
        this.state.interesting = Math.random() < 0.1;
        this.state.color = Math.round(Math.random() * 11);
        this.uuid=this.guid();
    };

    Element.prototype = Object.create(GameObject.prototype);

    Element.prototype.constructor = Element;

    Element.prototype.isVisible = function (lab) {
        if (!lab) {
            return false;
        }
        return this.state.discovered;
    };

    Element.prototype.isAvailable = function (lab) {
        if (!lab) {
            return false;
        }
        return this.state.amount > 0;
    };

    Element.prototype.research = function (lab) {
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

    Element.prototype.getInfo = function () {
        if (!this._info) {
            this._info = Helpers.loadFile(this.info);
        }
        this.state.interesting = false;
        return this._info;
    };

    /** @class Worker
     * Implement an auto-clicker in the game.
     */
    var Worker = function (obj) {
        GameObject.apply(this, [obj]);
        this.state.hired = 0;
    };

    Worker.prototype = Object.create(GameObject.prototype);

    Worker.prototype.constructor = Worker;

    Worker.prototype.isVisible = function (lab) {
        if (!lab) {
            return false;
        }
        return this.state.hired > 0 ||
            lab.state.money >= this.state.cost * GLOBAL_VISIBILITY_THRESHOLD;
    };

    Worker.prototype.isAvailable = function (lab) {
        if (!lab) {
            return false;
        }
        return lab.state.money >= this.state.cost;
    };

    Worker.prototype.hire = function (lab) {
        if (lab && lab.buy(this.state.cost)) {
            this.state.hired++;
            var cost = this.state.cost;
            this.state.cost = Math.floor(cost * this.cost_increase);
            return cost;
        }
        return -1; // not enough money
    };

    Worker.prototype.getTotal =
        function () {
            return this.state.hired * this.state.rate;
        };

    /** @class Upgrade
     */
    var Upgrade = function (obj) {
        GameObject.apply(this, [obj]);
        this.state.visible = false;
        this.state.used = false;
    };

    Upgrade.prototype = Object.create(GameObject.prototype);

    Upgrade.prototype.constructor = Upgrade;

    Upgrade.prototype.meetsRequirements = function (allObjects) {
        if (!allObjects) {
            return false;
        }
        for (var i = 0; i < this.requirements.length; i++) {
            var req = this.requirements[i];
            if (allObjects[req.key].state[req.property] < req.threshold) {
                return false;
            }
        }
        return true;
    };

    Upgrade.prototype.isAvailable = function (lab, allObjects) {
        if (!lab || !allObjects) {
            return false;
        }
        return !this.state.used && lab.state.money >= this.cost &&
            this.meetsRequirements(allObjects);
    };

    Upgrade.prototype.isVisible = function (lab, allObjects) {
        if (!lab || !allObjects) {
            return false;
        }
        if (!this.state.used &&
            (this.state.visible ||
                lab.state.money >= this.cost * GLOBAL_VISIBILITY_THRESHOLD &&
                this.meetsRequirements(allObjects))) {
            this._visible = true;
            return true;
        }
        return false;
    };

    Upgrade.prototype.buy = function (lab, allObjects) {
        if (lab && allObjects && !this.state.used && lab.buy(this.cost)) {
            for (var i = 0; i < this.targets.length; i++) {
                var t = this.targets[i];
                allObjects[t.key].state[t.property] *= this.factor || 1;
                allObjects[t.key].state[t.property] += this.constant || 0;
            }
            this.state.used = true; // How about actually REMOVING used upgrades?
            this.state.visible = false;
            return this.cost;
        }
        return -1;
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
        Element: Element,
        Worker: Worker,
        Upgrade: Upgrade,
        Achievement: Achievement,
        ElementStore: ElementStore
    };
}());
