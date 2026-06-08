import { CHARACTER_SCHEMA } from '../src/lib/schema';
import * as fs from 'fs';
import * as path from 'path';

const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Character Card",
  type: "object",
  properties: {} as Record<string, any>,
  additionalProperties: false
};

for (const section of CHARACTER_SCHEMA) {
  for (const field of section.fields) {
    schema.properties[field.id] = {
      type: "string",
      description: field.label
    };
  }
}

fs.writeFileSync(path.join(process.cwd(), 'docs/character-schema.json'), JSON.stringify(schema, null, 2));
console.log('JSON Schema generated.');
