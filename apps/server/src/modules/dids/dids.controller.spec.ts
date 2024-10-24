import { Test, TestingModule } from '@nestjs/testing';
import { DidsController } from './dids.controller';

describe('IdentityController', () => {
    let controller: DidsController;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            controllers: [DidsController],
        }).compile();

        controller = module.get<DidsController>(DidsController);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
