import { MultiLineString } from 'geojson';
import { User } from '../users/user.entity';
import { Location } from '../locations/relations';
import * as ETrip from '../enums';

export interface ICreateTrip {
  startDate: string;
  endDate: string;
  publisher: User;
  startPoint: Location;
  endPoint: Location;
  publicStatus: ETrip.ETripView;
  companyName?: string;
  shipNumber?: string;
  geom?: MultiLineString;
  [futureKey: string]: any;
}
