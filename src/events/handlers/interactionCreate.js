const { Interaction, Permissions, EmbedBuilder } = require("discord.js");
const chalk = require("chalk");
const config = require('../../../config.json');
const path = require('path');

const errorsDir = path.join(__dirname, '../../../errors'); // Ensure correct path to the root

// Function to create the errors directory if it doesn't exist
function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

// Function to log errors to a file
function logErrorToFile(errorMessage) {
    ensureErrorDirectoryExists();
    
    // Create a unique filename based on the timestamp
    const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const filePath = path.join(errorsDir, fileName);

    // Save the error message to the file
    fs.writeFileSync(filePath, errorMessage, 'utf8');
}

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {

        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);

        if (!command) {
            console.log(chalk.yellow(`Command "${interaction.commandName}" not found.`));
            return;
        }

        if (command.adminOnly) {
            if (!config.bot.admins.includes(interaction.user.id)) {
                return await interaction.reply({
                    content: `This command is admin-only. You cannot run this command.`,
                    ephemeral: true
                });
            }
        }

        if (command.ownerOnly) {
            if (interaction.user.id !== config.bot.ownerId) {
                return await interaction.reply({
                    content: `This command is owner-only. You cannot run this command.`,
                    ephemeral: true
                });
            }
        }

        if (command.userPermissions) {
            const memberPermissions = interaction.member.permissions;
            const missingPermissions = command.userPermissions.filter(perm => !memberPermissions.has(perm));

            if (missingPermissions.length) {
                return await interaction.reply({
                    content: `You lack the necessary permissions to execute this command: **${missingPermissions.join(", ")}**`,
                    ephemeral: true
                });
            }
        }



        if (command.botPermissions) {
            const botPermissions = interaction.guild.members.me.permissions;
            const missingBotPermissions = command.botPermissions.filter(perm => !botPermissions.has(perm));
            if (missingBotPermissions.length) {
                return await interaction.reply({
                    content: `I lack the necessary permissions to execute this command: **${missingBotPermissions.join(", ")}**`,
                    ephemeral: true
                });
            }
        }

        const cooldowns = client.cooldowns || new Map();
        const now = Date.now();
        const cooldownAmount = (command.cooldown || 3) * 1000;
        const timestamps = cooldowns.get(command.name) || new Map();

        if (timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;
                return await interaction.reply({
                    content: `Please wait ${timeLeft.toFixed(1)} more second(s) before reusing the command.`,
                    ephemeral: true
                });
            }
        }

        timestamps.set(interaction.user.id, now);
        cooldowns.set(command.name, timestamps);

        try {
            await command.execute(interaction, client);
            // Create an embed to log the command execution
            const logEmbed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle('Command Executed')
                .addFields(
                    { name: 'User', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Command', value: `/${command.data.name}`, inline: true },
                    { name: 'Server', value: `${interaction.guild.name} (${interaction.guild.id})`, inline: true },
                    { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
                )
                .setTimestamp();

            // Send the embed to the specified logs channel
            if (config.logging.commandLogsChannelId) {
                const logsChannel = client.channels.cache.get(config.logging.commandLogsChannelId);
                if (logsChannel) {
                    await logsChannel.send({ embeds: [logEmbed] });
                } else {
                    console.error(chalk.yellow(`Logs channel with ID ${config.logging.commandLogsChannelId} not found.`));
                }
            }
        } catch (error) {
            console.error(chalk.red(`Error executing command "${command.data.name}":`), error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
            logErrorToFile(error)

        }
    },
};
