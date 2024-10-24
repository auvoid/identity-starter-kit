import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  Relation,
} from 'typeorm';
import { BaseEntity } from './base-entity';
import { CredentialIssuance } from './credential-issuance';
import { User } from './user';
import { SiopOffer } from './siop-offer';
import { ApplicationStatus } from '@repo/dtos';

@Entity()
export class Application extends BaseEntity {
  @Column({ nullable: false, default: 'pending' })
  status: ApplicationStatus;

  @Column({ default: 'self', nullable: false })
  source: 'self' | 'application' | 'flow';

  @Column({ nullable: false, type: 'jsonb' })
  body: Record<string, any>;

  @Column({ nullable: false, default: false })
  claimed: boolean;

  @Column({ nullable: true })
  approvalTimeStamp: Date;

  @Column({ default: 'credential' })
  type: 'credential' | 'login';

  @OneToOne(() => CredentialIssuance, (e) => e.application, {
    cascade: ['insert', 'update', 'remove'],
  })
  @JoinColumn()
  credentialIssuance: Relation<CredentialIssuance>;

  @ManyToOne(() => User, (e) => e.applications)
  user: Relation<User>;

  @ManyToOne(() => User)
  processedBy: Relation<User>;

  @Column({ nullable: true })
  email: string;

  @OneToMany(() => SiopOffer, (e) => e.application)
  siopAttempts: SiopOffer[];
}
