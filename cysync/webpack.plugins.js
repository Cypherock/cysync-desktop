const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new webpack.IgnorePlugin({ resourceRegExp: /osx-temperature-sensor/ })
];
