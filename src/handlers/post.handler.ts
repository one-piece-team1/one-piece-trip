import { TripEventPublishersFactory } from '../publishers';
import * as Event from '../events';
import { Post } from '../posts/post.entity';

class PostHandler {
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceUserExchange: string = 'onepiece-user';

  /**
   * @description Create post with microservice communication by RMQ
   * @public
   * @param {Post} post
   * @returns {void}
   */
  createPost(post: Post) {
    const pubExchanges: string[] = [this.onepieceUserExchange];
    pubExchanges.forEach((exchange: string) => {
      TripEventPublishersFactory.createPub(
        {
          type: Event.PostEvent.CREATEPOST,
          data: post,
        },
        exchange,
      );
    });
  }
}

/**
 * @classdesc RMQ post publish factory
 */
export class PostHandlerFactory {
  /**
   * @description Create post with microservice communication by RMQ
   * @public
   * @param {Post} post
   * @returns {void}
   */
  static createPost(post: Post) {
    return new PostHandler().createPost(post);
  }
}
