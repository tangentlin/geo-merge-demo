import { Placekey } from '@placekey/placekey';
import axios from 'axios';
import { PlaceKeyApiKey } from './secret';
import { Address, PlaceBulkItem } from './type';
import { chunkArray, sleep } from './util';

const bulkSize = 100;
const maxCallsPerMinute = 99; // Use 500 instead of 1000 to be safe
const pauseMsBetweenBatches = 60 * 1000;

export interface RateLimitCallOption {
  /**
   * The maximum number of calls allowed per minute.
   */
  limit: number;

  /**
   * The time interval in milliseconds to wait between batches.
   */
  interval: number;
}

export async function getAddressPlaceKeyBulk(addresses: readonly Address[]): Promise<Placekey[]> {
  const placekeys: Placekey[] = [];
  const chunks = chunkArray(addresses, bulkSize);
  console.log(`Processing ${addresses.length} addresses in ${chunks.length} chunks.`);
  const result: PlaceBulkItem[][] = await sequentialProcessArrayWithRateLimit(chunks, callPlaceKey, {
    limit: maxCallsPerMinute,
    interval: pauseMsBetweenBatches
  });
  const flatResult: Map<string, Placekey> = new Map(result.flat().map((item) => [item.query_id, item.placekey]));
  for (const address of addresses) {
    const placekey = flatResult.get(address.id);
    if (placekey) {
      placekeys.push(placekey);
    }
  }
  return placekeys;
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

/**
 * Process data by making parallel calls within a rate limit,
 * waiting between batches to respect the rate limit.
 *
 * However, this function is not used in the final implementation due
 * to a possible bug that the Placekey API returns 429 errors even with
 * fewer than 10 parallel requests.
 *
 * @param dataArray
 * @param processFunction
 * @param options
 * @returns
 */
export async function parallelProcessArrayWithRateLimit<T, R>(
  dataArray: T[],
  processFunction: (dataItem: T) => Promise<R>,
  options: RateLimitCallOption
): Promise<R[]> {
  const { limit, interval } = options;
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
        await sleep(interval);
      }
    } catch (error) {
      console.error(`Error processing batch ${index + 1}:`, error);
      // Handle partial batch failure if needed
      // Depending on requirements, you might want to retry failed items or simply continue to the next batch
    }
  }

  return results;
}

/**
 * Make sequential calls to process data within a rate limit,
 * waiting between calls to respect the rate limit.
 *
 * @param dataArray
 * @param processFunction
 * @param options
 * @returns
 */
export async function sequentialProcessArrayWithRateLimit<T, R>(
  dataArray: T[],
  processFunction: (dataItem: T) => Promise<R>,
  options: RateLimitCallOption
): Promise<R[]> {
  const { limit, interval } = options;
  const results: R[] = [];
  let counter = 0;

  for (const item of dataArray) {
    // Check if the limit is reached
    if (counter >= limit) {
      console.log(`Rate limit reached, waiting for ${interval / 1000} seconds.`);
      await sleep(interval);
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
