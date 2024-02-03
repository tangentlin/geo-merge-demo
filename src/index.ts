import { mergeSalesViolations } from './merge';
import { BlightViolation, PropertySale } from './type';
import { readJsonFile, writeGeoJsonFile } from './util';

const violationFile = 'data/Blight_Violations-2024-01-26.geojson';
const saleFile = 'data/Property_Sales-2024-01-06.geojson';

async function merge() {
  if (1 > 0) {
    const sales = await readJsonFile<PropertySale>(saleFile);
    console.log(`Read ${sales.features.length.toLocaleString()} sales records.`);

    const violations = await readJsonFile<BlightViolation>(violationFile);
    console.log(`Read ${violations.features.length.toLocaleString()} violation records.`);

    const merged = mergeSalesViolations(sales, violations);
    console.log(`Merged ${merged.features.length.toLocaleString()} records.`);

    await writeGeoJsonFile('data/merged.geojson', merged);
  }
}

merge()
  .then(() => console.log('done'))
  .catch(console.error);
