/**
Definition of the SyntaxErrorEx class.
@module syntax-error-ex.js
*/

(function() {


  /**
  Represents a SyntaxError exception with line and column info.
  Collect syntax error information from the provided exception object. The
  JavaScript `SyntaxError` exception isn't interpreted uniformly across environ-
  ments, so we first check for a .lineNumber and .columnNumber and, if that's
  not present, fall back to the JSONLint library, which provides that info.
  See: http://stackoverflow.com/q/13323356
  @class SyntaxErrorEx
  */

  module.exports = function SyntaxErrorEx( ex, rawData ) {

    var lineNum = null, colNum = null;
    if( ex.lineNumber !== undefined && ex.lineNumber !== null ) {
      lineNum = ex.lineNumber;
    }
    if( ex.columnNumber !== undefined && ex.columnNumber !== null ) {
      colNum = ex.columnNumber;
    }
    if( lineNum === null || colNum === null ) {
      var JSONLint = require('json-lint');
      var lint = JSONLint( rawData, { comments: false } );
      if( lineNum === null ) lineNum = (lint.error ? lint.line : '???');
      if( colNum === null ) colNum = (lint.error ? lint.character : '???');
    }
    this.line = lineNum;
    this.col = colNum;

  };


}());
