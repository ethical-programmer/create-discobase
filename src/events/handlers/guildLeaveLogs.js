const { EmbedBuilder } = require('discord.js'); 
const config = require('../../../config.json');

module.exports = {
    name: 'guildDelete',
    async execute(guild, client) {
        const channelId = config.logging.guildLeaveLogsId;

        if (channelId) {
            const channel = client.channels.cache.get(channelId);

            if (channel || channelId !== 'GUILD_LEAVE_LOGS_CHANNEL_ID') {
                const memberCount = guild.memberCount;

                const embed = new EmbedBuilder()
                    .setColor('Red')
                    .setTitle(`Leave Guild: ${guild.name}`)
                    .addFields(
                        { name: 'Total Members', value: `${memberCount}`, inline: true },
                        { name: 'Guild ID', value: `${guild.id}`, inline: true },
                    )
                    .setTimestamp()
                    .setFooter({ text: `Bot leaved at` });

                if (guild.iconURL()) {
                    embed.setThumbnail(guild.iconURL());
                }

                try {
                    await channel.send({ embeds: [embed] });
                } catch (error) {
                    console.error(`Failed to send message to channel ${channelId}:`, error);
                }
            } else {
                console.error(`Channel with ID ${channelId} does not exist or is not a text channel for guild leave logs.`);
            }
        } else {
            console.error('No channel ID specified for guild leave logs in config.');
        }
    }
}
