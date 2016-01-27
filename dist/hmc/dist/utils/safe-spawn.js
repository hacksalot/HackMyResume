
/**
Safe spawn utility for HackMyResume / FluentCV.
@module utils/safe-spawn
@license MIT. See LICENSE.md for details.
 */

(function() {
  module.exports = function(cmd, args, isSync) {
    var info, spawn;
    try {
      spawn = require('child_process')[isSync ? 'spawnSync' : 'spawn'];
      info = spawn(cmd, args);
      if (!isSync) {
        return info.on('error', function(err) {
          throw {
            cmd: 'wkhtmltopdf',
            inner: err
          };
        });
      } else {
        if (info.error) {
          throw {
            cmd: 'wkhtmltopdf',
            inner: info.error
          };
        }
      }
    } catch (_error) {
      throw _error;
    }
  };

}).call(this);
