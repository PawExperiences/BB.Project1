# Sample fixture for linkcheck tests

This document exercises each construct linkcheck must classify. Every
construct under test sits on its own line so reported line numbers are
unambiguous.

A well-formed http(s) link: [good http link](https://example.com/page).
A well-formed mailto link: [contact us](mailto:someone@example.com).

[good-ref]: https://example.com

A link with an empty target: [empty target]()
A link with an ftp:// target: [ftp target](ftp://ftp.example.com/pub/file.txt)
A link with a space in its target: [space target](some file with spaces.md)
A link to a missing absolute path: [missing absolute path](/nonexistent/missing-file.md)

End of fixture.
