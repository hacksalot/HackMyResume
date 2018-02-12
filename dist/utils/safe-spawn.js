(function() {
  /**
  Safe spawn utility for HackMyResume / FluentCV.
  @module utils/safe-spawn
  @license MIT. See LICENSE.md for details.
  */
  /** Safely spawn a process synchronously or asynchronously without throwing an
  exception */
  module.exports = function(cmd, args, isSync, callback, param) {
    var ex, info, spawn;
    try {
      // .spawnSync not available on earlier Node.js, so default to .spawn
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
    } catch (error) {
      ex = error;
      if (typeof callback === "function") {
        callback(ex, param);
      }
      return ex;
    }
  };

}).call(this);

//# sourceMappingURL=safe-spawn.js.map
