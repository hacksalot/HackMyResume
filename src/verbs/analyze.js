/**
Implementation of the 'analyze' verb for HackMyResume.
@module create.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var FLUENT = require('../hackmyapi')
    , MKDIRP = require('mkdirp')
    , PATH = require('path')
    , _ = require('underscore')
    , ResumeFactory = require('../core/resume-factory')
    , chalk = require('chalk');



  /**
  Run the 'analyze' command.
  */
  module.exports = function analyze( sources, dst, opts, logger ) {
    var _log = logger || console.log;
    if( !sources || !sources.length ) throw { fluenterror: 3 };

    var nlzrs = _loadInspectors();

    sources.forEach( function(src) {
      var result = ResumeFactory.loadOne( src, {
        log: _log, format: 'FRESH', objectify: true, throw: false
      });
      result.error || _analyze( result, nlzrs, opts, _log );
    });

  };



  /**
  Analyze a single resume.
  */
  function _analyze( resumeObject, nlzrs, opts, log ) {
    var rez = resumeObject.rez;
    var safeFormat =
      (rez.meta && rez.meta.format && rez.meta.format.startsWith('FRESH')) ?
      'FRESH' : 'JRS';
    log(chalk.cyan('Analyzing ') + chalk.cyan.bold(safeFormat) +
      chalk.cyan(' resume: ') + chalk.cyan.bold(resumeObject.file));
    var info = _.mapObject( nlzrs, function(val, key) {
      return val.run( resumeObject.rez );
    });

    log(chalk.cyan('\nTotals: '));
    var pad = require('string-padding');
    _.each( info.totals, function(tot, key) {
      log(chalk.cyan(pad(key + ': ',17)) + chalk.cyan.bold(pad(tot.toString(),4)));
    });

    log();
    log(chalk.cyan('Gaps: ') + chalk.cyan.bold(info.gaps.length) +
      chalk.cyan(' [') + info.gaps.map(function(g) {
        var clr = 'green';
        if( g.duration > 35 ) clr = 'yellow';
        if( g.duration > 90 ) clr = 'red';
        return chalk[clr].bold(g.duration);
      }).join(', ') + chalk.cyan(']') );
  }



  /**
  Load inspectors.
  */
  function _loadInspectors() {
    return {
      totals: require('../inspectors/totals-inspector'),
      gaps: require('../inspectors/gap-inspector')
    };
  }



}());
