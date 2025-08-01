const { EmbedBuilder } = require('discord.js'); 
const config = require('../../../config.json');

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        const channelId = config.logging.guildJoinLogsId;
        if (channelId === 'GUILD_JOIN_LOGS_CHANNEL_ID') return;
        if (channelId) {
            const channel = client.channels.cache.get(channelId);

            if (channel) {
                const memberCount = guild.memberCount;

                const embed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle(`Joined New Guild: ${guild.name}`)
                    .addFields(
                        { name: 'Total Members', value: `${memberCount}`, inline: true },
                        { name: 'Guild ID', value: `${guild.id}`, inline: true },
                    )
                    .setTimestamp()
                    .setFooter({ text: `Bot joined at` });

                if (guild.iconURL()) {
                    embed.setThumbnail(guild.iconURL());
                }

                try {
                    await channel.send({ embeds: [embed] });
                } catch (error) {
                    console.error(`Failed to send message to channel ${channelId}:`, error);
                }
            } else {
                console.error(`Channel with ID ${channelId} does not exist or is not a text channel for guild join logs.`);
            }
        } else {
            console.error('No channel ID specified for guild join logs in config.');
        }
    }
}
