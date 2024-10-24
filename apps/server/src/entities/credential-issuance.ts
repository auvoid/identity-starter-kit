import {
  Column,
  Entity,
  ManyToOne,
  OneToOne,
  Relation,
  Unique,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from './base-entity';
import { Application } from './application';

@Entity()
@Unique('unique_credential_issuance', ['template', 'applicationIndex'])
export class CredentialIssuance extends BaseEntity {
  @Column({ nullable: true })
  applicationIndex: number;

  @OneToOne(() => Application, (e) => e.credentialIssuance)
  application: Relation<Application>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
