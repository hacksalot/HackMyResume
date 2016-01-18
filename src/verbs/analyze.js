/**
Implementation of the 'analyze' verb for HackMyResume.
@module verbs/analyze
@license MIT. See LICENSE.md for details.
*/



(function(){



  var MKDIRP = require('mkdirp')
    , PATH = require('path')
    , HMEVENT = require('../core/event-codes')
    , HMSTATUS = require('../core/status-codes')
    , _ = require('underscore')
    , ResumeFactory = require('../core/resume-factory')
    , Verb = require('../verbs/verb')
    , chalk = require('chalk');



  var AnalyzeVerb = module.exports = Verb.extend({

    init: function() {
      this._super('analyze');
    },

    invoke: function() {
      this.stat( HMEVENT.begin, { cmd: 'analyze' });
      analyze.apply( this, arguments );
      this.stat( HMEVENT.end );
    }

  });



  /**
  Run the 'analyze' command.
  */
  function analyze( sources, dst, opts ) {
    if( !sources || !sources.length )
      throw { fluenterror: HMSTATUS.resumeNotFound };

    var nlzrs = _loadInspectors();

    _.each(sources, function(src) {
      var result = ResumeFactory.loadOne( src, {
        format: 'FRESH', objectify: true
      }, this);
      result.fluenterror || _analyze.call(this, result, nlzrs, opts );
    }, this);

  }



  /**
  Analyze a single resume.
  */
  function _analyze( resumeObject, nlzrs, opts ) {
    var rez = resumeObject.rez;
    var safeFormat =
      (rez.meta && rez.meta.format && rez.meta.format.startsWith('FRESH')) ?
      'FRESH' : 'JRS';

    this.stat( HMEVENT.beforeAnalyze, { fmt: safeFormat, file: resumeObject.file });
    var info = _.mapObject( nlzrs, function(val, key) {
      return val.run( resumeObject.rez );
    });
    this.stat( HMEVENT.afterAnalyze, { info: info } );
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
