const chalk = require("chalk");
const config = require('../../../config.json');
const { EmbedBuilder } = require('discord.js');
const { getSimilarCommands } = require('../../functions/handlers/similarity');
const path = require('path')

const errorsDir = path.join(__dirname, '../../../errors');

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

function logErrorToFile(errorMessage) {
    ensureErrorDirectoryExists();
    
    const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const filePath = path.join(errorsDir, fileName);
    fs.writeFileSync(filePath, errorMessage, 'utf8');
}

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        const prefix = config.prefix.value;
        const content = message.content.toLowerCase();
        if (prefix === '') return;
        if (!content.startsWith(prefix) || message.author.bot) return;

        const args = content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        let command = client.prefix.get(commandName);
        if (!command) {
            command = Array.from(client.prefix.values()).find(
                (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
            );
        }

        if (!command) {
            console.log(chalk.yellow.bold('WARNING: ') + `Unknown command: "${commandName}"`);

            const similarCommands = getSimilarCommands(commandName, Array.from(client.prefix.values()));
            if (similarCommands.length > 0) {
                return await message.reply(`Command not found. Did you mean: ${similarCommands.join(', ')}?`);
            } else {
                return;
            }
        }

        if (!client.cooldowns) {
            client.cooldowns = new Map();
        }

        const now = Date.now();
        const cooldownAmount = (command.cooldown || 3) * 1000;

        if (!client.cooldowns.has(command.name)) {
            client.cooldowns.set(command.name, new Map());
        }

        const timestamps = client.cooldowns.get(command.name);

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return message.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the "${command.name}" command.`,
                });
            }
        }

        timestamps.set(message.author.id, now);

        if (command.adminOnly && !config.bot.admins.includes(message.author.id)) {
            return message.reply({
                content: `This command is admin-only. You cannot run this command.`,
            });
        }

        if (command.ownerOnly && message.author.id !== config.bot.ownerId) {
            return await message.reply({
                content: `This command is owner-only. You cannot run this command.`,
            });
        }

        if (command.userPermissions) {
            const memberPermissions = message.member.permissions;
            const missingPermissions = command.userPermissions.filter(perm => !memberPermissions.has(perm));
            if (missingPermissions.length) {
                return message.reply({
                    content: `You lack the necessary permissions to execute this command: **${missingPermissions.join(", ")}**`,
                });
            }
        }

        if (command.botPermissions) {
            const botPermissions = message.guild.members.me.permissions;
            const missingBotPermissions = command.botPermissions.filter(perm => !botPermissions.has(perm));
            if (missingBotPermissions.length) {
                return message.reply({
                    content: `I lack the necessary permissions to execute this command: **${missingBotPermissions.join(", ")}**`,
                });
            }
        }

        try {
            await command.run(client, message, args);
            const logEmbed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('Command Executed')
                .addFields(
                    { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'Command', value: `${config.prefix.value}${command.name}`, inline: true },
                    { name: 'Server', value: `${message.guild.name} (${message.guild.id})`, inline: true },
                    { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
                )
                .setTimestamp();

            if (config.logging.commandLogsChannelId) {
                const logsChannel = client.channels.cache.get(config.logging.commandLogsChannelId);
                if (logsChannel) {
                    await logsChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error(chalk.yellow(`Logs channel with ID ${config.logging.commandLogsChannelId} not found.`));
                }
            }
        } catch (error) {
            console.log(chalk.red.bold('ERROR: ') + `Failed to execute command "${commandName}".`);
            console.error(error);
            message.reply({
                content: 'There was an error while executing this command!',
            });
            logErrorToFile(error)

        }
    }
};
