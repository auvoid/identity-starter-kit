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
import { Application, CredentialIssuance } from '../../entities';
import { CredentialIssuanceService } from '../credential-issuance/credential-issuance.service';
import { DataSource } from 'typeorm';

@Injectable()
export class ApplicationsService {
    constructor(
        @InjectRepository(Application)
        private repository: Repository<Application>,
        private credentialIssuanceService: CredentialIssuanceService,
        private dataSource: DataSource,
    ) {}

    async linkIssuance(e: Application) {
        if (e.status === 'approved') {
            this.dataSource.transaction(async (txManager) => {
                if (e.credentialIssuance) return;
                const issuanceExists = await this.repository.findOne({
                    where: {
                        credentialIssuance: { application: { id: e.id } },
                    },
                });
                if (issuanceExists) return;
                const maxIndex = await this.credentialIssuanceService
                    .getRepository()
                    .maximum('applicationIndex', {
                        template: { id: e.template.id },
                    });
                const credentialIssuance =
                    await this.credentialIssuanceService.create({
                        template: e.template,
                        application: e,
                        applicationIndex: (maxIndex || 0) + 1,
                    });
                e.credentialIssuance = credentialIssuance;
                await txManager.save(e);
            });
        }
    }

    async create(entity: DeepPartial<Application>): Promise<Application> {
        const entityCreate = this.repository.create(entity);
        await this.repository.save(entityCreate);
        await this.linkIssuance(entityCreate);
        return entityCreate;
    }

    async createBulk(
        entities: DeepPartial<Application>[],
    ): Promise<Application[]> {
        const maxIndex = await this.credentialIssuanceService
            .getRepository()
            .maximum('applicationIndex', {
                template: { id: entities[0].template.id },
            });

        const applications = entities.map((e: Application, i) => {
            const issuance = new CredentialIssuance();
            issuance.application = e;
            issuance.applicationIndex = maxIndex + 1 + i;
            issuance.template = e.template;
            return { ...e, credentialIssuance: issuance };
        });

        return await this.repository.save(applications);
    }

    async findMany(
        options: FindOptionsWhere<Application>,
        relations: FindOptionsRelations<Application> = {},
        order: FindOptionsOrder<Application> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<Application[]> {
        const searchParams: FindManyOptions<Application> = {
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
        options: FindOptionsWhere<Application>,
        relations: FindOptionsRelations<Application> = {},
        order: FindOptionsOrder<Application> = {},
        paginate: { take: number; skip: number } | null = null,
    ): Promise<[Application[], number]> {
        const searchParams: FindManyOptions<Application> = {
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
        options: FindOptionsWhere<Application>,
        relations: FindOptionsRelations<Application> = {},
    ): Promise<Application> {
        const entity = await this.repository.findOne({
            where: options,
            relations,
        });
        return entity;
    }

    async findById(
        id: string,
        relations: FindOptionsRelations<Application> = {},
        order: FindOptionsOrder<Application> = {},
    ): Promise<Application> {
        const entity = await this.repository.findOne({
            where: { id } as unknown as FindOptionsWhere<Application>,
            relations,
            order,
        });
        return entity;
    }

    async findByIdAndUpdate(
        id: string,
        entity: Partial<Application>,
    ): Promise<Application> {
        const current = await this.findById(id);
        const toSave = this.repository.create({
            ...current,
            ...entity,
        });
        const updated = await this.repository.save(toSave);
        const application = await this.findById(id, { template: true });
        await this.linkIssuance(application);
        return updated;
    }

    async findByIdAndDelete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
}
