const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
});

rules.push(
  // TTF Font
  {
    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'application/octet-stream'
      }
    }
  }
);
rules.push(
  // SVG Font
  {
    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
    use: {
      loader: 'url-loader',
      options: {
        limit: 10000,
        mimetype: 'image/svg+xml'
      }
    }
  }
);

rules.push(
  // Common Image Formats
  {
    test: /\.(?:ico|gif|jpg|jpeg|webp)$/,
    use: 'url-loader'
  }
);

rules.push({ test: /\.png$/, use: 'url-loader?mimetype=image/png' });

module.exports = {
  module: {
    rules
  },
  plugins: plugins,
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css']
  },
  node: {
    __dirname: true
  }
};
