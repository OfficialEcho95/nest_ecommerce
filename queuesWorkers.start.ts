import fs from 'fs';
import path from 'path';
import { RedisServer } from './redisServer';

// this class imports all queues and workers dynamically
export class QueuesAndWorkersStarter {
  static start() {
    const redisServer = new RedisServer();

    const loadDir = (dir: string) => {
      const dirPath = path.join(__dirname, 'src', 'shared', 'background_runners', dir);

      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️ Directory not found: ${dirPath}`);
        return;
      }

      fs.readdirSync(dirPath)
        .filter(file => file.endsWith('.js') || file.endsWith('.ts') && !file.endsWith('.d.ts'))
        .forEach(file => {
          const modulePath = path.join(dirPath, file);
          const imported = require(modulePath);

          for (const key in imported) {
            const ClassRef = imported[key];
            if (typeof ClassRef === 'function') {
              try {
                new ClassRef(redisServer);
              } catch (err) {
                console.error(`❌ Error initializing ${key}:`, err.message);
              }
            }
          }
        });
    };

    loadDir('queues');
    loadDir('workers');

    console.log('✅ All queues and workers loaded dynamically');
  }
}

QueuesAndWorkersStarter.start();
