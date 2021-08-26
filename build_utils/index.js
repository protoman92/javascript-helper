// @ts-check
const { SharedIniFileCredentials } = require("aws-sdk");
const { DefinePlugin } = require("webpack");

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
 * @property {{[x: string]: unknown}} [additionalEnv] Additional env variables that may not be found in the current env.
 * @property {readonly string[]} [optionalKeys] The keys that may be present in the final env.
 * @property {readonly string[]} requiredKeys The keys that must be present in the final env.
 * @param {ConstructEnvVarsArgs} arg0
 */
exports.constructEnvVars = function ({
  additionalEnv = {},
  optionalKeys = [],
  requiredKeys,
}) {
  /** @type {{[x: string]: unknown}} */
  let extraEnv = {};

  for (const key of [...optionalKeys, ...requiredKeys]) {
    if (!!process.env[key]) extraEnv[key] = process.env[key];
  }

  extraEnv = { ...extraEnv, ...additionalEnv };
  requireEnvVars(extraEnv, ...requiredKeys);
  return extraEnv;
};

/** @param {Record<string, unknown>} environment */
exports.createProcessEnvWebpackPlugin = function (environment) {
  return new DefinePlugin(
    Object.entries(environment).reduce(
      (acc, [k, v]) =>
        Object.assign(acc, {
          [`process.env.${k}`]: JSON.stringify(v),
          [`process.env["${k}"]`]: JSON.stringify(v),
        }),
      {}
    )
  );
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
