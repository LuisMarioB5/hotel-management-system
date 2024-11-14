import { Test, TestingModule } from '@nestjs/testing';
import { ConsumptionsController } from './consumptions.controller';

describe('ConsumptionsController', () => {
  let controller: ConsumptionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumptionsController],
    }).compile();

    controller = module.get<ConsumptionsController>(ConsumptionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
