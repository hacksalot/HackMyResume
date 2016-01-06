/**
Implementation of the 'validate' verb for HackMyResume.
@module validate.js
@license MIT. See LICENSE.md for details.
*/

(function() {

  var FS = require('fs');
  var ResumeFactory = require('../core/resume-factory');
  var SyntaxErrorEx = require('../utils/syntax-error-ex');
  var chalk = require('chalk');

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

    var resumes = ResumeFactory.load( sources, {
      log: _log,
      format: null,
      objectify: false,
      throw: false,
      muffle: true
    });

    // Load input resumes...
    resumes.forEach(function( src ) {

      if( src.error ) {
        // TODO: Core should not log
        _log( chalk.white('Validating ') + chalk.gray.bold(src.file) +
        chalk.white(' against ') + chalk.gray.bold('AUTO') +
        chalk.white(' schema:') + chalk.red.bold(' BROKEN') );

        var ex = src.error; // alias
        if ( ex instanceof SyntaxError) {
          var info = new SyntaxErrorEx( ex, src.raw );
          _log( chalk.red.bold('--> ' + src.file.toUpperCase() + ' contains invalid JSON on line ' +
            info.line + ' column ' + info.col + '.' +
            chalk.red(' Unable to validate.') ) );
          _log( chalk.red.bold('    INTERNAL: ' + ex) );
        }
        else {
          _log(chalk.red.bold('ERROR: ' + ex.toString()));
        }
        return;
      }

      var json = src.json;
      var isValid = false;
      var style = 'green';
      var errors = [];
      var fmt = json.basics ? 'jrs' : 'fresh';

      try {
        var validate = validator( schemas[ fmt ], { // Note [1]
          formats: {
            date: /^\d{4}(?:-(?:0[0-9]{1}|1[0-2]{1})(?:-[0-9]{2})?)?$/
          }
        });

        isValid = validate( json );
        if( !isValid ) {
          style = 'yellow';
          errors = validate.errors;
        }

      }
      catch(exc) {
        return;
      }

      _log( chalk.white('Validating ') + chalk.white.bold(src.file) + chalk.white(' against ') +
        chalk.white.bold(fmt.replace('jars','JSON Resume').toUpperCase()) +
        chalk.white(' schema: ') + chalk[style].bold(isValid ? 'VALID!' : 'INVALID') );

      errors.forEach(function(err,idx) {
        _log( chalk.yellow.bold('--> ') +
          chalk.yellow(err.field.replace('data.','resume.').toUpperCase() + ' ' +
          err.message) );
      });

    });
  };

}());
