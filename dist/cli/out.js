
/**
Output routines for HackMyResume.
@license MIT. See LICENSE.md for details.
@module cli/out
 */

(function() {
  var EXTEND, FS, HANDLEBARS, HME, LO, M2C, OutputHandler, PATH, YAML, _, chalk, dbgStyle, pad, printf;

  chalk = require('chalk');

  HME = require('../core/event-codes');

  _ = require('underscore');

  M2C = require('../utils/md2chalk.js');

  PATH = require('path');

  LO = require('lodash');

  FS = require('fs');

  EXTEND = require('extend');

  HANDLEBARS = require('handlebars');

  YAML = require('yamljs');

  printf = require('printf');

  pad = require('string-padding');

  dbgStyle = 'cyan';


  /** A stateful output module. All HMR console output handled here. */

  module.exports = OutputHandler = (function() {
    function OutputHandler(opts) {
      this.init(opts);
      return;
    }

    OutputHandler.prototype.init = function(opts) {
      this.opts = EXTEND(true, this.opts || {}, opts);
      this.msgs = YAML.load(PATH.join(__dirname, 'msg.yml')).events;
    };

    OutputHandler.prototype.log = function(msg) {
      var finished;
      msg = msg || '';
      printf = require('printf');
      finished = printf.apply(printf, arguments);
      return this.opts.silent || console.log(finished);
    };

    OutputHandler.prototype["do"] = function(evt) {
      var L, WRAP, adj, info, msg, msgs, numFormats, output, rawTpl, sty, style, suffix, template, that, themeName, tot;
      that = this;
      L = function() {
        return that.log.apply(that, arguments);
      };
      switch (evt.sub) {
        case HME.begin:
          return this.opts.debug && L(M2C(this.msgs.begin.msg, dbgStyle), evt.cmd.toUpperCase());
        case HME.afterCreate:
          L(M2C(this.msgs.beforeCreate.msg, evt.isError ? 'red' : 'green'), evt.fmt, evt.file);
          break;
        case HME.beforeTheme:
          return this.opts.debug && L(M2C(this.msgs.beforeTheme.msg, dbgStyle), evt.theme.toUpperCase());
        case HME.afterParse:
          return L(M2C(this.msgs.afterRead.msg, 'gray', 'white.dim'), evt.fmt.toUpperCase(), evt.file);
        case HME.beforeMerge:
          msg = '';
          evt.f.reverse().forEach(function(a, idx) {
            return msg += printf((idx === 0 ? this.msgs.beforeMerge.msg[0] : this.msgs.beforeMerge.msg[1]), a.file);
          }, this);
          return L(M2C(msg, (evt.mixed ? 'yellow' : 'gray'), 'white.dim'));
        case HME.applyTheme:
          this.theme = evt.theme;
          numFormats = Object.keys(evt.theme.formats).length;
          return L(M2C(this.msgs.applyTheme.msg, evt.status === 'error' ? 'red' : 'gray', evt.status === 'error' ? 'bold' : 'white.dim'), evt.theme.name.toUpperCase(), numFormats, numFormats === 1 ? '' : 's');
        case HME.end:
          if (evt.cmd === 'build') {
            themeName = this.theme.name.toUpperCase();
            if (this.opts.tips && (this.theme.message || this.theme.render)) {
              WRAP = require('word-wrap');
              if (this.theme.message) {
                L(M2C(this.msgs.afterBuild.msg[0], 'cyan'), themeName);
                return L(M2C(this.theme.message, 'white'));
              } else if (this.theme.render) {
                L(M2C(this.msgs.afterBuild.msg[0], 'cyan'), themeName);
                return L(M2C(this.msgs.afterBuild.msg[1], 'white'));
              }
            }
          }
          break;
        case HME.afterGenerate:
          suffix = '';
          if (evt.fmt === 'pdf') {
            if (this.opts.pdf) {
              if (this.opts.pdf !== 'none') {
                suffix = printf(M2C(this.msgs.afterGenerate.msg[0], evt.error ? 'red' : 'green'), this.opts.pdf);
              } else {
                L(M2C(this.msgs.afterGenerate.msg[1], 'gray'), evt.fmt.toUpperCase(), evt.file);
                return;
              }
            }
          }
          return L(M2C(this.msgs.afterGenerate.msg[2] + suffix, evt.error ? 'red' : 'green'), pad(evt.fmt.toUpperCase(), 4, null, pad.RIGHT), PATH.relative(process.cwd(), evt.file));
        case HME.beforeAnalyze:
          return L(M2C(this.msgs.beforeAnalyze.msg, 'green'), evt.fmt, evt.file);
        case HME.afterAnalyze:
          info = evt.info;
          rawTpl = FS.readFileSync(PATH.join(__dirname, 'analyze.hbs'), 'utf8');
          HANDLEBARS.registerHelper(require('../helpers/console-helpers'));
          template = HANDLEBARS.compile(rawTpl, {
            strict: false,
            assumeObjects: false
          });
          tot = 0;
          info.keywords.forEach(function(g) {
            return tot += g.count;
          });
          info.keywords.totalKeywords = tot;
          output = template(info);
          return this.log(chalk.cyan(output));
        case HME.beforeConvert:
          return L(M2C(this.msgs.beforeConvert.msg, 'green'), evt.srcFile, evt.srcFmt, evt.dstFile, evt.dstFmt);
        case HME.afterInlineConvert:
          return L(M2C(this.msgs.afterInlineConvert.msg, 'gray', 'white.dim'), evt.file, evt.fmt);
        case HME.afterValidate:
          style = 'red';
          adj = '';
          msgs = this.msgs.afterValidate.msg;
          switch (evt.status) {
            case 'valid':
              style = 'green';
              adj = msgs[1];
              break;
            case 'invalid':
              style = 'yellow';
              adj = msgs[2];
              break;
            case 'broken':
              style = 'red';
              adj = msgs[3];
              break;
            case 'missing':
              style = 'red';
              adj = msgs[4];
              break;
            case 'unknown':
              style = 'red';
              adj = msgs[5];
          }
          evt.schema = evt.schema.replace('jars', 'JSON Resume').toUpperCase();
          L(M2C(msgs[0], 'white') + chalk[style].bold(adj), evt.file, evt.schema);
          if (evt.violations) {
            _.each(evt.violations, function(err, idx) {
              L(chalk.yellow.bold('--> ') + chalk.yellow(err.field.replace('data.', 'resume.').toUpperCase() + ' ' + err.message));
            }, this);
          }
          break;
        case HME.afterPeek:
          sty = evt.error ? 'red' : (evt.target !== void 0 ? 'green' : 'yellow');
          if (evt.requested) {
            L(M2C(this.msgs.beforePeek.msg[0], sty), evt.requested, evt.file);
          } else {
            L(M2C(this.msgs.beforePeek.msg[1], sty), evt.file);
          }
          if (evt.target !== void 0 && !evt.error) {
            return console.dir(evt.target, {
              depth: null,
              colors: true
            });
          } else if (!evt.error) {
            return L(M2C(this.msgs.afterPeek.msg, 'yellow'), evt.requested, evt.file);
          } else if (evt.error) {
            return L(chalk.red(evt.error.inner.inner));
          }
      }
    };

    return OutputHandler;

  })();

}).call(this);

//# sourceMappingURL=out.js.map
