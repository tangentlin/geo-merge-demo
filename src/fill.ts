import { Placekey } from '@placekey/placekey';
import { FeatureCollection, Point } from 'geojson';
import { getAddressPlaceKeyBulk } from './api';
import {
  Address,
  BlightViolationProps,
  MaybePlaceKey,
  PropertySaleProps,
  ResolutionConflict,
  WithPlaceKey
} from './type';
import { getPlaceKeyFromPoint, nextAddressId } from './util';

export function choosePlacekey(
  addressKey: Placekey,
  address: Address,
  latLongKey: Placekey | undefined,
  point: Point | undefined,
  addPlaceKeyConflict: (conflict: ResolutionConflict) => void
): Placekey {
  if (point == null || latLongKey == null || latLongKey === addressKey) {
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

  const conflict: ResolutionConflict = {
    addressKey,
    addressWhere: `@${addressWhere}`,
    address,
    latLongWhere: `@${latLongWhere}`,
    latLong: {
      latitude: point.coordinates[1],
      longitude: point.coordinates[0]
    }
  };
  addPlaceKeyConflict(conflict);

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

export async function fillPlaceKey<T>(
  geo: FeatureCollection<Point, MaybePlaceKey<T>>,
  option: {
    getAddress: (props: T) => Address;
    addPlaceKeyConflict: (conflict: ResolutionConflict) => void;
  }
): Promise<FeatureCollection<Point, WithPlaceKey<T>>> {
  const len = geo.features.length;
  const addresses: Address[] = [];
  for (let i = 0; i < len; i++) {
    const feature = geo.features[i];
    const address = option.getAddress(feature.properties);
    addresses.push(address);
  }
  const addressKeys = await getAddressPlaceKeyBulk(addresses);

  for (let i = 0; i < len; i++) {
    const feature = geo.features[i];
    if (feature.properties.placeKey != null) {
      continue;
    }

    let latLongKey: Placekey | undefined;
    if (feature.geometry != null) {
      latLongKey = getPlaceKeyFromPoint(feature.geometry);
    }
    const addressKey = addressKeys[i];
    const address = addresses[i];
    const placeKey = choosePlacekey(addressKey, address, latLongKey, feature.geometry, option.addPlaceKeyConflict);

    feature.properties.placeKey = placeKey;
  }
  return geo as FeatureCollection<Point, WithPlaceKey<T>>;
}
