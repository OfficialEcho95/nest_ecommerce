import { MigrationInterface, QueryRunner } from "typeorm";

export class InitSchema1762033780362 implements MigrationInterface {
    name = 'InitSchema1762033780362'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`Users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstname\` varchar(255) NOT NULL, \`lastname\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`address\` varchar(255) NULL, \`role\` enum ('customer', 'admin') NOT NULL DEFAULT 'customer', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_3c3ab3f49a87e6ddb607f3c494\` (\`email\`), UNIQUE INDEX \`IDX_f0444b8b5c111257c300932ae0\` (\`phone\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ProductVariants\` (\`id\` int NOT NULL AUTO_INCREMENT, \`attributes\` json NULL, \`price\` decimal(10,2) NULL, \`stock\` int NOT NULL DEFAULT '0', \`isActive\` tinyint NOT NULL DEFAULT 1, \`productId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ProductImages\` (\`id\` int NOT NULL AUTO_INCREMENT, \`url\` varchar(255) NOT NULL, \`isPrimary\` tinyint NOT NULL DEFAULT 0, \`productId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Categories\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`slug\` varchar(255) NOT NULL, \`parentId\` int NULL, UNIQUE INDEX \`IDX_9004ab74b495518b3dee4f4222\` (\`name\`), UNIQUE INDEX \`IDX_4fc9f1db5657ede0bb675defb2\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`Products\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`brand\` varchar(255) NOT NULL, \`stock\` int NOT NULL, \`description\` longtext NULL, \`price\` decimal(10,2) NULL, \`isPublished\` tinyint NOT NULL DEFAULT 1, \`isDeleted\` tinyint NOT NULL DEFAULT 0, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`deletedAt\` datetime(6) NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`orders\` (\`id\` int NOT NULL AUTO_INCREMENT, \`shippingAddress\` json NOT NULL, \`paymentMethod\` varchar(255) NOT NULL, \`note\` varchar(255) NULL, \`totalPrice\` decimal(10,2) NOT NULL DEFAULT '0.00', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`paystackReference\` varchar(255) NULL, \`status\` varchar(255) NOT NULL DEFAULT 'PENDING', \`paymentStatus\` varchar(255) NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`order_items\` (\`id\` int NOT NULL AUTO_INCREMENT, \`variantId\` int NOT NULL, \`quantity\` int NOT NULL, \`orderId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`ProductVariants\` ADD CONSTRAINT \`FK_7c4521c94aa173082862f2937c0\` FOREIGN KEY (\`productId\`) REFERENCES \`Products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`ProductImages\` ADD CONSTRAINT \`FK_a91f39a09b3c73a91cd5308e0c7\` FOREIGN KEY (\`productId\`) REFERENCES \`Products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`review\` ADD CONSTRAINT \`FK_2a11d3c0ea1b2b5b1790f762b9a\` FOREIGN KEY (\`productId\`) REFERENCES \`Products\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`review\` ADD CONSTRAINT \`FK_1337f93918c70837d3cea105d39\` FOREIGN KEY (\`userId\`) REFERENCES \`Users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`orders\` ADD CONSTRAINT \`FK_151b79a83ba240b0cb31b2302d1\` FOREIGN KEY (\`userId\`) REFERENCES \`Users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`order_items\` ADD CONSTRAINT \`FK_f1d359a55923bb45b057fbdab0d\` FOREIGN KEY (\`orderId\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`products_categories_categories\` ADD CONSTRAINT \`FK_40e7da0284a5389344605de8dab\` FOREIGN KEY (\`productsId\`) REFERENCES \`Products\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE \`products_categories_categories\` ADD CONSTRAINT \`FK_e1d833224b5be535323207473f1\` FOREIGN KEY (\`categoriesId\`) REFERENCES \`Categories\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`products_categories_categories\` DROP FOREIGN KEY \`FK_e1d833224b5be535323207473f1\``);
        await queryRunner.query(`ALTER TABLE \`products_categories_categories\` DROP FOREIGN KEY \`FK_40e7da0284a5389344605de8dab\``);
        await queryRunner.query(`ALTER TABLE \`order_items\` DROP FOREIGN KEY \`FK_f1d359a55923bb45b057fbdab0d\``);
        await queryRunner.query(`ALTER TABLE \`orders\` DROP FOREIGN KEY \`FK_151b79a83ba240b0cb31b2302d1\``);
        await queryRunner.query(`ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_1337f93918c70837d3cea105d39\``);
        await queryRunner.query(`ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_2a11d3c0ea1b2b5b1790f762b9a\``);
        await queryRunner.query(`ALTER TABLE \`ProductImages\` DROP FOREIGN KEY \`FK_a91f39a09b3c73a91cd5308e0c7\``);
        await queryRunner.query(`ALTER TABLE \`ProductVariants\` DROP FOREIGN KEY \`FK_7c4521c94aa173082862f2937c0\``);
        await queryRunner.query(`DROP TABLE \`order_items\``);
        await queryRunner.query(`DROP TABLE \`orders\``);
        await queryRunner.query(`DROP TABLE \`Products\``);
        await queryRunner.query(`DROP INDEX \`IDX_4fc9f1db5657ede0bb675defb2\` ON \`Categories\``);
        await queryRunner.query(`DROP INDEX \`IDX_9004ab74b495518b3dee4f4222\` ON \`Categories\``);
        await queryRunner.query(`DROP TABLE \`Categories\``);
        await queryRunner.query(`DROP TABLE \`ProductImages\``);
        await queryRunner.query(`DROP TABLE \`ProductVariants\``);
        await queryRunner.query(`DROP INDEX \`IDX_f0444b8b5c111257c300932ae0\` ON \`Users\``);
        await queryRunner.query(`DROP INDEX \`IDX_3c3ab3f49a87e6ddb607f3c494\` ON \`Users\``);
        await queryRunner.query(`DROP TABLE \`Users\``);
    }

}
