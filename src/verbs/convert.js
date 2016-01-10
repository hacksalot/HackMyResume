/**
Implementation of the 'convert' verb for HackMyResume.
@module convert.js
@license MIT. See LICENSE.md for details.
*/



(function(){



  var ResumeFactory = require('../core/resume-factory')
    , chalk = require('chalk')
    , Verb = require('../core/verb')
    , HACKMYSTATUS = require('../core/status-codes')
    , _ = require('underscore')
    , HME = require('../core/event-codes');


  var ConvertVerb = module.exports = Verb.extend({

    init: function() {
      this._super('convert');
    },

    invoke: function() {
      convert.apply( this, arguments );
    }

  });



  /**
  Convert between FRESH and JRS formats.
  */
  function convert( srcs, dst, opts ) {

    // Housekeeping
    if( !srcs || !srcs.length ) { throw { fluenterror: 6 }; }
    if( !dst || !dst.length ) {
      if( srcs.length === 1 ) {
        throw { fluenterror: HACKMYSTATUS.inputOutputParity };
      }
      else if( srcs.length === 2 ) {
        dst = dst || []; dst.push( srcs.pop() );
      }
      else {
        throw { fluenterror: HACKMYSTATUS.inputOutputParity };
      }
    }
    if(srcs && dst && srcs.length && dst.length && srcs.length !== dst.length){
      throw { fluenterror: HACKMYSTATUS.inputOutputParity };
    }

    // Load source resumes
    _.each(srcs, function( src, idx ) {

      // Load the resume
      var rinfo = ResumeFactory.loadOne( src, {
        format: null, objectify: true, throw: true
      });

      var s = rinfo.rez
        , srcFmt = ((s.basics && s.basics.imp) || s.imp).orgFormat === 'JRS' ?
          'JRS' : 'FRESH'
        , targetFormat = srcFmt === 'JRS' ? 'FRESH' : 'JRS';

      this.stat(HME.beforeConvert, { srcFile: rinfo.file, srcFmt: srcFmt, dstFile: dst[idx], dstFmt: targetFormat });

      // Save it to the destination format
      s.saveAs( dst[idx], targetFormat );

    }, this);

  }



}());
