const { GatewayIntentBits } = require('discord.js');

const REQUIRED_INTENTS = {
    'guildCreate': GatewayIntentBits.Guilds,
    'guildUpdate': GatewayIntentBits.Guilds,
    'guildDelete': GatewayIntentBits.Guilds,
    'channelCreate': GatewayIntentBits.Guilds,
    'channelUpdate': GatewayIntentBits.Guilds,
    'channelDelete': GatewayIntentBits.Guilds,
    'channelPinsUpdate': GatewayIntentBits.Guilds,
    'threadCreate': GatewayIntentBits.Guilds,
    'threadUpdate': GatewayIntentBits.Guilds,
    'threadDelete': GatewayIntentBits.Guilds,
    'threadListSync': GatewayIntentBits.Guilds,
    'threadMemberUpdate': GatewayIntentBits.Guilds,
    'threadMembersUpdate': GatewayIntentBits.Guilds,
    'stageInstanceCreate': GatewayIntentBits.Guilds,
    'stageInstanceUpdate': GatewayIntentBits.Guilds,
    'stageInstanceDelete': GatewayIntentBits.Guilds,
    'guildMemberAdd': GatewayIntentBits.GuildMembers,
    'guildMemberUpdate': GatewayIntentBits.GuildMembers,
    'guildMemberRemove': GatewayIntentBits.GuildMembers,
    'threadMembersUpdate': GatewayIntentBits.GuildMembers,
    'guildAuditLogEntryCreate': GatewayIntentBits.GuildModeration,
    'guildBanAdd': GatewayIntentBits.GuildModeration,
    'guildBanRemove': GatewayIntentBits.GuildModeration,
    'guildEmojisUpdate': GatewayIntentBits.GuildEmojisAndStickers,
    'guildStickersUpdate': GatewayIntentBits.GuildEmojisAndStickers,
    'guildIntegrationsUpdate': GatewayIntentBits.GuildIntegrations,
    'integrationCreate': GatewayIntentBits.GuildIntegrations,
    'integrationUpdate': GatewayIntentBits.GuildIntegrations,
    'integrationDelete': GatewayIntentBits.GuildIntegrations,
    'webhooksUpdate': GatewayIntentBits.GuildWebhooks,
    'inviteCreate': GatewayIntentBits.GuildInvites,
    'inviteDelete': GatewayIntentBits.GuildInvites,
    'voiceStateUpdate': GatewayIntentBits.GuildVoiceStates,
    'presenceUpdate': GatewayIntentBits.GuildPresences,
    'messageCreate': GatewayIntentBits.GuildMessages | GatewayIntentBits.DirectMessages | GatewayIntentBits.MessageContent,
    'messageUpdate': GatewayIntentBits.GuildMessages | GatewayIntentBits.DirectMessages,
    'messageDelete': GatewayIntentBits.GuildMessages | GatewayIntentBits.DirectMessages,
    'messageDeleteBulk': GatewayIntentBits.GuildMessages,
    'messageReactionAdd': GatewayIntentBits.GuildMessageReactions,
    'messageReactionRemove': GatewayIntentBits.GuildMessageReactions,
    'messageReactionRemoveAll': GatewayIntentBits.GuildMessageReactions,
    'messageReactionRemoveEmoji': GatewayIntentBits.GuildMessageReactions,
    'typingStart': GatewayIntentBits.GuildMessageTyping,
    'channelPinsUpdate': GatewayIntentBits.GuildMessages,
    'guildScheduledEventCreate': GatewayIntentBits.GuildScheduledEvents,
    'guildScheduledEventUpdate': GatewayIntentBits.GuildScheduledEvents,
    'guildScheduledEventDelete': GatewayIntentBits.GuildScheduledEvents,
    'guildScheduledEventUserAdd': GatewayIntentBits.GuildScheduledEvents,
    'guildScheduledEventUserRemove': GatewayIntentBits.GuildScheduledEvents,
    'autoModerationRuleCreate': GatewayIntentBits.AutoModerationConfiguration,
    'autoModerationRuleUpdate': GatewayIntentBits.AutoModerationConfiguration,
    'autoModerationRuleDelete': GatewayIntentBits.AutoModerationConfiguration,
    'autoModerationActionExecution': GatewayIntentBits.AutoModerationExecution,
};

// Updated function
function checkMissingIntents(client) {
    const missingIntents = new Set();

    const intents = Number(client.options.intents.bitfield);

    // Check missing intents based on required intents for each event
    for (const eventName of Object.keys(client._events)) {
        const required = REQUIRED_INTENTS[eventName];
        if (!required) continue; 
        if ((intents & required) !== required) {
            missingIntents.add(required);
        }
    }

    if (missingIntents.size === 0) return;

    // Map intents to event names
    const EventNames = Object.fromEntries(
        Object.entries(REQUIRED_INTENTS).map(([eventName, intent]) => [intent, eventName])
    );

    const missingIntentNames = [...missingIntents].map(intent => {
        // Try to map intent value back to an event name, or display 'Unknown Intent' if not found
        return EventNames[intent] || `Unknown Intent (${intent})`;
    });

    console.warn('Warning: Missing intents detected:', missingIntentNames);
}

module.exports = { checkMissingIntents };

