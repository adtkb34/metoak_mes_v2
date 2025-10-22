import { PrismaService } from "src/prisma/prisma.service";
import { UserDTO } from "./user.dto";
import { Injectable } from "@nestjs/common";


@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  findAll() {
    return this.prisma.mo_user_info.findMany();
  }

  findOne(user_name: string, user_password: string) {
    return this.prisma.mo_user_info.findFirst({
      select: { user_name: true, user_level: true },
      where: { user_name, user_password }
    });
  }

  create(dto: UserDTO) {
    return this.prisma.mo_user_info.create({
      data: {
        user_name: dto.user_name,
        user_password: dto.user_password ?? 'password',
        user_level: dto.user_level,
        work_code: dto.work_code,
        real_name: dto.real_name,
        create_time: dto.create_time ?? new Date(),
        user_state: dto.user_state ?? 0,
      }
    });
  }

  update(user_name: string, dto: UserDTO) {
    return this.prisma.mo_user_info.update({
      where: { user_name },
      data: {
        user_password: dto.user_password,
        user_level: dto.user_level,
        work_code: dto.work_code,
        real_name: dto.real_name,
        create_time: dto.create_time,
        user_state: dto.user_state,
      }
    });
  }

  delete(user_name: string) {
    return this.prisma.mo_user_info.delete({
      where: { user_name }
    });
  }
}
