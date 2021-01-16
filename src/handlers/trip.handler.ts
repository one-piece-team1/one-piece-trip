import { TripEventPublishersFactory } from '../publishers';
import { Trip } from '../trips/trip.entity';
import * as Event from '../events';

class TripHandler {
  // one server only listen to one exchange
  // seperate different event by type for different services
  private readonly onepieceUserExchange: string = 'onepiece-user';
  private readonly onepieceArticleExchange: string = 'onepiece-article';

  /**
   * @description Create trip with microservice communication by RMQ
   * @public
   * @param {Trip} trip
   * @returns {void}
   */
  createTrip(trip: Trip) {
    const pubExchanges: string[] = [this.onepieceUserExchange];
    pubExchanges.forEach((exchange: string) => {
      TripEventPublishersFactory.createPub(
        {
          type: Event.UserEvent.CREATEUSER,
          data: trip,
        },
        exchange,
      );
    });
  }
}

/**
 * @classdesc RMQ trip publish factory
 */
export class TripHandlerFactory {
  /**
   * @description Create trip with microservice communication by RMQ
   * @public
   * @param {Trip} trip
   * @returns {void}
   */
  static createTrip(trip: Trip) {
    return new TripHandler().createTrip(trip);
  }
}
