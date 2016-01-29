###*
Safe spawn utility for HackMyResume / FluentCV.
@module utils/safe-spawn
@license MIT. See LICENSE.md for details.
###

module.exports = ( cmd, args, isSync, callback ) ->

  try

    # .spawnSync not available on earlier Node.js, so default to .spawn
    spawn = require('child_process')[ if isSync then 'spawnSync' else 'spawn'];
    info = spawn cmd, args

    # Check for error depending on whether we're sync or async
    if !isSync
      info.on 'error', (err) ->
        if callback? then callback err; return
        else throw cmd: cmd, inner: err
      return
    else
      if info.error
        if callback? then callback err; return
        else throw cmd: cmd, inner: info.error

  catch
    if callback? then callback _error
    else throw _error
