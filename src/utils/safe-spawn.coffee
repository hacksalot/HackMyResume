###*
Safe spawn utility for HackMyResume / FluentCV.
@module utils/safe-spawn
@license MIT. See LICENSE.md for details.
###

###* Safely spawn a process synchronously or asynchronously without throwing an
exception ###
module.exports = ( cmd, args, isSync, callback, param ) ->

  try
    # .spawnSync not available on earlier Node.js, so default to .spawn
    spawn = require('child_process')[ if isSync then 'spawnSync' else 'spawn']
    info = spawn cmd, args

    # Check for error depending on whether we're sync or async TODO: Promises
    if !isSync
      info.on 'error', (err) ->
        callback?(err, param)
        return
      return
    else
      if info.error
        callback?(info.error, param)
        return cmd: cmd, inner: info.error

  catch
    callback?(_error, param)
    _error
