import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base-entity';
import { User } from './user';
import { NotificationType } from '@repo/dtos';

@Entity()
export class Notification extends BaseEntity {
  @Column()
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User, (e) => e.notifications)
  userSubject: Relation<User>;

  @ManyToOne(() => User)
  userTarget: Relation<User>;
}
