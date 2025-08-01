const config = require('../../../config.json');
const mongoose = require('mongoose');
const chalk = require('chalk');
const { ActivityType } = require('discord.js');
const { prefixHandler } = require('../../functions/handlers/prefixHandler');
const { handleCommands } = require('../../functions/handlers/handleCommands');
const path = require('path');
const gradient = require('gradient-string').default;
const fs = require('fs');

const errorsDir = path.join(__dirname, '../../../errors');

// Helper function to update presence based on name rotation
function updatePresence(client, config, nameIndex) {
    try {
        // Map string activity types to Discord.js ActivityType enum
        const activityTypeMap = {
            'PLAYING': ActivityType.Playing,
            'STREAMING': ActivityType.Streaming,
            'LISTENING': ActivityType.Listening,
            'WATCHING': ActivityType.Watching,
            'COMPETING': ActivityType.Competing,
            'CUSTOM': ActivityType.Custom
        };
        
        // Validate status
        const validStatusTypes = ['online', 'idle', 'dnd', 'invisible'];
        const status = validStatusTypes.includes(config.status?.toLowerCase()) 
            ? config.status.toLowerCase() 
            : 'online';
        
        // Get the activity type
        const type = activityTypeMap[config.type] || ActivityType.Playing;
        
        // Get the current name from rotation
        const name = config.names[nameIndex] || 'DiscoBase';
        
        // Create the activity object
        const presenceActivity = {
            type: type,
            name: name
        };
        
        // Handle special activity types
        if (type === ActivityType.Streaming && config.streamingUrl) {
            // Validate streaming URL
            if (config.streamingUrl.includes('twitch.tv') || config.streamingUrl.includes('youtube.com')) {
                presenceActivity.url = config.streamingUrl;
            } else {
                presenceActivity.url = 'https://www.twitch.tv/discobase';
                logWithStyle('WARNING', 'Invalid streaming URL. Using default.');
            }
        } else if (type === ActivityType.Custom && config.customState) {
            presenceActivity.state = config.customState;
        }
        
        // Set the presence (only changes the name to minimize rate limiting)
        client.user.setPresence({
            activities: [presenceActivity],
            status: status
        });
        
        logWithStyle('INFO', `Updated presence: ${config.type} "${name}" (${status})`);
    } catch (error) {
        logWithStyle('ERROR', 'Failed to update presence');
        logErrorToFile(error);
    }
}

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

function logErrorToFile(error) {
    try {
        // Check if error logging is enabled in discobase.json
        const discobasePath = path.join(__dirname, '../../../discobase.json');
        if (fs.existsSync(discobasePath)) {
            const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
            if (discobaseConfig.errorLogging && discobaseConfig.errorLogging.enabled === false) {
                // Error logging is disabled, do nothing
                return;
            }
        }
        
        ensureErrorDirectoryExists();

        const errorMessage = `${error.name}: ${error.message}\n${error.stack}`;
        const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
        const filePath = path.join(errorsDir, fileName);

        fs.writeFileSync(filePath, errorMessage, 'utf8');
    } catch (err) {
        // If there's an error while logging the error, just silently fail
        // We don't want errors in error logging to cause more issues
    }
}

function logWithStyle(status, message) {
    const timestamp = chalk.gray(`[${new Date().toLocaleTimeString([], { hour12: true })}]`);

    let icon = '';
    let colorStatus;

    switch (status) {
        case 'SUCCESS':
            icon = '✓';
            colorStatus = chalk.green.bold(` ${icon} ${status} `);
            break;
        case 'INFO':
            icon = 'ℹ';
            colorStatus = chalk.blue.bold(` ${icon} ${status} `);
            break;
        case 'WARNING':
            icon = '⚠';
            colorStatus = chalk.yellow.bold(` ${icon} ${status} `);
            break;
        case 'ERROR':
            icon = '✖';
            colorStatus = chalk.red.bold(` ${icon} ${status} `);
            break;
        default:
            icon = '•';
            colorStatus = chalk.white.bold(` ${icon} ${status} `);
    }

}

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        logWithStyle('SUCCESS', 'Bot is ready and connected to Discord!');

        if (!config.database.mongodbUrl || config.database.mongodbUrl === 'YOUR_MONGODB_URL') {
            logWithStyle('INFO', 'MongoDB URL is not provided or is set to the default placeholder. Skipping MongoDB connection.');
        } else {
            try {
                await mongoose.connect(config.database.mongodbUrl);
                if (mongoose.connect) {
                    console.log(
                        `${chalk.gray(`[${new Date().toLocaleTimeString([], { hour12: true })}]`)} ${gradient(['#caf0f8', '#90e0ef', '#0077b6'])('✓ CONNECTION │ Successfully connected to MongoDB! Database is ready.')}`
                      );
                }
            } catch (error) {
                logWithStyle('ERROR', 'Failed to connect to MongoDB. Please check your MongoDB URL and connection.');
                console.error(error);
                logErrorToFile(error);
            }
        }

        // Load presence configuration from discobase.json
        try {
            const discobasePath = path.join(__dirname, '../../../discobase.json');
            if (fs.existsSync(discobasePath)) {
                const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
                
                if (discobaseConfig.presence && discobaseConfig.presence.enabled) {
                    const presenceConfig = discobaseConfig.presence;
                    const names = presenceConfig.names || ['DiscoBase'];
                    const interval = presenceConfig.interval || 10000;
                    
                    // Set initial presence
                    updatePresence(client, presenceConfig, 0);
                    
                    // If there are multiple names, set up rotation
                    if (names.length > 1) {
                        let currentIndex = 0;
                        setInterval(() => {
                            currentIndex = (currentIndex + 1) % names.length;
                            updatePresence(client, presenceConfig, currentIndex);
                        }, interval);
                    }
                } else {
                    // Default presence if disabled or not configured
                    client.user.setPresence({
                        activities: [{
                            type: ActivityType.Custom,
                            name: 'custom',
                            state: '🚀 Made with discoBase!'
                        }],
                        status: 'online'
                    });
                }
            } else {
                // Default presence if discobase.json doesn't exist
                client.user.setPresence({
                    activities: [{
                        type: ActivityType.Custom,
                        name: 'custom',
                        state: '🚀 Made with discoBase!'
                    }],
                    status: 'online'
                });
            }
        } catch (error) {
            logWithStyle('ERROR', 'Failed to set custom presence. Using default.');
            logErrorToFile(error);
            // Default presence if there's an error
            client.user.setPresence({
                activities: [{
                    type: ActivityType.Custom,
                    name: 'custom',
                    state: '🚀 Made with discoBase!'
                }],
                status: 'online'
            });
        }

        prefixHandler(client, path.join(process.cwd(), 'src/messages'));
        handleCommands(client, path.join(process.cwd(), 'src/commands'));
    },
};
