import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import * as validatorPkg from '@seriousme/openapi-schema-validator';

const validate = (validatorPkg as any).validate || (validatorPkg as any).default?.validate || (validatorPkg as any).default || validatorPkg;

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
