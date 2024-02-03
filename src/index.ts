import { getAddressPlaceKeyBulk } from './api';
import { mergeSalesViolations } from './merge';
import { Address, BlightViolation, PropertySale } from './type';
import { readJsonFile, writeGeoJsonFile } from './util';

const violationFile = 'data/Blight_Violations-2024-01-26.geojson';
const saleFile = 'data/Property_Sales-2024-01-06.geojson';

async function merge() {
  const addresses: Address[] = [
    {
      id: '3106',
      streetAddress: '3106 Sutherland Hill Ct.',
      city: 'Fairfax',
      region: 'VA',
      zip: '22031',
      county: 'US'
    },
    {
      id: '3110',
      streetAddress: '3110 Sutherland Hill Ct.',
      city: 'Fairfax',
      region: 'VA',
      zip: '22031',
      county: 'US'
    }
  ];

  const placeKeys = await getAddressPlaceKeyBulk(addresses);
  console.log(placeKeys);

  if (1 > 2) {
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
