import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Starting backfill for Character fields...');
  
  const characters = await prisma.character.findMany();
  let count = 0;

  for (const char of characters) {
    let gender = '';
    let archetype = '';
    let age = '';

    try {
      const data = JSON.parse(char.data);
      gender = data.gender || '';
      archetype = data.archetype || '';
      age = data.age || '';
    } catch {
      console.warn(`Failed to parse data for character ${char.id}`);
      continue;
    }

    if (
      char.gender !== gender ||
      char.archetype !== archetype ||
      char.age !== age
    ) {
      await prisma.character.update({
        where: { id: char.id },
        data: { gender, archetype, age },
      });
      count++;
    }
  }

  console.log(`Backfill completed. Updated ${count} characters.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
