import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
// @ts-ignore
import { validate } from '@seriousme/openapi-schema-validator';

async function main() {
  const yamlContent = readFileSync('openapi.yaml', 'utf-8');
  const spec = parse(yamlContent);
  const res = await validate(spec);

  if (res.valid) {
    console.log('OK · documento OpenAPI 3.1 válido');
  } else {
    console.error('Error al validar OpenAPI:', res.errors);
    process.exit(1);
  }
}
main();
