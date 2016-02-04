
/**
Definition of the SafeJsonLoader class.
@module utils/safe-json-loader
@license MIT. See LICENSE.md for details.
 */

(function() {
  var FS, SyntaxErrorEx;

  FS = require('fs');

  SyntaxErrorEx = require('./syntax-error-ex');

  module.exports = function(file) {
    var ret, retRaw;
    ret = {};
    try {
      ret.raw = FS.readFileSync(file, 'utf8');
      ret.json = JSON.parse(ret.raw);
    } catch (_error) {
      retRaw = ret.raw && ret.raw.trim();
      ret.ex = {
        operation: retRaw ? 'parse' : 'read',
        inner: SyntaxErrorEx.is(_error) ? new SyntaxErrorEx(_error, retRaw) : _error,
        file: file
      };
    }
    return ret;
  };

}).call(this);

//# sourceMappingURL=safe-json-loader.js.map
