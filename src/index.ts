import { fillPlaceKey, getBlightViolationAddress, getPropertySaleAddress } from './fill';
import { mergeSalesViolations } from './merge';
import { BlightViolation, PropertySale, ResolutionConflict } from './type';
import { readJsonFile, writeGeoJsonFile, writeSimpleJsonFile } from './util';

const violationRawFile = 'data/Blight_Violations-2024-02-01.geojson';
// const violationRawFile = 'small-data/Blight_Violations-small.geojson';
const violationProcessedFile = 'data/Blight_Violations-processed-2024-02-01.geojson';

const saleRawFile = 'data/Property_Sales-2024-02-01.geojson';
// const saleRawFile = 'small-data/Property_Sales-small.geojson';
const saleProcessedFile = 'data/Property_Sales-processed-2024-02-01.geojson';

async function merge() {
  const performFill = true;

  const violationFile = performFill ? violationRawFile : violationProcessedFile;
  const saleFile = performFill ? saleRawFile : saleProcessedFile;

  const conflicts: ResolutionConflict[] = [];

  function addPlaceKeyConflict(conflict: ResolutionConflict) {
    conflicts.push(conflict);
  }

  let sales = await readJsonFile<PropertySale>(saleFile);
  console.log(`Read ${sales.features.length.toLocaleString()} sales records.`);

  if (performFill) {
    sales = await fillPlaceKey(sales, {
      getAddress: getPropertySaleAddress,
      addPlaceKeyConflict
    });
    console.log(`Filled ${sales.features.length.toLocaleString()} records.`);
    await writeGeoJsonFile(saleProcessedFile, sales);
  }

  let violations = await readJsonFile<BlightViolation>(violationFile);
  console.log(`Read ${violations.features.length.toLocaleString()} violation records.`);
  if (performFill) {
    violations = await fillPlaceKey(violations, {
      getAddress: getBlightViolationAddress,
      addPlaceKeyConflict
    });
    console.log(`Filled ${violations.features.length.toLocaleString()} records.`);
    await writeGeoJsonFile(violationProcessedFile, violations);
  }

  if (performFill && conflicts.length > 0) {
    console.log(`Found ${conflicts.length} conflicts.`);
    writeSimpleJsonFile('data/conflicts.json', conflicts);
  }

  const merged = mergeSalesViolations(sales, violations);
  console.log(`Merged ${merged.features.length.toLocaleString()} records.`);

  await writeGeoJsonFile('data/merged-by-placekey.geojson', merged);
}

merge()
  .then(() => console.log('done'))
  .catch(console.error);
