import { google } from "googleapis";
import { requireAllTruthy, requireTruthy } from "../utils";

interface GoogleOAuth2ClientArgs {
  /** OAuth2 credentials */
  readonly credentials?: Record<string, any>;
  /** OAuth2 refresh token */
  readonly refreshToken?: string;
}

export default function ({
  credentials = JSON.parse(process.env.GOOGLE_OAUTH_CREDENTIALS || "{}"),
  refreshToken: refresh_token = requireTruthy(
    JSON.parse(process.env.GOOGLE_OAUTH_TOKEN || "{}").refresh_token,
    "GOOGLE_OAUTH_TOKEN"
  ),
}: GoogleOAuth2ClientArgs) {
  const { client_secret, client_id, redirect_uris } = requireAllTruthy(
    credentials?.web
  );

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials({ refresh_token });
  return oAuth2Client;
}
