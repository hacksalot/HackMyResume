/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
/**
Output routines for HackMyResume.
@license MIT. See LICENSE.md for details.
@module cli/out
*/



const chalk = require('chalk');
const HME = require('../core/event-codes');
const _ = require('underscore');
const M2C = require('../utils/md2chalk.js');
const PATH = require('path');
const FS = require('fs');
const EXTEND = require('extend');
const HANDLEBARS = require('handlebars');
const YAML = require('yamljs');
let printf = require('printf');
const pad = require('string-padding');
const dbgStyle = 'cyan';



/** A stateful output module. All HMR console output handled here. */
class OutputHandler {



  constructor( opts ) {
    this.init(opts);
  }



  init(opts) {
    this.opts = EXTEND( true, this.opts || { }, opts );
    this.msgs = YAML.load(PATH.join( __dirname, 'msg.yml' )).events;
  }



  log() {
    printf = require('printf');
    const finished = printf.apply( printf, arguments );
    return this.opts.silent || console.log( finished ); // eslint-disable-line no-console
  }



  do( evt ) {

    const that = this;
    const L = function() { return that.log.apply( that, arguments ); };

    switch (evt.sub) {

      case HME.begin:
        return this.opts.debug &&
        L( M2C( this.msgs.begin.msg, dbgStyle), evt.cmd.toUpperCase() );

      //when HME.beforeCreate
        //L( M2C( this.msgs.beforeCreate.msg, 'green' ), evt.fmt, evt.file )
        //break;

      case HME.afterCreate:
        L( M2C( this.msgs.beforeCreate.msg, evt.isError ? 'red' : 'green' ), evt.fmt, evt.file );
        break;

      case HME.beforeTheme:
        return this.opts.debug &&
          L( M2C( this.msgs.beforeTheme.msg, dbgStyle), evt.theme.toUpperCase() );

      case HME.afterParse:
        return L( M2C( this.msgs.afterRead.msg, 'gray', 'white.dim'), evt.fmt.toUpperCase(), evt.file );

      case HME.beforeMerge:
        var msg = '';
        evt.f.reverse().forEach(function( a, idx ) {
          return msg += printf( (idx === 0 ? this.msgs.beforeMerge.msg[0] : this.msgs.beforeMerge.msg[1]), a.file );
        }
        , this);
        return L( M2C(msg, (evt.mixed ? 'yellow' : 'gray'), 'white.dim') );

      case HME.applyTheme:
        this.theme = evt.theme;
        var numFormats = Object.keys( evt.theme.formats ).length;
        return L( M2C(this.msgs.applyTheme.msg,
          evt.status === 'error' ? 'red' : 'gray',
          evt.status === 'error' ? 'bold' : 'white.dim'),
          evt.theme.name.toUpperCase(),
          numFormats, numFormats === 1 ? '' : 's' );

      case HME.end:
        if (evt.cmd === 'build') {
          const themeName = this.theme.name.toUpperCase();
          if (this.opts.tips && (this.theme.message || this.theme.render)) {
            if (this.theme.message) {
              L( M2C( this.msgs.afterBuild.msg[0], 'cyan' ), themeName );
              return L( M2C( this.theme.message, 'white' ));
            } else if (this.theme.render) {
              L( M2C( this.msgs.afterBuild.msg[0], 'cyan'), themeName);
              return L( M2C( this.msgs.afterBuild.msg[1], 'white'));
            }
          }
        }
        break;

      case HME.afterGenerate:
        var suffix = '';
        if (evt.fmt === 'pdf') {
          if (this.opts.pdf) {
            if (this.opts.pdf !== 'none') {
              suffix = printf( M2C( this.msgs.afterGenerate.msg[0], evt.error ? 'red' : 'green' ), this.opts.pdf );
            } else {
              L( M2C( this.msgs.afterGenerate.msg[1], 'gray' ), evt.fmt.toUpperCase(), evt.file );
              return;
            }
          }
        }

        return L( M2C( this.msgs.afterGenerate.msg[2] + suffix, evt.error ? 'red' : 'green' ),
            pad( evt.fmt.toUpperCase(),4,null,pad.RIGHT ),
            PATH.relative( process.cwd(), evt.file ) );

      case HME.beforeAnalyze:
        return L( M2C( this.msgs.beforeAnalyze.msg, 'green' ), evt.fmt, evt.file);

      case HME.afterAnalyze:
        var { info } = evt;
        var rawTpl = FS.readFileSync( PATH.join( __dirname, 'analyze.hbs' ), 'utf8');
        HANDLEBARS.registerHelper( require('../helpers/console-helpers') );
        var template = HANDLEBARS.compile(rawTpl, { strict: false, assumeObjects: false });
        var tot = 0;
        info.keywords.forEach(g => tot += g.count);
        info.keywords.totalKeywords = tot;
        var output = template( info );
        return this.log( chalk.cyan(output) );

      case HME.beforeConvert:
        return L( M2C( this.msgs.beforeConvert.msg, evt.error ? 'red' : 'green' ),
          evt.srcFile, evt.srcFmt, evt.dstFile, evt.dstFmt
        );

      case HME.afterInlineConvert:
        return L( M2C( this.msgs.afterInlineConvert.msg, 'gray', 'white.dim' ),
          evt.file, evt.fmt );

      case HME.afterValidate:
        var style = 'red';
        var adj = '';
        var msgs = this.msgs.afterValidate.msg;
        switch (evt.status) {
          case 'valid': style = 'green'; adj = msgs[1]; break;
          case 'invalid': style = 'yellow'; adj = msgs[2]; break;
          case 'broken': style = 'red'; adj = msgs[3]; break;
          case 'missing': style = 'red'; adj = msgs[4]; break;
          case 'unknown': style = 'red'; adj = msgs[5]; break;
        }
        evt.schema = evt.schema.replace('jars','JSON Resume').toUpperCase();
        L(M2C( msgs[0], 'white' ) + chalk[style].bold(adj), evt.file, evt.schema);

        if (evt.violations) {
          _.each(evt.violations, function(err) {
            L( chalk.yellow.bold('--> ') +
               chalk.yellow(err.field.replace('data.','resume.').toUpperCase() +
               ' ' + err.message));
          }
          , this);
        }
        return;

      case HME.afterPeek:
        var sty = evt.error ? 'red' : ( evt.target !== undefined ? 'green' : 'yellow' );

        // "Peeking at 'someKey' in 'someFile'."
        if (evt.requested) {
          L(M2C(this.msgs.beforePeek.msg[0], sty), evt.requested, evt.file);
        } else {
          L(M2C(this.msgs.beforePeek.msg[1], sty), evt.file);
        }

        // If the key was present, print it
        if ((evt.target !== undefined) && !evt.error) {
          // eslint-disable-next-line no-console
          return console.dir( evt.target, { depth: null, colors: true } );

        // If the key was not present, but no error occurred, print it
        } else if (!evt.error) {
          return L(M2C( this.msgs.afterPeek.msg, 'yellow'), evt.requested, evt.file);

        } else if (evt.error) {
          return L(chalk.red( evt.error.inner.inner ));
        }
        break;
    }
  }
}

module.exports = OutputHandler;
