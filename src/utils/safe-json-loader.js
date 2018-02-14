/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Definition of the SafeJsonLoader class.
@module utils/safe-json-loader
@license MIT. See LICENSE.md for details.
*/

const FS = require('fs');
const SyntaxErrorEx = require('./syntax-error-ex');

module.exports = function( file ) {
  const ret = { };
  try {
    ret.raw = FS.readFileSync( file, 'utf8' );
    ret.json = JSON.parse( ret.raw );
  } catch (err) {
    // If we get here, either FS.readFileSync or JSON.parse failed.
    // We'll return HMSTATUS.readError or HMSTATUS.parseError.
    const retRaw = ret.raw && ret.raw.trim();
    ret.ex = {
      op: retRaw ? 'parse' : 'read',
      inner:
        SyntaxErrorEx.is( err )
        ? (new SyntaxErrorEx( err, retRaw ))
        : err,
      file
    };
  }
  return ret;
};
