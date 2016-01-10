/**
Definition of the SyntaxErrorEx class.
@module syntax-error-ex.js
@license MIT. See LICENSE.md for details.
*/

(function() {


  /**
  Represents a SyntaxError exception with line and column info.
  Collect syntax error information from the provided exception object. The
  JavaScript `SyntaxError` exception isn't interpreted uniformly across environ-
  ments, so we reparse on error to grab the line and column.
  See: http://stackoverflow.com/q/13323356
  @class SyntaxErrorEx
  */

  function SyntaxErrorEx( ex, rawData ) {

    var lineNum = null, colNum = null;
    var JSONLint = require('json-lint');
    var lint = JSONLint( rawData, { comments: false } );
    this.line = (lint.error ? lint.line : '???');
    this.col =  (lint.error ? lint.character : '???');

  }

  SyntaxErrorEx.is = function( ex ) {
    return ex instanceof SyntaxError;
  };

  module.exports = SyntaxErrorEx;

}());
