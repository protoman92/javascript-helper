/**
 * Either supply stringified credential, or location of the credential file.
 * Either supply stringified token, or location of the token file.
 */
type AuthorizeGoogleArgs = Readonly<
  { scopes: string[] } & (
    | {
        credentialString: string;
        credentialDirectory?: undefined;
        credentialFileName?: undefined;
        credentialPath?: undefined;
      }
    | {
        credentialString?: undefined;
        credentialDirectory?: undefined;
        credentialFileName?: undefined;
        credentialPath: string;
      }
    | {
        credentialString?: undefined;
        credentialDirectory: string;
        credentialFileName: string;
        credentialPath?: undefined;
      }
  ) &
    (
      | {
          tokenDirectory?: undefined;
          tokenFileName?: undefined;
          tokenPath: string;
        }
      | {
          tokenDirectory: string;
          tokenFileName: string;
          tokenPath?: undefined;
        }
    )
>;
