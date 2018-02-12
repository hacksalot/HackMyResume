(function() {
  /**
  Definition of the SafeJsonLoader class.
  @module utils/safe-json-loader
  @license MIT. See LICENSE.md for details.
  */
  var FS, SyntaxErrorEx;

  FS = require('fs');

  SyntaxErrorEx = require('./syntax-error-ex');

  module.exports = function(file) {
    var err, ret, retRaw;
    ret = {};
    try {
      ret.raw = FS.readFileSync(file, 'utf8');
      ret.json = JSON.parse(ret.raw);
    } catch (error) {
      err = error;
      // If we get here, either FS.readFileSync or JSON.parse failed.
      // We'll return HMSTATUS.readError or HMSTATUS.parseError.
      retRaw = ret.raw && ret.raw.trim();
      ret.ex = {
        op: retRaw ? 'parse' : 'read',
        inner: SyntaxErrorEx.is(err) ? new SyntaxErrorEx(err, retRaw) : err,
        file: file
      };
    }
    return ret;
  };

}).call(this);

//# sourceMappingURL=safe-json-loader.js.map
