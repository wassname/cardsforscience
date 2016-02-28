module.exports = function (config) {

    // http://mike-ward.net/2015/09/07/tips-on-setting-up-karma-testing-with-webpack/
    var webpackConfig = require('../webpack.config.js');
    webpackConfig.entry = {};

    config.set({

        webpack: webpackConfig,
        webpackMiddleware: {
            // noInfo: true,
        },
        basePath: '../',

        // web server port
        port: 9876,
        // urlRoot: "/",

        // level of logging
       // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
       logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress','html','junit'],

        frameworks: ['jasmine'],

        browsers: [
            'Chrome',
            // 'Firefox'
        ],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        plugins: [
            require('karma-sourcemap-loader'),
            require("karma-webpack"),
            require('karma-jasmine'),
            require('karma-ng-html2js-preprocessor'),
            require('karma-chrome-launcher'),
            require('karma-firefox-launcher'),
        ],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        },

        preprocessors: {
            // './build/clientapp.bundle.js': ['webpack','sourcemap'],
            './src/index.js': ['webpack','sourcemap'],
            // './src/js/rules.js': ['webpack','sourcemap'],
            "*.html": ["ng-html2js"]
        },

        // ngHtml2JsPreprocessor: {
        //     // If your build process changes the path to your templates,
        //     // use stripPrefix and prependPrefix to adjust it.
        //     // stripPrefix: "source/path/to/templates/.*/",
        //     // prependPrefix: "web/path/to/templates/",
        //
        //     // the name of the Angular module to create
        //     moduleName: "cardsForScience.templates"
        // },


        // use this to fix server 404 errors. Karma server everything at /base
        proxies: {
            '/json/': '/base/json/'
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // list of files / patterns to load in the browser
        files: [

            // dependencies

            // these are for Module('')
            'node_modules/angular/angular.js',
            'node_modules/angular-mocks/angular-mocks.js',

            // chai for rule tests
            'node_modules/chai/chai.js',

            // files to test
            './src/index.js', // load in webpack entry point
            'src/js/rules.js',
            'test/unit/**/*.js'
        ],

        // list of files to exclude
        exclude: [],
    });
};
