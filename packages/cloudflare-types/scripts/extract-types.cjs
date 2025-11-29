#!/usr/bin/env node'use strict';'use strict';'use strict';

const fs = require('node:fs');
const path = require('node:path');

const GENERATED_FILE = path.join(__dirname, '../cloudflare-env.d.ts');
const TYPES_FILE = path.join(__dirname, '../types.ts');

function extractEnvInterface() {
  if (!fs.existsSync(GENERATED_FILE)) {
    console.error(
      'Generated cloudflare-env.d.ts file not found. Run cf-typegen first.'
    );
    process.exit(1);
  }

  const content = fs.readFileSync(GENERATED_FILE, 'utf8');

  // Extract the Env interface
  const envMatch = content.match(/interface Env \{([\s\S]*?)\}/);
  if (!envMatch) {
    console.error('Could not find Env interface in generated file');
    process.exit(1);
  }

  const envContent = envMatch[1];

  // Parse the properties
  const properties = [];
  const lines = envContent.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      // Clean up the property line
      const cleaned = trimmed.replace(/\t/g, '  ').replace(/;$/, ';');
      if (cleaned.includes(':')) {
        properties.push(`  ${cleaned}`);
      }
    }
  }

  // Generate the new types.ts content
  const newContent = `// Cloudflare Environment Variables Type Definition
// This file contains the CloudflareEnv interface for type-safe environment access
// Auto-generated from wrangler types - DO NOT EDIT MANUALLY

import type { KVNamespace, Fetcher } from "@cloudflare/workers-types";

export interface CloudflareEnv {
${properties.join('\n')}
}`;

  // Write the new types.ts file
  fs.writeFileSync(TYPES_FILE, newContent);
  console.log(
    '✅ Successfully updated types.ts with latest CloudflareEnv interface'
  );
}

extractEnvInterface();
