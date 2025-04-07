const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const entries = {
  asi: './src/asi.ts',
  calc: './src/calc.ts',
  captcha: './src/captcha.ts',
  civilization: './src/civilization.ts',
  excuses: './src/excuses.ts',
  fence: './src/fence.ts',
  rng: './src/rng.ts',
};

const htmlPages = [
  new HtmlWebpackPlugin({
    filename: 'index.html',
    template: './index.html',
    chunks: [], // index.html has no associated ts
  }),
  ...Object.keys(entries).map(name => new HtmlWebpackPlugin({
    filename: `${name}.html`,
    template: `./src/${name}.html`,
    chunks: [name],
  })),
];

module.exports = {
  entry: entries,
  output: {
    filename: '[name].js', // asi.js, calc.js, etc.
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
            loader: 'ts-loader',
            options: {
                configFile: path.resolve(__dirname, 'tsconfig.json')
            },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  plugins: [
    ...htmlPages,
    new CopyWebpackPlugin({
      patterns: [
        { from: 'styles', to: 'styles' },
      ],
    }),
  ],
};
