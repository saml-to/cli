// eslint-disable-next-line no-undef,@typescript-eslint/no-var-requires
const path = require('path');

// eslint-disable-next-line no-undef
module.exports = {
  // bundling mode
  mode: 'production',

  // entry files
  entry: './src/index.ts',

  // output bundles (location)
  output: {
    // eslint-disable-next-line no-undef
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
  },

  // file resolutions
  resolve: {
    extensions: ['.ts', '.js'],
  },

  // loaders
  module: {
    rules: [
      {
        test: /\.tsx?/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
