const { google } = require("googleapis");

/**
 * @typedef SheetCallbackArgs
 * @property {unknown[][]} sheetRows
 * @property {string} sheetTitle
 * @typedef Args
 * @property {(args: SheetCallbackArgs) => import("../interface").Resolvable<void>} callback
 * @property {google["auth"]["OAuth2"]['prototype']} oAuth2Client
 * @property {string} spreadsheetID
 * @param {Args} args
 */
module.exports = async function ({
  callback,
  oAuth2Client,
  spreadsheetID: spreadsheetId,
}) {
  const workbook = google.sheets({ auth: oAuth2Client, version: "v4" });

  const {
    data: { sheets: worksheets = [] },
  } = await workbook.spreadsheets.get({ spreadsheetId });

  await Promise.all(
    worksheets.map(async ({ properties: { title: sheetTitle = "" } = {} }) => {
      if (!sheetTitle) return;

      const {
        data: { values: sheetRows },
      } = await workbook.spreadsheets.values.get({
        spreadsheetId,
        range: `${sheetTitle}!A:Z`,
      });

      if (sheetRows == null || sheetRows.length === 0) return;
      await callback({ sheetRows, sheetTitle });
    })
  );
};
