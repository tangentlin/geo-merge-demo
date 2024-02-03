import { Placekey, geoToPlacekey } from '@placekey/placekey';
import { createParseStream } from 'big-json';
import { ReadStream, createReadStream, createWriteStream, existsSync, unlinkSync } from 'fs';
import { FeatureCollection, Point } from 'geojson';
import memoize from 'micro-memoize';

export async function readJsonFile<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const readStream: ReadStream = createReadStream(path);
    const parseStream = createParseStream();

    parseStream.on('data', (data: T) => {
      resolve(data);
    });

    // @ts-expect-error
    readStream.pipe(parseStream).on('error', reject);
  });
}

export function stringify(data: any): string {
  return JSON.stringify(data, null, 2);
}

export async function writeGeoJsonFile<T>(path: string, data: FeatureCollection<Point, T>): Promise<void> {
  if (existsSync(path)) {
    unlinkSync(path);
  }

  const withoutFeature: Omit<FeatureCollection<Point, T>, 'features'> = {
    type: data.type,
    bbox: data.bbox
  };

  const rootJson = stringify(withoutFeature);

  const writeStream = createWriteStream(path, { flags: 'a' });
  const rootJsonOpen = trimEnd(rootJson, '}').trim();
  writeStream.write(rootJsonOpen);

  writeStream.write(',\n  "features": [\n');
  for (let i = 0; i < data.features.length; i++) {
    const feature = data.features[i];
    const featureJson = JSON.stringify(feature);
    writeStream.write(`    ${featureJson}`);
    if (i < data.features.length - 1) {
      writeStream.write(',');
    }
    writeStream.write('\n');
  }

  writeStream.write('  ]\n');
  writeStream.write('}');
}

export function chunkArray<T>(array: readonly T[], size: number): T[][] {
  // Validate chunk size
  if (size <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    // Push a slice of the original array of the specified size into the result array
    result.push(array.slice(i, i + size));
  }
  return result;
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function trimStart(s: string, character: string, maxOccurrence: number = 1): string {
  let result = s.trimStart();
  let count = 0;
  while ((result.startsWith(character), count < maxOccurrence)) {
    result = result.slice(1);
    result = result.trimStart();
    count++;
  }
  return result;
}

export function trimEnd(s: string, character: string, maxOccurrence: number = 1): string {
  let result = s.trimEnd();
  let count = 0;
  while ((result.endsWith(character), count < maxOccurrence)) {
    result = result.slice(0, -1);
    result = result.trimEnd();
    count++;
  }
  return result;
}

let addressId = 0;
export function nextAddressId(): string {
  addressId++;
  return addressId.toString();
}

export const getPLaceKey = memoize(geoToPlacekey);

export function getPlaceKeyFromPoint(point: Point): Placekey {
  return getPLaceKey(point.coordinates[0], point.coordinates[1]);
}
