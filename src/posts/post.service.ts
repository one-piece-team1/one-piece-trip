import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { PostRepository } from './post.repository';
import { CreatePostDto } from './dto';
import { UserRepository } from '../users/user.repository';
import { User } from '../users/user.entity';

import * as ITrip from '../interfaces';
import * as ETrip from '../enums';
import { TripRepository } from 'trips/trip.repository';
import { Uploader } from '../libs/cloudinary';

@Injectable()
export class PostService {
  private readonly logger: Logger = new Logger('PostService');

  constructor(private readonly postRepository: PostRepository, private readonly tripRepository: TripRepository, private readonly userRepository: UserRepository, private readonly uploader: Uploader) {}

  getRequestTest(): string {
    return 'Hello World!';
  }

  public async createPost(user: ITrip.UserInfo | ITrip.JwtPayload, createPostDto: CreatePostDto) {
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
      console.log('post_result: ', post_result);
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
}
