import { Injectable } from '@nestjs/common';
import * as Cloudinary from 'cloudinary';
import * as fs from 'fs';
import { join } from 'path';
import { config } from '../../config';
import * as ITrip from '../interfaces';

@Injectable()
export class Uploader {
  constructor() {
    Cloudinary.v2.config({
      cloud_name: config.CLOUDINARY.NAME,
      api_key: config.CLOUDINARY.KEY,
      api_secret: config.CLOUDINARY.SECRET,
    });
  }

  /**
   * @description Create Write Stream
   * @private
   * @param {ITrip.BufferedFile} file
   * @returns {Promise<boolean>}
   */
  private writeStream(file: ITrip.BufferedFile): Promise<boolean> {
    return new Promise((resolve, reject) => {
      fs.createWriteStream(join(process.cwd(), `public/assets/${file.originalname}`)).write(Buffer.from(file.buffer['data']), (err) => {
        if (err) return reject(false);
        resolve(true);
      });
    });
  }

  public async uploadBatch(files: ITrip.BufferedFile[]): Promise<void> {
    const promises = [];

    for (let i = 0; i < files.length; i++) {
      await this.writeStream(files[i]);
    }

    files.forEach((file) => {
      const public_id = file.originalname.replace(/\.[^.]+$/, '');
      promises.push(
        Cloudinary.v2.uploader.upload(
          join(process.cwd(), `public/assets/${file.originalname}`),
          {
            access_mode: 'public',
            resource_type: 'image',
            folder: 'posts',
            allowed_formats: ['jpg', 'png', 'jpeg'],
            public_id,
            unique_filename: true,
            timestamp: new Date().getTime(),
          },
          function(err, result) {
            if (err) return err;
            return result;
          },
        ),
      );
    });

    Promise.all(promises)
      .then((resources) => resources)
      .catch((err) => err);
  }
}
