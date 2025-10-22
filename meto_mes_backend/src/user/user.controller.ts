import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { UserDTO } from './user.dto';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    findAll(): Promise<any> {
        return this.userService.findAll();
    }

    @Post('/login')
    async login(@Body() dto: UserDTO) {
        if (!dto.user_password) {
            return;
        }
        const result = await this.userService.findOne(dto.user_name, dto.user_password);
        console.log(result);
        
        return result
            ? { ...result, success: true }
            : { success: false };
    }

    @Post()
    async create(@Body() dto: UserDTO) {
        return this.userService.create(dto);
    }

    @Put(':user_name')
    async update(@Param('user_name') user_name: string, @Body() dto: UserDTO) {
        return this.userService.update(user_name, dto);
    }

    @Delete(':user_name')
    async delete(@Param('user_name') user_name: string) {
        return this.userService.delete(user_name);
    }
}
