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
import { OrganizationCredential } from '../../entities';

@Injectable()
export class OrganizationCredentialsService {
    constructor(
        @InjectRepository(OrganizationCredential)
        private repository: Repository<OrganizationCredential>,
    ) {}

    async create(
        entity: DeepPartial<OrganizationCredential>,
    ): Promise<OrganizationCredential> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        return entityCreate;
    }

    async createBulk(
        entities: DeepPartial<OrganizationCredential>[],
    ): Promise<OrganizationCredential[]> {
        const entitiesCreate = this.repository.create(entities);
        await this.repository.save(entitiesCreate);
        return entitiesCreate;
    }

    async findMany(
        options: FindOptionsWhere<OrganizationCredential>,
        relations: FindOptionsRelations<OrganizationCredential> = {},
        order: FindOptionsOrder<OrganizationCredential> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<OrganizationCredential[]> {
        const searchParams: FindManyOptions<OrganizationCredential> = {
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
        options: FindOptionsWhere<OrganizationCredential>,
        relations: FindOptionsRelations<OrganizationCredential> = {},
        order: FindOptionsOrder<OrganizationCredential> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[OrganizationCredential[], number]> {
        const searchParams: FindManyOptions<OrganizationCredential> = {
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
        options: FindOptionsWhere<OrganizationCredential>,
        relations: FindOptionsRelations<OrganizationCredential> = {},
    ): Promise<OrganizationCredential> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<OrganizationCredential> = {},
    ): Promise<OrganizationCredential> {
        const entity = await this.repository.findOne({
            where: {
                id,
            } as unknown as FindOptionsWhere<OrganizationCredential>,
            relations,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<OrganizationCredential>,
    ): Promise<OrganizationCredential> {
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
