fluentcmd
=========
*Generate beautiful, targeted resumes from your command line or shell.*

FluentCMD is a **hackable, data-driven, Markdown-and-JSON-friendly resume authoring tool** with support for HTML, Word, PDF, plain text, and other arbitrary-format resumes and CVs.

[![](assets/office_space.jpg)][8]

Looking for a desktop version with pretty timelines and graphs? Check out [FluentCV Desktop][7].

## Features

- Runs on OS X, Linux, and Windows. If you can run Node.js, you can run fluentcmd.
- Store your resume data as a durable, versionable JSON, YML, or XML document.
- Generate multiple targeted resumes in multiple formats, based on your needs.
- Output to HTML, PDF, Markdown, Word, JSON, XML, or other arbitrary formats.
- Compatible with the [JSON Resume][6] standard and other compatible tools.
- Compatible with [FluentCV Desktop][7] and FluentDesk tools.
- 100% free and open-source.

## Install

First make sure [Node.js][4] and [NPM][5] are installed. Then:

1. (Optional, for PDF support) Install the latest official [wkhtmltopdf][3] binary for your platform.
2. Install fluentcmd by running `npm install` followed by `npm link`.

## Use

Assuming you've got a JSON-formatted resume handy, generating output resumes is easy. Just run:

`fluentcmd [inputs] [outputs] -t [theme]`.

Where `[inputs]` is one or more .json resume files, `[outputs]` is one or more destination resumes, and `[theme]` is the desired theme. For example:

```bash
# Generate all resume formats (HTML, PDF, DOC, TXT)
fluentcmd resume.json resume.all -t informatic

# Generate a specific resume format
fluentcmd resume.json resume.html -t informatic
fluentcmd resume.json resume.txt -t informatic
fluentcmd resume.json resume.pdf -t informatic
fluentcmd resume.json resume.doc -t informatic
```

You should see something to the effect of:

```
*** FluentCMD v0.1.0 ***
Reading JSON resume: foo/resume.json
Generating HTML resume: out/resume.html
Generating TXT resume: out/resume.txt
Generating DOC resume: out/resume.doc
Generating PDF resume: out/resume.pdf
```

## Advanced

### Merging resumes

You can **merge multiple resumes together** by specifying them in order from most generic to most specific:

```bash
# Merge specific.json onto base.json and generate all formats
fluentcmd base.json specific.json resume.all
```

This can be useful for overriding a base (generic) resume with information from a specific (targeted) resume. For example, you might override portions of your generic "software developer" resume with specific information from your targeted "game developer" resume. Merging follows standard jQuery or Underscore extends()-style behavior.

### Multiple targets

You can specify **multiple output targets**:

```bash
# Merge specific.json onto base.json and generate out1.doc and out1.pdf
fluentcmd base.json specific.json out1.doc out1.pdf
```

You can omit the output file(s) and/or theme completely:

```bash
# Equivalent to "fluentcmd resume.json resume.all -t default"
fluentcmd resume.json
```

### Using .all

The special `.all` extension tells FluentCMD to generate all supported output formats for the given resume. For example, this...

```bash
# Generate all resume formats (HTML, PDF, DOC, TXT, etc.)
fluentcmd input.json output.all
```

..tells FluentCV to read `input.json` and generate `output.doc`, `output.html`, `output.txt`, `output.pdf`. That's more or less equivalent to:

```bash
# Generate all resume formats (HTML, PDF, DOC, TXT)
fluentcmd input.json output.doc output.html output.txt output.pdf
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
