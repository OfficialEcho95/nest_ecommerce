<h1 align="center">🛍️ Nest E-Commerce Backend</h1>

<p align="center">
  <b>A modern, scalable, and production-ready E-Commerce API built with NestJS.</b><br/>
  Featuring payments, background jobs, email notifications, and modular architecture.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-v10-red?logo=nestjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/MySQL-8.0-orange?logo=mysql&logoColor=white" />
  <img src="https://img.shields.io/badge/BullMQ-Queue-red?logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg" />
</p>

---

## 🚀 Features

### 🧩 Core Modules

- **Users & Auth**
  - JWT authentication (register, login, guards)
  - Role-based access (Admin, Customer)
- **Products & Categories**
  - Full CRUD operations
  - Product variants (e.g., color, size)
  - Image uploads with file storage linking
- **Orders**
  - Order creation, payments, and automatic status updates
  - Linked order items, shipment tracking, and invoice generation
- **Shipments**
  - Shipment creation with courier + tracking number
  - Auto email notifications for “Shipped” and “Delivered”
  - Background processing via BullMQ Workers
- **Payments**
  - Paystack integration with webhook verification
  - Auto invoice generation + PDF email
- **Reviews**
  - Product review and rating system linked to authenticated users

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|-------------|
| **Framework** | [NestJS](https://nestjs.com/) |
| **ORM** | [TypeORM](https://typeorm.io/) |
| **Database** | MySQL |
| **Queue** | BullMQ + Redis |
| **Mailer** | Nodemailer |
| **Payment Gateway** | Paystack |
| **PDF Generation** | PDFKit / ReportLab |
| **Environment** | dotenv |
| **Language** | TypeScript |

---

## 🧠 Architecture Overview

This project follows **Domain-Driven Design (DDD)** principles.


Each module includes:
- **Controller** → API endpoints  
- **Service** → Business logic  
- **Entity** → Database model  
- **Repository** → Data access abstraction  

---

## 🔄 Background Jobs

All long-running or asynchronous tasks are processed via **BullMQ workers** (Redis-backed).

**Examples**
- Shipment processing  
- Sending email notifications  
- Invoice generation  
- Stock alerts  

```ts
// Example queue dispatch
await this.shipmentQueue.add('process-shipment', {
  orderId,
  shipmentId,
});


🧾 Example Workflow

User places an order → Order stored in DB

Payment processed via Paystack → Paystack webhook hits /paystack/webhook

Order marked as PAID

Job queued → Generate and send invoice

Shipment created → Worker sends shipment notification

Delivery confirmed → Worker marks order as DELIVERED



Installation & Setup

git clone https://github.com/yourusername/nest-ecommerce.git
cd nest-ecommerce


npm install

Create .env file in project root:

DATABASE_URL=mysql://root:password@localhost:3306/nest_shop
REDIS_URL=redis://localhost:6379
PAYSTACK_SECRET=sk_test_***
MAIL_USER=youremail@example.com
MAIL_PASS=yourpassword


Run migrations:
npm run migration:run


API Testing

Use Thunder Client or Postman to test endpoints.

Example order creation payload:

{
  "userId": 1,
  "items": [
    { "variantId": 2, "quantity": 1 },
    { "variantId": 5, "quantity": 2 }
  ],
  "address": "123 Ikoyi Crescent, Lagos",
  "paymentMethod": "paystack"
}

Paystack Webhook Payload (charge.success)
{
  "event": "charge.success",
  "data": {
    "id": 2858393021,
    "domain": "live",
    "status": "success",
    "reference": "order_8_1762960588327",
    "amount": 500000,
    "gateway_response": "Successful",
    "paid_at": "2025-11-12T15:39:36.000Z",
    "created_at": "2025-11-12T15:38:58.000Z",
    "channel": "card",
    "currency": "NGN",
    "customer": {
      "email": "officialecho95@outlook.com",
      "first_name": "Emmanuel",
      "last_name": "Chukwu"
    },
    "authorization": {
      "authorization_code": "AUTH_98abc123xyz",
      "card_type": "visa",
      "last4": "4242",
      "bank": "Test Bank"
    },
    "metadata": {
      "orderId": 8
    }
  }
}


Key Concepts Demonstrated

Repository injection and clean DI architecture

Queue-based async processing (BullMQ)

Real-world payment lifecycle (Paystack webhook → order → invoice → email)

Shipment workflow automation

Scalable, modular NestJS structure

Secure config with environment isolation

Author


**Emmanuel Chukwu**  
💼 Backend Developer | Node.js | NestJS | TypeScript  
📧 <a href="mailto:officialecho95@outlook.com">officialecho95@outlook.com</a>

<p align="center">
  <a href="https://www.linkedin.com/in/emmanuelchukwu">
    <img src="https://img.shields.io/badge/LinkedIn-Connect-blue?logo=linkedin&logoColor=white" />
  </a>
  <a href="mailto:officialecho95@outlook.com">
    <img src="https://img.shields.io/badge/Email-Contact-blueviolet?logo=gmail&logoColor=white" />
  </a>
</p>



