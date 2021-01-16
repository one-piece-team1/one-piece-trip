import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LocationRepository } from 'locations/location.repository';
import { UserRepository } from '../users/user.repository';
import { JwtStrategy } from './strategy';
import { TripController } from './trip.controller';
import { TripRepository } from './trip.repository';
import { TripService } from './trip.service';
import { TripEventSubscribers } from '../subscribers';
import { config } from '../../config';

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
    TypeOrmModule.forFeature([TripRepository, LocationRepository, UserRepository]),
  ],
  controllers: [TripController],
  providers: [TripService, JwtStrategy, TripEventSubscribers],
})
export class TripModule {}
