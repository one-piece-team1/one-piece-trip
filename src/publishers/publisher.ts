import * as amqp from 'amqplib/callback_api';
import { Injectable, Logger } from '@nestjs/common';
import { config } from '../../config';

@Injectable()
export class TripEventPublishers {
  private defaultExchangeName = 'onepiece-trip';
  private logger = new Logger('AMQPHandler');

  /**
   * @description Pub Data
   * @public
   * @param {any} message
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  publishData(message: any): Promise<unknown>;
  publishData(message: any, exchangeName: string): Promise<unknown>;
  publishData(message: any, exchangeName?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);
          if (exchangeName) this.defaultExchangeName = exchangeName;

          channel.assertExchange(this.defaultExchangeName, 'fanout', {
            durable: false,
          });
          channel.publish(this.defaultExchangeName, '', Buffer.from(JSON.stringify(message)));
          resolve(true);
          this.logger.log(message, 'AMQPHandler-PublishData');
        });
      });
    });
  }
}

export class TripEventPublishersFactory {
  /**
   * @description Pub Data
   * @public
   * @param {any} message
   * @param {string | undefined} exchangeName
   * @returns {Promise<unknown>}
   */
  static createPub(message: any, exchangeName?: string) {
    return new TripEventPublishers().publishData(message, exchangeName);
  }
}
