const { SharedIniFileCredentials } = require("aws-sdk");
const dotenv = require("dotenv");
const fs = require("fs");
const os = require("os");
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
 * @property {{[x: string]: unknown}} [additionalEnv] additional env variables that may not be found in the .env file.
 * @property {string} dirname the current directory.
 * @property {readonly string[]} [optionalKeys] the keys that may be present in the final env.
 * @property {readonly string[]} requiredKeys the keys that must be present in the final env.
 * @property {string} stage the stage with which we shall find the correct .env file.
 * @param {ConstructEnvVarsArgs} arg0
 */
exports.constructEnvVars = function ({
  additionalEnv = {},
  dirname,
  optionalKeys = [],
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
  let extraEnv = { NODE_ENV };

  for (const key of [...optionalKeys, ...requiredKeys]) {
    if (!!process.env[key]) extraEnv[key] = process.env[key];
  }

  /** @type {{[x: string]: unknown}} */
  extraEnv = {
    ...extraEnv,
    ...dotenv.config({
      encoding: "utf-8",
      debug: true,
      path: path.join(dirname, `.env.${stage}`),
    }).parsed,
  };

  extraEnv = { ...extraEnv, ...additionalEnv };
  requireEnvVars(extraEnv, ...requiredKeys);
  return extraEnv;
};

/**
 * @typedef GetAWSCredentialsArgs
 * @property {string} profile
 * @param {GetAWSCredentialsArgs} arg0
 * @returns {SharedIniFileCredentials}
 */
exports.getLocalAWSCredentials = function ({ profile }) {
  const credentials = new SharedIniFileCredentials({ profile });
  return credentials;
};
