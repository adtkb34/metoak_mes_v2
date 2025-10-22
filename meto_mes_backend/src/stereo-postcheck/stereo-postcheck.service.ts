import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PostCheckDto } from './dto';

@Injectable()
export class StereoPostcheckService {
    constructor(private prisma: PrismaService) { }

    async create(data: PostCheckDto) {
        return await this.prisma.mo_stereo_postcheck.create({
            data
        })
    }
}
