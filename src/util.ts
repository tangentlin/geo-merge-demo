import fs from 'fs';

export function readJsonFile<T>(path: string): T {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}
