import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base-entity';
import { Application } from './application';

@Entity()
export class SiopOffer extends BaseEntity {
  @Column({ type: 'text' })
  request: string;

  @Column({ type: 'jsonb', default: {} })
  pex: Record<string, any>;

  @ManyToOne(() => Application, (e) => e.siopAttempts)
  application: Application;
}
