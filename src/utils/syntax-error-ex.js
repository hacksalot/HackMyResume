/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the SyntaxErrorEx class.
@module utils/syntax-error-ex
@license MIT. See LICENSE.md for details.
*/



/**
Represents a SyntaxError exception with line and column info.
Collect syntax error information from the provided exception object. The
JavaScript `SyntaxError` exception isn't interpreted uniformly across environ-
ments, so we reparse on error to grab the line and column.
See: http://stackoverflow.com/q/13323356
@class SyntaxErrorEx
*/

class SyntaxErrorEx {
  constructor( ex, rawData ) {
    let JSONLint = require('json-lint');
    const lint = JSONLint(rawData, { comments: false });
    if (lint.error) { [this.line, this.col] = Array.from([lint.line, lint.character]); }
    if (!lint.error) {
      JSONLint = require('jsonlint');
      try {
        JSONLint.parse(rawData);
      } catch (err) {
        this.line = (/on line (\d+)/.exec(err))[1];
      }
    }
  }
}


// Return true if the supplied parameter is a JavaScript SyntaxError
SyntaxErrorEx.is =  ex  => ex instanceof SyntaxError;

module.exports = SyntaxErrorEx;
