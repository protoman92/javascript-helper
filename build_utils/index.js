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

/**
 * @param {object} args
 * @param {string} args.environment Could be prod(uction)/dev(elopment)/local etc
 * @param {Record<string, unknown>} args.environmentVariables
 * @param {boolean} [args.useNodeEnvFix] https://stackoverflow.com/questions/59272819/cannot-use-e-schema-from-another-module-or-realm-and-duplicate-graphql
 * @param {boolean} [args.useProcessEnv2Dump] Dump all environment variables into process.env2.
 */
exports.createProcessEnvWebpackPlugin = function ({
  environment,
  environmentVariables,
  useNodeEnvFix = true,
  useProcessEnv2Dump = true,
}) {
  environmentVariables = {
    ...environmentVariables,
    ...(useNodeEnvFix && environment !== "local"
      ? { NODE_ENV: "production" }
      : { NODE_ENV: "local" }),
  };

  /** @type {Record<string, DefinePlugin.CodeValueObject>} */
  let definedProperties = {};

  for (const [k, v] of Object.entries(environmentVariables)) {
    definedProperties[`process.env.${k}`] = JSON.stringify(v);
    definedProperties[`process.env["${k}"]`] = JSON.stringify(v);
  }

  if (useProcessEnv2Dump) {
    /** @type {typeof definedProperties} */
    const env2 = {};

    for (const [k, v] of Object.entries(environmentVariables)) {
      env2[k] = JSON.stringify(v);
    }

    definedProperties["process.env2"] = env2;
  }

  return new DefinePlugin(definedProperties);
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
