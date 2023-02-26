import {
  requireAllTruthy,
  requireTruthy,
} from "@haipham/javascript-helper-preconditions";
import { google } from "googleapis";

declare module "google-auth-library" {
  interface OAuth2Client {
    getUserInfo(): Promise<Readonly<{ email: string }>>;
  }
}

google.auth.OAuth2.prototype.getUserInfo = async function () {
  const { token } = await this.getAccessToken();

  if (!token) {
    throw new Error("No access token found");
  }

  const { email } = await this.getTokenInfo(token);

  if (!email) {
    throw new Error("No user email found");
  }

  return { email };
};

interface GoogleOAuth2ClientArgs {
  /** OAuth2 credentials */
  readonly credentials?: Record<string, any>;
  /** OAuth2 refresh token */
  readonly refreshToken?: string;
}

export default function createGoogleOAuth2Client({
  credentials = JSON.parse(process.env["GOOGLE_OAUTH_CREDENTIALS"] || "{}"),
  refreshToken: refresh_token = requireTruthy(
    JSON.parse(process.env["GOOGLE_OAUTH_TOKEN"] || "{}").refresh_token,
    "GOOGLE_OAUTH_TOKEN"
  ),
}: GoogleOAuth2ClientArgs) {
  const { client_secret, client_id, redirect_uris } = requireAllTruthy(
    credentials["web"]
  );

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  oAuth2Client.setCredentials({ refresh_token });
  return oAuth2Client;
}
