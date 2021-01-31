import * as amqp from 'amqplib/callback_api';
import { Injectable, Logger } from '@nestjs/common';
import { config } from '../../config';
import * as Event from '../events';

interface IReceiveEvent {
  type: Event.UserEvent;
  data: any;
}

@Injectable()
export class PostEventSubscribers {
  private readonly logger: Logger = new Logger('PostEventSubscribers');

  private readonly defaultExchangeName: string = 'onepiece-post';

  constructor() {
    this.subscribeData('onepiece_post_queue');
  }

  /**
   * @description Sub Data
   * @public
   * @param {string} queueName
   * @returns {Promise<unknown>}
   */
  subscribeData(queueName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      amqp.connect(`${config.EVENT_STORE_SETTINGS.protocol}://${config.EVENT_STORE_SETTINGS.hostname}:${config.EVENT_STORE_SETTINGS.tcpPort}/?heartbeat=60`, (connectErr: Error, connection: amqp.Connection) => {
        if (connectErr) return reject(connectErr.message);

        connection.createChannel((createChErr: Error, channel: amqp.Channel) => {
          if (createChErr) return reject(createChErr.message);
          channel.assertExchange(this.defaultExchangeName, 'fanout', {
            durable: false,
          });

          channel.assertQueue(
            queueName,
            {
              exclusive: true,
            },
            (assertErr: Error, q: amqp.Replies.AssertQueue) => {
              if (assertErr) return reject(assertErr.message);
              channel.bindQueue(q.queue, this.defaultExchangeName, '');
              channel.consume(
                q.queue,
                (msg: amqp.Message) => {
                  this.logger.log(msg.content.toString(), 'AMQPHandler-SubscribeData');
                  if (msg.content) {
                    this.execute(msg.content.toString());
                    resolve(true);
                  }
                },
                { noAck: true },
              );
            },
          );
        });
      });
    });
  }

  execute(event) {
    const jsonEvent: IReceiveEvent = JSON.parse(event);
    this.logger.log(jsonEvent, 'PostEventSubscribers');
  }
}
