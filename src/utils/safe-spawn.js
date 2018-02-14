/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Safe spawn utility for HackMyResume / FluentCV.
@module utils/safe-spawn
@license MIT. See LICENSE.md for details.
*/

/** Safely spawn a process synchronously or asynchronously without throwing an
exception */
module.exports = function( cmd, args, isSync, callback, param ) {

  try {
    // .spawnSync not available on earlier Node.js, so default to .spawn
    const spawn = require('child_process')[ isSync ? 'spawnSync' : 'spawn'];
    const info = spawn(cmd, args);

    // Check for error depending on whether we're sync or async TODO: Promises
    if (!isSync) {
      info.on('error', function(err) {
        if (typeof callback === 'function') {
          callback(err, param);
        }
      });
      return;
    } else {
      if (info.error) {
        if (typeof callback === 'function') {
          callback(info.error, param);
        }
        return {cmd, inner: info.error};
      }
    }

  } catch (ex) {
    if (typeof callback === 'function') {
      callback(ex, param);
    }
    return ex;
  }
};
