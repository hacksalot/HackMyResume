/**
@module error-handler.js
*/

(function() {

  var HACKMYSTATUS = require('./status-codes')
    , PKG = require('../../package.json')
    , FS = require('fs')
    , FCMD = require('../hackmycmd')
    , PATH = require('path')
    , chalk = require('chalk')
    , title = chalk.white.bold('\n*** HackMyResume v' + PKG.version + ' ***');

  var ErrorHandler = module.exports = {


    err: function( ex, shouldExit ) {
      var msg = '', exitCode;

      if( ex.fluenterror ){
        switch( ex.fluenterror ) { // TODO: Remove magic numbers

          case HACKMYSTATUS.themeNotFound:
            msg = "The specified theme couldn't be found: " + ex.data;
            break;

          case HACKMYSTATUS.copyCSS:
            msg = "Couldn't copy CSS file to destination folder";
            break;

          case HACKMYSTATUS.resumeNotFound:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('feed me a resume') +
              chalk.yellow(' in FRESH or JSON Resume format.');
            break;

          case HACKMYSTATUS.missingCommand:
            msg = title + chalk.yellow("\nPlease ") + chalk.yellow.bold("give me a command") +
              chalk.yellow(" (");

            msg += Object.keys( FCMD.verbs ).map( function(v, idx, ar) {
              return (idx === ar.length - 1 ? chalk.yellow('or ') : '') +
                chalk.yellow.bold(v.toUpperCase());
            }).join( chalk.yellow(', ')) + chalk.yellow(").\n\n");

            msg += chalk.gray(FS.readFileSync( PATH.resolve(__dirname, '../use.txt'), 'utf8' ));
            break;

          case HACKMYSTATUS.invalidCommand:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('specify the output resume file') +
              chalk.yellow(' that should be created.');
            break;

          case HACKMYSTATUS.resumeNotFoundAlt:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('feed me a resume') +
              chalk.yellow(' in either FRESH or JSON Resume format.');
            break;

          case HACKMYSTATUS.inputOutputParity:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('specify an output file name') +
              chalk.yellow(' for every input file you wish to convert.');
            break;

          case HACKMYSTATUS.createNameMissing:
            msg = chalk.yellow('Please ') + chalk.yellow.bold('specify the filename of the resume') +
              chalk.yellow(' to create.');
            break;

          case HACKMYSTATUS.wkhtmltopdf:
            msg = chalk.red.bold('ERROR: PDF generation failed. ') + chalk.red('Make sure wkhtmltopdf is ' +
            'installed and accessible from your path.');
            break;

        }
        exitCode = ex.fluenterror;

      }
      else {
        msg = ex.toString();
        exitCode = 4;
      }

      var idx = msg.indexOf('Error: ');
      var trimmed = idx === -1 ? msg : msg.substring( idx + 7 );
      if( !ex.fluenterror || ex.fluenterror < 3 ) { // TODO: magic #s
        console.log( chalk.red.bold('ERROR: ' + trimmed.toString()) );
        if( ex.code !== 'ENOENT' ) // Don't emit stack for common stuff
          console.log( chalk.gray(ex.stack) );
      }
      else {
        console.log( trimmed.toString() );
      }

      if( shouldExit )
        process.exit( exitCode );

    }

  };

}());
