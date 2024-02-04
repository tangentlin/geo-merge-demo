# Merge Data with Placekey Demo

This demo showcases how to merge datasets using Placekey, focusing on GeoJSON data from Detroit's Blight Violations and Property Sales. Ensure you have NodeJS version 18 or later installed before proceeding.

## One-time Setup

Follow these steps to set up the environment and prepare the data for merging:

1. **Install pnpm**: Run `npm install -g pnpm` in your terminal to install pnpm globally.
2. **Install dependencies**: Navigate to your project directory and execute `pnpm install` to install all required dependencies.
3. **Prepare the data directory**: Create a directory named `data` at the same level as `src` and `small-data` directories in your project structure.
4. **Download GeoJSON data**:
   - Blight Violations: Download the GeoJSON file from [Blight Violations](https://data.detroitmi.gov/datasets/detroitmi::blight-violations/explore?location=42.352732%2C-83.099290%2C11.91).
   - Property Sales: Download the GeoJSON file from [Property Sales](https://data.detroitmi.gov/datasets/detroitmi::property-sales-1/explore?location=42.352683%2C-83.099546%2C11.91).
   - Place both GeoJSON files in the `data` folder you created.
5. **Configure Placekey API key**: Inside the `src` folder, create a file named `secret.ts`. Insert your Placekey API key as shown below:

```typescript
// src/secret.ts
export const PlaceKeyApiKey = '<your_placekey_api_key_here>';
```

## Running the Demo

To execute the demo and merge the datasets:

1. Open the file `src/index.ts`.
2. Modify the paths to the Property Sales and Blight Violation GeoJSON files accordingly. The relevant variables end with `RawFile`.
3. Execute `pnpm go` in your terminal to run the demo. The process is expected to take approximately 8 hours.
4. Upon completion, the `data` directory will contain the merged results:
   - `merged-by-placekey.geojson` will have the merged data.
   - `discrepancy-list.json` will detail locations where discrepancies between address-derived and coordinate-derived Placekeys were found.
