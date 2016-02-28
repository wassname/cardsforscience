'use strict';
var path = require('path');
var colors = require('colors');
var webpack = require('webpack');
var WebpackDevServer = require("webpack-dev-server");

// loaders
var fileLoader = require("file-loader");
var importsLoader = require("imports-loader");
var urlload = require("url-loader");

// css loaders
var cssLoader = require("css-loader");
var styleLoader = require("style-loader");
var autoprefixer = require('autoprefixer');
var csswring = require('csswring');

// text
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var HtmlWebpackPlugin = require('html-webpack-plugin');


/* debug for build folder, not debug for uglify into dist folder */
var DEBUG = (process.env.NODE_ENV !== 'production');
var DIR = DEBUG ? 'build':'dist';
console.log('Running in DEBUG='+DEBUG+' mode');

/* Provide globals to any who mention them */
var provide = new webpack.ProvidePlugin({
    "log": "loglevel",
    "_": "lodash",
    "jQuery": "jquery",
    "jquery": "jquery",
    "$": "jquery",
    "window.jQuery": "jquery",
});
// extract css file into styles.css
var extractText = new ExtractTextPlugin("[name].css", {
    allChunks: true
});
// multiple extract instances
var extractLESS = new ExtractTextPlugin('[name].less');
//
// inject bundles into html file template. Note html loader can overwrite output
var htmlWebpack = new HtmlWebpackPlugin({
    template: 'webpack.html',
    inject: 'body',
    filename: 'index.html', // otherwise this overrides the template, wierd
    hash: true,
    showErrors: DEBUG // this will override template
});
// uglify in production
var uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
  minimize: !DEBUG,
  sourceMap: DEBUG,
  mangle: !DEBUG,
  dropDebugger: true,
  dropConsole: true,
});

var plugins = [
    provide,
    extractText,
    new webpack.optimize.OccurenceOrderPlugin(true),
    htmlWebpack,
];
if (DEBUG){
    // DEVELOPMENT
    //plugins.push(
    //  new webpack.HotModuleReplacementPlugin()
    //);
} else {
    plugins.push(
        new webpack.optimize.DedupePlugin(),
        uglifyJsPlugin
    );
}

module.exports = {
    target: "web",
    entry: {
        clientApp: 'index.js',
    },
    output: {
        path: path.join(__dirname, DIR),
        //publicPath: '/' + DIR + '/',
        filename: '[name].bundle.js',
        libraryTarget:'umd', //var [CommonJs, AMD, umd,this]
        library: '[name]' // If set, export the bundle as library
    },
    module: {
        loaders: [
        {test: /\.js?$/, loader: 'babel-loader?cacheDirectory', exclude: /(node_modules|bower_components)/ },
        {test: /\.jsx?$/, loader: 'babel-loader?cacheDirectory', exclude: /(node_modules|bower_components)/ },
        { test: /\.(jpe?g|png|gif)$/i, loader: "file?name=[path][name].[ext]" },
        { test: /\.(mp3|ac3|ogg|m4a|wav)$/i, loader: "file?name=[path][name].[ext]" },
        { test: /\.(ttf|woff|eot|svg|woff2)(\?.*$|$)/i, loader: "file?name=[path][name].[ext]" },
        { test: /\.(json)$/i, loader: "file?name=[path][name].[ext]" },
        // { test: /\.html/,   loader: 'file?name=[path][name].[ext]'}, // breaks html template
        { test: /\.(less)$/i, loader: extractLESS.extract("style-loader", "css-loader",'less-loader') },
        { test: /\.(css)$/i, loader: ExtractTextPlugin.extract("style-loader", "css-loader") }
    ]
    },
    resolve: {
        root: [
            // paths to look in
            path.resolve(__dirname),
            path.resolve('./js/external'),
            path.resolve('./js'),
            path.resolve('./css'),
            path.resolve('./json')
        ],
        alias: {
            // "phaser-arcade-physics": "phaser/build/custom/phaser-arcade-physics.js",
            //  jquery: "jquery/src/jquery"
        },
        // extentions to auto add if needed
        extensions: ["", ".js"]
    },
    postcss: [autoprefixer, csswring],
    debug: DEBUG, // Switch loaders to debug mode.
    // Create Sourcemaps for the bundle
    devtool: DEBUG ? 'source-map' : false, //  slower than 'cheap-module-eval-source-map'
    plugins: plugins
};
