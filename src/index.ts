import { mergeSalesViolations } from './merge';
import { BlightViolation, PropertySale } from './type';
import { readJsonFile, writeJsonFile } from './util';

const violationFile = 'data/Blight_Violations-2024-01-26.geojson';
const saleFile = 'data/Property_Sales-2024-01-06.geojson';

// Strategy
// First pass: Naive
// 1. Go through each line of data, resolve per geometry to Plaekey
// 2. Merge data into a single object
//
// Second pass: thorough
// 1. Go through each line of data, resolve both geometry and address to Plaekeys, compare two placekeys
// 2. If the placekey are the same, great
// 3. Otherwise, log the error and move on

/**
 * Discoveries
 *
 * Average sales price correlation to violations
 * Number of sales correlation to violations
 * Violations per location
 * Sales price per location
 * Violations per time
 *
 */

async function merge() {
  const sales = await readJsonFile<PropertySale>(saleFile);
  console.log(`Read ${sales.features.length.toLocaleString()} sales records.`);

  const violations = await readJsonFile<BlightViolation>(violationFile);
  console.log(`Read ${violations.features.length.toLocaleString()} violation records.`);

  const merged = mergeSalesViolations(sales, violations);
  console.log(`Merged ${merged.features.length.toLocaleString()} records.`);

  await writeJsonFile('data/merged.geojson', merged);
}

merge()
  .then(() => console.log('done'))
  .catch(console.error);
