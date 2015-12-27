var webpack = require('webpack');

module.exports = {
  entry: "./src/entry.js",
  output: {
    path: __dirname,
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
