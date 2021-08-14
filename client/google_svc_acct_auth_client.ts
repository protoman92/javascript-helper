import { GoogleAuth } from "google-auth-library";
import { requireAllTruthy } from "../utils";

interface GoogleAuthClientArgs {}

export default function ({}: GoogleAuthClientArgs) {
  const { client_email, private_key } = requireAllTruthy(
    JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS || "{}")
  );

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
