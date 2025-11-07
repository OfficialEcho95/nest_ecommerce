import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateOrderItems1762076972261 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "order_items",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "orderId",
                        type: "int",
                    },
                    {
                        name: "variantId",
                        type: "int",
                    },
                    {
                        name: "quantity",
                        type: "int",
                        default: 1,
                    },
                ],
            })
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            "order_items",
            new TableForeignKey({
                columnNames: ["orderId"],
                referencedColumnNames: ["id"],
                referencedTableName: "orders",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "order_items",
            new TableForeignKey({
                columnNames: ["variantId"],
                referencedColumnNames: ["id"],
                referencedTableName: "productvariants",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("order_items");
    }
}
