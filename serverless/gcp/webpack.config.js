// @ts-check
const path = require("path");
const WebpackShellPlugin = require("webpack-shell-plugin");

/**
 * @typedef ServerOverrides
 * @property {boolean} [buildOnly] whether the server should be run upon build end.
 * Use this webpack config to ensure we can use server and serverless
 * infrastructures interchangeably during development/deployment.
 * @typedef Args
 * @property {string} dirname the current project directory.
 * @property {'server' | 'serverless'} infrastructure the server infrastructure.
 * @property {ServerOverrides} [serverOverrides] overriding config for server infrastructure.
 * @param {Args} args
 * @return {import('webpack').Configuration}
 */
module.exports = function ({
  dirname,
  infrastructure,
  serverOverrides: { buildOnly } = {},
}) {
  switch (infrastructure) {
    case "server":
      return {
        target: "node",
        output: { path: path.join(dirname, "build"), filename: "index.js" },
        plugins: [
          ...(buildOnly
            ? []
            : /**
               * This is triggered only once after the first build finishes,
               * even in watch mode, so we use nodemon to watch for built file
               * changes.
               */
              [
                new WebpackShellPlugin({
                  onBuildEnd: [["yarn", "nodemon"].join(" ")],
                }),
              ]),
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
        devtool: "nosources-source-map",
        optimization: { minimize: false },
        output: {
          libraryTarget: "commonjs2",
          path: path.join(dirname, ".webpack"),
          filename: "[name].js",
          sourceMapFilename: "[file].map",
        },
        performance: { hints: false },
        target: "node",
      };
  }
};
