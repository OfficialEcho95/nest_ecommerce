import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from 'bcrypt'
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../users/entities/users.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-dto.users";
import { QueueAuthentication } from "src/shared/background_runners/queues/authentication.queue";

@Injectable()

export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private  readonly queueAuthentication: QueueAuthentication,
        private usersService: UsersService,
        private jwtService: JwtService
    ) { }


    async create(createUserDto: CreateUserDto) {
        const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } })

        if (existing) {
            throw new BadRequestException("Email already in use");
        }
        const user = this.userRepository.create(createUserDto)
        const savedUser = await this.userRepository.save(user)

        const { password, ...safeUser } = savedUser
        await this.queueAuthentication.queueNewUserRegistration(
            savedUser.email,
            'Welcome to our platform! Your account has been successfully created.'
        );
        return safeUser;
    }


    async login(dto: LoginDto) {
        const { login, password } = dto;
        const isEmail = login.includes('@');
        const user: any = isEmail ?
            await this.usersService.findByEmail(login)
            : await this.usersService.findByPhone(login);
        console.log("user:", user);

        if (!user) {
            throw new UnauthorizedException("Invalid Credentials");
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException("Invalid Credentials");
        }

        const payload = { sub: user.id, email: user.email, role: user.role };
        const token = await this.jwtService.signAsync(payload);

        delete user.password;

        await this.queueAuthentication.successfulLoginNotification(user.email);

        return {
            access_token: token,
            user
        }
    }
}