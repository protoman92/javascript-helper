import { google } from "googleapis";
import { requireAllTruthy } from "../utils";

export default function () {
  const {
    web: { client_secret, client_id, redirect_uris },
  } = requireAllTruthy(
    JSON.parse(process.env.GOOGLE_OAUTH2_CREDENTIALS || "{}").web
  );

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_OAUTH2_REFRESH_TOKEN || "",
  });

  return oAuth2Client;
}
