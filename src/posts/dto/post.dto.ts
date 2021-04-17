import { IsIn, IsNumber, IsNumberString, IsOptional, IsString, IsUUID } from 'class-validator';
import * as ITrip from '../../interfaces';
import * as ETrip from '../../enums';

type TSort = 'ASC' | 'DESC';

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

export class GetPostByIdDto {
  @IsUUID()
  postId: string;
}

export class PostPaging {
  @IsNumberString()
  @IsOptional()
  take: number;

  @IsNumberString()
  @IsOptional()
  skip: number;
}

export class PostSearchDto extends PostPaging {
  @IsString()
  @IsOptional()
  keyword: string;

  @IsOptional()
  sort: TSort;
}
