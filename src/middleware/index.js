/**
 * Middleware functions for DiscoBase
 * Returns true to continue execution, false to stop.
 */
module.exports = {
    /**
     * Example: Check if the user is blacklisted
     * @param {import('discord.js').Interaction} interaction 
     */
    checkBlacklist: async (interaction) => {
        // Implement your blacklist logic here
        // const isBlacklisted = await db.blacklist.findOne({ userId: interaction.user.id });
        // if (isBlacklisted) {
        //     await interaction.reply({ content: 'You are blacklisted.', ephemeral: true });
        //     return false;
        // }
        return true;
    },

    /**
     * Example: Global maintenance mode
     * @param {import('discord.js').Interaction} interaction 
     */
    maintenanceMode: async (interaction) => {
        // const maintenance = false;
        // if (maintenance) {
        //      await interaction.reply({ content: 'Maintenance mode is on.', ephemeral: true });
        //      return false;
        // }
        return true;
    }
};