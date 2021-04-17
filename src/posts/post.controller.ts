import { Controller, Get, SetMetadata, UseGuards, Post, Body, ValidationPipe, Param, ParseUUIDPipe, Query, HttpException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from '../guards/local-guard';
import { CurrentUser } from '../strategy';
import { PostService } from './post.service';
import { Post as PostEntity } from './post.entity';
import { CreatePostDto, GetPostByIdDto } from './dto';
import * as Euser from '../enums';
import * as ITrip from '../interfaces';
import { EUserRole } from '../enums';

@Controller('posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  /**
   * @description Get posts by paging
   * @routes
   * @get
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {ITrip.ISearch} searchDto
   * @returns {Promise<ITrip.IResponseBase<ITrip.IPostPagingResponseBase<PostEntity[]>> | HttpException>}
   */
  @Get('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getPosts(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Query(ValidationPipe) searchDto: ITrip.ISearch): Promise<ITrip.IResponseBase<ITrip.IPostPagingResponseBase<PostEntity[]>> | HttpException> {
    return this.postService.getPosts(user, searchDto);
  }

  /**
   * @description Get post by id
   * @routes
   * @get
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {GetPostByIdDto} getPostByIdDto
   * @returns {Promise<ITrip.IResponseBase<PostEntity> | HttpException>}
   */
  @Get('/:postId')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  getPostById(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Param(ValidationPipe) getPostByIdDto: GetPostByIdDto): Promise<ITrip.IResponseBase<PostEntity> | HttpException> {
    return this.postService.getPostById(user, getPostByIdDto.postId);
  }

  /**
   * @description Create post
   * @routes
   * @get
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {CreatePostDto} createPostDto
   * @returns {Promise<ITrip.IResponseBase<PostEntity> | HttpException>}
   */
  @Post('/')
  @SetMetadata('roles', [Euser.EUserRole.USER, Euser.EUserRole.VIP1, Euser.EUserRole.VIP2, Euser.EUserRole.ADMIN])
  @UseGuards(AuthGuard(['jwt']), RoleGuard)
  createPost(@CurrentUser() user: ITrip.UserInfo | ITrip.JwtPayload, @Body(ValidationPipe) createPostDto: CreatePostDto): Promise<ITrip.IResponseBase<PostEntity> | HttpException> {
    return this.postService.createPost(user, createPostDto);
  }
}
