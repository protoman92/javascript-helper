/**
 * Either supply stringified credential, or location of the credential file.
 * Either supply stringified token, or location of the token file.
 */
type AuthorizeGoogleArgs = Readonly<
  {
    scopes: string[];
  } & (
    | {
        credentialString: string;
        credentialFileName?: undefined;
        credentialPath?: undefined;
      }
    | {
        credentialString?: undefined;
        credentialFileName?: string;
        credentialPath: string;
      }
  ) &
    (
      | {
          tokenString: string;
          tokenFileName?: undefined;
          tokenPath?: undefined;
        }
      | { tokenString?: undefined; tokenFileName: string; tokenPath?: string }
    )
>;
