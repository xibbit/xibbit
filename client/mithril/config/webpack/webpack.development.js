// The MIT License (MIT)
//
// xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
//
// @version 2.0.0
// @copyright xibbit 2.0.0 Copyright (c) © 2021 Daniel W. Howard and Sanjana A. Joshi Partnership
// @license http://opensource.org/licenses/MIT
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const Dotenv = require('dotenv-webpack');
const paths = require('./paths');

module.exports = {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    devServer: {
        hot: true,
        contentBase: paths.outputPath,
        port: 3000,
        proxy: {
            '/php': 'http://localhost:80/xibbit/server',
            '/socket.io': 'http://localhost:80/xibbit/server/php'
        },
        open: true,
        /*overlay: {
            errors: true,
            warnings: true,
        },*/
        compress: true,
        historyApiFallback: true
    },
    module: {
        rules: [{
            test: /\.js$/,
            enforce: 'pre',
            exclude: /node_modules/,
            loader: 'eslint-loader',
            options: {
                cache: false,
                configFile: './.eslintrc.js',
                emitWarning: true,
                // Fail only on errors
                failOnWarning: false,
                failOnError: false,
                // Toggle autofix
                fix: false,
                formatter: require('eslint/lib/cli-engine/formatters/stylish')
            }
        }]
    },
    output: {
        path: paths.outputPath,
        filename: 'js/[name].js',
        chunkFilename: 'js/[name].js'
    },
    plugins: [
        new Dotenv({
            path: paths.envDevPath, // Path to .env.development file
            expand: true 
        }),
        new Dotenv({
            path: paths.envPath, // Path to .env file 
            expand: true
        }),
        new MiniCssExtractPlugin({
            filename: 'css/[name].css',
            chunkFilename: 'css/[id].css'
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    optimization: {
        splitChunks: {
            chunks: 'all'
        }
    }
};
