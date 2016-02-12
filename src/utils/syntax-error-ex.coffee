###*
Definition of the SyntaxErrorEx class.
@module utils/syntax-error-ex
@license MIT. See LICENSE.md for details.
###



###*
Represents a SyntaxError exception with line and column info.
Collect syntax error information from the provided exception object. The
JavaScript `SyntaxError` exception isn't interpreted uniformly across environ-
ments, so we reparse on error to grab the line and column.
See: http://stackoverflow.com/q/13323356
@class SyntaxErrorEx
###

class SyntaxErrorEx
  constructor: ( ex, rawData ) ->
    lineNum = null
    colNum = null
    JSONLint = require 'json-lint'
    lint = JSONLint rawData, { comments: false }
    [@line, @col] = [lint.line, lint.character] if lint.error
    if !lint.error
      JSONLint = require 'jsonlint'
      try
        JSONLint.parse rawData
      catch
        @line = (/on line (\d+)/.exec _error)[1]



SyntaxErrorEx.is = ( ex ) -> ex instanceof SyntaxError
module.exports = SyntaxErrorEx;
