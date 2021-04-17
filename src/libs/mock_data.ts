import { v4 as uuidv4 } from 'uuid';
import * as EShare from '../enums';
import * as IShare from '../interfaces';

export function MockGenerateRoutesAsText(): IShare.INetworkGeometryResponse[] {
  return [
    {
      id: 2265,
      name: 'a625nghvhpzn',
      geom: '0102000020E610000002000000FB8FFB3F4F551AC07DC908A0FFDF484000000000000016C051B2072056554840',
      srid: '0102000020E610000002000000FB8FFB3F4F551AC07DC908A0FFDF484000000000000016C051B2072056554840',
      length: 1.532,
      fromnode: 3555,
      tonode: 4771,
      version: 1,
      createdAt: '2021-04-14T14:31:03.211Z',
      updatedAt: '2021-04-14T14:31:03.211Z',
      seq: '1',
      path_seq: 1,
      node: '3555',
      edge: '2271',
      cost: 13.425,
      agg_cost: 0,
      route_legnth: 1.532023107881831,
      l_str: 'LINESTRING(-6.583310127 49.74998856,-5.5 48.66669083)',
      lineString: {
        type: 'LineString',
        coordinates: [
          [-6.583310127, 49.74998856],
          [-5.5, 48.66669083],
        ],
      },
    },
  ];
}

export function MockGenerateRoutesAsLine(): IShare.INetworkGeometryResponse[] {
  return [
    {
      l_str: '0102000020E610000017000000FB8FFB3F4F551AC07DC908A0FFDF484000000000000016C051B207205655484000000000000034C0A17C0760FFFF484005B0F99F999925C0FB4F066066A64940EEFC0DA000003EC0A17C0760FFFF484000000000000044C0A17C0760FFFF4840EEFC0DA000003EC0A17C0760FFFF484005B0F99F99594AC0FB4F0660666647400000000000404AC08279024099D9474005B0F99F99594AC0FB4F0660666647400000000000004BC009A3FE1FCC0C474005B0F99F99594AC0FB4F06606666474005B0F99F99194EC0A17C0760FFDF47401F03052066A64DC009A3FE1FCC0C47406EA60020008050C0A17C0760FFFF48404DFEFEFF056050C08DA9054026E548401B1000A0B32E51C0BAFF0220F25948403B520120FCB351C0FBA6FADF5B6A4740494E0560ECAA52C087D20760BD8046406D7FFCDF30D552C0B428054009674640760A03E069DF52C000C103A0DD5A464010A10040C40553C07A54FCDF911F46405C78FBFF7A1053C04C98FE5FD4184640',
      lineString: {
        type: 'LineString',
        coordinates: [],
      },
    },
  ];
}

export function MockCreateCountry() {
  return {
    id: uuidv4(),
    name: 'countrytest1',
    code: 'ct1',
  };
}

export function MockCreateLocation() {
  return {
    id: uuidv4(),
    point: {
      type: 'Point',
      coordinates: [113.416667, 23.083333],
    },
    pointSrid: {
      type: 'Point',
      coordinates: [113.416667, 23.083333],
    },
    lat: 23.083333,
    lon: 113.416667,
    type: EShare.ELocationType.PORT,
    locationName: 'locationName',
  };
}

export function MockCreateUser() {
  return {
    id: uuidv4(),
    username: 'unit-test1',
    email: 'unit-test1@gmail.com',
    expiredDate: new Date(),
  };
}

export function MockCreateTrip() {
  return {
    id: uuidv4(),
    startDate: new Date(),
    endDate: new Date('2050/01/01'),
    publicStatus: EShare.ETripView.PUBLIC,
    companyName: 'companyName',
    shipNumber: 'shipNumber',
    geom: {
      type: 'MultiLineString',
      coordinates: [],
    },
  };
}

export function MockCreatePost() {
  return {
    id: uuidv4(),
    content: 'test',
    image: 'https://test.com/test.png',
    publicStatus: EShare.ETripView.PUBLIC,
  };
}
