import { IsArray, IsIn, IsOptional, IsString } from 'class-validator';
import * as ELocation from '../../enums';

export class CreateTurnDto {
  @IsIn([ELocation.ELocationType.TURN])
  type: ELocation.ELocationType;

  @IsArray()
  coordinates: number[];
}

export class SearchForPlanStartandEndPointDto {
  @IsString()
  startLocationName: string;

  @IsString()
  endLocationName: string;

  @IsOptional()
  type?: ELocation.EPlanType;
}
