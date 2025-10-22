import { Module } from '@nestjs/common';
import { DataAnalysisController } from './data-analysis.controller';
import { DataAnalysisService } from './data-analysis.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DataAnalysisController],
  providers: [DataAnalysisService]
})
export class DataAnalysisModule {}
