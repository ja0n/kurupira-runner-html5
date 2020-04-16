var path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.join(__dirname, 'dist'),
    library: 'KurupiraRunner',
    libraryTarget: 'umd',
    filename: 'kurupira-runner.js',
    auxiliaryComment: 'KurupiraRunner',
  },
  devServer: {
    contentBase: path.join(__dirname, "public"),
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
