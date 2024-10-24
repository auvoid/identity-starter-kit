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
import { Identity } from '../../entities';

@Injectable()
export class DidsService {
    constructor(
        @InjectRepository(Identity) private repository: Repository<Identity>,
    ) {}

    async create(entity: DeepPartial<Identity>): Promise<Identity> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        return entityCreate;
    }

    async createBulk(entities: DeepPartial<Identity>[]): Promise<Identity[]> {
        const entitiesCreate = this.repository.create(entities);
        await this.repository.save(entitiesCreate);
        return entitiesCreate;
    }

    async findMany(
        options: FindOptionsWhere<Identity>,
        relations: FindOptionsRelations<Identity> = {},
        order: FindOptionsOrder<Identity> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<Identity[]> {
        const searchParams: FindManyOptions<Identity> = {
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
        options: FindOptionsWhere<Identity>,
        relations: FindOptionsRelations<Identity> = {},
        order: FindOptionsOrder<Identity> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[Identity[], number]> {
        const searchParams: FindManyOptions<Identity> = {
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
        options: FindOptionsWhere<Identity>,
        relations: FindOptionsRelations<Identity> = {},
    ): Promise<Identity> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<Identity> = {},
    ): Promise<Identity> {
        const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<Identity>,
            relations,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<Identity>,
    ): Promise<Identity> {
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
