import { InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, getRepository, Repository } from 'typeorm';
import { CreatePostDto } from './dto';
import { Post } from './post.entity';
import { Trip } from '../trips/trip.entity';
import { User } from '../users/user.entity';
import * as ITrip from '../interfaces';
import { config } from '../../config';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  private readonly connectionName: string = config.ENV === 'test' ? 'testConnection' : 'default';
  private readonly logger: Logger = new Logger('PostRepository');
  private readonly cloudinaryBaseUrl: string = 'https://res.cloudinary.com/ahoyapp/image/upload';

  /**
   * @description Create post includes user authentication and trip verification
   * - also updating post images to CDN and store it's url string
   * @public
   * @param {CreatePostDto} createPostDto
   * @param {Trip} trip
   * @param {User} user
   * @returns {Promise<Post>}
   */
  public async createPost(createPostDto: CreatePostDto, trip: Trip, user: User): Promise<Post> {
    const { content, publicStatus, files } = createPostDto;
    const post = new Post();
    post.content = content;
    if (files) post.images = files.map((file) => `${this.cloudinaryBaseUrl}/posts/${file.originalname}`);
    post.publicStatus = publicStatus;
    post.publisher = user;
    post.trip = trip;
    try {
      await post.save();
    } catch (error) {
      this.logger.error(error.message, '', 'CreatePostError');
      throw new InternalServerErrorException(error.message);
    }
    return post;
  }

  /**
   * @description Get post by it's primary key also join publisher and trips data
   * @public
   * @param {string} id publish post primary key
   * @param {string} publisher_id publish user primary key
   * @returns {Promise<ITrip.ResponseBase>}
   */
  public async getPostById(id: string, publisher_id: string): Promise<Post> {
    try {
      return await getRepository(Post, this.connectionName).findOne({ where: { id, publisher: publisher_id } });
    } catch (error) {
      this.logger.error(error.message, '', 'GetPostByIdError');
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Get Posts by paging
   * @todo User relations blocking for trip publicStatus and post publicStatus
   * - In the first release everything is default also 'public' with all created data to default to public as well
   * @public
   * @param {ITrip.ISearch} searchDto
   * @param {boolean} isAdmin
   * @returns {Promise<{ posts: Post[]; take: number; skip: number; count: number }>}
   */
  // eslint-disable-next-line
  public async getPosts(searchDto: ITrip.ISearch, isAdmin: boolean): Promise<{ posts: Post[]; take: number; skip: number; count: number }> {
    const take = searchDto.take ? Number(searchDto.take) : 10;
    const skip = searchDto.skip ? Number(searchDto.skip) : 0;
    // eslint-disable-next-line
    const searchOpts: ITrip.IQueryPaging = {
      take,
      skip,
      relations: ['publisher', 'trip'],
      order: {
        updatedAt: searchDto.sort,
      },
    };

    try {
      const [posts, count] = await getRepository(Post, this.connectionName).findAndCount(searchOpts);
      return {
        posts,
        take,
        skip,
        count,
      };
    } catch (error) {
      this.logger.error(error.message, '', 'GetPostsError');
      throw new InternalServerErrorException(error.message);
    }
  }
}
