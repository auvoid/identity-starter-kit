import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    Repository,
    FindOptionsOrder,
    FindOptionsWhere,
    FindOptionsRelations,
    FindManyOptions,
    DeepPartial,
} from 'typeorm';
import { NotificationPreferences } from '../../entities';

@Injectable()
export class NotificationPreferencesService {
    constructor(
        @InjectRepository(NotificationPreferences)
        private repository: Repository<NotificationPreferences>,
    ) {}

    async create(
        entity: DeepPartial<NotificationPreferences>,
    ): Promise<NotificationPreferences> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        return entityCreate;
    }

    async createBulk(
        entities: DeepPartial<NotificationPreferences>[],
    ): Promise<NotificationPreferences[]> {
        const entitiesCreate = this.repository.create(entities);
        await this.repository.save(entitiesCreate);
        return entitiesCreate;
    }

    async findMany(
        options: FindOptionsWhere<NotificationPreferences>,
        relations: FindOptionsRelations<NotificationPreferences> = {},
        order: FindOptionsOrder<NotificationPreferences> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<NotificationPreferences[]> {
        const searchParams: FindManyOptions<NotificationPreferences> = {
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
        options: FindOptionsWhere<NotificationPreferences>,
        relations: FindOptionsRelations<NotificationPreferences> = {},
        order: FindOptionsOrder<NotificationPreferences> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[NotificationPreferences[], number]> {
        const searchParams: FindManyOptions<NotificationPreferences> = {
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
        options: FindOptionsWhere<NotificationPreferences>,
        relations: FindOptionsRelations<NotificationPreferences> = {},
    ): Promise<NotificationPreferences> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<NotificationPreferences> = {},
    ): Promise<NotificationPreferences> {
        const entity = await this.repository.findOne({
            where: {
                id,
            } as unknown as FindOptionsWhere<NotificationPreferences>,
            relations,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<NotificationPreferences>,
    ): Promise<NotificationPreferences> {
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
