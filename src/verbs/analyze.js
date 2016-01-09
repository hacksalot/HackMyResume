/**
Implementation of the 'analyze' verb for HackMyResume.
@module create.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var MKDIRP = require('mkdirp')
    , PATH = require('path')
    , HME = require('../core/event-codes')
    , _ = require('underscore')
    , ResumeFactory = require('../core/resume-factory')
    , Verb = require('../core/verb')
    , chalk = require('chalk');



  var AnalyzeVerb = module.exports = Verb.extend({

    init: function() {
      this._super('analyze');
    },

    invoke: function() {
      analyze.apply( this, arguments );
    }

  });



  /**
  Run the 'analyze' command.
  */
  function analyze( sources, dst, opts, logger ) {
    this.stat('begin');
    var _log = logger || console.log;
    if( !sources || !sources.length ) throw { fluenterror: 3 };
    var nlzrs = _loadInspectors();
    _.each(sources, function(src) {
      var result = ResumeFactory.loadOne( src, {
        log: _log, format: 'FRESH', objectify: true, throw: false
      });
      result.error || _analyze.call(this, result, nlzrs, opts, _log );
    }, this);
    this.stat('end');
  }



  /**
  Analyze a single resume.
  */
  function _analyze( resumeObject, nlzrs, opts, log ) {
    var rez = resumeObject.rez;
    var safeFormat =
      (rez.meta && rez.meta.format && rez.meta.format.startsWith('FRESH')) ?
      'FRESH' : 'JRS';

    var padding = 20;
    this.stat( HME.beforeAnalyze, { fmt: safeFormat, file: resumeObject.file });
    var info = _.mapObject( nlzrs, function(val, key) {
      return val.run( resumeObject.rez );
    });
    this.stat( HME.afterAnalyze, { info: info } );
  }



  /**
  Load inspectors.
  */
  function _loadInspectors() {
    return {
      totals: require('../inspectors/totals-inspector'),
      coverage: require('../inspectors/gap-inspector'),
      keywords: require('../inspectors/keyword-inspector')
    };
  }



}());
