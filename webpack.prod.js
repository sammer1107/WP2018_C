const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const common = require('./webpack.common.js')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = webpackMerge(common, {
    mode: 'production',
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
})