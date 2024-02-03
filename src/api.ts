import { Placekey } from '@placekey/placekey';
import axios from 'axios';
import DataLoader from 'dataloader';
import { PlaceKeyApiKey } from './secret';
import { Address, PlaceBulkItem } from './type';
import { chunkArray } from './util';

const bulkSize = 100;
const maxCallsPerMinute = 1000;
const pauseMsBetweenBatches = 60 * 1000;

export async function getAddressPlaceKeyBulk(addresses: readonly Address[]): Promise<Placekey[]> {
  const placekeys: Placekey[] = [];
  const chunks = chunkArray(addresses, bulkSize);
  console.log(`Processing ${addresses.length} addresses in ${chunks.length} chunks.`);
  const result: PlaceBulkItem[][] = await parallelProcessArrayWithRateLimit(
    chunks,
    callPlaceKey,
    maxCallsPerMinute,
    pauseMsBetweenBatches
  );
  const flatResult: Map<string, Placekey> = new Map(result.flat().map((item) => [item.query_id, item.placekey]));
  for (const address of addresses) {
    const placekey = flatResult.get(address.id);
    if (placekey) {
      placekeys.push(placekey);
    }
  }
  return placekeys;
}

const getAddressPlaceKeyLoader = new DataLoader(getAddressPlaceKeyBulk, {
  batchScheduleFn: (callback) => {
    setTimeout(callback, 2500);
  }
});

export async function getAddressPlaceKey(address: Address): Promise<Placekey> {
  return getAddressPlaceKeyLoader.load(address);
}

export function callPlaceKey(addresses: readonly Address[]): Promise<PlaceBulkItem[]> {
  const data = addresses.map((address) => {
    const result = {
      query_id: address.id,
      street_address: address.streetAddress,
      city: address.city,
      region: address.region,
      postal_code: address.zip,
      iso_country_code: address.county
    };
    return result;
  });

  const payload = {
    queries: data
  };

  return axios
    .post<PlaceBulkItem[]>('https://api.placekey.io/v1/placekeys', JSON.stringify(payload), {
      headers: {
        apikey: `${PlaceKeyApiKey}`,
        'Content-Type': 'application/json'
      }
    })
    .then((response) => response.data);
}

export async function parallelProcessArrayWithRateLimit<T, R>(
  dataArray: T[],
  processFunction: (dataItem: T) => Promise<R>,
  limit: number = 1000,
  interval: number = 60000 // 60000 milliseconds = 1 minute
): Promise<R[]> {
  let results: R[] = [];
  let batches: Promise<R>[][] = [];

  // Split data into batches according to the rate limit
  for (let i = 0; i < dataArray.length; i += limit) {
    const batch = dataArray.slice(i, i + limit).map((item) => processFunction(item));
    batches.push(batch);
  }

  // Process each batch
  for (const [index, batch] of batches.entries()) {
    try {
      const batchResults = await Promise.all(batch);
      results = [...results, ...batchResults];
      console.log(`Batch ${index + 1} processed.`);

      // Wait between batches but not after the last one
      if (index < batches.length - 1) {
        console.log(`Waiting for ${interval / 1000} seconds to respect the rate limit.`);
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    } catch (error) {
      console.error(`Error processing batch ${index + 1}:`, error);
      // Handle partial batch failure if needed
      // Depending on requirements, you might want to retry failed items or simply continue to the next batch
    }
  }

  return results;
}

export async function sequentialProcessArrayWithRateLimit<T, R>(
  dataArray: T[],
  processFunction: (dataItem: T) => Promise<R>,
  limit: number = 1000,
  interval: number = 60000 // 60000 milliseconds = 1 minute
): Promise<R[]> {
  const results: R[] = [];
  let counter = 0;

  for (const item of dataArray) {
    // Check if the limit is reached
    if (counter >= limit) {
      console.log(`Rate limit reached, waiting for ${interval / 1000} seconds.`);
      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for the specified interval
      counter = 0; // Reset the counter after waiting
    }

    try {
      const result = await processFunction(item);
      results.push(result);
      counter++;
    } catch (error) {
      console.error(`Error processing item: ${error}`);
      // Optionally, push a default value or handle the error as needed
      // results.push(defaultValue);
    }
  }

  return results;
}
