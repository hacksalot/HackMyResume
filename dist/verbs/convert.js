
/**
Implementation of the 'convert' verb for HackMyResume.
@module verbs/convert
@license MIT. See LICENSE.md for details.
 */

(function() {
  var ConvertVerb, HMEVENT, HMSTATUS, ResumeFactory, Verb, _, chalk, convert;

  ResumeFactory = require('../core/resume-factory');

  chalk = require('chalk');

  Verb = require('../verbs/verb');

  HMSTATUS = require('../core/status-codes');

  _ = require('underscore');

  HMEVENT = require('../core/event-codes');

  ConvertVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('convert');
    },
    invoke: function() {
      this.stat(HMEVENT.begin, {
        cmd: 'convert'
      });
      convert.apply(this, arguments);
      return this.stat(HMEVENT.end);
    }
  });


  /**
  Convert between FRESH and JRS formats.
   */

  convert = function(srcs, dst, opts) {
    if (!srcs || !srcs.length) {
      throw {
        fluenterror: 6,
        quit: true
      };
    }
    if (!dst || !dst.length) {
      if (srcs.length === 1) {
        throw {
          fluenterror: HMSTATUS.inputOutputParity,
          quit: true
        };
      } else if (srcs.length === 2) {
        dst = dst || [];
        dst.push(srcs.pop());
      } else {
        throw {
          fluenterror: HMSTATUS.inputOutputParity,
          quit: true
        };
      }
    }
    if (srcs && dst && srcs.length && dst.length && srcs.length !== dst.length) {
      throw {
        fluenterror: HMSTATUS.inputOutputParity({
          quit: true
        })
      };
    }
    _.each(srcs, function(src, idx) {
      var rinfo, s, srcFmt, targetFormat;
      rinfo = ResumeFactory.loadOne(src, {
        format: null,
        objectify: true,
        "throw": false
      });
      if (rinfo.fluenterror) {
        this.err(rinfo.fluenterror, rinfo);
        return;
      }
      s = rinfo.rez;
      srcFmt = ((s.basics && s.basics.imp) || s.imp).orgFormat === 'JRS' ? 'JRS' : 'FRESH';
      targetFormat = srcFmt === 'JRS' ? 'FRESH' : 'JRS';
      this.stat(HMEVENT.beforeConvert, {
        srcFile: rinfo.file,
        srcFmt: srcFmt,
        dstFile: dst[idx],
        dstFmt: targetFormat
      });
      s.saveAs(dst[idx], targetFormat);
    }, this);
  };

}).call(this);
