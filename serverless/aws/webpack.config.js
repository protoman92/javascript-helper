// @ts-check
const path = require("path");
const WebpackShellPlugin = require("webpack-shell-plugin");

/**
 * @typedef ServerOverrides
 * @property {string} [entry]
 * @property {boolean} [buildOnly] whether the server should be run upon build end.
 * Use this webpack config to ensure we can use server and serverless
 * infrastructures interchangeably during development/deployment.
 * @typedef Args
 * @property {string} dirname the current project directory.
 * @property {'server' | 'serverless'} infrastructure the server infrastructure.
 * @property {ServerOverrides} [serverOverrides] overriding config for server infrastructure.
 * @property {typeof import('serverless-webpack')} slsw serverless config.
 * @param {Args} args
 * @return {import('webpack').Configuration}
 */
module.exports = function ({
  dirname,
  infrastructure,
  serverOverrides: { buildOnly, entry: overrideServerEntry } = {},
  slsw,
}) {
  switch (infrastructure) {
    case "server":
      return {
        entry: overrideServerEntry || path.join(dirname, "index.ts"),
        target: "node",
        mode: "development",
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
