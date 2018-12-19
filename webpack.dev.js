const path = require('path');
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
        splitChunks: {
            cacheGroups: {
                phaser: {
                    test: /phaser.js/,
                    name: 'phaser',
                    chunks: 'all'
                }
            }
        }
    }
};