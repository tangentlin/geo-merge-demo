import { Placekey } from '@placekey/placekey';
import { Feature, FeatureCollection, Point } from 'geojson';
import {
  BlightViolation,
  BlightViolationProps,
  Merged,
  MergedProps,
  PropertySale,
  PropertySaleProps,
  WithPlaceKey
} from './type';

export function newSalesViolationProps(feature: Feature<Point, WithPlaceKey<any>>): MergedProps {
  return {
    placeKey: feature.properties.placeKey,
    violations: [],
    sales: []
  };
}

export function appendViolation(merge: MergedProps, props: BlightViolationProps): void {
  merge.violations.push(props);
}

export function appendSale(merge: MergedProps, props: PropertySaleProps): void {
  merge.sales.push(props);
}

export function mergeSalesViolations(sales: PropertySale, violations: BlightViolation): Merged {
  const skippedData = [];
  // @ts-ignore
  const merged = mergeGeo(sales, violations, {
    newMergeProps: newSalesViolationProps,
    appendProp1: appendSale,
    appendProp2: appendViolation,
    onSkipped: (data, index) => {
      skippedData.push(data);
    }
  });

  if (skippedData.length > 0) {
    console.log(`Skipped ${skippedData.length.toLocaleString()} records.`);
    console.log(`Sample skipped data: ${JSON.stringify(skippedData[0], null, 2)}`);
  }

  return merged;
}

/**
 * Merge two feature collections into a single feature collection.
 * @param geo1
 * @param geo2
 * @param option
 * @returns
 */
export function mergeGeo<T1, T2, MergeT>(
  geo1: FeatureCollection<Point, WithPlaceKey<T1>>,
  geo2: FeatureCollection<Point, WithPlaceKey<T2>>,
  option: {
    newMergeProps: (feature: Feature<Point, WithPlaceKey<T1 | T2>>) => MergeT;
    appendProp1: (merge: MergeT, props: T1) => void;
    appendProp2: (merge: MergeT, props: T2) => void;
    onSkipped?: (data: any, index) => void;
  }
): FeatureCollection<Point, MergeT> {
  const merged = new Map<Placekey, Feature<Point, MergeT>>();
  indexGeo(geo1, merged, {
    newMergeProps: option.newMergeProps,
    append: option.appendProp1,
    onSkipped: option.onSkipped
  });

  indexGeo(geo2, merged, {
    newMergeProps: option.newMergeProps,
    append: option.appendProp2,
    onSkipped: option.onSkipped
  });

  return {
    type: 'FeatureCollection',
    features: Array.from(merged.values())
  };
}

export function indexGeo<T, MergeT>(
  geo: FeatureCollection<Point, WithPlaceKey<T>>,
  index: Map<Placekey, Feature<Point, MergeT>>,
  option: {
    newMergeProps: (point: Feature<Point, WithPlaceKey<T>>) => MergeT;
    append: (merge: MergeT, props: T) => void;
    onSkipped?: (data: any, index) => void;
  }
): void {
  const len = geo.features.length;
  for (let i = 0; i < len; i++) {
    const feature = geo.features[i];
    if (!feature.properties.placeKey) {
      option.onSkipped?.(feature, i);
      continue;
    }
    const placeKey = feature.properties.placeKey;
    let merged: MergeT | undefined = index.get(placeKey)?.properties;
    if (!merged) {
      merged = option.newMergeProps(feature);
      const mergedFeature: Feature<Point, MergeT> = {
        type: 'Feature',
        geometry: feature.geometry,
        properties: merged
      };
      index.set(placeKey, mergedFeature);
    }
    option.append(merged, feature.properties);
  }
}
