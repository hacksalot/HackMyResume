(function() {

  var FS = require('fs');
  var loadSourceResumes = require('../core/load-source-resumes');

  module.exports =

  /**
  Validate 1 to N resumes in either FRESH or JSON Resume format.
  */
  function validate( src, unused, opts, logger ) {
    var _log = logger || console.log;
    if( !src || !src.length ) { throw { fluenterror: 6 }; }
    var isValid = true;

    var validator = require('is-my-json-valid');
    var schemas = {
      fresh: require('fresca'),
      jars: require('../core/resume.json')
    };

    // Load input resumes...
    var sheets = loadSourceResumes(src, _log, function( res ) {
      try {
        return {
          file: res,
          raw: FS.readFileSync( res, 'utf8' )
        };
      }
      catch( ex ) {
        throw ex;
      }
    });

    sheets.forEach( function( rep ) {

      var rez;
      try {
        rez = JSON.parse( rep.raw );
      }
      catch( ex ) { // Note [1]
        _log('Validating '.info + rep.file.infoBold +
          ' against FRESH/JRS schema: '.info + 'ERROR!'.error.bold);

        if (ex instanceof SyntaxError) {
          // Invalid JSON
          _log( '--> '.bold.red + rep.file.toUpperCase().red +
            ' contains invalid JSON. Unable to validate.'.red );
          _log( ('    INTERNAL: ' + ex).red );
        }
        else {

          _log(('ERROR: ' + ex.toString()).red.bold);
        }
        return;
      }

      var isValid = false;
      var style = 'useful';
      var errors = [];
      var fmt = rez.meta &&
        (rez.meta.format === 'FRESH@0.1.0') ? 'fresh':'jars';

      try {

        var validate = validator( schemas[ fmt ], { // Note [1]
          formats: {
            date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
          }
        });

        isValid = validate( rez );
        if( !isValid ) {
          style = 'warn';
          errors = validate.errors;
        }

      }
      catch(ex) {
        return;
      }

      _log( 'Validating '.info + rep.file.infoBold + ' against '.info +
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
