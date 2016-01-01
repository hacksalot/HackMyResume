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
    , ResumeFactory = require('../core/resume-factory');



  /**
  Run the 'analyze' command.
  */
  module.exports = function analyze( src, dst, opts, logger ) {
    var _log = logger || console.log;
    if( !src || !src.length ) throw { fluenterror: 8 };
    var sourceResumes = ResumeFactory.load( src, _log, null, true );
    var nlzrs = _loadInspectors();
    sourceResumes.forEach( function(r) {
      _analyze( r, nlzrs, opts, _log );
    });
  };



  /**
  Analyze a single resume.
  */
  function _analyze( resumeObject, nlzrs, opts, log ) {
    var rez = resumeObject.rez;
    var safeFormat = rez.meta.format.startsWith('FRESH') ? 'FRESH' : 'JRS';
    log('Analyzing '.useful + safeFormat.useful.bold +
      ' resume: '.useful + resumeObject.file.useful.bold);
    var info = _.mapObject( nlzrs, function(val, key) {
      return val.run( resumeObject.rez );
    });

    console.log('Gaps: ' + info.gaps.length );
  }



  /**
  Load inspectors.
  */
  function _loadInspectors() {
    return {
      gaps: require('../inspectors/gap-inspector')
    };
  }



}());
