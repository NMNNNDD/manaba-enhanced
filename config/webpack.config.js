"use strict"

const path = require("path")
const glob = require("glob")

const SizePlugin = require("size-plugin")
const CopyWebpackPlugin = require("copy-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer")
const ZipPlugin = require("zip-webpack-plugin")

process.traceDeprecation = true

const nodeEnv = process.env.NODE_ENV

const entries = glob.sync("./src/*.ts").reduce((acc, cur) => {
  const key = path.basename(cur, ".ts")
  acc[key] = cur
  return acc
}, {})

const version = require("../package.json").version

// To re-use webpack configuration across templates,
// CLI maintains a common webpack configuration file - `webpack.common.js`.
// Whenever user creates an extension, CLI adds `webpack.common.js` file
// in template's `config` folder
const common = {
  mode: nodeEnv === "development" ? "development" : "production",
  output: {
    path: path.resolve(__dirname, "../build"),
    filename: "[name].js",
  },
  entry: entries,
  stats: {
    all: false,
    errors: true,
    builtAt: true,
  },
  devtool: nodeEnv === "development" ? "source-map" : false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
      },
      // Help webpack in understanding CSS files imported in .js files
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.sass$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      // Check for images imported in .js files and
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: "file-loader",
            options: {
              outputPath: "images",
              name: "[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".ts"],
  },
  plugins: [
    // Print file sizes
    new SizePlugin(),
    // Copy static assets from `public` folder to `build` folder
    new CopyWebpackPlugin([
      {
        from: "**/*",
        context: "public",
      },
    ]),
    // Extract CSS into separate files
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    ...(nodeEnv === "production"
      ? [
          new BundleAnalyzerPlugin({ analyzerMode: "static" }),
          new ZipPlugin({
            path: path.resolve(__dirname, "../"),
            filename: `manabaEnhanced-${version}`,
          }),
        ]
      : []),
  ],
}

module.exports = common