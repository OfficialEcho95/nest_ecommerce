import { Worker } from "bullmq";
import { transporter } from "nodemailer.setup";
import { RedisServer } from "redisServer";
import { Injectable } from '@nestjs/common';

@Injectable() 
export class AuthenticationWorkers {
    public registrationWorker: Worker;
    constructor(private redisServer: RedisServer) {
        this.registrationWorker = new Worker('authentication',
            async job => {
                switch (job.name) {
                    case 'new-user-registration':
                        const { email, message } = job.data;
                        return this.newUserRegistration(email, message);
                    case 'password-reset':
                        return this.passwordReset(job.data);
                    case 'email-verification':
                        return this.emailVerification(job.data);
                    case 'successful-login-notification':
                        return this.successfulLoginNotification(job.data);
                    default:
                        console.log(`No handler for job name: ${job.name}`);
                }
            },
            { connection: this.redisServer.getConnection() }
        )

        this.registrationWorker.on('completed', (job) => {
            console.log(`Job with id ${job.id} has been completed`);
        });

        this.registrationWorker.on('failed', (job, err) => {
            console.log(`Job with id ${job?.id} has failed with ${err.message}`);
        });
    }

    async newUserRegistration(email: string, message: string) {
        await transporter.sendMail({
            from: "Nest E-Commerce 👻 <noreply@nestecommerce.com>",
            to: email,
            subject: "Welcome to Nest E-Commerce ✔",
            text: message,
            html: `<b>${message}</b>`,
        })
        console.log(`✅ Sent welcome email to ${email}`);
    }

    async passwordReset({ email, token }) {
        await transporter.sendMail({
            from: "Nest E-Commerce 👻 <noreply@nestecommerce.com>",
            to: email,
            subject: "Password Reset Request ✔",
            text: `Use this token to reset your password: ${token}`,
            html: `<b>Use this token to reset your password: ${token}</b>`,
        })
        console.log(`✅ Sent password reset to ${email}`);
    }

    async emailVerification({ email, token }) {
        await transporter.sendMail({
            from: "Nest E-Commerce 👻 <>",
            to: email,
            subject: "Email Verification ✔",
            text: `Use this token to verify your email: ${token}`,
            html: `<b>Use this token to verify your email: ${token}</b>`,
        })

        console.log(`✅ Sent email verification to ${email}`);
    } 


    async successfulLoginNotification({ email }) {
        await transporter.sendMail({
            from: "Nest E-Commerce 👻 <>",
            to: email,
            subject: "Successful Login Notification ✔",
            text: `Your account was logged into at ${Date.now}. If its not you please click the link to block your account`,
            html: `<b>You have successfully logged in to your account.</b>`,
        })

        console.log(`✅ Sent successful login notification to ${email}`);
    }
}