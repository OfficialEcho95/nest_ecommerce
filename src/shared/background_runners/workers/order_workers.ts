import { Worker } from 'bullmq';
import { transporter } from 'nodemailer.setup';
import { RedisServer } from 'redisServer';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class OrderWorkers {
    public orderWorker: Worker;
    constructor(private redisServer: RedisServer) {
        this.orderWorker = new Worker('order',
            async job => {
                switch (job.name) {
                    case 'create-order':
                        return this.createOrder(job.data);
                    case 'cancel-order':
                        return this.cancelOrder(job.data);
                    default:
                        console.log(`No handler for job name: ${job.name}`);
                }
            },
            { connection: this.redisServer.getConnection() }
        )
        this.orderWorker.on('completed', (job) => {
            console.log(`Job with id ${job.id} has been completed`);
        });

        this.orderWorker.on('failed', (job, err) => {
            console.log(`Job with id ${job?.id} has failed with ${err.message}`);
        });
    }

    createOrder({ orderId, fullname, email, fullvariant, totalPrice }) {
        transporter.sendMail({
            from: 'Nest E-Commerce 👻 <no-reply@nest-commerce.test>',
            to: email,
            subject: 'Order Created ✔',
            text: `
            Dear ${fullname},
            Your order with ID ${orderId} has been successfully created.
            The details of your order are:  ${fullvariant}.
            `,
            html: `
        <p>Dear <strong>${fullname}</strong>,</p>
        <p>Your order with ID <b>${orderId}</b> has been successfully created.</p>
        <p>Details: ${fullvariant}</p>
        <p> Bringing your total price to ${totalPrice}
        <p>Thank you for shopping with us!</p>
      `,
        })
        console.log(`🛒 Sent order confirmation for order ID ${orderId}`);
    }


    cancelOrder({ orderId, fullname, email, fullvariant }) {
        transporter.sendMail({
            from: 'Nest E-Commerce 👻 <no-reply@nest-commerce.test>',
            to: email,
            subject: 'Order Created ✔',
            text: `
            Dear ${fullname},
            Your order with ID ${orderId} has been successfully created.
            The details of your order are:  ${fullvariant}.
            `,
            html: `
        <p>Dear <strong>${fullname}</strong>,</p>
        <p>Your order with ID <b>${orderId}</b> has been cancelled.</p>
        <p>Details: ${fullvariant}</p>
        <p>Thank you for shopping with us!</p>
      `,
        })
        console.log(`🛒 Sent order cancellation for order ID ${orderId}`);
    }
}