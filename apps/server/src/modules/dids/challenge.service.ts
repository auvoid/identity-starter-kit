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
import { Challenge } from '../../entities';

@Injectable()
export class ChallengesService {
    constructor(
        @InjectRepository(Challenge) private repository: Repository<Challenge>,
    ) {}

    async create(entity: DeepPartial<Challenge>): Promise<Challenge> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        return entityCreate;
    }

    async createBulk(entities: DeepPartial<Challenge>[]): Promise<Challenge[]> {
        const entitiesCreate = this.repository.create(entities);
        await this.repository.save(entitiesCreate);
        return entitiesCreate;
    }

    async findMany(
        options: FindOptionsWhere<Challenge>,
        relations: FindOptionsRelations<Challenge> = {},
        order: FindOptionsOrder<Challenge> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<Challenge[]> {
        const searchParams: FindManyOptions<Challenge> = {
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
        options: FindOptionsWhere<Challenge>,
        relations: FindOptionsRelations<Challenge> = {},
        order: FindOptionsOrder<Challenge> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[Challenge[], number]> {
        const searchParams: FindManyOptions<Challenge> = {
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
        options: FindOptionsWhere<Challenge>,
        relations: FindOptionsRelations<Challenge> = {},
    ): Promise<Challenge> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<Challenge> = {},
    ): Promise<Challenge> {
        const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<Challenge>,
            relations,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<Challenge>,
    ): Promise<Challenge> {
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
