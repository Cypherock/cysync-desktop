const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const relocateLoader = require('@vercel/webpack-asset-relocator-loader');

module.exports = [
  new ForkTsCheckerWebpackPlugin(),
  new webpack.IgnorePlugin({ resourceRegExp: /osx-temperature-sensor/ }),
  {
    apply(compiler) {
      compiler.hooks.compilation.tap(
        'webpack-asset-relocator-loader',
        compilation => {
          relocateLoader.initAssetCache(compilation, 'native_modules');
        }
      );
    }
  }
];
