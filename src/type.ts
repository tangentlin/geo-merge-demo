import { FeatureCollection, Point } from 'geojson';

export interface PropertySaleProps {
  sale_id: number;
  parcel_number: string;
  street_number: string;
  street_prefix: string;
  street_name: string;
  unit_number: string;
  sale_number: string;
  sale_date: string;
  sale_price: number;
  grantor: string;
  grantee: string;
  liber_page: string;
  term_of_sale: string;
  sale_verification: string;
  sale_instrument: string;
  property_transferred_percentage: number;
  property_class_code: string;
  economic_condition_factor_neigh: string;
  ESRI_OID: number;
  address?: string;
}

export interface BlightViolationProps {
  ticket_id: number;
  ticket_number: string;
  agency_name: string;
  inspector_name: string;
  violator_name: string;
  violation_street_number: number;
  violation_street_name: string;
  violation_address: string;
  violation_zip_code: number | null;
  violator_id: number;
  mailing_address_street_number: string;
  mailing_address_street_name: string;
  mailing_address: string;
  city: string;
  state: string;
  zip_code: string;
  non_us_str_code: string | null;
  country: string | null;
  violation_date: string;
  ticket_issued_time: string;
  hearing_date: string;
  hearing_time: string;
  judgment_date: string;
  ordinance_law: string;
  ordinance_description: string;
  disposition: string;
  fine_amount: number;
  admin_fee: number;
  state_fee: number;
  late_fee: number;
  discount_amount: number;
  clean_up_cost: number | null;
  judgment_amount: number;
  payment_amount: number;
  balance_due: number;
  payment_date: string | null;
  payment_status: string;
  collection_status: string | null;
  parcelno: string;
  address_id: number;
  updated_at: string;
}

export type PropertySale = FeatureCollection<Point, PropertySaleProps>;
export type BlightViolation = FeatureCollection<Point, BlightViolationProps>;

export interface MergedProps {
  placeKey: string;
  violations: BlightViolationProps[];
  sales: PropertySaleProps[];
}

export type Merged = FeatureCollection<Point, MergedProps>;

/**
 * Reason for failure and the properties of the feature that failed.
 */
export interface Failed<T> {
  reason: string;
  properties: T;
  geometry: Point;
  featureIndex: number;
}
