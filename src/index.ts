import { fillBlightViolationPlaceKey, fillPropertySalePlaceKey } from './fill';
import { mergeSalesViolations } from './merge';
import { BlightViolation, PropertySale } from './type';
import { readJsonFile, writeGeoJsonFile } from './util';

const violationRawFile = 'data/Blight_Violations-2024-02-01.geojson';
const violationProcessedFile = 'data/Blight_Violations-processed-2024-02-01.geojson';

const saleRawFile = 'data/Property_Sales-2024-02-01.geojson';
const saleProcessedFile = 'data/Property_Sales-processed-2024-02-01.geojson';

async function merge() {
  const performFill = true;

  const violationFile = performFill ? violationRawFile : violationProcessedFile;
  const saleFile = performFill ? saleRawFile : saleProcessedFile;

  if (1 > 2) {
    let sales = await readJsonFile<PropertySale>(saleFile);
    console.log(`Read ${sales.features.length.toLocaleString()} sales records.`);

    if (performFill) {
      sales = await fillPropertySalePlaceKey(sales);
      console.log(`Filled ${sales.features.length.toLocaleString()} records.`);
      await writeGeoJsonFile(saleProcessedFile, sales);
    }

    let violations = await readJsonFile<BlightViolation>(violationFile);
    console.log(`Read ${violations.features.length.toLocaleString()} violation records.`);
    if (performFill) {
      violations = await fillBlightViolationPlaceKey(violations);
      console.log(`Filled ${violations.features.length.toLocaleString()} records.`);
      await writeGeoJsonFile(violationProcessedFile, violations);
    }

    const merged = mergeSalesViolations(sales, violations);
    console.log(`Merged ${merged.features.length.toLocaleString()} records.`);

    await writeGeoJsonFile('data/merged.geojson', merged);
  }
}

merge()
  .then(() => console.log('done'))
  .catch(console.error);
