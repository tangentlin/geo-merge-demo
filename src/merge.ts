import { Placekey, geoToPlacekey } from '@placekey/placekey';
import { Feature, FeatureCollection, Point } from 'geojson';
import memoize from 'micro-memoize';
import { BlightViolation, BlightViolationProps, Merged, MergedProps, PropertySale, PropertySaleProps } from './type';

export function newSalesViolationProps(point: Point): MergedProps {
  return {
    placeKey: getPlaceKeyFromPoint(point),
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
  return mergeGeo(sales, violations, {
    newMergeProps: newSalesViolationProps,
    appendProp1: appendSale,
    appendProp2: appendViolation
  });
}

/**
 * Merge two feature collections into a single feature collection.
 * @param geo1
 * @param geo2
 * @param option
 * @returns
 */
export function mergeGeo<T1, T2, MergeT>(
  geo1: FeatureCollection<Point, T1>,
  geo2: FeatureCollection<Point, T2>,
  option: {
    newMergeProps: (point: Point) => MergeT;
    appendProp1: (merge: MergeT, props: T1) => void;
    appendProp2: (merge: MergeT, props: T2) => void;
  }
): FeatureCollection<Point, MergeT> {
  const merged = new Map<Placekey, Feature<Point, MergeT>>();
  indexGeo(geo1, merged, {
    newMergeProps: option.newMergeProps,
    append: option.appendProp1
  });

  indexGeo(geo2, merged, {
    newMergeProps: option.newMergeProps,
    append: option.appendProp2
  });

  return {
    type: 'FeatureCollection',
    features: Array.from(merged.values())
  };
}

export function indexGeo<T, MergeT>(
  geo: FeatureCollection<Point, T>,
  index: Map<Placekey, Feature<Point, MergeT>>,
  option: {
    newMergeProps: (point: Point) => MergeT;
    append: (merge: MergeT, props: T) => void;
  }
): void {
  for (const feature of geo.features) {
    const placeKey = getPlaceKeyFromPoint(feature.geometry);
    let merged: MergeT | undefined = index.get(placeKey)?.properties;
    if (!merged) {
      merged = option.newMergeProps(feature.geometry);
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

export const getPLaceKey = memoize(geoToPlacekey);

export function getPlaceKeyFromPoint(point: Point): Placekey {
  return getPLaceKey(point.coordinates[0], point.coordinates[1]);
}
