const violationFile = 'Blight_Violations-2024-01-26.geojson';
const saleFile = 'Property_Sales-2024-01-06.geojson';

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
