import { Test, TestingModule } from '@nestjs/testing';
import { PDFService } from './pdf.service';

describe('PDFService', () => {
  let service: PDFService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PDFService],
    }).compile();

    service = module.get<PDFService>(PDFService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
