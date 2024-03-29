// @ts-check
/// <reference path="./index.d.ts" />
const { google } = require("googleapis");

/** @type {import('./index').SyncGoogleSheet} */
const syncGoogleSheet = async function ({
  callback,
  eligibleSheetTitlesOrIDs,
  oAuth2Client,
  htmlTagMapping: {
    bold: boldTag = "b",
    italic: italicTag = "i",
    underline: underlineTag = "u",
    wrapper: wrapperTag = undefined,
  } = {},
  spreadsheetID: spreadsheetId,
}) {
  /**
   * @param {object} args
   * @param {string} args.formattedValue
   * @param {import('googleapis').sheets_v4.Schema$TextFormatRun[]} args.textFormatRuns
   * @return {string}
   */
  function generateHTMLFromTextFormatRuns({ formattedValue, textFormatRuns }) {
    /** @type {[number, number][]} */
    const indexSlices = [];

    for (let { startIndex } of textFormatRuns) {
      startIndex = startIndex || 0;

      if (indexSlices.length > 0) {
        const lastSlice = indexSlices[indexSlices.length - 1];
        lastSlice[1] = startIndex;
      }

      indexSlices.push([startIndex, formattedValue.length]);
    }

    /** @type {string[]} */
    let htmlStrings = [];

    for (let index = 0; index < indexSlices.length; index += 1) {
      const [startIndex, endIndex] = indexSlices[index];

      const { format: { bold, italic, underline } = {} } =
        textFormatRuns[index];

      let html = formattedValue.slice(startIndex, endIndex);

      if (!!underline) {
        html = `<${underlineTag}>${html}</${underlineTag}>`;
      }

      if (!!italic) {
        html = `<${italicTag}>${html}</${italicTag}>`;
      }

      if (!!bold) {
        html = `<${boldTag}>${html}</${boldTag}>`;
      }

      htmlStrings.push(html);
    }

    let html = htmlStrings.join("");

    if (!!wrapperTag) {
      html = `<${wrapperTag}>${html}</${wrapperTag}>`;
    }
    return html;
  }

  const workbook = google.sheets({ auth: oAuth2Client, version: "v4" });

  const {
    data: { sheets: worksheets = [] },
  } = await workbook.spreadsheets.get({ spreadsheetId, includeGridData: true });

  /** @type {Record<string, number>} */
  const sheetTitleIDMapping = {};

  for (const { properties: { sheetId = NaN, title = "" } = {} } of worksheets) {
    if (sheetId == null || isNaN(sheetId) || title == null) {
      continue;
    }

    sheetTitleIDMapping[title] = sheetId;
  }

  /** @type {Set<number | string | null>} */
  const sheetsToSync = new Set(eligibleSheetTitlesOrIDs);

  for (const {
    data: gridData = [],
    properties: { sheetId = NaN, title: sheetTitle = "" } = {},
  } of worksheets) {
    if (
      !sheetTitle ||
      (eligibleSheetTitlesOrIDs != null &&
        !sheetsToSync.has(sheetId) &&
        !sheetsToSync.has(sheetTitle))
    ) {
      continue;
    }

    await callback({
      gridData,
      sheetTitle,
      sheetID: sheetId || NaN,
      rowData: gridData.flatMap(({ rowData = [] } = {}) => {
        return rowData.map(({ values = [] }) => {
          return values.map(
            ({
              formattedValue,
              textFormatRuns = [],
              userEnteredValue = {},
            }) => {
              const fmtValue = formattedValue || "";
              /** @type {import('./index').SyncGoogleSheet.SheetReference | undefined} */
              let sheetReference;
              /** @type {RegExpMatchArray | null} */
              let sheetReferenceMatch = null;

              if (
                !!userEnteredValue.formulaValue &&
                (sheetReferenceMatch = userEnteredValue.formulaValue.match(
                  /^'?=('?(?<sheetTitle>.+)'?!)?\$?(?<columnName>[A-Z]+)\$?(?<rowIndex>\d+)'?$/
                )) != null &&
                sheetReferenceMatch.groups != null
              ) {
                const {
                  columnName: referenceColumnName,
                  rowIndex: referenceRowIndex,
                  sheetTitle: referenceSheetTitle = sheetTitle,
                } = sheetReferenceMatch.groups;

                const referenceSheetID =
                  sheetTitleIDMapping[referenceSheetTitle];

                sheetReference = {
                  columnName: referenceColumnName,
                  rowIndex: parseInt(referenceRowIndex) - 1,
                  sheetID: referenceSheetID,
                  sheetTitle: referenceSheetTitle,
                };
              }

              return {
                sheetReference,
                formattedValue: fmtValue,
                /** Text format runs only apply for string values */
                htmlValue:
                  !!userEnteredValue.stringValue && textFormatRuns.length > 0
                    ? generateHTMLFromTextFormatRuns({
                        textFormatRuns,
                        formattedValue: fmtValue,
                      })
                    : generateHTMLFromTextFormatRuns({
                        formattedValue: fmtValue,
                        textFormatRuns: [{ format: {} }],
                      }),
              };
            }
          );
        });
      }),
    });
  }
};

module.exports = syncGoogleSheet;
