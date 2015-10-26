fluentcmd
=========
*Generate beautiful, targeted resumes from your command line or shell.*

FluentCMD is a **hackable, data-driven, dev-friendly resume authoring tool** with support for HTML, Markdown, Word, PDF, plain text, smoke signal, carrier pigeon, and other arbitrary-format resumes and CVs.

![](assets/fluentcmd_ubuntu.png)

Looking for a desktop GUI version with pretty timelines and graphs? Check out [FluentCV Desktop][7].

## Features

- Runs on OS X, Linux, and Windows.
- Store your resume data as a durable, versionable JSON, YML, or XML document.
- Generate multiple targeted resumes in multiple formats, based on your needs.
- Output to HTML, PDF, Markdown, Word, JSON, YAML, XML, or a custom format.
- Never update one piece of information in four different resumes again.
- Compatible with the [JSON Resume standard][6] and [authoring tools][7].
- Free and open-source through the MIT license.
- Forthcoming: StackOverflow and LinkedIn support.
- Forthcoming: More themes!

## Install

FluentCMD requires a recent version of [Node.js][4] and [NPM][5]. Then:

1. (Optional, for PDF support) Install the latest official [wkhtmltopdf][3] binary for your platform.
2. Install **fluentcmd** by running `npm install fluentcmd -g`.
3. You're ready to go.

## Use

Assuming you've got a JSON-formatted resume handy, generating resumes in different formats and combinations easy. Just run:

```bash
fluentcmd [inputs] [outputs] [-t theme].
```

Where `[inputs]` is one or more .json resume files, separated by spaces; `[outputs]` is one or more destination resumes, each prefaced with the `-o` option; and `[theme]` is the desired theme. For example:

```bash
# Generate all resume formats (HTML, PDF, DOC, TXT, YML, etc.)
fluentcmd resume.json -o out/resume.all -t modern

# Generate a specific resume format
fluentcmd resume.json -o out/resume.html
fluentcmd resume.json -o out/resume.pdf
fluentcmd resume.json -o out/resume.md
fluentcmd resume.json -o out/resume.doc
fluentcmd resume.json -o out/resume.json
fluentcmd resume.json -o out/resume.txt
fluentcmd resume.json -o out/resume.yml

# Specify 2 inputs and 3 outputs
fluentcmd in1.json in2.json -o out.html -o out.doc -o out.pdf
```

You should see something to the effect of:

```
*** FluentCMD v0.5.0 ***
Reading JSON resume: foo/resume.json
Applying MODERN Theme (7 formats)
Generating HTML resume: out/resume.html
Generating TXT resume: out/resume.txt
Generating DOC resume: out/resume.doc
Generating PDF resume: out/resume.pdf
Generating JSON resume: out/resume.json
Generating MARKDOWN resume: out/resume.md
Generating YAML resume: out/resume.yml
```

## Advanced

### Applying a theme

You can specify a predefined or custom theme via the optional `-t` parameter. For a predefined theme, include the theme name. For a custom theme, include the path to the custom theme's folder.

```bash
fluentcmd resume.json -t modern
fluentcmd resume.json -t ~/foo/bar/my-custom-theme/
```

As of v0.5.0, available predefined themes are `modern`, `minimist`, and `hello-world`.

### Merging resumes

You can **merge multiple resumes together** by specifying them in order from most generic to most specific:

```bash
# Merge specific.json onto base.json and generate all formats
fluentcmd base.json specific.json -o resume.all
```

This can be useful for overriding a base (generic) resume with information from a specific (targeted) resume. For example, you might override your generic catch-all "software developer" resume with specific details from your targeted "game developer" resume, or combine two partial resumes into a "complete" resume. Merging follows conventional [extend()][9]-style behavior and there's no arbitrary limit to how many resumes you can merge:

```bash
fluentcmd in1.json in2.json in3.json in4.json -o out.html -o out.doc
Reading JSON resume: in1.json
Reading JSON resume: in2.json
Reading JSON resume: in3.json
Reading JSON resume: in4.json
Merging in4.json onto in3.json onto in2.json onto in1.json
Generating HTML resume: out.html
Generating WORD resume: out.doc
```

### Multiple targets

You can specify **multiple output targets** and FluentCMD will build them:

```bash
# Generate out1.doc, out1.pdf, and foo.txt from me.json.
fluentcmd me.json -o out1.doc -o out1.pdf -o foo.txt
```

You can also omit the output file(s) and/or theme completely:

```bash
# Equivalent to "fluentcmd resume.json resume.all -t modern"
fluentcmd resume.json
```

### Using .all

The special `.all` extension tells FluentCMD to generate all supported output formats for the given resume. For example, this...

```bash
# Generate all resume formats (HTML, PDF, DOC, TXT, etc.)
fluentcmd me.json -o out/resume.all
```

..tells FluentCV to read `me.json` and generate `out/resume.md`, `out/resume.doc`, `out/resume.html`, `out/resume.txt`, `out/resume.pdf`, and `out/resume.json`.

### Prettifying

FluentCMD applies [js-beautify][10]-style HTML prettification by default to HTML-formatted resumes. To disable prettification, the `--nopretty` or `-n` flag can be used:

```bash
fluentcmd resume.json out.all --nopretty
```

### Silent Mode

Use `-s` or `--silent` to run in silent mode:

```bash
fluentcmd resume.json -o someFile.all -s
fluentcmd resume.json -o someFile.all --silent
```

## License

MIT. Go crazy. See [LICENSE.md][1] for details.

[1]: LICENSE.md
[2]: http://phantomjs.org/
[3]: http://wkhtmltopdf.org/
[4]: https://nodejs.org/
[5]: https://www.npmjs.com/
[6]: http://jsonresume.org
[7]: http://fluentcv.com
[8]: https://youtu.be/N9wsjroVlu8
[9]: https://api.jquery.com/jquery.extend/
[10]: https://github.com/beautify-web/js-beautify
