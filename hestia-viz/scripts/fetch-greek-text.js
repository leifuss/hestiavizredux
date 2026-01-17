#!/usr/bin/env node

/**
 * Script to fetch all Greek text from Perseus CTS API
 * and save it locally in the repository
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Book structure from books.json
const books = [
  { id: 1, maxChapterId: 216 },
  { id: 2, maxChapterId: 182 },
  { id: 3, maxChapterId: 160 },
  { id: 4, maxChapterId: 205 },
  { id: 5, maxChapterId: 126 },
  { id: 6, maxChapterId: 140 },
  { id: 7, maxChapterId: 239 },
  { id: 8, maxChapterId: 144 },
  { id: 9, maxChapterId: 122 }
];

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchGreekText(bookId, chapter) {
  const urn = `urn:cts:greekLit:tlg0016.tlg001.perseus-grc2:${bookId}.${chapter}`;
  const apiUrl = `https://cts.perseids.org/api/cts/?request=GetPassage&urn=${urn}`;

  try {
    const response = await fetch(apiUrl);
    const text = await response.text();

    // Parse XML response
    const dom = new JSDOM(text, { contentType: 'text/xml' });
    const xmlDoc = dom.window.document;
    const passageNode = xmlDoc.querySelector('passage') || xmlDoc.querySelector('TEI');

    if (passageNode) {
      return passageNode.textContent.trim();
    }
    return null;
  } catch (error) {
    console.error(`Error fetching Book ${bookId}, Chapter ${chapter}:`, error.message);
    return null;
  }
}

async function fetchAllGreekText() {
  console.log('Starting to fetch Greek text from Perseus...');

  const allText = {};

  for (const book of books) {
    console.log(`\nFetching Book ${book.id} (${book.maxChapterId} chapters)...`);
    allText[book.id] = {};

    for (let chapter = 1; chapter <= book.maxChapterId; chapter++) {
      process.stdout.write(`  Chapter ${chapter}/${book.maxChapterId}\r`);

      const text = await fetchGreekText(book.id, chapter);
      if (text) {
        allText[book.id][chapter] = text;
      }

      // Be polite to the API - small delay between requests
      await delay(100);
    }
    console.log(`  Book ${book.id} complete!                    `);
  }

  // Save to file
  const outputDir = path.join(__dirname, '..', 'public', 'data');
  const outputPath = path.join(outputDir, 'greek-text.json');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(allText, null, 2));
  console.log(`\n✅ Greek text saved to ${outputPath}`);

  // Calculate stats
  let totalChapters = 0;
  Object.values(allText).forEach(book => {
    totalChapters += Object.keys(book).length;
  });
  console.log(`📊 Total chapters: ${totalChapters}`);
}

await fetchAllGreekText();
