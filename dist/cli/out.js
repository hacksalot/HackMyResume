/**
Output routines for HackMyResume.
@license MIT. See LICENSE.md for details.
@module out.js
*/



(function() {



  var chalk = require('chalk')
    , HME = require('hackmycore/dist/core/event-codes')
    , _ = require('underscore')
    , Class = require('hackmycore/dist/utils/class.js')
    , M2C = require('hackmycore/dist/utils/md2chalk.js')
    , PATH = require('path')
    , LO = require('lodash')
    , FS = require('fs')
    , EXTEND = require('extend')
    , HANDLEBARS = require('handlebars')
    , YAML = require('yamljs')
    , printf = require('printf')
    , pad = require('string-padding')
    , dbgStyle = 'cyan';



  /**
  A stateful output module. All HMR console output handled here.
  */
  var OutputHandler = module.exports = Class.extend({



    init: function( opts ) {
      this.opts = EXTEND( true, this.opts || { }, opts );
      this.msgs = YAML.load(PATH.join( __dirname, 'msg.yml' )).events;
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

        case HME.begin:
          this.opts.debug &&
          L( M2C( this.msgs.begin.msg, dbgStyle), evt.cmd.toUpperCase() );
          break;

        case HME.error:
          break;

        case HME.beforeCreate:
          L( M2C( this.msgs.beforeCreate.msg, 'green' ), evt.fmt, evt.file );
          break;

        case HME.beforeRead:
          break;

        case HME.afterRead:
          break;

        case HME.beforeTheme:
          this.opts.debug &&
            L( M2C( this.msgs.beforeTheme.msg, dbgStyle), evt.theme.toUpperCase() );
          break;

        case HME.afterParse:
          L(
            M2C( this.msgs.afterRead.msg, 'gray', 'white.dim'), evt.fmt.toUpperCase(), evt.file
          );

          break;

        case HME.afterTheme:
          break;

        case HME.beforeMerge:
          var msg = '';
          evt.f.reverse().forEach( function( a, idx ) {
            msg += printf(
              ((idx === 0) ?
                this.msgs.beforeMerge.msg[0] :
                this.msgs.beforeMerge.msg[1] ), a.file
            );
          }, this);
          L( M2C(msg, evt.mixed ? 'yellow' : 'gray', 'white.dim') );
          break;

        case HME.afterMerge:
          break;

        case HME.applyTheme:
          this.theme = evt.theme;
          var numFormats = Object.keys( evt.theme.formats ).length;
          L( M2C(this.msgs.applyTheme.msg, evt.status === 'error' ? 'red' : 'gray', evt.status === 'error' ? 'bold' : 'white.dim'),
            evt.theme.name.toUpperCase(),
            numFormats, ( numFormats === 1 ? '' : 's') );
          break;

        case HME.end:
          if( evt.cmd === 'build' ) {
            var themeName = this.theme.name.toUpperCase();
            if( this.opts.tips && (this.theme.message || this.theme.render) ) {
              var WRAP = require('word-wrap');
              if( this.theme.message ) {
                L( M2C( this.msgs.afterBuild.msg[0], 'cyan' ), themeName );
                L( M2C( this.theme.message, 'white' ));
              }
              else if ( this.theme.render ) {
                L( M2C( this.msgs.afterBuild.msg[0], 'cyan'), themeName);
                L( M2C( this.msgs.afterBuild.msg[1], 'white'));
              }
            }
          }
          break;

        case HME.afterGenerate:
          var suffix = '';
          if( evt.fmt === 'pdf' ) {
            if( this.opts.pdf ) {
              if( this.opts.pdf !== 'none' ) {
                suffix = printf( M2C( this.msgs.afterGenerate.msg[0], evt.error ? 'red' : 'green' ), this.opts.pdf );
              }
              else {
                L( M2C( this.msgs.afterGenerate.msg[1], 'gray' ),
                  evt.fmt.toUpperCase(), evt.file );
                return;
              }
            }
          }

          L( M2C( this.msgs.afterGenerate.msg[2] + suffix, evt.error ? 'red' : 'green' ),
              pad(evt.fmt.toUpperCase(),4,null,pad.RIGHT),
              PATH.relative(process.cwd(), evt.file ));
          break;

        case HME.beforeAnalyze:
          L( M2C( this.msgs.beforeAnalyze.msg, 'green' ), evt.fmt, evt.file);
          break;

        case HME.afterAnalyze:
          var info = evt.info;
          var rawTpl = FS.readFileSync( PATH.join( __dirname, 'analyze.hbs' ), 'utf8');
          HANDLEBARS.registerHelper( require('hackmycore/src/helpers/console-helpers') );
          var template = HANDLEBARS.compile(rawTpl, { strict: false, assumeObjects: false });
          var tot = 0;
          info.keywords.forEach(function(g) { tot += g.count; });
          info.keywords.totalKeywords = tot;
          var output = template( info );
          this.log( chalk.cyan(output) );
          break;

        case HME.beforeConvert:
          L( M2C( this.msgs.beforeConvert.msg, 'green' ),
            evt.srcFile, evt.srcFmt, evt.dstFile, evt.dstFmt
          );
          break;

        case HME.afterInlineConvert:
          L( M2C( this.msgs.afterInlineConvert.msg, 'gray', 'white.dim' ),
            evt.file, evt.fmt );
          break;

        case HME.afterValidate:
          var style = evt.isValid ? 'green' : 'yellow';
          L(
            M2C( this.msgs.afterValidate.msg[0], 'white' ) +
            chalk[style].bold( evt.isValid ?
                               this.msgs.afterValidate.msg[1] :
                               this.msgs.afterValidate.msg[2] ),
            evt.file, evt.fmt
          );

          if( evt.errors ) {
            _.each(evt.errors, function(err,idx) {
              L( chalk.yellow.bold('--> ') +
                chalk.yellow(err.field.replace('data.','resume.').toUpperCase() + ' ' +
                err.message) );
            }, this);
          }
          break;

        case HME.beforePeek:
          // if( evt.target )
          //   L(M2C(this.msgs.beforePeek.msg[0], evt.isError ? 'red' : 'green'), evt.target, evt.file);
          // else
          //   L(M2C(this.msgs.beforePeek.msg[1], evt.isError ? 'red' : 'green'), evt.file);
          break;

        case HME.afterPeek:
          var sty = evt.error ? 'red' : ( evt.target !== undefined ? 'green' : 'yellow' );
          if( evt.requested )
            L(M2C(this.msgs.beforePeek.msg[0], sty), evt.requested, evt.file);
          else
            L(M2C(this.msgs.beforePeek.msg[1], sty), evt.file);

          if( evt.target !== undefined )
            console.dir( evt.target, { depth: null, colors: true } );
          else if( !evt.error )
            L(M2C( this.msgs.afterPeek.msg, 'yellow'), evt.requested, evt.file);
          break;

      }
    }



  });


}());
