import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateOrders1762034883440 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "orders",
                columns: [
                    { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
                    { name: "shippingAddress", type: "json", isNullable: false },
                    { name: "paymentMethod", type: "varchar", length: "255", isNullable: false },
                    { name: "note", type: "text", isNullable: true },
                    { name: "totalPrice", type: "decimal", precision: 10, scale: 2, isNullable: false },
                    { name: "createdAt", type: "datetime", default: "CURRENT_TIMESTAMP" },
                    { name: "updatedAt", type: "datetime", default: "CURRENT_TIMESTAMP", onUpdate: "CURRENT_TIMESTAMP" },
                    { name: "paystackReference", type: "varchar", length: "255", isNullable: true },
                    { name: "status", type: "varchar", length: "50", default: "'pending'" },
                    { name: "paymentStatus", type: "varchar", length: "50", default: "'pending'" },
                    { name: "userId", type: "int", isNullable: false },
                ],
            })
        );

        await queryRunner.createForeignKey(
            "orders",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // const table = await queryRunner.getTable("orders");
        // const foreignKey = table!.foreignKeys.find(fk => fk.columnNames.indexOf("userId") !== -1);
        // if (foreignKey) await queryRunner.dropForeignKey("orders", foreignKey);
        // await queryRunner.dropTable("orders");
    }
}
