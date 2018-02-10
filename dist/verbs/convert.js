
/**
Implementation of the 'convert' verb for HackMyResume.
@module verbs/convert
@license MIT. See LICENSE.md for details.
 */

(function() {
  var ConvertVerb, HMEVENT, HMSTATUS, ResumeFactory, Verb, _, _convert, _convertOne, chalk,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ResumeFactory = require('../core/resume-factory');

  chalk = require('chalk');

  Verb = require('../verbs/verb');

  HMSTATUS = require('../core/status-codes');

  _ = require('underscore');

  HMEVENT = require('../core/event-codes');

  module.exports = ConvertVerb = (function(superClass) {
    extend(ConvertVerb, superClass);

    function ConvertVerb() {
      ConvertVerb.__super__.constructor.call(this, 'convert', _convert);
    }

    return ConvertVerb;

  })(Verb);


  /** Private workhorse method. Convert 0..N resumes between FRESH and JRS
  formats.
   */

  _convert = function(srcs, dst, opts) {
    var fmtUp, freshVerRegex, matches, results, targetSchema, targetVer;
    if (!srcs || !srcs.length) {
      this.err(HMSTATUS.resumeNotFound, {
        quit: true
      });
      return null;
    }
    if (!dst || !dst.length) {
      if (srcs.length === 1) {
        this.err(HMSTATUS.inputOutputParity, {
          quit: true
        });
      } else if (srcs.length === 2) {
        dst = dst || [];
        dst.push(srcs.pop());
      } else {
        this.err(HMSTATUS.inputOutputParity, {
          quit: true
        });
      }
    }
    if (srcs && dst && srcs.length && dst.length && srcs.length !== dst.length) {
      this.err(HMSTATUS.inputOutputParity, {
        quit: true
      });
    }
    targetVer = null;
    if (opts.format) {
      fmtUp = opts.format.trim().toUpperCase();
      freshVerRegex = require('../utils/fresh-version-regex');
      matches = fmtUp.match(freshVerRegex());
      if (!matches) {
        this.err(HMSTATUS.invalidSchemaVersion, {
          data: opts.format.trim(),
          quit: true
        });
      }
      targetSchema = matches[1];
      targetVer = matches[2] || '1';
    }
    if (this.hasError()) {
      this.reject(this.errorCode);
      return null;
    }
    results = _.map(srcs, function(src, idx) {
      var r;
      r = _convertOne.call(this, src, dst, idx, targetSchema, targetVer);
      if (r.fluenterror) {
        r.quit = opts.assert;
        this.err(r.fluenterror, r);
      }
      return r;
    }, this);
    if (this.hasError() && !opts.assert) {
      this.reject(results);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };


  /** Private workhorse method. Convert a single resume. */

  _convertOne = function(src, dst, idx, targetSchema, targetVer) {
    var err, rez, rinfo, srcFmt, targetFormat;
    rinfo = ResumeFactory.loadOne(src, {
      format: null,
      objectify: true,
      inner: {
        privatize: false
      }
    });
    if (rinfo.fluenterror) {
      this.stat(HMEVENT.beforeConvert, {
        srcFile: src,
        srcFmt: '???',
        dstFile: dst[idx],
        dstFmt: '???',
        error: true
      });
      return rinfo;
    }
    rez = rinfo.rez;
    srcFmt = '';
    if (rez.meta && rez.meta.format) {
      srcFmt = 'FRESH';
    } else if (rez.basics) {
      srcFmt = 'JRS';
    } else {
      rinfo.fluenterror = HMSTATUS.unknownSchema;
      return rinfo;
    }
    targetFormat = targetSchema || (srcFmt === 'JRS' ? 'FRESH' : 'JRS');
    this.stat(HMEVENT.beforeConvert, {
      srcFile: rinfo.file,
      srcFmt: srcFmt,
      dstFile: dst[idx],
      dstFmt: targetFormat
    });
    try {
      rez.saveAs(dst[idx], targetFormat, targetVer);
    } catch (_error) {
      err = _error;
      if (err.badVer) {
        return {
          fluenterror: HMSTATUS.invalidSchemaVersion,
          quit: true,
          data: err.badVer
        };
      }
    }
    return rez;
  };

}).call(this);

//# sourceMappingURL=convert.js.map
