//! This is a basic structure for a prefix command in a discoBase using discord.js

module.exports = {
    //* Required: Command name, used to trigger the command. Example: !ping
    name: "ping",

    //* Required: A brief description of what the command does, useful for help commands.
    description: "This is the ping command.",

    //* Optional: Aliases are alternative names for the command. Example: !p will also trigger the ping command.
    aliases: ['p'],

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

    // The run function is the main logic that gets executed when the command is called.
    run: async (client, message, args) => {
        const ping = Date.now() - message.createdTimestamp;

        const latency = Math.abs(ping); 
        const latencyFormatted = `${latency.toString().substring(0, 2)}ms`;
        const emoji = "⏱️"; 

        message.reply(`${emoji} Pong! Latency is ${latencyFormatted}!`);
    },
};
