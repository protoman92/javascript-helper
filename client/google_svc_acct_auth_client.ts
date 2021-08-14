import { GoogleAuth } from "google-auth-library";
import { requireAllTruthy } from "../utils";

interface GoogleAuthClientArgs {
  readonly scopes: readonly string[];
}

export default function ({ scopes }: GoogleAuthClientArgs) {
  const { client_email, private_key } = requireAllTruthy(
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "{}")
  );

  const authClient = new GoogleAuth({
    credentials: { client_email, private_key },
    scopes: scopes.slice(),
  });

  return authClient;
}
