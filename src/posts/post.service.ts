import { HttpException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto';
import { UserRepository } from '../users/user.repository';
import { User } from '../users/user.entity';
import { TripRepository } from '../trips/trip.repository';
import { Uploader } from '../libs/cloudinary';
import { PostHandlerFactory } from '../handlers/post.handler';
import * as ITrip from '../interfaces';
import * as ETrip from '../enums';

@Injectable()
export class PostService {
  private readonly logger: Logger = new Logger('PostService');

  constructor(private readonly postRepository: PostRepository, private readonly tripRepository: TripRepository, private readonly userRepository: UserRepository, private readonly uploader: Uploader) {}

  getRequestTest(): string {
    return 'Hello World!';
  }

  /**
   * @description Create post includes user authentication and trip verification
   * - also updating post images to CDN and store it's url string
   * @public
   * @param {ITrip.UserInfo | ITrip.JwtPayload} user
   * @param {CreatePostDto} createPostDto
   * @returns {Promise<ITrip.ResponseBase>}
   */
  public async createPost(user: ITrip.UserInfo | ITrip.JwtPayload, createPostDto: CreatePostDto): Promise<ITrip.ResponseBase> {
    const { tripId, publisherId, files } = createPostDto;

    // check user information if it's pass user is valid
    if (user.id !== publisherId)
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    const isAdmin: boolean = user.role === ETrip.EUserRole.ADMIN;
    const publisher: User = await this.userRepository.getUserById(user.id, isAdmin);
    if (!publisher)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'User not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    // fi

    // check trip information if it's pass
    const trip = await this.tripRepository.verifyByTripById(tripId);
    if (!trip)
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Trip not found',
        },
        HttpStatus.BAD_REQUEST,
      );
    // user can only create belongs to there own post under trip
    if (trip.publisher.id !== publisherId)
      throw new HttpException(
        {
          status: HttpStatus.FORBIDDEN,
          error: 'Invalid credential',
        },
        HttpStatus.FORBIDDEN,
      );
    // fi
    // handle upload folder
    this.uploader.uploadBatch(files);

    try {
      const post_result = await this.postRepository.createPost(createPostDto, trip, publisher);
      if (post_result) {
        PostHandlerFactory.createPost(post_result);
      }
      return {
        statusCode: HttpStatus.CREATED,
        status: 'success',
        message: post_result,
      };
    } catch (error) {
      this.logger.log(error.message, 'CreatePost');
      throw new HttpException(
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
   * @returns {Promise<ITrip.ResponseBase>}
   */
  public async getPostById(user: ITrip.UserInfo | ITrip.JwtPayload, postId: string): Promise<ITrip.ResponseBase> {
    try {
      const post = await this.postRepository.getPostById(postId, user.id);
      if (!post) throw new NotFoundException(`Post ${postId} not found`);
      return {
        statusCode: HttpStatus.OK,
        status: 'success',
        message: post,
      };
    } catch (error) {
      this.logger.log(error.message, 'GetPostById');
      throw new HttpException(
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
   * @returns {Promise<ITrip.ResponseBase>}
   */
  public async getPosts(user: ITrip.UserInfo | ITrip.JwtPayload, searchDto: ITrip.ISearch): Promise<ITrip.ResponseBase> {
    if (!searchDto.keyword) searchDto.keyword = '';
    if (!searchDto.sort) searchDto.sort = 'DESC';
    const isAdmin = user.role === ETrip.EUserRole.ADMIN;
    try {
      const { posts, count } = await this.postRepository.getPosts(searchDto, isAdmin);
      if (!posts || !count) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: 'Post Not Found',
          },
          HttpStatus.NOT_FOUND,
        );
      }
      return {
        statusCode: HttpStatus.OK,
        status: 'success',
        message: {
          posts,
          count,
        },
      };
    } catch (error) {
      this.logger.log(error.message, 'GetPosts');
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
