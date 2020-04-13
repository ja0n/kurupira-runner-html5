var webpack = require('webpack');
var path = require('path');

module.exports = {
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
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
        }
      },
      { test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' },
      { test: /\.json$/, loader: 'json-loader' },
      { test: /\.html$/, loader: 'raw-loader' },
    ],
  }
};
