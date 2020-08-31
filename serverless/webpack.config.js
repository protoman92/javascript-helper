const path = require("path");
const slsw = require("serverless-webpack");
const WebpackShellPlugin = require("webpack-shell-plugin");

/**
 * @typedef Args
 * @property {string} dirname
 * @property {'server' | 'serverless'} infrastructure
 * @param {Args} args
 * @return {import('webpack').Configuration}
 */
module.exports = function ({ dirname, infrastructure }) {
  switch (infrastructure) {
    case "server":
      return {
        entry: path.join(dirname, "index.ts"),
        target: "node",
        mode: "development",
        output: { path: path.join(dirname, "build"), filename: "index.js" },
        plugins: [
          new WebpackShellPlugin({
            onBuildEnd: [["yarn", "nodemon"].join(" ")],
          }),
        ],
        resolve: {
          alias: {
            "./serverless_override": path.join(__dirname, "server_override"),
          },
        },
      };

    case "serverless":
    default:
      return {
        entry: slsw.lib.entries,
        target: "node",
        mode: slsw.lib.webpack.isLocal ? "development" : "production",
        optimization: { minimize: false },
        performance: { hints: false },
        devtool: "nosources-source-map",
        output: {
          libraryTarget: "commonjs2",
          path: path.join(dirname, ".webpack"),
          filename: "[name].js",
          sourceMapFilename: "[file].map",
        },
      };
  }
};
