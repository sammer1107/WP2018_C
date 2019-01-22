const path = require('path')
const cleanWebpackPlugin = require('clean-webpack-plugin')
const HTMLWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

var outputDir = path.resolve(__dirname, 'dist/muzikuro')

module.exports = {
    entry: {
        muzikuro: ['babel-polyfill', './src/muzikuro/main.js'],
    },
    output: {
        filename: '[name].[chunkhash:8].js',
        chunkFilename: '[name].[chunkhash:8].js',
        path: outputDir
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/node_modules/, /phaser/],
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
    optimization:{
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /node_modules/,
                    chunks: 'initial',
                    name: 'vendor',
                    enforce: true
                },
            }
        } 
    },
    plugins:[
        new cleanWebpackPlugin([
            path.join(outputDir, 'muzikuro.*.js*') 
        ]),
        new HTMLWebpackPlugin({
            filename: path.join(outputDir, 'index.html'),
            template: './src/muzikuro/index.html',
            inject: 'body'
        }),
        new CopyWebpackPlugin(
            [{from:'./src/muzikuro/index.css', to:path.join(outputDir, 'index.css') }]
        )
    ]
}