import { Column, Entity, ManyToOne, Relation } from 'typeorm';
import { BaseEntity } from './base-entity';
import { User } from './user';

export type NotificationType =
  | 'APPLICATION_CREATED'
  | 'APPLICATION_REJECTED'
  | 'APPLICATION_ACCEPTED'
  | 'ORGANIZATION_CREATED'
  | 'ACCOUNT_CLOSED'
  | 'ORGANIZATION_CLOSED'
  | 'STAFF_INVITED'
  | 'RECEIVED_CREDENTIAL'
  | 'CREDENTIAL_CLAIMED'
  | 'ISSUED_CREDENTIAL'
  | 'CREDENTIAL_REVOKED';

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
