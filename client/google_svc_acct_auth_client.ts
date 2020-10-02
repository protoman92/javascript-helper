import { GoogleAuth } from "google-auth-library";
import { requireAllTruthy } from "../utils";

interface GoogleAuthClientArgs {
  readonly scopes: readonly string[];
}

export default function ({ scopes }: GoogleAuthClientArgs) {
  const {
    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: credentials = "{}",
  } = process.env;

  const { client_email, private_key } = JSON.parse(credentials);
  requireAllTruthy({ client_email, private_key });

  const authClient = new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: [...scopes],
  });

  return authClient;
}
