//! This is a basic structure for a slash command in a discoBase using discord.js


const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    //! The 'data' property defines the slash command's structure using SlashCommandBuilder.
    data: new SlashCommandBuilder()
        //* Name of the slash command. In this case, the command will be '/ping'.
        .setName('ping')

        //* A short description of what the command does, shown when users type '/ping' in Discord.
        .setDescription('This is the ping command.'),

    //? Optional: Permissions that the bot requires to execute the command.
    //? botPermissions: ['SendMessages'], // Example: bot needs permission to send messages.

    //? Optional: Permissions that the user requires to use this command. Uncomment if needed.
    //? userPermissions: ['ManageMessages'], // Example: Only users with Manage Messages permission can use this command.

    //? Optional: Set this to true if only bot admins can use this command.
    //? adminOnly: true,

    //? Optional: Set this to true if only the bot owner can use this command.
    //? ownerOnly: true,

    //? Optional: Set this to true if only developers can use this command.
    //? devOnly: true, so if this true this slash command will only register for the server IDs you provided in config.json

    //? Optional: Cooldown period for the command in seconds to prevent spam.
    //? cooldown: 10,

    //! The 'execute' function is where the main logic for the command is placed.
    async execute(interaction, client) {
        try {
           
            const ping = Date.now() - interaction.createdTimestamp;
            const latency = Math.abs(ping);
            const latencyFormatted = `${latency.toString().substring(0, 2)}ms`;
            const emoji = "⏱️";

            await interaction.reply(`${emoji} Pong! Latency is ${latencyFormatted}!`);
        } catch (error) {
            console.error('An error occurred while executing the command:', error);
        }
    }
};
