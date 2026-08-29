---
title: Chapter One
id: chapter-one
order: 3
---

# Chapter One

A chapter is one Markdown file. It begins on a new page, and its heading is sunk three lines. Write in short paragraphs; the page is 4.25 by 5.5 inches and holds around twenty-three lines of ten-point type on a fourteen-point baseline, which is roughly a hundred and fifty words.

Asides go in an `<aside>` immediately after the paragraph they belong to. Prince floats them to the foot of the page as a page float, so the paragraph that follows in the source still reads as a continuation and is indented accordingly. Keep an aside to a sentence or two—it shares the page with the text it annotates.

<aside><p><em>Try this:</em> build the book, then read every page of the snapshot PDF before changing a single style.</p></aside>

Quotations are block quotes. The quote marks come from the stylesheet, so don’t type them:

> Start with a single thread. One input, one rule. Watch how it behaves before you add another.

Lists are plain, with a bullet or a number set before each item:

- one thread
- then another
- then the relationships between them

Code is set in Courier Prime, `inline` or as a block:

```
crown build
crown layout dist/book.pdf
```

Where a chapter runs past a page, Prince breaks it, keeping at least two lines of a paragraph on either side of the break and never leaving a heading stranded at the foot. This paragraph exists to push the chapter onto a second page so that the first build shows a break and a page that starts mid-paragraph. Delete it once there is real writing to replace it.
