'use strict';
var path = require('path');
var colors = require('colors');
var webpack = require('webpack');
// var WebpackConfig = require('webpack-config');
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
var htmlMinifyLoader = require("html-minify-loader");


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
    "chai":"chai",
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
    template: 'src/index.webpack',
    inject: 'body',
    filename: 'index.html',
    hash: true,
    showErrors: DEBUG,
    minify: DEBUG? false: htmlMinifyLoader
});
// uglify in production
var uglifyJsPlugin = new webpack.optimize.UglifyJsPlugin({
  minimize: !DEBUG,
  sourceMap: DEBUG,
  mangle: false,//!DEBUG,
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
        new webpack.NoErrorsPlugin(),
        new webpack.optimize.DedupePlugin(),
        new webpack.optimize.OccurenceOrderPlugin(),
        uglifyJsPlugin
    );
}

module.exports = {
    target: "web", //web[node,async-node,node-webkit,electron,webworker]
    entry: {
        clientApp: 'index.js',
        // clientLib: 'lib.js',
    },
    output: {
        path: path.join(__dirname, DIR),
        // publicPath: '/' + DIR + '/',
        filename: '[name].bundle.js?cacheBust=[hash]',
        libraryTarget:'umd', //var [CommonJs, AMD, umd,this]
        library: '[name]' // If set, export the bundle as library
    },
    module: {
        loaders: [
        {test: /\.jsx?$/i, loader: 'babel?cacheDirectory=node_modules/.cache', exclude: /(node_modules|bower_components)/ },
        { test: /\.(png)$/i, loader: "url?limit=5000&name=[path][name].[ext]" },
        { test: /\.(gif)$/i, loader: "url?limit=5000&name=[path][name].[ext]" },
        { test: /\.(jpe?g)$/i, loader: "url?limit=5000&name=[path][name].[ext]" },
        { test: /\.(mp3|ac3|ogg|m4a|wav)$/i, loader: "file?name=[path][name].[ext]" },
        { test: /\.(ttf|woff|eot|svg|woff2|ico)(\?.*$|$)/i, loader: "file?&name=[path][name].[ext]" },
        { test: /\.(json)$/i, loader: "json-loader" }, // this loads it as javascript in one go
        { test: /\.html/i,   loader: 'file?name=[path][name].[ext]!html-minify'}, // breaks html template // html-minify?
        { test: /\.(less)$/i, loader: extractLESS.extract("style-loader", "css-loader",'less-loader') },
        { test: /\.(css)$/i, loader: ExtractTextPlugin.extract("style-loader", "css-loader") }
    ]
    },
    resolve: {
        root: [
            // paths to look in
            // path.resolve(__dirname),
            path.resolve('./src'),
            path.resolve('./src/js'),
            path.resolve('./src/css'),
            path.resolve('./src/less'),
            path.resolve('./src/fonts'),
            path.resolve('./src/json')
        ],
        alias: {
            //  e.g. jquery: "jquery/src/jquery"
        },
        // extentions to auto add if needed
        extensions: ["", ".js"]
    },
    postcss: [autoprefixer, csswring],
    debug: DEBUG, // Switch loaders to debug mode.
    // Create Sourcemaps for the bundle
    devtool: DEBUG ? 'source-map' : false, //  slower than 'cheap-module-eval-source-map'
    plugins: plugins,
    'html-minify-loader': {
         empty: true,        // KEEP empty attributes
         cdata: true,        // KEEP CDATA from scripts
         comments: DEBUG,     // KEEP comments
         dom: {                            // options of !(htmlparser2)[https://github.com/fb55/htmlparser2]
                lowerCaseAttributeNames: false,      // do not call .toLowerCase for each attribute name (Angular2 uses camelCase attributes)
         }
    }
};
