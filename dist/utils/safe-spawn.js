
/**
Safe spawn utility for HackMyResume / FluentCV.
@module utils/safe-spawn
@license MIT. See LICENSE.md for details.
 */


/** Safely spawn a process synchronously or asynchronously without throwing an
exception
 */

(function() {
  module.exports = function(cmd, args, isSync, callback, param) {
    var info, spawn;
    try {
      spawn = require('child_process')[isSync ? 'spawnSync' : 'spawn'];
      info = spawn(cmd, args);
      if (!isSync) {
        info.on('error', function(err) {
          if (typeof callback === "function") {
            callback(err, param);
          }
        });
      } else {
        if (info.error) {
          if (typeof callback === "function") {
            callback(info.error, param);
          }
          return {
            cmd: cmd,
            inner: info.error
          };
        }
      }
    } catch (_error) {
      if (typeof callback === "function") {
        callback(_error, param);
      }
      return _error;
    }
  };

}).call(this);

//# sourceMappingURL=safe-spawn.js.map
