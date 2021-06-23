/// <reference path="./interface.d.ts" />
const fs = require("fs-extra");
const { google } = require("googleapis");
const path = require("path");
const readline = require("readline");

/** @param {AuthorizeGoogleArgs} args */
module.exports = async function ({
  credentialFileName = "google_credentials.json",
  credentialPath = "",
  credentialString: originalCredentialString = "",
  scopes,
  tokenString: originalTokenString = "",
  tokenFileName = "google_token.json",
  tokenPath = credentialPath,
}) {
  const TOKEN_PATH = path.join(tokenPath, tokenFileName);
  let credentialString = originalCredentialString;

  if (!credentialString) {
    // Load client secrets from a local file.
    credentialString = await fs
      .readFile(path.join(credentialPath, credentialFileName))
      .then((c) => c.toString("utf-8"));
  }

  const credentials = JSON.parse(credentialString);
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  /** @type {any} */
  let tokens;

  try {
    let tokenString = originalTokenString;

    if (!tokenString) {
      tokenString = await fs
        .readFile(path.join(credentialPath, tokenFileName))
        .then((t) => t.toString("utf-8"));
    }

    tokens = JSON.parse(tokenString);

    switch (true) {
      case !!tokens.refresh_token:
        break;

      case tokens.expiry_date < new Date().getTime():
        throw new Error("Tokens expired");

      default:
        break;
    }
  } catch (e) {
    const authURL = oAuth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });

    console.log("Authorize this app by visiting this url:", authURL);

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    tokens = await new Promise((resolve, reject) => {
      rl.question("Enter the code from that page here: ", async (code) => {
        rl.close();

        try {
          const { tokens } = await oAuth2Client.getToken(code);

          if (!originalTokenString) {
            /**
             * If the token file does not exist already, store the token to
             * disk for later program executions
             */
            await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
          }

          resolve(tokens);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  oAuth2Client.setCredentials(tokens);
  return oAuth2Client;
};
