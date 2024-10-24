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
import { Organization } from '../../entities';

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization)
        private repository: Repository<Organization>,
    ) {}

    async create(entity: DeepPartial<Organization>): Promise<Organization> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        return entityCreate;
    }

    async createBulk(
        entities: DeepPartial<Organization>[],
    ): Promise<Organization[]> {
        const entitiesCreate = this.repository.create(entities);
        await this.repository.save(entitiesCreate);
        return entitiesCreate;
    }

    async findMany(
        options: FindOptionsWhere<Organization>,
        relations: FindOptionsRelations<Organization> = {},
        order: FindOptionsOrder<Organization> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<Organization[]> {
        const searchParams: FindManyOptions<Organization> = {
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
        options: FindOptionsWhere<Organization>,
        relations: FindOptionsRelations<Organization> = {},
        order: FindOptionsOrder<Organization> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[Organization[], number]> {
        const searchParams: FindManyOptions<Organization> = {
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
        options: FindOptionsWhere<Organization>,
        relations: FindOptionsRelations<Organization> = {},
    ): Promise<Organization> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<Organization> = {},
    ): Promise<Organization> {
        const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<Organization>,
            relations,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<Organization>,
    ): Promise<Organization> {
        const current = await this.findById(id);
        if (
            entity.contactEmail &&
            current.contactEmail != entity.contactEmail
        ) {
            entity.emailVerified = false;
        }
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
