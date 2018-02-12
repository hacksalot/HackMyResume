(function() {
  /**
  Definition of the SyntaxErrorEx class.
  @module utils/syntax-error-ex
  @license MIT. See LICENSE.md for details.
  */
  var SyntaxErrorEx;

  /**
  Represents a SyntaxError exception with line and column info.
  Collect syntax error information from the provided exception object. The
  JavaScript `SyntaxError` exception isn't interpreted uniformly across environ-
  ments, so we reparse on error to grab the line and column.
  See: http://stackoverflow.com/q/13323356
  @class SyntaxErrorEx
  */
  SyntaxErrorEx = class SyntaxErrorEx {
    constructor(ex, rawData) {
      var JSONLint, colNum, err, lineNum, lint;
      lineNum = null;
      colNum = null;
      JSONLint = require('json-lint');
      lint = JSONLint(rawData, {
        comments: false
      });
      if (lint.error) {
        [this.line, this.col] = [lint.line, lint.character];
      }
      if (!lint.error) {
        JSONLint = require('jsonlint');
        try {
          JSONLint.parse(rawData);
        } catch (error) {
          err = error;
          this.line = (/on line (\d+)/.exec(err))[1];
        }
      }
    }

  };

  // Return true if the supplied parameter is a JavaScript SyntaxError
  SyntaxErrorEx.is = function(ex) {
    return ex instanceof SyntaxError;
  };

  module.exports = SyntaxErrorEx;

}).call(this);

//# sourceMappingURL=syntax-error-ex.js.map
