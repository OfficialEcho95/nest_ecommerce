import { Queue } from 'bullmq';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class QueueAuthentication {

    public authenticationQueue: Queue;

    constructor(private redisServer: RedisServer) {
        this.authenticationQueue = new Queue('authentication', {
            connection: this.redisServer.getConnection()
        })
    }

    async queueNewUserRegistration (email: string, message: string) {
        await this.authenticationQueue.add('new-user-registration', { email, message });
    };

    async queuePasswordReset (email:string, token: string) {
        await this.authenticationQueue.add('password-reset', { email, token });
    };

    async queueEmailVerification (email:string, token: string) {
        await this.authenticationQueue.add('email-verification', { email, token });
    }

    async successfulLoginNotification (email:string) {
        await this.authenticationQueue.add('successful-login-notification', { email });
    }
}
