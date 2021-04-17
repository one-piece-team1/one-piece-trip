import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Trip } from '../trips/trip.entity';
import { Post } from './post.entity';
import { UserRepository } from '../users/user.repository';
import { PostRepository } from './post.repository';
import { TripRepository } from '../trips/trip.repository';
import { PostHandlerFactory } from '../handlers/post.handler';
import { Uploader } from '../libs/cloudinary';
import HTTPResponse from '../libs/response';
import { CreatePostDto } from './dto';
import * as ITrip from '../interfaces';
import * as ETrip from '../enums';

@Injectable()
export class PostService {
  private readonly hTTPResponse: HTTPResponse = new HTTPResponse();
  private readonly logger: Logger = new Logger('PostService');

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: PostRepository,
    @InjectRepository(Trip)
    private readonly tripRepository: TripRepository,
    @InjectRepository(User)
    private readonly userRepository: UserRepository,
    private readonly uploader: Uploader,
  ) {}

  /**
   * @description Create post includes user authentication and trip verification
   * - also updating post images to CDN and store it's url string
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {CreatePostDto} createPostDto
   * @returns {Promise<ITrip.IResponseBase<Post> | HttpException>}
   */
  public async createPost(user: ITrip.UserInfo | ITrip.JwtPayload, createPostDto: CreatePostDto): Promise<ITrip.IResponseBase<Post> | HttpException> {
    const { tripId, publisherId, files } = createPostDto;

    // check user information if it's pass user is valid
    if (user.id !== publisherId) {
      this.logger.error('Invalid credential', '', 'CreatePostError');
      return new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    const isAdmin: boolean = user.role === ETrip.EUserRole.ADMIN;
    const publisher: User = await this.userRepository.getUserById(user.id, isAdmin);
    if (!publisher) {
      this.logger.error('User not found', '', 'CreatePostError');
      return new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // fi

    // check trip information if it's pass
    const trip = await this.tripRepository.verifyByTripById(tripId);
    if (!trip) {
      this.logger.error('Trip not found', '', 'CreatePostError');
      return new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Trip not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // user can only create belongs to there own post under trip
    if (trip.publisher.id !== publisherId) {
      this.logger.error('Invalid credential', '', 'CreatePostError');
      return new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    }
    // fi
    // handle upload folder
    this.uploader.uploadBatch(files);

    try {
      const post_result = await this.postRepository.createPost(createPostDto, trip, publisher);
      if (post_result) {
        PostHandlerFactory.createPost(post_result);
      }
      return this.hTTPResponse.StatusCreated(post_result);
    } catch (error) {
      this.logger.error(error.message, '', 'CreatePostError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get post by it's primary key also join publisher and trips data
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {string} postId
   * @returns {Promise<ITrip.IResponseBase<Post> | HttpException>}
   */
  public async getPostById(user: ITrip.UserInfo | ITrip.JwtPayload, postId: string): Promise<ITrip.IResponseBase<Post> | HttpException> {
    try {
      const post = await this.postRepository.getPostById(postId, user.id);
      if (!post) {
        this.logger.error(`Post ${postId} not found`, '', 'GetPostByIdError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: `Post ${postId} not found`,
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.hTTPResponse.StatusOK(post);
    } catch (error) {
      this.logger.error(error.message, '', 'GetPostByIdError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * @description Get Posts by paging
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {ITrip.ISearch} searchDto
   * @returns {Promise<ITrip.IResponseBase<ITrip.IPostPagingResponseBase<Post[]>> | HttpException>}
   */
  public async getPosts(user: ITrip.UserInfo | ITrip.JwtPayload, searchDto: ITrip.ISearch): Promise<ITrip.IResponseBase<ITrip.IPostPagingResponseBase<Post[]>> | HttpException> {
    if (!searchDto.keyword) searchDto.keyword = '';
    if (!searchDto.sort) searchDto.sort = 'DESC';
    const isAdmin = user.role === ETrip.EUserRole.ADMIN;
    try {
      const { posts, count, take, skip } = await this.postRepository.getPosts(searchDto, isAdmin);
      if (!posts || !count || posts.length === 0) {
        this.logger.error('Post Not Found', '', 'GetPostsError');
        return new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Post Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return this.hTTPResponse.StatusOK({
        posts,
        take,
        skip,
        count,
      });
    } catch (error) {
      this.logger.error(error.message, '', 'GetPostsError');
      return new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
