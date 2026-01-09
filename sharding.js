const { ShardingManager } = require('discord.js');
const config = require('./config.json');
const chalk = require('chalk');

const manager = new ShardingManager('./src/index.js', { 
    token: config.bot.token,
    totalShards: 'auto' 
});

manager.on('shardCreate', shard => {
    console.log(chalk.blue(`[SHARD] Launched shard ${shard.id}`));
});

manager.spawn().catch(error => {
    console.error(chalk.red('[SHARDING ERROR] Failed to spawn shards:'), error);
});