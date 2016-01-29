###*
Definition of the SafeJsonLoader class.
@module utils/safe-json-loader
@license MIT. See LICENSE.md for details.
###

FS = require('fs')
SyntaxErrorEx = require('./syntax-error-ex')

module.exports = ( file ) ->
  ret = { }
  try
    ret.raw = FS.readFileSync( file, 'utf8' );
    ret.json = JSON.parse( ret.raw );
  catch
    # If we get here, either FS.readFileSync or JSON.parse failed.
    # We'll return HMSTATUS.readError or HMSTATUS.parseError.
    retRaw = ret.raw && ret.raw.trim()
    ret.ex =
      operation: if retRaw then 'parse' else 'read'
      inner:
        if SyntaxErrorEx.is( _error )
        then (new SyntaxErrorEx( _error, retRaw ))
        else _error
      file: file
  ret
