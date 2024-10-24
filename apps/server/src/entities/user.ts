import {
  AfterLoad,
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';
import { hash, verify } from 'argon2';
import { Notification } from './notification';
import { BaseEntity } from './base-entity';
import { Session } from './session';
import { Application } from './application';
import { NotificationPreference } from './notification-preference';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true, unique: true })
  did: string;

  @OneToMany(() => Session, (e) => e.user, { onDelete: 'CASCADE' })
  sessions: Relation<Session[]>;

  @OneToMany(() => Notification, (e) => e.userSubject)
  notifications: Relation<Notification[]>;

  @OneToOne(() => NotificationPreference)
  @JoinColumn()
  notificationPreferences: Relation<NotificationPreference>;

  @Column({ default: false, nullable: false })
  emailVerified: boolean;

  @OneToMany(() => Application, (e) => e.user)
  applications: Relation<Application[]>;

  private tempPassword: string;
  @AfterLoad()
  private loadTempPassword(): void {
    this.tempPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashAndSaltPassword() {
    if (this.tempPassword !== this.password) {
      this.password = await hash(this.password);
    }
  }

  async verifyPassword(pwd: string) {
    return verify(this.password, pwd);
  }
}
