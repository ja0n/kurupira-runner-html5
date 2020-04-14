var webpack = require('webpack');
var path = require('path');

module.exports = {
  mode: 'development',
  entry: {
    runner: './src/index.js',
    example: './src/example.js',
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js'
  },
  devServer: {
    // contentBase: path.join(__dirname, "dist"),
    compress: true,
    port: 8080
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, use: 'babel-loader' },
      { test: /\.html$/, use: 'raw-loader' },
    ],
  }
};
