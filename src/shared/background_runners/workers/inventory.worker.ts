import { RedisServer } from 'redisServer';
import { Worker } from 'bullmq';
import { transporter } from 'nodemailer.setup';
import { Injectable } from '@nestjs/common';

@Injectable() 
export class InventoryWorker {
    public inventoryWorker: Worker;
    constructor(
        private redisServer: RedisServer
    ) {
        this.inventoryWorker = new Worker(
            'inventory',
            async job => {
                switch (job.name) {
                    case 'notify-warehouse':
                        return this.notifyWarehouse(job.data);
                }
            },
            { connection: this.redisServer.getConnection() }
        )
    }

    async notifyWarehouse({ email, productName, stock }: { email: string[], productName: string, stock: number }) {
        await transporter.sendMail({
            from: `Nest E-commerce <noreply@nest.commerce.email>`,
            to: email,
            text: `
            <h2>⚠️ Low Stock Alert</h2>
        <p><b>Product:</b> ${productName}</p>
        <p><b>Remaining stock:</b> ${stock}</p>
        <p>If not restocked, this product will be unpublished soon.</p>
            `,
            subject: ` The current quantity of ${productName} is ${stock}, if product is not restocked, it will be unpublished`,
            html: ``
        })
        console.log(`📦 Sent low stock alert for ${productName}`); 
    }
}