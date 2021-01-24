import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRepository } from 'trips/trip.repository';
import { UserRepository } from 'users/user.repository';
import { PostController } from './post.controller';
import { PostRepository } from './post.repository';
import { PostService } from './post.service';
import { JwtStrategy } from '../strategy';
import { config } from '../../config';
import { PostEventSubscribers } from 'subscribers';
import { Uploader } from '../libs/cloudinary';

@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
      property: 'user',
      session: true,
    }),
    JwtModule.register({
      secret: config.JWT.SECRET,
      signOptions: {
        algorithm: 'HS256',
        expiresIn: '7d',
        issuer: 'one-piece',
      },
      verifyOptions: {
        algorithms: ['HS256'],
      },
    }),
    TypeOrmModule.forFeature([PostRepository, TripRepository, UserRepository]),
  ],
  controllers: [PostController],
  providers: [PostService, JwtStrategy, PostEventSubscribers, Uploader],
})
export class PostModule {}