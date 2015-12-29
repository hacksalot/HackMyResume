/**
Status codes for HackMyResume.
@module status-codes.js
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
    wkhtmltopdf: 9
  };

}());
