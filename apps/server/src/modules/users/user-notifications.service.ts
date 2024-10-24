import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    FindOptionsOrder,
    FindOptionsWhere,
    FindOptionsRelations,
    FindManyOptions,
    DeepPartial,
    In,
} from 'typeorm';
import { Notification } from '../../entities';

@Injectable()
export class UserNotificationsService {
    constructor(
        @InjectRepository(Notification)
        private repository: Repository<Notification>,
    ) {}

    async getUnreadCount(userId: string) {
        const count = await this.repository.count({
            where: { isRead: false, userSubject: { id: userId } },
        });
        return count;
    }

    async markAsRead(ids: string[]) {
        await this.repository
            .createQueryBuilder()
            .update({ isRead: true })
            .where({ id: In(ids) })
            .execute();
    }

    async create(entity: DeepPartial<Notification>): Promise<Notification> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        return entityCreate;
    }

    async createBulk(
        entities: DeepPartial<Notification>[],
    ): Promise<Notification[]> {
        const entitiesCreate = this.repository.create(entities);
        await this.repository.save(entitiesCreate);
        return entitiesCreate;
    }

    async findMany(
        options: FindOptionsWhere<Notification>,
        relations: FindOptionsRelations<Notification> = {},
        order: FindOptionsOrder<Notification> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<Notification[]> {
        const searchParams: FindManyOptions<Notification> = {
            where: options,
            relations,
            order,
        };
        if (paginate) {
            searchParams.take = paginate.take;
            searchParams.skip = paginate.skip;
        }
        const entities = await this.repository.find(searchParams);
        return entities;
    }

    async findManyAndCount(
        options: FindOptionsWhere<Notification>,
        relations: FindOptionsRelations<Notification> = {},
        order: FindOptionsOrder<Notification> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[Notification[], number]> {
        const searchParams: FindManyOptions<Notification> = {
            where: options,
            relations,
            order,
        };
        if (paginate) {
            searchParams.take = paginate.take;
            searchParams.skip = paginate.skip;
        }
        const entities = await this.repository.findAndCount(searchParams);
        return entities;
    }

    async findOne(
        options: FindOptionsWhere<Notification>,
        relations: FindOptionsRelations<Notification> = {},
    ): Promise<Notification> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<Notification> = {},
    ): Promise<Notification> {
        const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<Notification>,
            relations,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<Notification>,
    ): Promise<Notification> {
        const current = await this.findById(id);
        const toSave = this.repository.create({
            ...current,
            ...entity,
        });

        const updated = await this.repository.save(toSave);
        return updated;
    }

    async findByIdAndDelete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
