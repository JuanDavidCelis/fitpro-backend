import { PrismaClient } from '@prisma/client';
import * as https from 'https';
import * as fs from 'fs';

const DATASET_URL = 'https://raw.githubusercontent.com/Nielide/exercises-dataset/main/data/exercises.json';
const IMAGE_BASE = 'https://raw.githubusercontent.com/Nielide/exercises-dataset/main';

interface NielideExercise {
  id: string;
  name: string;
  image: string;
  gif_url: string;
}

async function fetchDataset(): Promise<NielideExercise[]> {
  return new Promise((resolve, reject) => {
    https.get(DATASET_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const dataset = await fetchDataset();
    const byName = new Map<string, NielideExercise>();
    for (const ex of dataset) byName.set(normalize(ex.name), ex);

    const exercises = await prisma.exercise.findMany({ select: { id: true, nombre: true } });
    let matched = 0;
    for (const ex of exercises) {
      const match = byName.get(normalize(ex.nombre));
      if (match) {
        await prisma.exercise.update({
          where: { id: ex.id },
          data: {
            imageUrl: `${IMAGE_BASE}/${match.image}`,
            gifUrl: `${IMAGE_BASE}/${match.gif_url}`,
          },
        });
        matched++;
      }
    }
    console.log(`Matched ${matched}/${exercises.length} exercises with images.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
