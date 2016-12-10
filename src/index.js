/** App imports **/

// css
import "css/bootstrap.min.css";
import "font-awesome/css/font-awesome.css";
// import "font-awesome/scss/font-awesome.scss";
// import "bower_components/angular-ui-grid/ui-grid.min.css";
// import "css/ui-grid.css";
import "css/style.css";

// img
import "../favicon.ico";
import "assets/favicon.png";
import "assets/favicon_color.png";
import "assets/favicons/apple-icon-57x57.png";
import "assets/favicons/apple-icon-60x60.png";
import "assets/favicons/apple-icon-72x72.png";
import "assets/favicons/apple-icon-76x76.png";
import "assets/favicons/apple-icon-114x114.png";
import "assets/favicons/apple-icon-120x120.png";
import "assets/favicons/apple-icon-144x144.png";
import "assets/favicons/apple-icon-152x152.png";
import "assets/favicons/apple-icon-180x180.png";
import "assets/favicons/android-icon-192x192.png";
import "assets/favicons/favicon-32x32.png";
import "assets/favicons/favicon-96x96.png";
import "assets/favicons/favicon-16x16.png";
import "assets/favicons/ms-icon-144x144.png";

// json
// import cards from "json/cards.json";
// import acheivements from "json/achievements.json";

// deps
// import jquery from "jquery";
// import jqueryUi from "jquery-ui";
// import jqueryUiTouchPunch from "jquery-ui-touch-punch";
// import jqueryCookie from "js-cookie";
//
import bootstrap from "bootstrap";
// // import retina from "retina";
// import FastClick from "fastclick";
//
// import chai from "chai";
// import lodash from "lodash";
//
// import angular from "angular";
// import angularDragdrop from "angular-dragdrop";
// import angularAnimate from "angular-animate";


// app
import ObjectStorage from "js/storage.js";
import Helpers from "js/helpers.js";
import Analytics from "js/analytics.js";
import GameObjects from "js/gameobjects.js";
import Rules from "js/rules.js";
import UI from "js/ui.js";
import Game from "js/game.js";
import app from "js/app.js";
import simulate from "json/simulations.json"
import cards from "json/cards.json"

/** This file exports parts of the app as a library **/
// var clientApp = {
//     ObjectStorage: import "js/storage.js",
//     Helpers: import "js/helpers.js",
//     Analytics: import "js/analytics.js",
//     GameObjects: import "js/gameobjects.js",
//     Rules: import "./js/rules.js",
//     UI: import "js/ui.js",
//     Game: import "js/game.js",
//     app: import "js/app.js",
//     simulate: import "json/simulations.json",
//     cards: import "json/cards.json",
//     // acheivements: import "json/achievements.json",
// };
var clientApp = {
    ObjectStorage, Helpers, Analytics, GameObjects, Rules, UI, Game, app, simulate, cards
}
export default clientApp

import "js/rules/simulate.html";

// deleteme dev TODO XXX
console.log('break here for dev');
