import { GoogleAuth, CredentialBody } from "google-auth-library";
import { requireAllTruthy } from "../utils";

interface GoogleServiceAccountAuthClientArgs {
  /** Service account credentials */
  readonly credentials?: Pick<CredentialBody, "client_email" | "private_key">;
}

export default function ({
  credentials = JSON.parse(
    process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "{}"
  ),
}: GoogleServiceAccountAuthClientArgs) {
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
