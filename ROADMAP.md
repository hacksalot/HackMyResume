Development Roadmap
===================

## Short-Term

- The **FluentCV Desktop 1.0 beta release** will present HackMyResume
functionality in a cross-platform desktop application for OS X, Linux, and
Windows.

- The **fresh-themes 1.0** release will bring 100% coverage of the FRESH and JRS
object models&mdash;all resume sections and fields&mdash;along with
documentation, theme developer's guide, new themes, and a freeze to the FRESH
theme structure.

- **Better LaTeX support** including Markdown-to-LaTeX translation and more
LaTeX-driven themes and formats.

- **StackOverflow and LinkedIn** support will start appearing in v1.7.0, with
incremental improvements in 1.8.0 and beyond.

- **Better resume sorting** of items and sections: ascending, descending, by
date or other criteria ([#67][i67]).

- **Support remote loading** of themes and resumes over `http`, `https`, and
`git://`. Enable these usage patterns:

      hackmyresume build https://somesite.com/my-resume.json -t informatic

      hackmyresume build resume.json -t npm:fresh-theme-ergonomic

      hackmyresume analyze https://github.com/foo/my-resume

- **100% code coverage**. Should reduce certain classes of errors and allow us
to display a nifty 100% code coverage badge.

- Improved **documentation and samples**.

## Mid-Term

- Introduce **character sheets** support ([#117][i117]), with a twist.

- Add support for schema-driven **cover letters** and **job descriptions**.

- Basic support for **rich text** `.rtf` output formats.

- Investigate adding [**groff**][groff] support, because that would, indeed, be
[dope][d] ([#37][i37]).

- Investigate adding [**org mode**][om] support ([#38][i38]).

- Investigate adding [**Scribus SLA**][scri] support ([#54][i54]).

- Support **JSON Resume 1.0.0** when released.

## Long-Term

- TBD

[groff]: http://www.gnu.org/software/groff/
[om]: http://orgmode.org/
[scri]: https://en.wikipedia.org/wiki/Scribus
[d]: https://github.com/hacksalot/HackMyResume/issues/37#issue-123818674
[i37]: https://github.com/hacksalot/HackMyResume/issues/37
[i38]: https://github.com/hacksalot/HackMyResume/issues/38
[i54]: https://github.com/hacksalot/HackMyResume/issues/54
[i67]: https://github.com/hacksalot/HackMyResume/issues/67
[i107]: https://github.com/hacksalot/HackMyResume/issues/107
[i117]: https://github.com/hacksalot/HackMyResume/issues/117
