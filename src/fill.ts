import { Placekey } from '@placekey/placekey';
import { FeatureCollection, Point } from 'geojson';
import { getAddressPlaceKey } from './api';
import { Address, BlightViolationProps, MaybePlaceKey, PropertySaleProps } from './type';
import { getPlaceKeyFromPoint, nextAddressId } from './util';

export function choosePlacekey(addressKey: Placekey, latLongKey?: Placekey): Placekey {
  if (latLongKey == null || latLongKey === addressKey) {
    return addressKey;
  }

  const [addressWhat, addressWhere] = addressKey.split('@');
  const [latLongWhat, latLongWhere] = latLongKey.split('@');

  // Address should fall in the long/lat indicated location
  // If it is different, that means the key is not accurate
  // Thus latLongKey is more accurate
  if (addressWhere === latLongWhere) {
    return addressKey;
  }

  return latLongKey;
}

export function getPropertySaleAddress(props: PropertySaleProps): Address {
  const streetAddress = !!props.address
    ? props.address
    : [props.street_number, props.street_name, props.street_prefix].filter((p) => !!p).join(' ');
  return {
    id: nextAddressId(),
    streetAddress,
    city: 'Detroit',
    region: 'MI',
    county: 'US'
  };
}

export function getBlightViolationAddress(props: BlightViolationProps): Address {
  const streetAddress = !!props.violation_address
    ? props.violation_address
    : [props.violation_street_number, props.violation_street_name].filter((p) => !!p).join(' ');

  let city = 'Detroit';
  if (props.city != null && props.city.toUpperCase() !== 'DET') {
    city = props.city;
  }

  return {
    id: nextAddressId(),
    streetAddress,
    city: 'Detroit',
    region: 'MI',
    county: 'US',
    zip: props.zip_code
  };
}

export async function fillPropertySalePlaceKey(
  sales: FeatureCollection<Point, MaybePlaceKey<PropertySaleProps>>
): Promise<FeatureCollection<Point, MaybePlaceKey<PropertySaleProps>>> {
  return fillPlaceKey(sales, {
    getAddress: getPropertySaleAddress
  });
}

export async function fillBlightViolationPlaceKey(
  violations: FeatureCollection<Point, MaybePlaceKey<BlightViolationProps>>
): Promise<FeatureCollection<Point, MaybePlaceKey<BlightViolationProps>>> {
  return fillPlaceKey(violations, {
    getAddress: getBlightViolationAddress
  });
}

export async function fillPlaceKey<T>(
  geo: FeatureCollection<Point, MaybePlaceKey<T>>,
  option: {
    getAddress: (props: T) => Address;
  }
): Promise<FeatureCollection<Point, MaybePlaceKey<T>>> {
  const len = geo.features.length;
  for (let i = 0; i < len; i++) {
    const feature = geo.features[i];
    if (feature.properties.placeKey != null) {
      continue;
    }

    let latLongKey: Placekey | undefined;
    if (feature.geometry != null) {
      latLongKey = getPlaceKeyFromPoint(feature.geometry);
    }
    const address = option.getAddress(feature.properties);
    const addressKey = await getAddressPlaceKey(address);
    const placeKey = choosePlacekey(addressKey, latLongKey);

    feature.properties.placeKey = placeKey;
  }
  return geo;
}
