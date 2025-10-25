const path = require('path');
const nodeExternals = require('webpack-node-externals');
const CircularDependencyPlugin = require('circular-dependency-plugin')
const slsw = require('serverless-webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const isLocal = slsw.lib.webpack.isLocal;

module.exports = {
  mode: isLocal ? 'development' : 'production',
  externals: [nodeExternals()],
  entry: slsw.lib.entries,
  devtool: 'source-map',
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.(ts|js)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'cache-loader',
            options: {
              cacheDirectory: path.resolve('.webpackCache')
            }
          },
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
            },
          }
        ]
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, 'src'), 'node_modules'],
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new ForkTsCheckerWebpackPlugin(),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      include: /src/,
      failOnError: false,
      allowAsyncCycles: false,
      cwd: process.cwd(),
    }),
  ],
};
