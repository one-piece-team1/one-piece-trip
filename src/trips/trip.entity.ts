import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Location } from '../locations/relations';
import { User } from '../users/user.entity';
import * as ETrip from '../enums';
import { Post } from 'posts/post.entity';
import { MultiLineString } from 'geojson';

@Entity()
export class Trip extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description Basic Area
   */
  @Column({ type: 'timestamp', nullable: false })
  startDate: Date;

  @Column({ type: 'timestamp', nullable: false })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: ETrip.ETripView,
    default: ETrip.ETripView.PUBLIC,
    nullable: false,
  })
  publicStatus: ETrip.ETripView;

  /**
   * @description Unnecessary fields but maybe necessary in the future depends we have open data for those fields or not
   */
  @Column({ type: 'varchar', nullable: true })
  companyName?: string;

  @Column({ type: 'varchar', nullable: true })
  shipNumber?: string;

  @Column({
    type: 'geometry',
    nullable: true,
    spatialFeatureType: 'MultiLineString',
    srid: 4326,
  })
  geom?: MultiLineString;

  /**
   * @description Relation Area with User
   */
  @ManyToOne(
    () => User,
    (user) => user.trips,
  )
  @JoinColumn()
  publisher: User;

  @ManyToMany(
    () => User,
    (user) => user.views,
  )
  @JoinColumn()
  viewers: User[];

  /**
   * @description Relation Area with post
   */
  @OneToMany(
    () => Post,
    (post) => post.trip,
  )
  posts: Post[];

  /**
   * @description Relation Area with location
   */
  @ManyToOne(
    () => Location,
    (location) => location.startTrips,
  )
  @JoinColumn()
  startPoint: Location;

  @ManyToOne(
    () => Location,
    (location) => location.endTrips,
  )
  @JoinColumn()
  endPoint: Location;

  /**
   * @description Time area
   */
  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;

  @BeforeInsert()
  updateWhenInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  updateDateWhenUpdate() {
    this.updatedAt = new Date();
  }
}
