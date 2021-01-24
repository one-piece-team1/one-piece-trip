import { Controller, Get, SetMetadata, UseGuards, Post, UseInterceptors, Request, Body, ValidationPipe, Param, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'guards/local-guard';
import { CurrentUser } from '../strategy';
import { PostService } from './post.service';
import * as Euser from '../enums';
import * as ITrip from '../interfaces';
import { CreatePostDto } from './dto';
import { EUserRole } from '../enums';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/usertest')
  @SetMetadata('roles', [Euser.EUserRole.USER])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getRequestTest(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload) {
    return this.postService.getRequestTest();
  }

  @Post('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  createPost(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Body(ValidationPipe) createPostDto: CreatePostDto) {
    return this.postService.createPost(user, createPostDto);
  }

  @Get('/:postId')
  @SetMetadata('roles', [Euser.EUserRole.ADMIN, EUserRole.USER])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getPostById(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Param('postId', ParseUUIDPipe) postId: string) {
    return this.postService.getPostById(user, postId);
  }
}
