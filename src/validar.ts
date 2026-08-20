import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { Validator } from '@seriousme/openapi-schema-validator';

async function main() {
  const yamlContent = readFileSync('openapi.yaml', 'utf-8');
  const especificacion = parse(yamlContent);

  const validator = new Validator();
  const resultado = await validator.validate(especificacion);

  if (resultado.valid) {
    console.log(
      `OK · documento OpenAPI ${validator.version} válido`,
    );
    return;
  }

  console.error(
    'Error al validar OpenAPI:',
    resultado.errors,
  );

  process.exit(1);
}

main().catch((error) => {
  console.error('No fue posible validar el documento OpenAPI:', error);
  process.exit(1);
});