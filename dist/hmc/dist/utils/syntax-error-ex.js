
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

(function() {
  var SyntaxErrorEx;

  SyntaxErrorEx = function(ex, rawData) {
    var JSONLint, colNum, lineNum, lint;
    lineNum = null;
    colNum = null;
    JSONLint = require('json-lint');
    lint = JSONLint(rawData, {
      comments: false
    });
    this.line = lint.error ? lint.line : '???';
    return this.col = lint.error ? lint.character : '???';
  };

  SyntaxErrorEx.is = function(ex) {
    return ex instanceof SyntaxError;
  };

  module.exports = SyntaxErrorEx;

}).call(this);
