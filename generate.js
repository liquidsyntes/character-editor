const fs = require('fs');
const content = fs.readFileSync('src/lib/schema.ts', 'utf-8');
const schema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Character Card",
  type: "object",
  properties: {},
  additionalProperties: false
};
const regex = /\{ id: '([^']+)', label: '([^']+)'/g;
let match;
while ((match = regex.exec(content)) !== null) {
  schema.properties[match[1]] = { type: 'string', description: match[2] };
}
fs.writeFileSync('docs/character-schema.json', JSON.stringify(schema, null, 2));
console.log('Done!');
