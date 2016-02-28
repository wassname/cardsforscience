module.exports = function (config) {
    config.set({

        basePath: '../',
        port: 9876,
        // urlRoot: "/",

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        frameworks: ['jasmine'],

        browsers: ['Chrome', 'Firefox'],

        plugins: [
            'karma-chrome-launcher',
            'karma-firefox-launcher',
            'karma-jasmine'
        ],

        junitReporter: {
            outputFile: 'test_out/unit.xml',
            suite: 'unit'
        },

        preprocessors: {
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


        // list of files / patterns to load in the browser
        files: [

            // dependencies
            'bower_components/jquery/dist/jquery.js',
            'bower_components/jquery-ui/jquery-ui.js',


            'bower_components/bootstrap/dist/js/bootstrap.js',

            'bower_components/angular/angular.js',
            'bower_components/angular-route/angular-route.js',
            'bower_components/angular-resource/angular-resource.js',
            'bower_components/angular-animate/angular-animate.js',
            'bower_components/angular-mocks/angular-mocks.js',
            'bower_components/angular-dragdrop/src/angular-dragdrop.js',
            'bower_components/angular-ui-grid/ui-grid.js',

            'bower_components/lodash/dist/lodash.js',
            'bower_components/chai/chai.js',

            'js/external/*.js',

            // fixtures
            {
                pattern: 'index.html',
                watched: true,
                served: true,
                included: false
            }, {
                pattern: 'json/*.json',
                watched: true,
                served: true,
                included: false
            },
            {
                pattern: 'css/*.css',
                watched: true,
                served: true,
                included: false
            },

            // files to test
            'js/storage.js',
            'js/helpers.js',
            'js/analytics.js',
            'js/gameobjects.js',
            'js/rules.js',
            'js/detector/detector.js',
            'js/ui.js',
            'js/game.js',
            'js/app.js',
            'test/unit/**/*.js'
        ],
    });
};
