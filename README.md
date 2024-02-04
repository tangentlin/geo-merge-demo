# Merge data with Placekey Demo

To run this demo, you would need to have NodeJS 18 or later, please follow the steps below

## One-time installation

1. Install pnpm: `npm i -g pnpm`
2. Install dependencies: `pnpm install`
3. Create `data` in the same level as `src` and `small-data`
4. Download GeoJSON data from [Blight Violations](https://data.detroitmi.gov/datasets/detroitmi::blight-violations/explore?location=42.352732%2C-83.099290%2C11.91) and [Property Sales](https://data.detroitmi.gov/datasets/detroitmi::property-sales-1/explore?location=42.352683%2C-83.099546%2C11.91), and place the GeoJSON file in the data folder
5. Add PlaceKey API key: under `src` folder, create a file named `secret.ts`, and put your Placekey API key there, the content of the secret.ts should look like the following:

```ts
// src/secret.ts
export const PlaceKeyApiKey = '<your_placekey_api_key_here>';
```

## Run the demo code

1. Open `src/index.ts`
2. Adjust the path to both the Property Sales and Blight Violation files, the variable names are ended with `RawFile`
3. Run the demo with `pnpm go`
4. The process should take about 8 hours to run.
5. The end results are stored in the data folder.
   - `merged-by-placekey.geojson` consists of merged results
   - `discrepancy-list.json` consists of all the locations where two distinct placekeys are observed from address and coordinates.
