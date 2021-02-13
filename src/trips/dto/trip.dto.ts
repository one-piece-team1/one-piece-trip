import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import * as ETrip from '../../enums';

type TSort = 'ASC' | 'DESC';
export class TripBasicDto {
  @IsUUID()
  id: string;
}

export class TripPaging {
  @IsOptional()
  take?: number;

  @IsOptional()
  skip?: number;
}

export class TripSearch extends TripPaging {
  keyword?: string;
  sort?: TSort;
}

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

export class GetTripByIdDto extends TripBasicDto {
  @IsUUID()
  publisherId: string;
}

export class GetTripByPagingDto extends TripSearch {
  @IsUUID()
  publisherId: string;
}
