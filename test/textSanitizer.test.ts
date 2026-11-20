import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  decodeHtmlEntities,
  fixMojibake,
  cleanText,
  cleanJobDescription,
  safeTruncate
} from '../src/utils/textSanitizer.ts';

describe('[EC-026] Generic Multi-Source Text & Description Sanitation Engine', () => {
  describe('decodeHtmlEntities', () => {
    it('decodes common named entities', () => {
      const input = 'Bits &amp; Pieces &quot;Quote&quot; &apos;Single&apos; &lt;tag&gt; &nbsp;&ndash;&mdash;&bull;&hellip;';
      const output = decodeHtmlEntities(input);
      assert.strictEqual(output, 'Bits & Pieces "Quote" \'Single\' <tag>  –—•…');
    });

    it('decodes decimal numeric entities', () => {
      const input = 'Price: &#36;100 &#38; world&#39;s largest &#8217;quote&#8217; &#8211; test';
      const output = decodeHtmlEntities(input);
      assert.strictEqual(output, "Price: $100 & world's largest ’quote’ – test");
    });

    it('decodes hex numeric entities', () => {
      const input = 'Symbol: &#x24; &#x26; &#x27;';
      const output = decodeHtmlEntities(input);
      assert.strictEqual(output, "Symbol: $ & '");
    });

    it('handles double-encoded entities', () => {
      const input = 'Double &amp;amp; &amp;quot; &amp;lt;';
      const output = decodeHtmlEntities(input);
      assert.strictEqual(output, 'Double & " <');
    });

    it('preserves bare ampersands that are not entities', () => {
      const input = 'C & C++ Programming and R&D';
      const output = decodeHtmlEntities(input);
      assert.strictEqual(output, 'C & C++ Programming and R&D');
    });
  });

  describe('fixMojibake', () => {
    it('fixes common UTF-8 misinterpreted as Latin-1 artifacts', () => {
      const input = 'Oracle Fusion Cloud Lead â€” Logistics and Supply Chain â€“ Weâ€™re dedicated to empoweringâ€¦ â€¢ Item 1';
      const output = fixMojibake(input);
      assert.strictEqual(output, "Oracle Fusion Cloud Lead — Logistics and Supply Chain – We're dedicated to empowering… • Item 1");
    });
  });

  describe('cleanText', () => {
    it('cleans job titles by decoding entities, fixing mojibake, stripping html, and normalizing spaces', () => {
      const rawTitle = '  Backend / Platform Developer &amp; Consultant (Temporal &amp; Kubernetes)  ';
      assert.strictEqual(cleanText(rawTitle), 'Backend / Platform Developer & Consultant (Temporal & Kubernetes)');

      const mojibakeTitle = 'Oracle Fusion Cloud Lead â€” Logistics';
      assert.strictEqual(cleanText(mojibakeTitle), 'Oracle Fusion Cloud Lead — Logistics');

      const htmlTitle = '<b>Senior</b> Java &amp; Cloud Developer <span class="badge">New</span>';
      assert.strictEqual(cleanText(htmlTitle), 'Senior Java & Cloud Developer New');
    });
  });

  describe('cleanJobDescription', () => {
    it('strips <style> and <script> blocks with contents', () => {
      const input = '<style>.btn { color: red; }</style><script>alert(1);</script>Clean Description';
      assert.strictEqual(cleanJobDescription(input), 'Clean Description');
    });

    it('converts block closing tags and line breaks to natural paragraphs', () => {
      const input = '<h2>Who We Are</h2><p>Paragraph 1</p><p>Paragraph 2</p><ul><li>Point 1</li><li>Point 2</li></ul>';
      const output = cleanJobDescription(input);
      assert.ok(output.includes('Who We Are\nParagraph 1\nParagraph 2'));
      assert.ok(output.includes('• Point 1\n• Point 2'));
    });

    it('cleans raw CSS blocks and unclosed CSS fragments', () => {
      const input = '# { display: inline; }\n.buttontext47d030a40eb4ac5c a{ border: 1px solid transparent; } .buttontext47d030a40eb4ac5c a: focus{ border: 1px dashed #2b97ef !important; outline\n\nActual job requirements.';
      const output = cleanJobDescription(input);
      assert.strictEqual(output.includes('buttontext'), false);
      assert.strictEqual(output.includes('display: inline'), false);
      assert.strictEqual(output.includes('#2b97ef'), false);
      assert.ok(output.includes('Actual job requirements.'));
    });

    it('handles Greenhouse entity-encoded descriptions (Stripe and Elastic)', () => {
      const stripeDirty = '&lt;h2 id=&quot;who-we-are&quot;&gt;Who we are&lt;/h2&gt; &lt;h3 id=&quot;about-stripe&quot;&gt;About Stripe&lt;/h3&gt; &lt;p&gt;Stripe is a financial infrastructure platform for businesses. Millions of companies—from the world&#39;s largest enterpri';
      const output = cleanJobDescription(stripeDirty);
      assert.strictEqual(output.includes('&lt;'), false);
      assert.strictEqual(output.includes('&gt;'), false);
      assert.strictEqual(output.includes('&quot;'), false);
      assert.strictEqual(output.includes('&#39;'), false);
      assert.ok(output.includes("world's largest"));
      assert.ok(output.includes('Who we are'));
    });
  });

  describe('safeTruncate', () => {
    it('truncates on word boundaries without cutting words in half', () => {
      const text = 'Stripe is a financial infrastructure platform for businesses worldwide.';
      const truncated = safeTruncate(text, 40);
      assert.strictEqual(truncated, 'Stripe is a financial infrastructure...');
    });

    it('cleans trailing broken HTML tags resulting from truncation', () => {
      const textWithTag = 'Headquarters: Pune, Maharashtra, India\n <br /';
      const output = safeTruncate(textWithTag, 100);
      assert.strictEqual(output.includes('<br'), false);
      assert.strictEqual(output.trim(), 'Headquarters: Pune, Maharashtra, India');
    });

    it('cleans trailing broken entities resulting from truncation', () => {
      const textWithEntity = 'Company Info &lt';
      const output = safeTruncate(textWithEntity, 50);
      assert.strictEqual(output.includes('&lt'), false);
      assert.strictEqual(output.trim(), 'Company Info');
    });
  });
});
