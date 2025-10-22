import { Module } from '@nestjs/common';
import { SpcController } from './spc.controller';
import { SpcService } from './spc.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SpcController],
    providers: [SpcService],
    exports:[SpcService]
})
export class SpcModule { }
