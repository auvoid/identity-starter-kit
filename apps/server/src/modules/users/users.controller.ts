import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './users.service';
import { createJsonWebToken } from '../../utils/jwt';
import { IsAuthenticated } from '../../guards/auth.guard';
import { CurrentUser } from '../../decorators/user';
import { User } from '../../entities/user';
import {
  CreateUserDTO,
  LoginUserDTO,
  UpdateUserDTO,
  UserDTO,
} from '@repo/dtos';
import { Serialize } from '../../interceptors/serialize';

@Controller('users')
export class UsersController {
  constructor(private userService: UserService) {}

  @Post()
  @Serialize(UserDTO)
  async createNewUser(@Body() body: CreateUserDTO) {
    const { email, password } = body;
    const _userExists = await this.userService.findOne({ email });
    if (_userExists) throw new BadRequestException('email already exists');

    const user = await this.userService.create({
      email,
      password,
    });
    return user;
  }

  @Get()
  async getUser(@CurrentUser() user: User) {
    return user;
  }

  @Post('/login')
  async loginUser(@Body() body: LoginUserDTO) {
    const { email, password } = body;
    const user = await this.userService.findOne({ email });
    if (!(await user.verifyPassword(password))) throw new BadRequestException();
    return {
      token: createJsonWebToken({ scope: 'auth', userId: user.id }, '1y'),
    };
  }

  @Patch()
  @IsAuthenticated()
  @Serialize(UserDTO)
  async updateUser(@CurrentUser() user: User, @Body() body: UpdateUserDTO) {
    const { password, oldPassword } = body;
    const isValidPassword = await user.verifyPassword(oldPassword);
    if (!isValidPassword) throw new BadRequestException();
    const updated = await this.userService.findByIdAndUpdate(user.id, {
      password,
    });
    return updated;
  }

  @Post('/sign-out')
  async signOut() {
    return;
  }
}
