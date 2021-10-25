// @ts-check
/// <reference path="./index.d.ts" />
const fs = require("fs-extra");
const { google } = require("googleapis");
const path = require("path");
const readline = require("readline");

/** @param {AuthorizeGoogleArgs} args */
module.exports = async function ({ scopes, ...args }) {
  /** @type {string | undefined} */
  let credentialString;
  /** @type {string | undefined} */
  let fullCredentialPath;

  if (!!args.credentialString) {
    credentialString = args.credentialString;
  } else if (
    (!!args.credentialPath && !!(fullCredentialPath = args.credentialPath)) ||
    (!!args.credentialDirectory &&
      !!(fullCredentialPath = path.join(
        args.credentialDirectory,
        args.credentialFileName
      )))
  ) {
    // Load client secrets from a local file.
    credentialString = await fs.readFile(fullCredentialPath).then((c) => {
      return c.toString("utf-8");
    });
  }

  if (!credentialString) {
    throw new Error("Script cannot continue due to invalid OAuth credentials");
  }

  const credentials = JSON.parse(credentialString);
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  /** @type {string | undefined} */
  let fullTokenPath;
  /** @type {string | undefined} */
  let tokenString = undefined;

  if (
    (!!args.tokenPath && !!(fullTokenPath = args.tokenPath)) ||
    (!!args.tokenDirectory &&
      !!(fullTokenPath = path.join(args.tokenDirectory, args.tokenFileName)))
  ) {
    // Load client secrets from a local file.
    tokenString = await fs
      .readFile(fullTokenPath)
      .then((c) => {
        return c.toString("utf-8");
      })
      .catch(() => {
        return undefined;
      });
  }

  /** @type {any} */
  let tokens;

  if (
    !tokenString ||
    (tokens = JSON.parse(tokenString)) == null ||
    (!tokens.refresh_token && tokens.expiry_date < new Date().getTime())
  ) {
    if (!fullTokenPath) {
      throw new Error("Script cannot continue due to invalid token path");
    }

    const authURL = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    console.log("Authorize this app by visiting this url:", authURL);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const oauthCode = await new Promise((resolve) => {
      rl.question("Enter the code from that page here: ", async (code) => {
        rl.close();
        resolve(code);
      });
    });

    tokens = await oAuth2Client.getToken(oauthCode).then(({ tokens }) => {
      return tokens;
    });

    /**
     * If the token file does not exist already, store the token to disk for
     * later program executions
     */
    await fs.writeFile(fullTokenPath, JSON.stringify(tokens));
  }

  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};
