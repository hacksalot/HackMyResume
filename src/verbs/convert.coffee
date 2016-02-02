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



module.exports = class ConvertVerb extends Verb

  constructor: -> super 'convert', _convert



###* Private workhorse method. Convert 0..N resumes between FRESH and JRS
formats. ###

_convert = ( srcs, dst, opts ) ->

  # Housekeeping...
  if !srcs || !srcs.length
    @err HMSTATUS.resumeNotFound, { quit: true }
    return null
  if !dst || !dst.length
    if srcs.length == 1
      @err HMSTATUS.inputOutputParity, { quit: true }
    else if srcs.length == 2
      dst = dst || []; dst.push( srcs.pop() )
    else
      @err HMSTATUS.inputOutputParity, { quit: true }
  if srcs && dst && srcs.length && dst.length && srcs.length != dst.length
    @err HMSTATUS.inputOutputParity, { quit: true }

  # Load source resumes
  results = _.map srcs, ( src, idx ) ->
    return { } if opts.assert and @hasError()
    r = _convertOne.call @, src, dst, idx
    if r.fluenterror
      r.quit = opts.assert
      @err r.fluenterror, r
    r
  , @

  if @hasError() and !opts.assert
    @reject results
  else if !@hasError()
    @resolve results
  results



###* Private workhorse method. Convert a single resume. ###
_convertOne = (src, dst, idx) ->
  # Load the resume
  rinfo = ResumeFactory.loadOne src, format: null, objectify: true

  # If a load error occurs, report it and move on to the next file (if any)
  if rinfo.fluenterror
    return rinfo

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
  s
