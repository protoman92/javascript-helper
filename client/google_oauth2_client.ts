import { google } from "googleapis";
import { requireAllTruthy } from "../utils";

export default function () {
  const {
    GOOGLE_OAUTH2_CREDENTIALS = "{}",
    GOOGLE_OAUTH2_REFRESH_TOKEN = "",
  } = process.env;

  const googleCredentials = JSON.parse(GOOGLE_OAUTH2_CREDENTIALS);
  requireAllTruthy({ webCredentials: googleCredentials.web });

  const {
    web: { client_secret, client_id, redirect_uris },
  } = googleCredentials;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH2_REFRESH_TOKEN });
  return oAuth2Client;
}
