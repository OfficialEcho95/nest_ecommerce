import { Controller, Post, Param, Req, UseGuards, ParseIntPipe, Body, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { PaymentGateway } from '../services/payment.gateway';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrdersService } from '../services/orders.services';
import { Roles } from 'src/shared/decorators/roles.decorators';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { User } from '../../users/entities/users.entity';

@Controller('orders')
export class OrdersController {
  constructor(
    private paymentGateway: PaymentGateway,
    private readonly ordersService: OrdersService,
  ) { }


  @Post(':id/pay')
  async initializePayment(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: User,
  ) {
    return this.paymentGateway.initializePaystackTransaction(id, user);
  }


  @Post(':userId/create-order')
  async createOrder(@Param('userId', ParseIntPipe) userId: number, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto, userId);
  }

  @Post(':orderId/cancel')
  async cancelOrder(orderId: number, userId: number) {
    return this.ordersService.cancelOrder(orderId, userId);
  }

  @Roles('admin')
  @Get('order/:orderId')
  async getOrderById(orderId: number, userId: number) {
    return this.ordersService.getOrderById(orderId, userId);
  }

  @Get('user/:userId/orders')
  async getOrdersForUser(userId: number) {
    return this.ordersService.getUserOrders(userId);
  }

  @Get('admin/all-orders')
  @Roles('admin')
  async getAllOrders() {
    return this.ordersService.adminGetAllOrders();
  }

  @Get('admin/order/:orderId')
  @Roles('admin')
  async adminGetOrderById(orderId: number) {
    return this.ordersService.adminGetOrderById(orderId);
  }

  @Get('all-completed-orders')
  @Roles('admin')
  async getAllCompletedOrders() {
    return this.ordersService.getAllCompletedOrders();
  }

}