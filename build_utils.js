const dotenv = require("dotenv");
const path = require("path");

/**
 * @param {{[x: string]: unknown}} envVars
 * @param {string[]} keys
 */
function requireEnvVars(envVars, ...keys) {
  for (const key of keys) {
    if (!envVars[key]) throw new Error(`Invalid env for ${key}`);
  }
}

/**
 * @typedef ConstructEnvVarsArgs
 * @property {{[x: string]: unknown}} [additionalEnv]
 * @property {string} dirname
 * @property {readonly string[]} requiredKeys
 * @property {string} stage
 * @param {ConstructEnvVarsArgs} arg0
 */
exports.constructEnvVars = function ({
  additionalEnv = {},
  dirname,
  requiredKeys,
  stage,
}) {
  const NODE_ENV = (() => {
    switch (stage) {
      case "prod":
      case "production":
        return "production";

      case "local":
        return "local";

      case "test":
        return "test";

      case "dev":
      case "development":
      default:
        return "development";
    }
  })();

  /** @type {{[x: string]: unknown}} */
  let extraEnv = {
    ...dotenv.config({ path: path.join(dirname, `.env.${stage}`) }).parsed,
    NODE_ENV,
  };

  switch (process.env.PIPELINE) {
    case "CI":
      for (const key of requiredKeys) extraEnv[key] = process.env[key];
      break;

    default:
      break;
  }

  extraEnv = { ...extraEnv, ...additionalEnv };
  requireEnvVars(extraEnv, ...requiredKeys);
  return extraEnv;
};
