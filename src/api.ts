import { Placekey } from '@placekey/placekey';
import DataLoader from 'dataloader';
import { Address } from './type';
import { chunkArray } from './util';

const bulkSize = 100;
const maxCallsPerMinute = 1000;
const pauseMsBetweenBatches = 60 * 1000;

export async function getAddressPlaceKeyBulk(addresses: readonly Address[]): Promise<Placekey[]> {
  const placekeys: Placekey[] = [];
  const chunks = chunkArray(addresses, bulkSize);
  for (const chunk of chunks) {
    const promises = chunk.map(async (address) => {
      return getAddressPlaceKey(address);
    });
    const results = await Promise.all(promises);
    placekeys.push(...results);
    await new Promise((resolve) => setTimeout(resolve, pauseMsBetweenBatches));
  }
  return placekeys;
}

const getAddressPlaceKeyLoader = new DataLoader(getAddressPlaceKeyBulk);

export async function getAddressPlaceKey(address: Address): Promise<Placekey> {
  return getAddressPlaceKeyLoader.load(address);
}
