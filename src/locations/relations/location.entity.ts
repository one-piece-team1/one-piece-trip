import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn, VersionColumn } from 'typeorm';
import { Point } from 'geojson';
import * as ELocation from '../../enums';
import { Country } from './country.entity';
import { Trip } from '../../trips/trip.entity';

@Entity()
@Unique(['locationName'])
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description location Point fields with point & srid & lon & lat
   */
  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'Point',
  })
  point: Point;

  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  pointSrid: Point;

  @Column({ type: 'float', nullable: false })
  lat: number;

  @Column({ type: 'float', nullable: false })
  lon: number;

  /**
   * @description Enum location type
   */
  @Column({
    type: 'simple-enum',
    enum: ELocation.ELocationType,
    nullable: false,
  })
  type: ELocation.ELocationType;

  @Column({ type: 'varchar', nullable: false })
  locationName: string;

  @ManyToOne(() => Country, { nullable: true })
  @JoinColumn()
  country?: Country;

  @OneToMany(
    () => Trip,
    (trip) => trip.startPoint,
  )
  @JoinColumn()
  startTrips?: Trip[];

  @OneToMany(
    () => Trip,
    (trip) => trip.endPoint,
  )
  @JoinColumn()
  endTrips?: Trip[];

  /**
   * @description version control
   */
  @VersionColumn({ nullable: true })
  version: number;

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

  // location currently don't need this hook, update in turn services in future
  /* istanbul ignore next */
  @BeforeUpdate()
  updateDateWhenUpdate() {
    this.updatedAt = new Date();
  }
}
