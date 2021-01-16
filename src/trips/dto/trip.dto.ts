import { IsDateString, IsIn, IsOptional, IsUUID } from 'class-validator';
import * as ETrip from '../../enums';

export class CreateTripDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsUUID()
  publisherId: string;

  @IsUUID()
  startPointId: string;

  @IsUUID()
  endPointId: string;

  @IsIn([ETrip.ETripView.SELF, ETrip.ETripView.PUBLIC, ETrip.ETripView.FRIEND])
  publicStatus: ETrip.ETripView;

  @IsOptional()
  companyName?: string;

  @IsOptional()
  shipNumber?: string;
}
