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

    var padding = 20;
    log(chalk.cyan('Analyzing ') + chalk.cyan.bold(safeFormat) +
      chalk.cyan(' resume: ') + chalk.cyan.bold(resumeObject.file));
    var info = _.mapObject( nlzrs, function(val, key) {
      return val.run( resumeObject.rez );
    });

    log(chalk.cyan('\nSECTIONS (') + chalk.cyan.bold(_.keys(info.totals).length) + chalk.cyan('):\n'));
    var pad = require('string-padding');
    _.each( info.totals, function(tot, key) {
      log(chalk.cyan(pad(key + ': ',20)) + chalk.cyan.bold(pad(tot.toString(),4)));
    });

    log();
    log(chalk.cyan('GAPS (') + chalk.cyan.bold(info.gaps.length) + chalk.cyan('):\n'));
    log(chalk.cyan(pad('Lengths:    ', padding + 3)) + info.gaps.map(function(g) {
        var clr = 'green';
        if( g.duration > 35 ) clr = 'yellow';
        if( g.duration > 90 ) clr = 'red';
        return chalk[clr].bold( g.duration) ;
      }).join(', ') );


    var tot = 0;
    log();
    log( chalk.cyan('KEYWORDS (') + chalk.cyan.bold( info.keywords.length ) +
      chalk.cyan('):\n\n') +
      info.keywords.map(function(g) {
        tot += g.count;
        return chalk.cyan( pad(g.name + ': ', padding) ) + chalk.cyan.bold( pad( g.count.toString(), 4 )) + chalk.cyan(' mentions');
      }).join('\n'));

    console.log(chalk.cyan( pad('TOTAL: ', padding) ) + chalk.white.bold( pad( tot.toString(), 4 )) + chalk.cyan(' mentions'));
  }



  /**
  Load inspectors.
  */
  function _loadInspectors() {
    return {
      totals: require('../inspectors/totals-inspector'),
      gaps: require('../inspectors/gap-inspector'),
      keywords: require('../inspectors/keyword-inspector')
    };
  }



}());
