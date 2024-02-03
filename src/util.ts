import { createParseStream, createStringifyStream } from 'big-json';
import { ReadStream, createReadStream, createWriteStream, existsSync, unlinkSync } from 'fs';

export async function readJsonFile<T>(path: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const readStream: ReadStream = createReadStream(path);
    const parseStream = createParseStream();

    parseStream.on('data', (data: T) => {
      console.log('end ---');
      resolve(data);
    });

    // @ts-expect-error
    readStream.pipe(parseStream).on('error', reject);
  });
}

export async function writeJsonFile<T extends object>(path: string, data: T): Promise<void> {
  if (existsSync(path)) {
    unlinkSync(path);
  }
  return new Promise((resolve, reject) => {
    const writeStream = createWriteStream(path, { flags: 'a' });
    const stringifyStream = createStringifyStream({
      body: data
    });

    stringifyStream
      .pipe(writeStream)
      .on('error', reject)
      .on('data', (chunk: string) => {
        console.log(`Written ${chunk.length.toLocaleString()} bytes.`);
        writeStream.write(chunk);
      })
      .on('end', () => {
        writeStream.end(() => {
          writeStream.close();
          resolve();
        });
      })
      .on('end', () => {
        writeStream.end(() => {
          writeStream.close();
          resolve();
        });
      });
  });
}
