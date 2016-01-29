
/**
Safe spawn utility for HackMyResume / FluentCV.
@module utils/safe-spawn
@license MIT. See LICENSE.md for details.
 */

(function() {
  module.exports = function(cmd, args, isSync, callback) {
    var info, spawn;
    try {
      spawn = require('child_process')[isSync ? 'spawnSync' : 'spawn'];
      info = spawn(cmd, args);
      if (!isSync) {
        info.on('error', function(err) {
          if (callback != null) {
            callback(err);
          } else {
            throw {
              cmd: cmd,
              inner: err
            };
          }
        });
      } else {
        if (info.error) {
          if (callback != null) {
            callback(err);
          } else {
            throw {
              cmd: cmd,
              inner: info.error
            };
          }
        }
      }
    } catch (_error) {
      if (callback != null) {
        return callback(_error);
      } else {
        throw _error;
      }
    }
  };

}).call(this);
