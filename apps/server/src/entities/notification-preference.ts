import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base-entity';

@Entity()
export class NotificationPreference extends BaseEntity {
  @Column({ default: true })
  communication: boolean;

  @Column({ default: true })
  activity: boolean;

  @Column({ default: true })
  system: boolean;

  @Column({ default: true })
  credential: boolean;

  @Column({ default: false })
  newsletter: boolean;

  @Column({ default: false })
  products: boolean;

  @Column({ default: false })
  resources: boolean;

  @Column({ default: false })
  emailNotifications: boolean;
}
