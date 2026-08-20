import { writeFileSync } from 'node:fs';
import { stringify } from 'yaml';
import { documentoOpenAPI } from './openapi.js';

writeFileSync('openapi.json', JSON.stringify(documentoOpenAPI, null, 2), 'utf-8');
writeFileSync('openapi.yaml', stringify(documentoOpenAPI), 'utf-8');
console.log('✔ Archivos openapi.json y openapi.yaml generados.');
