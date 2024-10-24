import { Test, TestingModule } from '@nestjs/testing';
import { DidsService } from './dids.service';

describe('IdentityService', () => {
    let service: DidsService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [DidsService],
        }).compile();

        service = module.get<DidsService>(DidsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
