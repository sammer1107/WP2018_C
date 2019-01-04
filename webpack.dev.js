const path = require('path');

module.exports = {
    entry: ['babel-polyfill', './js/client/main.js'],
    mode: 'development',
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
    devtool: "source-map",
    optimization: {
        minimize: false
    },
    watch: true,
    watchOptions:{
        ignored: /node_modules/
    }
};