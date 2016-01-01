/**
Implementation of the 'validate' verb for HackMyResume.
@module validate.js
@license MIT. See LICENSE.md for details.
*/

(function() {

  var FS = require('fs');
  var ResumeFactory = require('../core/resume-factory');
  var SyntaxErrorEx = require('../utils/syntax-error-ex');

  module.exports =

  /**
  Validate 1 to N resumes in either FRESH or JSON Resume format.
  */
  function validate( sources, unused, opts, logger ) {
    var _log = logger || console.log;
    if( !sources || !sources.length ) { throw { fluenterror: 6 }; }
    var isValid = true;

    var validator = require('is-my-json-valid');
    var schemas = {
      fresh: require('fresca'),
      jars: require('../core/resume.json')
    };

    // Load input resumes...
    sources.forEach(function( src ) {

      var result = ResumeFactory.loadOne( src, function(){}, null, false );
      if( result.error ) {
        _log( 'Validating '.info + src.infoBold + ' against '.info + 'AUTO'.infoBold + ' schema:'.info + ' BROKEN'.red.bold );

        var ex = result.error; // alias
        if ( ex instanceof SyntaxError) {
          var info = new SyntaxErrorEx( ex, result.raw );
          _log( ('--> '.warn.bold + src.toUpperCase() + ' contains invalid JSON on line ' +
            info.line + ' column ' + info.col + '.').warn +
            ' Unable to validate.'.warn );
          _log( ('    INTERNAL: ' + ex).warn );
        }
        else {
          _log(('ERROR: ' + ex.toString()).warn.bold);
        }
        return;
      }

      var json = result.json;
      var isValid = false;
      var style = 'useful';
      var errors = [];
      var fmt = json.meta && (json.meta.format==='FRESH@0.1.0') ? 'fresh':'jars';

      try {
        var validate = validator( schemas[ fmt ], { // Note [1]
          formats: {
            date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
          }
        });

        isValid = validate( json );
        if( !isValid ) {
          style = 'warn';
          errors = validate.errors;
        }

      }
      catch(exc) {
        return;
      }

      _log( 'Validating '.info + result.file.infoBold + ' against '.info +
        fmt.replace('jars','JSON Resume').toUpperCase().infoBold +
        ' schema: '.info + (isValid ? 'VALID!' : 'INVALID')[style].bold );

      errors.forEach(function(err,idx) {
        _log( '--> '.bold.yellow +
          (err.field.replace('data.','resume.').toUpperCase() + ' ' +
          err.message).yellow );
      });

    });
  };

}());
