import { InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { CreatePostDto } from './dto';
import { Post } from './post.entity';
import { Trip } from '../trips/trip.entity';
import { User } from '../users/user.entity';
import { config } from '../../config';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('PostRepository');
  private readonly cloudinaryBaseUrl: string = 'https://res.cloudinary.com/ahoyapp/image/upload';

  public async createPost(createPostDto: CreatePostDto, trip: Trip, user: User) {
    const { content, publicStatus, files } = createPostDto;
    const post = new Post();
    post.content = content;
    post.images = files.map((file) => `${this.cloudinaryBaseUrl}/posts/${file.originalname}`);
    post.publicStatus = publicStatus;
    post.publisher = user;
    post.trip = trip;
    try {
      await post.save();
    } catch (error) {
      this.logger.log(error.message, 'CreatePost');
      throw new InternalServerErrorException(error.message);
    }
    return post;
  }

  public async getPostById(id: string, publisher_id: string): Promise<Post> {
    try {
      return await this.findOne({ where: { id, publisher: publisher_id } });
    } catch (error) {
      this.logger.log(error.message, 'GetPostById');
      throw new InternalServerErrorException(error.message);
    }
  }
}
