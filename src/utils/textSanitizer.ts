/**
 * Generic Multi-Source Text & Description Sanitation Engine (EC-025 & EC-026)
 *
 * Normalizes and sanitizes text across all job boards and upstream feeds:
 * - Decodes named, decimal, and hex HTML entities
 * - Reconstructs corrupted Mojibake (UTF-8 parsed as Latin-1/Windows-1252)
 * - Converts HTML block structures into natural, readable prose and bullet points
 * - Strips embedded style/script blocks and raw CSS declarations
 * - Prevents dangling broken tags or entities from string truncation
 */

const NAMED_ENTITIES: Record<string, string> = {
  '&quot;': '"',
  '&apos;': "'",
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&sbquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&bdquo;': '"',
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&nbsp;': ' ',
  '&ensp;': ' ',
  '&emsp;': ' ',
  '&thinsp;': ' ',
  '&ndash;': '–',
  '&mdash;': '—',
  '&hyphen;': '-',
  '&bull;': '•',
  '&middot;': '·',
  '&hellip;': '…',
  '&trade;': '™',
  '&copy;': '©',
  '&reg;': '®',
  '&cent;': '¢',
  '&pound;': '£',
  '&euro;': '€',
  '&yen;': '¥'
};

const MOJIBAKE_MAP: [RegExp, string][] = [
  // 3-byte unicode representations first
  [/\u00e2\u0080\u0099/g, "'"], // right single quote / apostrophe
  [/\u00e2\u0080\u0098/g, "'"], // left single quote
  [/\u00e2\u0080\u009c/g, '"'], // left double quote
  [/\u00e2\u0080\u009d/g, '"'], // right double quote
  [/\u00e2\u0080\u0094/g, '—'], // em dash
  [/\u00e2\u0080\u0093/g, '–'], // en dash
  [/\u00e2\u0080\u00a6/g, '…'], // ellipsis
  [/\u00e2\u0080\u00a2/g, '•'], // bullet
  [/\u00c2\u00a0/g, ' '],       // non-breaking space
  [/\u00e2\u0084\u00a2/g, '™'], // trademark

  // Literal Mojibake strings (longest multi-char sequences first)
  [/â€™/g, "'"],
  [/â€˜/g, "'"],
  [/â€œ/g, '"'],
  [/â€ /g, '"'],
  [/â€”/g, '—'],
  [/â€“/g, '–'],
  [/â€¦/g, '…'],
  [/â€¢/g, '•'],
  [/Â /g, ' '],
  [/Â/g, ''],
  [/â€/g, '"']
];

/**
 * Decodes all named, decimal, and hexadecimal HTML entities.
 */
export function decodeHtmlEntities(str: string): string {
  if (!str) return '';
  let res = str;

  // Run up to 2 passes to resolve double-encoded entities (e.g. &amp;quot;)
  for (let pass = 0; pass < 2; pass++) {
    if (!res.includes('&')) break;

    // 1. Named entities
    for (const [entity, replacement] of Object.entries(NAMED_ENTITIES)) {
      if (res.includes(entity)) {
        res = res.replaceAll(entity, replacement);
      }
    }

    // 2. Decimal entities: &#([0-9]+);
    res = res.replace(/&#([0-9]{1,7});/g, (match, numStr) => {
      try {
        const code = parseInt(numStr, 10);
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    });

    // 3. Hexadecimal entities: &#x([0-9a-fA-F]+);
    res = res.replace(/&#x([0-9a-fA-F]{1,6});/g, (match, hexStr) => {
      try {
        const code = parseInt(hexStr, 16);
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    });
  }

  return res;
}

/**
 * Fixes Mojibake artifacts caused by UTF-8 bytes decoded as Latin-1 or Windows-1252.
 */
export function fixMojibake(str: string): string {
  if (!str) return '';
  let res = str;
  for (const [pattern, replacement] of MOJIBAKE_MAP) {
    res = res.replace(pattern, replacement);
  }
  return res;
}

/**
 * Sanitizes single-line fields (job titles, company names, locations).
 */
export function cleanText(text: string): string {
  if (!text) return '';
  let str = text;
  str = decodeHtmlEntities(str);
  str = fixMojibake(str);
  str = str.replace(/<[^>]+>/g, ' ');
  str = str.replace(/\s+/g, ' ').trim();
  return str;
}

/**
 * Sanitizes multi-line job descriptions across all formats and feeds.
 */
export function cleanJobDescription(text: string): string {
  if (!text) return '';
  let str = text;

  // 1. Decode entities & fix mojibake
  str = decodeHtmlEntities(str);
  str = fixMojibake(str);

  // 2. Strip style & script blocks (with contents)
  str = str.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ');
  str = str.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ');
  str = str.replace(/<!--[\s\S]*?-->/g, ' ');

  // 3. Convert block tags and list items to natural line breaks
  str = str.replace(/<br\s*\/?>/gi, '\n');
  str = str.replace(/<\/(p|div|h[1-6]|tr|blockquote|section|article)>/gi, '\n');
  str = str.replace(/<li>/gi, '\n• ');
  str = str.replace(/<\/li>/gi, '');

  // 4. Strip all remaining HTML tags
  str = str.replace(/<[^>]+>/g, ' ');

  // 5. Strip broken/dangling tag remnants (e.g. "<br /" or "<div class=")
  str = str.replace(/<[a-zA-Z\/][^>]*$/g, '');

  // 6. Strip CSS selector blocks
  str = str.replace(/(?:[#.]?[a-zA-Z0-9_\-\s,:>+~*]+|\bbody|\bdiv|\ba|\bbutton|\bspan|\bp)\s*\{[^}]*\}/g, ' ');
  str = str.replace(/(?:[#.]?[a-zA-Z0-9_\-\s,:>+~*]+|\bbody|\bdiv|\ba|\bbutton|\bspan|\bp)\s*\{[^\n]*(?:\n[^\n]+)*(?=\n\n|$)/g, ' ');
  str = str.replace(/\b(?:display|color|background|border|margin|padding|font-size|line-height|width|height)\s*:[^;\n]+;?/gi, ' ');
  str = str.replace(/!important/gi, ' ');

  // 7. Normalize line breaks and spaces
  str = str.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  str = str.replace(/[ \t]+/g, ' ');
  str = str.replace(/^[ \t]+|[ \t]+$/gm, '');
  str = str.replace(/\n\s*\n\s*\n+/g, '\n\n');

  return str.trim();
}

/**
 * Safely truncates a description to a maximum length on a word boundary,
 * guaranteeing no dangling partial HTML tags, broken entities, or half-cut words.
 */
export function safeTruncate(text: string, maxLength: number): string {
  if (!text) return '';
  let cleaned = cleanJobDescription(text);

  // Strip any trailing broken tags or entities before length check
  cleaned = cleaned.replace(/<[a-zA-Z\/][^>]*$/g, '').replace(/&[a-zA-Z0-9#]{1,8}$/g, '').trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // Slice at maxLength
  let sliced = cleaned.slice(0, maxLength);

  // Backtrack to the last space to avoid cutting words in half
  const lastSpace = sliced.lastIndexOf(' ');
  if (lastSpace > 0) {
    sliced = sliced.slice(0, lastSpace);
  }

  // Strip trailing punctuation and dangling fragments
  sliced = sliced.replace(/[,;:\-\s]+$/, '');
  sliced = sliced.replace(/<[a-zA-Z\/][^>]*$/, '');
  sliced = sliced.replace(/&[a-zA-Z0-9#]{1,8}$/, '');

  return `${sliced}...`;
}
