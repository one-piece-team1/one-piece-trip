import { Module } from '@nestjs/common';
import { TripModule } from './trips/trip.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ormConfig } from './config/orm.config';
import { PostModule } from 'posts/post.module';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), TripModule, PostModule],
})
export class AppModule {}
