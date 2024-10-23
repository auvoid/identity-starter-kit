import { AfterLoad, BeforeInsert, BeforeUpdate, Column, Entity } from 'typeorm';
import { BaseEntity } from './base-entity';
import { hash, verify } from 'argon2';

@Entity()
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

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
