import { BadRequestException, Body, Controller, NotFoundException, Post, Req } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { CreateUserDto } from "./dto/create-dto.users";
import { Public } from "src/shared/decorators/public.decorators";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { User } from "../users/entities/users.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { QueueAuthentication } from "src/shared/background_runners/queues/authentication.queue";

@Controller('auth')
export class AuthController {
    constructor(
        @InjectRepository(User) private userRepo: Repository<User>,
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        private configService: ConfigService,
        private queueAuthentication: QueueAuthentication,

    ) { }

    @Public()
    @Post('register')
    create(@Body() createUserDto: CreateUserDto) {
        return this.authService.create(createUserDto);
    }


    @Public()
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto)
    }

    @Public()
    @Post('verify-email')
    async verifyEmail(@Body('token') token: string) {
        try {
            const decoded = await this.jwtService.verifyAsync(
                token, { secret: this.configService.get('JWT_SECRET') }
            )

            const user = await this.userRepo.findOneBy({ id: decoded.userId });
            if (!user) throw new NotFoundException("User not found")

            user.isVerified = true;
            await this.userRepo.save(user);
            await this.queueAuthentication.queueNewUserRegistration(user.email, '✅ Email successfully verified!')

            return { message: '✅ Email successfully verified!' }
        } catch (error) {
            throw new BadRequestException('Invalid or expired token');
        }
    }


    @Post('password-reset')
    async passwordReset(
        @Body('token') token: string,
        @Body('newPassword') newPassword: string
    ) {
         try {
            const decoded = await this.jwtService.verifyAsync(
                token, { secret: this.configService.get('JWT_SECRET') }
            )

            const user = await this.userRepo.findOneBy({ id: decoded.userId });
            if (!user) throw new NotFoundException("User not found")

            user.password = newPassword;
            const {password, ...safeUser} = user;

            await this.userRepo.save(safeUser);
            return { message: '✅ Password successfully changed!' }
        } catch (error) {
            throw new BadRequestException('Invalid or expired token');
        }
    }
}
