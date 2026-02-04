#!/usr/bin/env tsx
/**
 * Dictionary processing script
 *
 * Downloads and processes the MOE dictionary data from moedict
 * to extract two-character words for the guessing game.
 *
 * Usage:
 *   pnpm tsx scripts/process-dictionary.ts
 *
 * Or manually download dict-revised.json from:
 *   https://github.com/g0v/moedict-data
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUTPUT_DIR = join(__dirname, '../apps/server/data/words');
const OUTPUT_FILE = join(OUTPUT_DIR, 'two-char-words.json');

interface MoedictEntry {
  title: string;
  heteronyms?: Array<{
    bopomofo?: string;
    definitions?: Array<{
      def?: string;
    }>;
  }>;
}

async function downloadDictionary(): Promise<MoedictEntry[]> {
  console.log('Downloading dictionary data...');

  // Try to fetch from GitHub raw
  const url = 'https://raw.githubusercontent.com/g0v/moedict-data/master/dict-revised.json';

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Downloaded ${Array.isArray(data) ? data.length : 'unknown'} entries`);
    return data as MoedictEntry[];
  } catch (error) {
    console.error('Failed to download dictionary:', error);
    console.log('Please manually download dict-revised.json from:');
    console.log('https://github.com/g0v/moedict-data');
    throw error;
  }
}

function extractTwoCharWords(entries: MoedictEntry[]): string[] {
  const words = new Set<string>();

  for (const entry of entries) {
    const title = entry.title;

    // Only keep two-character words
    if (title && title.length === 2) {
      // Skip if contains non-Chinese characters
      if (/^[\u4e00-\u9fff]{2}$/.test(title)) {
        words.add(title);
      }
    }
  }

  return Array.from(words).sort();
}

async function main() {
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let entries: MoedictEntry[];

  // Check if local file exists
  const localFile = join(__dirname, 'dict-revised.json');
  if (existsSync(localFile)) {
    console.log('Using local dictionary file...');
    entries = JSON.parse(readFileSync(localFile, 'utf-8'));
  } else {
    entries = await downloadDictionary();
  }

  console.log('Extracting two-character words...');
  const words = extractTwoCharWords(entries);

  console.log(`Found ${words.length} two-character words`);

  // Save to file
  const output = {
    generatedAt: new Date().toISOString(),
    count: words.length,
    words: words,
  };

  writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');
  console.log(`Saved to ${OUTPUT_FILE}`);

  // Print some statistics
  const charFreq = new Map<string, number>();
  for (const word of words) {
    for (const char of word) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }
  }

  const topChars = Array.from(charFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  console.log('\nTop 20 most common characters:');
  for (const [char, count] of topChars) {
    console.log(`  ${char}: ${count} occurrences`);
  }
}

main().catch(console.error);
