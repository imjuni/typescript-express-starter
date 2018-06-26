const path = require('path');
const tsconfigPathsWebpackPlugin = require('tsconfig-paths-webpack-plugin');
const webpackNodeExternals = require('webpack-node-externals');
// uglifyjsWebpackPlugin을 사용하지 말 것. 잘 안된다. 이를 해결하기 위해서는 노력이 많이 필요하다.
// const uglifyjsWebpackPlugin = require('uglifyjs-webpack-plugin');

const distPath = path.resolve(path.join(__dirname, 'dist'));

const config = {
  externals: [webpackNodeExternals({
    whitelist: ['tslib'],
  })],
  mode: 'development',
  target: 'node',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    plugins: [
      new tsconfigPathsWebpackPlugin({
        configFile: './tsconfig.json',
      }),
    ],
  },

  entry: {
    'joy-luck-server': [
      './app.ts',
    ],
  },

  output: {
    filename: 'app.js',
    libraryTarget: 'commonjs',
    path: distPath,
  },

  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.tsx?$/,
        use: 'source-map-loader',
      },
      {
        loader: 'json-loader',
        test: /\.json$/,
      },
      {
        exclude: [/node_modules/, '../../joy-luck-server'],
        loader: 'ts-loader',
        test: /\.tsx?$/,
      },
    ],
  },

  devtool: 'inline-source-map',

  node: {
    __dirname: false,
    __filename: false,
    console: false,
    global: false,
    process: false,
  },
};

module.exports = config;
