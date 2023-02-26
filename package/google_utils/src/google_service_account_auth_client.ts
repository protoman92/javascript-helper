import { requireAllTruthy } from "@haipham/javascript-helper-preconditions";
import { CredentialBody, GoogleAuth } from "google-auth-library";

interface GoogleServiceAccountAuthClientArgs {
  /** Service account credentials */
  readonly credentials?: Pick<CredentialBody, "client_email" | "private_key">;
}

export default function createGoogleServiceAccountAuthClient({
  credentials = JSON.parse(
    process.env["GOOGLE_SERVICE_ACCOUNT_CREDENTIALS"] || "{}"
  ),
}: GoogleServiceAccountAuthClientArgs = {}) {
  const { client_email, private_key } = requireAllTruthy(credentials);

  const authClient = new GoogleAuth({
    credentials: { client_email, private_key },
  });

  authClient.request = async function (options) {
    if (!options.url) {
      throw new Error("URL must be specified");
    }

    const idTokenClient = await authClient.getIdTokenClient(
      new URL(options.url).toString()
    );

    return idTokenClient.request(options);
  };

  return authClient;
}
