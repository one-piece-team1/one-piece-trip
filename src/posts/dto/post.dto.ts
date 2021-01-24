import { IsIn, IsOptional, IsString, IsUUID } from 'class-validator';
import * as ITrip from '../../interfaces';
import * as ETrip from '../../enums';

export class CreatePostDto {
  @IsString()
  content: string;

  @IsIn([ETrip.ETripView.SELF, ETrip.ETripView.PUBLIC, ETrip.ETripView.FRIEND])
  publicStatus: ETrip.ETripView;

  @IsUUID()
  tripId: string;

  @IsUUID()
  publisherId: string;

  @IsOptional()
  files?: ITrip.BufferedFile[];
}
