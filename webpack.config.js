var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry: "./src/entry.js",
  output: {
    path: path.join(__dirname, 'dist'),
    filename: "bundle.js"
  },
  module: {
    loaders: [
      // { test: /\.css$/, loader: "style!css" },
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      { test: /\.json$/, loader: 'json' },
      { test: /\.html$/, loader: 'raw' },
    ],
  }
};
