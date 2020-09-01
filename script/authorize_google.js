const fs = require("fs-extra");
const { google } = require("googleapis");
const path = require("path");
const readline = require("readline");

/**
 * @typedef Args
 * @property {string} dirname
 * @property {string[]} scopes
 * @param {Args} args
 */
module.exports = async function ({ dirname, scopes }) {
  const TOKEN_PATH = path.join(dirname, "credential", "google_token.json");

  // Load client secrets from a local file.
  const credentialsContent = await fs.readFile(
    path.join(dirname, "credential", "google_credentials.json")
  );

  const credentials = JSON.parse(credentialsContent.toString("utf-8"));
  const { client_secret, client_id, redirect_uris } = credentials.web;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  /** @type {any} */
  let tokens;

  try {
    const tokenString = await fs.readFile(TOKEN_PATH);
    tokens = JSON.parse(tokenString.toString("utf-8"));

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
          // Store the token to disk for later program executions
          await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
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
