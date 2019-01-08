const path = require('path');
const webpack = require('webpack');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
    entry: ['babel-polyfill', './js/client/main.js'],
    mode: 'production',
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'js/dist')
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/, /phaser.js/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        cacheDirectory: true,
                    }
                }
            }
        ]
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                uglifyOptions: {
                    compress: {
                        drop_console: true,
                    },
                    mangle: {
                        toplevel: true,
                        properties: false,
                    }
                },
                cache: true,
            })
        ],
        splitChunks: {
            cacheGroups: {
                phaser: {
                    test: /phaser.js/,
                    name: 'phaser',
                    chunks: 'all'
                }
            }
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            __DEBUG: false, 
        }),
    ]
};