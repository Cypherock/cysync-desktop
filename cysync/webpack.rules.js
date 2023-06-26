module.exports = [
  {
    test: /native_modules\/.+\.node$/,
    use: 'node-loader'
  },
  {
    test: /\.md$/,
    use: ['markdown-loader', 'html-loader']
  },
  {
    test: /\.(m?js|node)$/,
    parser: { amd: false },
    use: {
      loader: '@vercel/webpack-asset-relocator-loader',
      options: {
        outputAssetBase: 'native_modules'
      }
    }
  },
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true
      }
    }
  }
];
