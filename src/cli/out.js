/**
Output routines for HackMyResume.
@license MIT. See LICENSE.md for details.
@module out.js
*/



(function() {



  var chalk = require('chalk')
    , HME = require('../core/event-codes')
    , _ = require('underscore')
    , Class = require('../utils/class.js')
    , M2C = require('../utils/md2chalk.js')
    , PATH = require('path')
    , LO = require('lodash')
    , FS = require('fs')
    , EXTEND = require('../utils/extend')
    , HANDLEBARS = require('handlebars')
    , pad = require('string-padding');



  /**
  A stateful output module. All HMR console output handled here.
  */
  var OutputHandler = module.exports = Class.extend({



    init: function( opts ) {
      this.opts = EXTEND( true, this.opts || { }, opts );
    },



    log: function( msg ) {
      msg = msg || '';
      var printf = require('printf');
      var finished = printf.apply( printf, arguments );
      this.opts.silent || console.log( finished );
    },



    do: function( evt ) {

      var that = this;
      function L() {
        that.log.apply( that, arguments );
      }

      switch( evt.sub ) {

        case HME.error:
          //L('ERROR occured');
          break;

        case HME.beforeCreate:
          L(
            M2C('Creating new **%s** resume: **%s**', 'green'),
            evt.fmt, evt.file
          );
          break;

        case HME.beforeRead:
          L(
            M2C('Reading resume: **%s**', 'cyan'), evt.file
          );
          break;

        case HME.beforeTheme:
          this.opts.debug && L(
            M2C('Verifying theme:    **%s**', 'cyan'), evt.theme.toUpperCase()
          );
          break;

        case HME.afterTheme:
          this.theme = evt.theme;
          this.opts.debug && L( M2C('Verifying outputs:  ???', 'cyan') );
          break;

        case HME.beforeMerge:
          var msg = '';
          evt.f.reverse().forEach( function( a, idx ) {
            msg += ((idx === 0) ? chalk.cyan('Merging ') :
             chalk.cyan(' onto ')) + chalk.cyan.bold(a.i().file);
          });
          L( msg );
          break;

        case HME.afterMerge:
          var numFormats = Object.keys( this.theme.formats ).length;
          L( M2C('Applying **%s** theme (%s format%s)', 'yellow'),
            this.theme.name.toUpperCase(),
            numFormats, ( numFormats === 1 ? '' : 's') );
          break;

        case HME.end:
          if( evt.cmd === 'build' ) {
            var themeName = this.theme.name.toUpperCase();
            if( this.opts.tips && (this.theme.message || this.theme.render) ) {
              var WRAP = require('word-wrap');
              if( this.theme.message ) {
                L( WRAP( chalk.gray('The ' + themeName + ' theme says: "') +
                chalk.white(this.theme.message) + chalk.gray('"'),
                  { width: this.opts.wrap, indent: '' } ));
              }
              else if ( this.theme.render ) {
                L( M2C( 'The **' + themeName + '** theme says:', 'cyan'));
                L( WRAP( '"For best results view JSON Resume themes over a ' +
                    'local or remote HTTP connection. For example:',
                    { width: this.opts.wrap, indent: '' })
                );
                L('');
                L('    npm install http-server -g\r' +
                  '    http-server <resume-folder>' );
                L('');
                L(chalk.white('For more information, see the README."'));
              }
            }
          }
          break;

        case HME.beforeGenerate:
          var suffix = '';
          if( evt.fmt === 'pdf' ) {
            if( this.opts.pdf ) {
              if( this.opts.pdf !== 'none' ) {
                suffix = chalk.green(' (with ' + this.opts.pdf + ')');
              }
              else {
                L( chalk.gray('Skipping   ') +
                  chalk.white.bold( pad(evt.fmt.toUpperCase(),4,null,pad.RIGHT)) +
                  chalk.gray(' resume') + suffix + chalk.green(': ') +
                  chalk.white( evt.file ));
                return;
              }
            }
          }

          L( chalk.green('Generating ') +
            chalk.green.bold(
              pad(evt.fmt.toUpperCase(),4,null,pad.RIGHT)) +
            chalk.green(' resume') + suffix + chalk.green(': ') +
            chalk.green.bold( PATH.relative(process.cwd(), evt.file )) );
          break;

        case HME.beforeAnalyze:
          L(chalk.cyan('Analyzing ') + chalk.cyan.bold(evt.fmt) +
            chalk.cyan(' resume: ') + chalk.cyan.bold(evt.file));
          break;

        case HME.afterAnalyze:
          var info = evt.info;
          var rawTpl = FS.readFileSync( PATH.join( __dirname, 'analyze.hbs' ), 'utf8');
          HANDLEBARS.registerHelper( require('../helpers/console-helpers') );
          var template = HANDLEBARS.compile(rawTpl, { strict: false, assumeObjects: false });
          var tot = 0;
          info.keywords.forEach(function(g) { tot += g.count; });
          info.keywords.totalKeywords = tot;
          var output = template( info );
          this.log( chalk.cyan(output) );
          break;

        case HME.beforeConvert:
          // TODO: Core should not log
          L( chalk.green('Converting ') + chalk.green.bold(evt.srcFile) +
            chalk.green(' (' + evt.srcFmt + ') to ') + chalk.green.bold(evt.dstFile) +
            chalk.green(' (' + evt.dstFmt + ').'));
          break;

        case HME.afterValidate:
          var style = evt.isValid ? 'green' : 'yellow';
          L( chalk.white('Validating ') + chalk.white.bold(evt.file) + chalk.white(' against ') +
            chalk.white.bold( evt.fmt ).toUpperCase() +
            chalk.white(' schema: ') + chalk[style].bold(evt.isValid ? 'VALID!' : 'INVALID'));

          if( evt.errors ) {
            _.each(evt.errors, function(err,idx) {
              L( chalk.yellow.bold('--> ') +
                chalk.yellow(err.field.replace('data.','resume.').toUpperCase() + ' ' +
                err.message) );
            }, this);
          }

          break;

        case HME.beforePeek:
          if( evt.target )
            L(M2C('Peeking at **%s** in **%s**...', 'cyan'), evt.target, evt.file);
          else
            L(M2C('Peeking at **%s**...', 'cyan'), evt.file);
          break;

        case HME.afterPeek:
          if( evt.target )
            console.dir( evt.target, { depth: null, colors: true } );
          else
            L(M2C('The specified key **%s** was not found in **%s**.', 'yellow'), evt.requested, evt.file);
          break;

      }
    }



  });


}());
