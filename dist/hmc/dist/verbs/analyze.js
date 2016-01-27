
/**
Implementation of the 'analyze' verb for HackMyResume.
@module verbs/analyze
@license MIT. See LICENSE.md for details.
 */

(function() {
  var AnalyzeVerb, HMEVENT, HMSTATUS, MKDIRP, PATH, ResumeFactory, Verb, _, _analyze, _loadInspectors, analyze, chalk;

  MKDIRP = require('mkdirp');

  PATH = require('path');

  HMEVENT = require('../core/event-codes');

  HMSTATUS = require('../core/status-codes');

  _ = require('underscore');

  ResumeFactory = require('../core/resume-factory');

  Verb = require('../verbs/verb');

  chalk = require('chalk');

  AnalyzeVerb = module.exports = Verb.extend({
    init: function() {
      return this._super('analyze');
    },
    invoke: function() {
      this.stat(HMEVENT.begin, {
        cmd: 'analyze'
      });
      analyze.apply(this, arguments);
      return this.stat(HMEVENT.end);
    }
  });


  /**
  Run the 'analyze' command.
   */

  analyze = function(sources, dst, opts) {
    var nlzrs;
    if (!sources || !sources.length) {
      throw {
        fluenterror: HMSTATUS.resumeNotFound,
        quit: true
      };
    }
    nlzrs = _loadInspectors();
    return _.each(sources, function(src) {
      var result;
      result = ResumeFactory.loadOne(src, {
        format: 'FRESH',
        objectify: true
      }, this);
      if (result.fluenterror) {
        return this.setError(result.fluenterror, result);
      } else {
        return _analyze.call(this, result, nlzrs, opts);
      }
    }, this);
  };


  /**
  Analyze a single resume.
   */

  _analyze = function(resumeObject, nlzrs, opts) {
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
    return this.stat(HMEVENT.afterAnalyze, {
      info: info
    });
  };


  /**
  Load inspectors.
   */

  _loadInspectors = function() {
    return {
      totals: require('../inspectors/totals-inspector'),
      coverage: require('../inspectors/gap-inspector'),
      keywords: require('../inspectors/keyword-inspector')
    };
  };

}).call(this);
