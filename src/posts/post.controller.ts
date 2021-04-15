import { Controller, Get, SetMetadata, UseGuards, Post, Body, ValidationPipe, Param, ParseUUIDPipe, Query, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../guards/local-guard';
import { CurrentUser } from '../strategy';
import { PostService } from './post.service';
import { CreatePostDto } from './dto';
import * as Euser from '../enums';
import * as ITrip from '../interfaces';
import { EUserRole } from '../enums';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getPosts(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Query(ValidationPipe) searchDto: ITrip.ISearch) {
    return this.postService.getPosts(user, searchDto);
  }

  @Get('/:postId')
  @SetMetadata('roles', [Euser.EUserRole.ADMIN, EUserRole.USER])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getPostById(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Param('postId', ParseUUIDPipe) postId: string) {
    return this.postService.getPostById(user, postId);
  }

  @Post('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  createPost(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Body(ValidationPipe) createPostDto: CreatePostDto) {
    return this.postService.createPost(user, createPostDto);
  }
}
