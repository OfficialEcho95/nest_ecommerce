import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import * as bcrypt from 'bcrypt'
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../users/entities/users.entity";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-dto.users";
import { QueueAuthentication } from "src/shared/background_runners/queues/authentication.queue";
import { UpdateUserDto } from "../users/dto/update-user.dto";
import { ConfigService } from "@nestjs/config";

@Injectable()

export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly queueAuthentication: QueueAuthentication,
        private usersService: UsersService,
        private jwtService: JwtService,
        private configService: ConfigService
    ) { }


    async create(createUserDto: CreateUserDto) {
        const existing = await this.userRepository.findOne({
            where: { email: createUserDto.email },
        });

        if (existing) {
            throw new BadRequestException('Email already in use');
        }

        const user = this.userRepository.create({
            ...createUserDto,
            isVerified: false,
        });

        const savedUser = await this.userRepository.save(user);

        const token = await this.jwtService.signAsync(
            { userId: savedUser.id },
            {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '1h',
            },
        );

        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${token}`;

        await this.queueAuthentication.queueEmailVerification(savedUser.email, verificationLink);

        const { password, ...safeUser } = savedUser;
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

    async passwordReset(email: string) {
        const user = await this.userRepository.findOne({ where: { email: email } });
        if (!user) throw new NotFoundException(`${email} is not a registered account`);
        const token = await this.jwtService.signAsync({ userId: user.id },
            {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '15m'
            })
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const resetLink = `${frontendUrl}/reset-password?token=${token}`;

        await this.queueAuthentication.queuePasswordReset(user.email, resetLink);
        return { message: `A password reset mail has been sent to your email` };
    }
}