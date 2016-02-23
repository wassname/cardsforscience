/**
 * Game object load/saves game resources and stores game objects
 */
var Game = (function(Helpers,GameObjects,ObjectStorage) {
  'use strict';

  var Game = function() {
    this.lab = new GameObjects.Lab();
    this.elements = null;
    this.workers = null;
    this.upgrades = null;
    this.achievements = null;
    this.allObjects = {lab : this.lab};
    this.loaded = false;
    this.rules= null;
  };

  Game.prototype.load = function() {
    if (this.loaded) {
      return;
    }

    // I know synchronous requests are bad as they will block the browser.
    // However, I don't see any other reasonable way to do this in order to
    // make it work with Angular. If you know a way, let me know, and I'll
    // give you a beer. - Kevin
    this.elements = Helpers.loadFile('json/elements.json');
    this.workers = Helpers.loadFile('json/workers.json');
    this.upgrades = Helpers.loadFile('json/upgrades.json');
    this.achievements = Helpers.loadFile('json/achievements.json');
    this.keywords = Helpers.loadFile('json/keywords.json');

    // Turn JSON files into actual game objects and fill map of all objects
    var _this = this;
    var makeGameObject = function(type, object) {
      // It's okay to define this function here since load is only called
      // once anyway...
      var o = new type(object);
      _this.allObjects[o.key] = o;
      return o;
    };
    this.elements = this.elements.map(
        function(r) { return makeGameObject(GameObjects.Element, r); });
    this.workers = this.workers.map(
        function(w) { return makeGameObject(GameObjects.Worker, w); });
    this.upgrades = this.upgrades.map(
        function(u) { return makeGameObject(GameObjects.Upgrade, u); });
    this.achievements = this.achievements.map(
        function(a) { return makeGameObject(GameObjects.Achievement, a); });
    // Load states from local store
    for (var key in this.allObjects) {
      var o = this.allObjects[key];
      o.loadState(ObjectStorage.load(key));
    }

    // this.detector.init(400,$('#detector'));

    this.rules = this.generateRules();

    this.loaded = true;
  };

  /** Generate rules between runes **/
  Game.prototype.generateRules= function(){
      var elements = this.elements;
      // generate rules and store them with a hash of inredients
      // the rule will be an object with ingredients, catalysts, conditions, results
      // todo make a strcture that's more like a tree with progression etc
      // todo add duds, misleading ones, explosions wildcards
      // todo make this theory based?
      // todo simulation
      var rules={};
      for (var k = 0; k < this.elements.length*5; k++) {
          // make a rules
          var rule={ingredients:[],catalysts:[],conditions:[],results:[],inputs:[]}
          var numOfIngredients = 2+Math.round(Math.random()*2);
          for (var i = 0; i < numOfIngredients; i++) {
              var j = Math.round(Math.random()*(elements.length-1));
              rule.ingredients.push(elements[j].key);
          }

          if (Math.random()<0.1) {
              var j = Math.round(Math.random()*(elements.length-1));
              rule.catalysts.push(elements[j].key);
          }
          var numOfresults = Math.round(Math.random()*3);
          for (var i = 0; i < numOfresults; i++) {
              var j = Math.round(Math.random()*(elements.length-1));
              rule.results.push(elements[j].key);
          }
          rule.inputs=[].concat(rule.ingredients,rule.catalysts)
          rule.ingredients.sort()
          rule.results.sort()
          rule.catalysts.sort()
          rule.inputs.sort();
          // index byhash of sorted array of ingredients
          rules[rule.inputs]=rule
      }
      return rules;
  },

    /** Run an experiment depending on ingredients and conditions **/
    Game.prototype.experiment = function(options) {
        var inputs = options.inputs || [];
        var inputKeys = inputs.map(function(i,e){return $(e).data('element')});
        inputKeys.sort(); // this makes reaction be independant of order

        var result = this.rules[inputKeys]
        if (result) {
            return this.reaction(result.ingredients,result.rune)
        }
        return result;
    },

    /** Remove ingredients and make results with animations **/
    Game.prototype.reaction= function(ingredients,results){

        // remove ingredients
        for (var i = 0; i < ingredients.length; i++) {
            var ingredient = ingredients[i];

        }

        // TODO use angular effects to remove in puff of fade
        $(aElem).remove();
        $(bElem).remove();

        // if the dragger came from the elements panels, clone it to here
        for (var i = 0; i < results.length; i++) {
            // make sure it's discovered
            var resultKey = results[i];
            var elementStore = this.elements.filter(function(e){return e.key===resultKey;});
            elementStore.state.discovered=true;

            // add new element to beaker
            var newElement = $('#elementContent').find('.'+resultKey).clone();
            $('#detector').append(newElement);
            newElement.offset($draggable.offset())
        }

        // effects
        this.bubblr.start(1500);

    },
  Game.prototype.save = function() {
    // Save every object's state to local storage
    for (var key in this.allObjects) {
      ObjectStorage.save(key, this.allObjects[key].state);
    }
  };

  return Game;
}(Helpers,GameObjects,ObjectStorage));
