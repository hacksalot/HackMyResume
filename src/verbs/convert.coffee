###*
Implementation of the 'convert' verb for HackMyResume.
@module verbs/convert
@license MIT. See LICENSE.md for details.
###



ResumeFactory = require('../core/resume-factory')
chalk = require('chalk')
Verb = require('../verbs/verb')
HMSTATUS = require('../core/status-codes')
_ = require('underscore')
HMEVENT = require('../core/event-codes');



ConvertVerb = module.exports = Verb.extend

  init: -> @_super 'convert', convert



###*
Convert between FRESH and JRS formats.
###
convert = ( srcs, dst, opts ) ->

  # Housekeeping
  throw { fluenterror: 6, quit: true } if !srcs || !srcs.length
  if !dst || !dst.length
    if srcs.length == 1
      throw { fluenterror: HMSTATUS.inputOutputParity, quit: true };
    else if srcs.length == 2
      dst = dst || []; dst.push( srcs.pop() )
    else
      throw fluenterror: HMSTATUS.inputOutputParity, quit: true

  if srcs && dst && srcs.length && dst.length && srcs.length != dst.length
    throw fluenterror: HMSTATUS.inputOutputParity quit: true

  # Load source resumes
  _.each(srcs, ( src, idx ) ->

    # Load the resume
    rinfo = ResumeFactory.loadOne src,
      format: null, objectify: true, throw: false

    # If a load error occurs, report it and move on to the next file (if any)
    if rinfo.fluenterror
      this.err rinfo.fluenterror, rinfo
      return

    s = rinfo.rez
    srcFmt =
      if ((s.basics && s.basics.imp) || s.imp).orgFormat == 'JRS'
      then 'JRS' else 'FRESH'
    targetFormat = if srcFmt == 'JRS' then 'FRESH' else 'JRS'

    this.stat HMEVENT.beforeConvert,
      srcFile: rinfo.file
      srcFmt: srcFmt
      dstFile: dst[idx]
      dstFmt: targetFormat

    # Save it to the destination format
    s.saveAs dst[idx], targetFormat
    return

  , @)

  return
