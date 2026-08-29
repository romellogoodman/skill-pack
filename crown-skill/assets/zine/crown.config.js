import { defineConfig } from '@romello/crown';

// Trim size: Quarter Letter Portrait (4.25 × 5.5 in) — 2 × 2 on a letter
// sheet, 8 pages per sheet. `npm run build` (scripts/build.mjs) runs crown,
// strips the decoy page, snapshots to book/<title>.<stamp>/ and imposes
// with `crown layout -f quarter-portrait`.
//
// NOTE: page geometry lives in src/styles.css (@page). Crown only injects
// the `page` block below when the stylesheet has no @page, so it is
// documentation here — keep it in step with the CSS.
export default defineConfig({
  input: {
    content: 'src/content/**/*.md',
    template: 'src/templates/layout.html',
    styles: 'src/styles.css',
    assets: 'src/fonts',
  },
  output: {
    html: 'dist/book.html',
    pdf: 'dist/book.pdf',
  },
  metadata: {
    title: 'My Book',
    author: 'Romello Goodman',
    subject: '',
    keywords: [],
    lang: 'en',
  },
  page: {
    size: '4.25in 5.5in',
    margins: {
      top: '0.45in',
      bottom: '0.55in',
      inside: '0.45in',
      outside: '0.45in',
    },
  },
  prince: {
    javascript: false,
    verbose: false,
  },
  devServer: {
    port: 3004,
    open: false,
  },
});
