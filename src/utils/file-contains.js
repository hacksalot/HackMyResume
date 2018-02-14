/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the SyntaxErrorEx class.
@module file-contains.js
*/

module.exports = ( file, needle ) => require('fs').readFileSync(file,'utf-8').indexOf( needle ) > -1;
