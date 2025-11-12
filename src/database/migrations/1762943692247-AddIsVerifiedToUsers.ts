import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddIsVerifiedToUsers1762943692247 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.addColumn('Users', new TableColumn({
            name: 'isVerified',
            type: 'tinyint',
            default: 0
        }));

    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
