//webpack.config.js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js', // Punto de entrada de tu aplicación
  output: {
    path: path.resolve(__dirname, 'dist'), // Carpeta de salida
    filename: 'bundle.js', // Nombre del archivo de salida
    publicPath: '/', // Ruta pública
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Archivos JS
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.css$/, // Archivos CSS
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif)$/, // Archivos de imagen
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[path][name].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html', // Plantilla HTML
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
  devServer: {
    contentBase: path.join(__dirname, 'dist'), // Carpeta de contenido
    compress: true,
    port: 3000,
    historyApiFallback: true, // Para rutas de React Router
  },
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
    },
  },
};
