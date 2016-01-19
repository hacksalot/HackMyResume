/**
Implementation of the 'convert' verb for HackMyResume.
@module verbs/convert
@license MIT. See LICENSE.md for details.
*/



(function(){



  var ResumeFactory = require('../core/resume-factory')
    , chalk = require('chalk')
    , Verb = require('../verbs/verb')
    , HMSTATUS = require('../core/status-codes')
    , _ = require('underscore')
    , HMEVENT = require('../core/event-codes');


  var ConvertVerb = module.exports = Verb.extend({

    init: function() {
      this._super('convert');
    },

    invoke: function() {
      this.stat( HMEVENT.begin, { cmd: 'convert' });
      convert.apply( this, arguments );
      this.stat( HMEVENT.end );
    }

  });



  /**
  Convert between FRESH and JRS formats.
  */
  function convert( srcs, dst, opts ) {

    // Housekeeping
    if( !srcs || !srcs.length ) { throw { fluenterror: 6, quit: true }; }
    if( !dst || !dst.length ) {
      if( srcs.length === 1 ) {
        throw { fluenterror: HMSTATUS.inputOutputParity, quit: true };
      }
      else if( srcs.length === 2 ) {
        dst = dst || []; dst.push( srcs.pop() );
      }
      else {
        throw { fluenterror: HMSTATUS.inputOutputParity, quit: true };
      }
    }
    if(srcs && dst && srcs.length && dst.length && srcs.length !== dst.length){
      throw { fluenterror: HMSTATUS.inputOutputParity, quit: true };
    }

    // Load source resumes
    _.each(srcs, function( src, idx ) {

      // Load the resume
      var rinfo = ResumeFactory.loadOne( src, {
        format: null, objectify: true, throw: false
      });

      // If a load error occurs, report it and move on to the next file (if any)
      if( rinfo.fluenterror ) {
        this.err( rinfo.fluenterror, rinfo );
        return;
      }

      var s = rinfo.rez
        , srcFmt = ((s.basics && s.basics.imp) || s.imp).orgFormat === 'JRS' ?
          'JRS' : 'FRESH'
        , targetFormat = srcFmt === 'JRS' ? 'FRESH' : 'JRS';

      this.stat(HMEVENT.beforeConvert, { srcFile: rinfo.file, srcFmt: srcFmt, dstFile: dst[idx], dstFmt: targetFormat });

      // Save it to the destination format
      s.saveAs( dst[idx], targetFormat );

    }, this);

  }



}());
