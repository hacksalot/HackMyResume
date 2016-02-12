
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

  SyntaxErrorEx = (function() {
    function SyntaxErrorEx(ex, rawData) {
      var JSONLint, colNum, lineNum, lint, ref;
      lineNum = null;
      colNum = null;
      JSONLint = require('json-lint');
      lint = JSONLint(rawData, {
        comments: false
      });
      if (lint.error) {
        ref = [lint.line, lint.character], this.line = ref[0], this.col = ref[1];
      }
      if (!lint.error) {
        JSONLint = require('jsonlint');
        try {
          JSONLint.parse(rawData);
        } catch (_error) {
          this.line = (/on line (\d+)/.exec(_error))[1];
        }
      }
    }

    return SyntaxErrorEx;

  })();

  SyntaxErrorEx.is = function(ex) {
    return ex instanceof SyntaxError;
  };

  module.exports = SyntaxErrorEx;

}).call(this);

//# sourceMappingURL=syntax-error-ex.js.map
