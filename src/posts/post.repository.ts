import { InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { CreatePostDto } from './dto';
import { Post } from './post.entity';
import { Trip } from '../trips/trip.entity';
import { User } from 'users/user.entity';

@EntityRepository(Post)
export class PostRepository extends Repository<Post> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('PostRepository');

  public async createPost(createPostDto: CreatePostDto, trip: Trip, user: User) {
    const { content, publicStatus, tripId, publisherId, files } = createPostDto;
    const post = new Post();
    post.content = content;
    post.images = files.map((file) => `/posts/${file.originalname}`);
    post.publicStatus = publicStatus;
    post.publisher = user;
    post.trip = trip;
    try {
      await post.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
    return post;
  }
}
