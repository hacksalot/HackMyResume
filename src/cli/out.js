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
    , PATH = require('path')
    , LO = require('lodash')
    , FS = require('fs')
    , HANDLEBARS = require('handlebars')
    , pad = require('string-padding');



  /**
  A stateful output handler. All HMR console output handled here.
  */
  var OutputHandler = module.exports = Class.extend({



    init: function( opts ) {
      this.opts = opts;
    },



    log: function( msg ) {
      msg = msg || '';
      this.opts.silent || console.log( msg );
    },



    do: function( evt ) {

      switch( evt.sub ) {

        case HME.beforeCreate:
          this.log( chalk.green('Creating new ') +
            chalk.green.bold(evt.fmt) +
            chalk.green(' resume: ') + chalk.green.bold(evt.file));
          break;

        case HME.afterTheme:
          this.theme = evt.theme;
          break;

        case HME.beforeMerge:
          var msg = '';
          evt.f.reverse().forEach( function( a, idx ) {
            msg += ((idx === 0) ? chalk.cyan('Merging ') :
             chalk.cyan(' onto ')) + chalk.cyan.bold(a.i().file);
          });
          this.log( msg );
          break;

        case HME.afterMerge:
          var numFormats = Object.keys(this.theme.formats).length;
          this.log( chalk.yellow('Applying ') +
            chalk.yellow.bold( this.theme.name.toUpperCase() ) +
            chalk.yellow(' theme (' + numFormats + ' format' +
            ( evt.numFormats === 1 ? ')' : 's)') ));
          break;

        case HME.end:
          if( evt.cmd === 'build' ) {
            var themeName = this.theme.name.toUpperCase();
            if( this.opts.tips && (this.theme.message || this.theme.render) ) {
              var WRAP = require('word-wrap');
              if( this.theme.message ) {
                this.log( WRAP( chalk.gray('The ' + themeName + ' theme says: "') +
                chalk.white(this.theme.message) + chalk.gray('"'),
                  { width: this.opts.wrap, indent: '' } ));
              }
              else if ( this.theme.render ) {
                this.log(  WRAP( chalk.gray('The ' + themeName +
                  ' theme says: "') + chalk.white('For best results view JSON ' +
                  'Resume themes over a local or remote HTTP connection. For ' +
                  'example:'), { width: this.opts.wrap, indent: '' }
                ));
                this.log( '');
                this.log(
                  '    npm install http-server -g\r' +
                  '    http-server <resume-folder>' );
                this.log('');
                this.log(chalk.white('For more information, see the README."'),
                  { width: this.opts.wrap, indent: '' } );
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
                this.log( chalk.gray('Skipping   ') +
                  chalk.white.bold( pad(evt.fmt.toUpperCase(),4,null,pad.RIGHT)) +
                  chalk.gray(' resume') + suffix + chalk.green(': ') +
                  chalk.white( evt.file ));
                return;
              }
            }
          }

          this.log( chalk.green('Generating ') +
            chalk.green.bold(
              pad(evt.fmt.toUpperCase(),4,null,pad.RIGHT)) +
            chalk.green(' resume') + suffix + chalk.green(': ') +
            chalk.green.bold( PATH.relative(process.cwd(), evt.file )) );
          break;

        case HME.beforeAnalyze:
          this.log(chalk.cyan('Analyzing ') + chalk.cyan.bold(evt.fmt) +
            chalk.cyan(' resume: ') + chalk.cyan.bold(evt.file));
          break;

        case HME.afterAnalyze:
          var info = evt.info;
          var rawTpl = FS.readFileSync( PATH.join( __dirname, 'analyze.hbs' ), 'utf8');
          HANDLEBARS.registerHelper( require('../helpers/console-helpers') );
          var template = HANDLEBARS.compile(rawTpl, { strict: false, assumeObjects: false });
          var tot = 0;
          info.keywords.forEach(function(g) {
            tot += g.count;
          });
          info.keywords.totalKeywords = tot;
          var output = template( info );

          this.log(chalk.cyan(output));
          break;

        case HME.beforeConvert:
          // TODO: Core should not log
          this.log( chalk.green('Converting ') + chalk.green.bold(evt.srcFile) +
            chalk.green(' (' + evt.srcFmt + ') to ') + chalk.green.bold(evt.dstFile) +
            chalk.green(' (' + evt.dstFmt + ').'));
          break;
      }
    }



  });


}());
