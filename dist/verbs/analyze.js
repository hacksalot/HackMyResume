
/**
Implementation of the 'analyze' verb for HackMyResume.
@module verbs/analyze
@license MIT. See LICENSE.md for details.
 */

(function() {
  var AnalyzeVerb, HMEVENT, HMSTATUS, MKDIRP, PATH, ResumeFactory, Verb, _, _analyze, _analyzeOne, _loadInspectors, chalk,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  MKDIRP = require('mkdirp');

  PATH = require('path');

  HMEVENT = require('../core/event-codes');

  HMSTATUS = require('../core/status-codes');

  _ = require('underscore');

  ResumeFactory = require('../core/resume-factory');

  Verb = require('../verbs/verb');

  chalk = require('chalk');


  /** An invokable resume analysis command. */

  module.exports = AnalyzeVerb = (function(superClass) {
    extend(AnalyzeVerb, superClass);

    function AnalyzeVerb() {
      AnalyzeVerb.__super__.constructor.call(this, 'analyze', _analyze);
    }

    return AnalyzeVerb;

  })(Verb);


  /** Private workhorse for the 'analyze' command. */

  _analyze = function(sources, dst, opts) {
    var nlzrs, results;
    if (!sources || !sources.length) {
      this.err(HMSTATUS.resumeNotFound, {
        quit: true
      });
      return null;
    }
    nlzrs = _loadInspectors();
    results = _.map(sources, function(src) {
      var r;
      r = ResumeFactory.loadOne(src, {
        format: 'FRESH',
        objectify: true
      }, this);
      if (opts.assert && this.hasError()) {
        return {};
      }
      if (r.fluenterror) {
        r.quit = opts.assert;
        this.err(r.fluenterror, r);
        return r;
      } else {
        return _analyzeOne.call(this, r, nlzrs, opts);
      }
    }, this);
    if (this.hasError() && !opts.assert) {
      this.reject(this.errorCode);
    } else if (!this.hasError()) {
      this.resolve(results);
    }
    return results;
  };


  /** Analyze a single resume. */

  _analyzeOne = function(resumeObject, nlzrs, opts) {
    var info, rez, safeFormat;
    rez = resumeObject.rez;
    safeFormat = rez.meta && rez.meta.format && rez.meta.format.startsWith('FRESH') ? 'FRESH' : 'JRS';
    this.stat(HMEVENT.beforeAnalyze, {
      fmt: safeFormat,
      file: resumeObject.file
    });
    info = _.mapObject(nlzrs, function(val, key) {
      return val.run(rez);
    });
    this.stat(HMEVENT.afterAnalyze, {
      info: info
    });
    return info;
  };

  _loadInspectors = function() {
    return {
      totals: require('../inspectors/totals-inspector'),
      coverage: require('../inspectors/gap-inspector'),
      keywords: require('../inspectors/keyword-inspector')
    };
  };

}).call(this);

//# sourceMappingURL=analyze.js.map
