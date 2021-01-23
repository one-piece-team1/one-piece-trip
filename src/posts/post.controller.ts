import { Controller, Get, SetMetadata, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'guards/local-guard';
import { CurrentUser } from '../strategy';
import { PostService } from './post.service';
import * as Euser from '../enums';
import * as ITrip from '../interfaces';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/usertest')
  @SetMetadata('roles', [Euser.EUserRole.USER])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getRequestTest(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload) {
    return this.postService.getRequestTest();
  }
}
