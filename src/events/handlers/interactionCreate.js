const { Interaction, Permissions } = require("discord.js");
const chalk = require("chalk");
const config = require('../../../config.json');

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
        } catch (error) {
            console.error(chalk.red(`Error executing command "${command.name}":`), error);
            await interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        }
    },
};
