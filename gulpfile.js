'use strict';
var gulp = require('gulp');
// var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util')

var webpack = require('webpack-stream');

var concurrent = require("concurrent-transform");
var rename = require('gulp-rename');
var awspublish = require('gulp-awspublish');
var debug = require('gulp-debug');

// load in settings
var pjson = require('./package.json');
var production = (process.env.NODE_ENV === 'production');

var DEBUG = !production;
console.log('Running in DEBUG='+DEBUG+' mode');

var config = {
    app_entry: 'client/scripts/main.js',
    debug: DEBUG,
};

/*
Just run webpack
 */


gulp.task('webpack', function () {
    DEBUG = config.debug=false; // run production mode
    process.env.NODE_ENV='production';
    var webpackConfig = require('./webpack.config.js');
    console.log('debug: ', webpackConfig.debug);

    return gulp.src(config.app_entry)
        .pipe(webpack(require('./webpack.config.js')))
        .pipe(gulp.dest('dist/'));
});


/** deploy to s3 using gulp-awspublish
 * https://github.com/pgherveou/gulp-awspublish
 **/

gulp.task('s3', function () {

    // create a new publisher using S3 options
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#constructor-property
    var credentials = JSON.parse(fs.readFileSync('secrets/aws-credentials.json', 'utf8'));
    var publisher = awspublish.create(credentials);

    // define custom headers
    var headers = {
        'Cache-Control': 'max-age=315360000, no-transform, public'
            // ...
    };

    return gulp.src('./dist/**/*.*',{cwd:'.'})

        // rename to put in subfolder
        // .pipe(rename(function (path) {
        //   path.dirname = pjson.name + '/' + path.dirname; // for /module/path/file.ext
        // }))

        // gzip, Set Content-Encoding headers and add .gz extension
        .pipe(awspublish.gzip())

        // publisher will add Content-Length, Content-Type and headers specified above
        // If not specified it will set x-amz-acl to public-read by default
        // Noe: this has been made concurrent using concurrent-transform
        .pipe(concurrent(publisher.publish(headers)), 10)

        // create a cache file to speed up consecutive uploads
        .pipe(publisher.cache())

        // print upload updates to console
        .pipe(awspublish.reporter());
});

gulp.task('default', ['webpack']);
gulp.task('deploy', ['webpack','s3']);
