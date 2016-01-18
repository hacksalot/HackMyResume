/**
Status codes for HackMyResume.
@module status-codes.js
@license MIT. See LICENSE.MD for details.
*/

(function(){

  module.exports = {
    success: 0,
    themeNotFound: 1,
    copyCss: 2,
    resumeNotFound: 3,
    missingCommand: 4,
    invalidCommand: 5,
    resumeNotFoundAlt: 6,
    inputOutputParity: 7,
    createNameMissing: 8,
    pdfgeneration: 9,
    missingPackageJSON: 10,
    invalid: 11,
    invalidFormat: 12,
    notOnPath: 13,
    readError: 14,
    parseError: 15,
    fileSaveError: 16,
    generateError: 17,
    invalidHelperUse: 18
  };

}());
