import {
    Controller,
    Get,
    Post,
    Patch,
    Param,
    Body,
    Delete,
    Query,
    ParseIntPipe,
} from '@nestjs/common';
import { ShipmentService } from '../service/shipment.service';

@Controller('shipments')
export class ShipmentController {
    constructor(private readonly shipmentService: ShipmentService) { }

    // Create a shipment
    @Post('create-shipment')
    async create(
        @Body('orderId') orderId: number,
        @Body('courier') courier: string) {
        return this.shipmentService.createShipment(orderId, courier);
    }

    // List all shipments (with optional filters)
    @Get()
    async findAll(@Query('status') status?: string, @Query('orderId') orderId?: number) {
        return this.shipmentService.findAll();
    }

    // Get a single shipment by ID
    @Get(':id')
    async findOne(@Param('id', ParseIntPipe) id: number) {
        return this.shipmentService.findOne(id);
    }

    // Update shipment details (like address, status, etc.)
    // @Patch(':id')
    // async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateShipmentDto) {
    //     return this.shipmentService.update(id, dto);


    // Mark shipment as delivered or change its status
    // @Patch(':id/status')
    // async updateStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    //     return this.shipmentService.updateStatus(id, status);
    // }

    // Delete shipment (soft delete)
    // @Delete(':id')
    // async remove(@Param('id', ParseIntPipe) id: number) {
    //     return this.shipmentService.remove(id);
    // }
}
