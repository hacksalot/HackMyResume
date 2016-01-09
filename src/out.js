/**
Output routines for HackMyResume.
@license MIT. See LICENSE.md for details.
@module out.js
*/



(function() {



  var chalk = require('chalk')
    , HME = require('./core/event-codes')
    , _ = require('underscore')
    , Class = require('./utils/class.js')
    , PATH = require('path')
    , pad = require('string-padding');



  /**
  A stateful output handler.
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
          // TODO: templatize all of this
          var info = evt.info;
          var padding = 20;
          this.log(chalk.cyan.bold('\nSECTIONS') + chalk.cyan(' (') +
            chalk.white.bold(_.keys(info.totals).length) + chalk.cyan('):\n'));

          _.each( info.totals, function(tot, key) {
            this.log(chalk.cyan(pad(key + ': ',20)) +
            chalk.cyan.bold(pad(tot.toString(),5)));
          }, this);

          this.log();
          this.log(chalk.cyan.bold('COVERAGE') + chalk.cyan(' (') + chalk.white.bold( info.coverage.pct ) + chalk.cyan('):\n'));
          this.log(chalk.cyan(pad('Total Days: ', padding)) + chalk.cyan.bold( pad(info.coverage.duration.total.toString(),5) ));
          this.log(chalk.cyan(pad('Employed: ', padding)) + chalk.cyan.bold( pad((info.coverage.duration.total - info.coverage.duration.gaps).toString(),5) ));
          this.log(chalk.cyan(pad('Gaps:     ', padding + 4)) + chalk.cyan.bold(info.coverage.gaps.length) + chalk.cyan('  [') + info.coverage.gaps.map(function(g) {
              var clr = 'green';
              if( g.duration > 35 ) clr = 'yellow';
              if( g.duration > 90 ) clr = 'red';
              return chalk[clr].bold( g.duration) ;
            }).join(', ') + chalk.cyan(']') );

          this.log(chalk.cyan(pad('Overlaps:     ', padding + 4)) + chalk.cyan.bold(info.coverage.overlaps.length) + chalk.cyan('  [') + info.coverage.overlaps.map(function(ol) {
              var clr = 'green';
              if( ol.duration > 35 ) clr = 'yellow';
              if( ol.duration > 90 ) clr = 'red';
              return chalk[clr].bold( ol.duration) ;
            }).join(', ') + chalk.cyan(']') );

          var tot = 0;
          this.log();
          this.log( chalk.cyan.bold('KEYWORDS') + chalk.cyan(' (') + chalk.white.bold( info.keywords.length ) +
            chalk.cyan('):\n\n') +
            info.keywords.map(function(g) {
              tot += g.count;
              return chalk.cyan( pad(g.name + ': ', padding) ) + chalk.cyan.bold( pad( g.count.toString(), 5 )) + chalk.cyan(' mentions');
            }).join('\n'));

          this.log(chalk.cyan( pad('TOTAL: ', padding) ) + chalk.white.bold( pad( tot.toString(), 5 )) + chalk.cyan(' mentions'));
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
