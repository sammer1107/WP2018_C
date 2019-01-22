const webpack = require('webpack')
const webpackMerge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = webpackMerge(common, {
    mode: 'development',
    devtool: 'source-map',
    optimization: {
        minimize: false
    },
    watch: true,
    watchOptions:{
        ignored: /node_modules/
    },
    plugins:[
        new webpack.DefinePlugin({
            __DEBUG: true, 
        }),
    ]
})