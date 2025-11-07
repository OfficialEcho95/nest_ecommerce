import { Worker } from 'bullmq';
import { RedisServer } from 'redisServer';
import { transporter } from 'nodemailer.setup';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { Injectable } from '@nestjs/common';
import pdf from 'pdf-parse';

@Injectable()
export class InvoiceWorker {
    private invoiceWorker: Worker;

    constructor(
        private redisServer: RedisServer,
    ) {
        this.invoiceWorker = new Worker('invoice', async job => {
            await this.handleJob(job);
        }, { connection: this.redisServer.getConnection() });
        this.registerListeners();
    }

    private async handleJob(job) {
        switch (job.name) {
            case 'generate-invoice':
                return this.generateInvoice(job.data);

            case 'email-invoice':
                return this.emailInvoice(job.data);
        }
    }

    private registerListeners() {
        this.invoiceWorker.on('completed', (job) => {
            console.log(`Job ${job.name} has completed for ${job.data.orderId}`);
        }
        );

        this.invoiceWorker.on('failed', (job, err) =>
            console.error(`❌ Job "${job?.name}" failed: ${err?.message}`)
        );
    }

    async generateInvoice({ orderId, userEmail }: { orderId: number, userEmail: string }) {
        const filePath = path.resolve(`./invoices/invoice-${orderId}.pdf`)
        const doc = new PDFDocument();
        fs.mkdirSync('./invoices', { recursive: true });
        doc.pipe(fs.createWriteStream(filePath))

        doc.fontSize(25).text('Invoice', { align: 'center' });
        doc.moveDown();
        doc.text('Order ID:', orderId);
        doc.text(`User Email: ${userEmail}`);
        doc.text(`Date: ${new Date().toLocaleDateString}`);
        doc.moveDown();
        doc.text('Thank you for your purchase!', { align: 'center' });
        doc.end();

        console.log(`Invoice generated for order ${orderId} at ${filePath}`);

        const invoiveQueue = new (require('../queues/invoice.queue').InvoiceQueue)(this.redisServer);
        await invoiveQueue.queueInvoiceEmail(orderId, userEmail, filePath);
    }

    async emailInvoice({ orderId, userEmail, filePath }: { orderId: number, userEmail: string, filePath: string }) {
        await transporter.sendMail({
            from: `Nest E-commerce <noreply@nest.commerce.email>`,
            to: userEmail,
            subject: `Your Invoice for Order #${orderId}`,
            text: `Dear Customer,\n\nPlease find attached the invoice for your recent order #${orderId}.\n\nThank you for shopping with us!\n\nBest regards,\nNest E-commerce Team`,
            attachments: [
                {
                    filename: `invoice-${orderId}.pdf`, path: filePath
                }]
        });
        console.log(`📧 Invoice emailed to ${userEmail} for order ${orderId}`);
    }
}