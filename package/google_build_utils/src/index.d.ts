import { Resolvable } from "@haipham/javascript-helper-essential-types";
import { google, sheets_v4 } from "googleapis";

export type AuthorizeGoogle = (
  /**
   * Either supply stringified credential, or location of the credential file.
   * Either supply stringified token, or location of the token file.
   */
  args: Readonly<
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
  >
) => Promise<typeof google.auth.OAuth2["prototype"]>;

declare namespace SyncGoogleSheet {
  export interface SheetReference {
    readonly columnName: string;
    readonly rowIndex: number;
    readonly sheetID: number;
    readonly sheetTitle: string;
  }
}

export type SyncGoogleSheet = (
  args: Readonly<{
    callback: (
      args: Readonly<{
        gridData: readonly sheets_v4.Schema$GridData[];
        rowData: readonly Readonly<{
          formattedValue: string;
          htmlValue: string;
          sheetReference: SyncGoogleSheet.SheetReference | undefined;
        }>[][];
        sheetID: number;
        sheetTitle: string;
      }>
    ) => Resolvable<void>;
    eligibleSheetTitlesOrIDs: readonly (number | string)[];
    htmlTagMapping: Readonly<{
      bold: string;
      italic: string;
      underline: string;
      wrapper: string;
    }>;
    oAuth2Client: typeof google["auth"]["OAuth2"]["prototype"];
    spreadsheetID: string;
  }>
) => Promise<void>;

export const authorizeGoogle: AuthorizeGoogle;
export const syncGoogleSheet: SyncGoogleSheet;
