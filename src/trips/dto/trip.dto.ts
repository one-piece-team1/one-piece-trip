import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import * as ETrip from '../../enums';

export class CreateTripDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsUUID()
  publisherId: string;

  @IsString()
  startPointName: string;

  @IsString()
  endPointName: string;

  @IsIn([ETrip.ETripView.SELF, ETrip.ETripView.PUBLIC, ETrip.ETripView.FRIEND])
  publicStatus: ETrip.ETripView;

  @IsOptional()
  companyName?: string;

  @IsOptional()
  shipNumber?: string;
}
