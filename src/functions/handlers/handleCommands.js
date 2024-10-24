
const { REST, Routes, Collection } = require('discord.js');
const fs = require('fs');
const chalk = require('chalk');
const config = require('../../../config.json');
const path = require('path');
const chokidar = require('chokidar');
const activities = [];
const addActivity = (action, filePath) => {
    const timestamp = new Date().toISOString();
    activities.push({ action, filePath, timestamp });
};

const getActivities = () => activities;


const log = (message, type = 'INFO') => {
    const colors = {
        INFO: chalk.blue.bold('INFO:'),
        SUCCESS: chalk.green.bold('SUCCESS:'),
        ERROR: chalk.red.bold('ERROR:'),
        WARNING: chalk.yellow.bold('WARNING:')
    };
    console.log(colors[type] + ' ' + message);
};

const errorsDir = path.join(__dirname, '../../../errors'); 

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

function logErrorToFile(error) {
    ensureErrorDirectoryExists();

    // Convert the error object into a string, including the stack trace
    const errorMessage = `${error.name}: ${error.message}\n${error.stack}`;
    
    const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const filePath = path.join(errorsDir, fileName);
    
    fs.writeFileSync(filePath, errorMessage, 'utf8');
}


const formatFilePath = (filePath) => {
    return path.relative(process.cwd(), filePath);
};

const isConfigIncomplete = (key, value, placeholderTokens) => {
    return !value || placeholderTokens.includes(value);
};

const getAllCommandFiles = (dirPath, arrayOfFiles = []) => {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        const filePath = path.join(dirPath, file);
        if (fs.statSync(filePath).isDirectory()) {
            arrayOfFiles = getAllCommandFiles(filePath, arrayOfFiles);
        } else if (file.endsWith('.js')) {
            arrayOfFiles.push(filePath);
        }
    });
    return arrayOfFiles;
};

const loadCommand = (client, filePath) => {
    try {
        if (filePath.includes('schemas')) {
            log(`Ignoring schema file: ${formatFilePath(filePath)}`, 'WARNING');
            return null; 
        }

        delete require.cache[require.resolve(filePath)];
        const command = require(filePath);

        if (!command.data || !command.data.name || typeof command.data.name !== 'string') {
            log(`The command file "${formatFilePath(filePath)}" is missing a valid name property.`, 'ERROR');
            return null;
        }

        client.commands.set(command.data.name, command);
        return command;

    } catch (error) {
        log(`Failed to load command from "${formatFilePath(filePath)}".`, 'ERROR');
        console.error(error);
        logErrorToFile(error)
        return null;
    }
};

const loadCommands = (client, commandsPath) => {
    const globalCommandArray = [];
    const devCommandArray = [];

    const commandFiles = getAllCommandFiles(commandsPath);

    for (const filePath of commandFiles) {
        const command = loadCommand(client, filePath);
        if (command) {
            if (command.devOnly) {
                devCommandArray.push(command.data.toJSON());
            } else {
                globalCommandArray.push(command.data.toJSON());
            }
        }
    }

    return { globalCommandArray, devCommandArray };
};

const unregisterCommand = async (commandName, rest, config, devCommandArray) => {
    try {
        log(`Unregistering global command: ${commandName}`, 'INFO');



        const globalCommands = await rest.get(Routes.applicationCommands(config.bot.id));
        const commandToDelete = globalCommands.find(cmd => cmd.name === commandName);
        if (commandToDelete) {
            await rest.delete(Routes.applicationCommand(config.bot.id, commandToDelete.id));
            log(`Successfully unregistered global command: ${commandName}`, 'SUCCESS');
        }
        

        if (devCommandArray.length > 0 && config.bot.developerCommandsServerIds && config.bot.developerCommandsServerIds.length > 0) {
            for (const serverId of config.bot.developerCommandsServerIds) {
                const guildCommands = await rest.get(Routes.applicationGuildCommands(config.bot.id, serverId));
                const guildCommandToDelete = guildCommands.find(cmd => cmd.name === commandName);
                if (guildCommandToDelete) {
                    await rest.delete(Routes.applicationGuildCommand(config.bot.id, serverId, guildCommandToDelete.id));
                    log(`Successfully unregistered command: ${commandName} from guild ${serverId}`, 'SUCCESS');
                }
            }
        }
    } catch (error) {
        log(`Failed to unregister command: ${commandName}`, 'ERROR');
        console.error(error);
        logErrorToFile(error)
    }
};

const registerCommands = async (globalCommandArray, devCommandArray, rest, config) => {
    if (globalCommandArray.length > 0) {
        try {
            log('Started refreshing global application (/) commands.', 'INFO');
            await rest.put(
                Routes.applicationCommands(config.bot.id),
                { body: globalCommandArray }
            );
            log('Successfully reloaded global application (/) commands.', 'SUCCESS');
        } catch (error) {
            log('Failed to reload global application (/) commands.', 'ERROR');
            if (error.code === 10002) {
                console.error(chalk.red.bold('ERROR: ') + 'Unknown Application. Please check the Discord bot ID provided in your configuration.');
                logErrorToFile(error)
            } else {
                console.error(chalk.red.bold('ERROR: ') + 'Failed to register commands:', error.message);
                logErrorToFile(error)
            }
        }
    }

    if (devCommandArray.length > 0 && config.bot.developerCommandsServerIds && config.bot.developerCommandsServerIds.length > 0) {
        const promises = config.bot.developerCommandsServerIds.map(async (serverId) => {
            try {
                log(`Started refreshing developer guild (/) commands for server: ${serverId}`, 'INFO');
                await rest.put(
                    Routes.applicationGuildCommands(config.bot.id, serverId),
                    { body: devCommandArray }
                );
                log(`Successfully reloaded developer guild (/) commands for server: ${serverId}`, 'SUCCESS');
            } catch (error) {
                log(`Failed to reload developer guild (/) commands for server: ${serverId}`, 'ERROR');
                console.error(error);
                logErrorToFile(error)
            }
        });

        await Promise.all(promises);
    } else {
        log('No developer guild server IDs provided, or no developer commands to register.', 'WARNING');
    }
};

const handleCommands = async (client, commandsPath) => {
    const placeholderTokens = [
        "YOUR_BOT_TOKEN",
        "YOUR_MONGODB_URL",
        "YOUR_BOT_ID",
        "YOUR_DEVELOPER_GUILD_ID",
        "YOUR_BOT_OWNER_ID",
        "YOUR_DEVELOPER_COMMANDS_SERVER_ID_1",
        "YOUR_DEVELOPER_COMMANDS_SERVER_ID_2",
        "YOUR_GUILD_JOIN_LOGS_CHANNEL_ID",
        "YOUR_GUILD_LEAVE_LOGS_CHANNEL_ID",
        "YOUR_COMMAND_LOGS_CHANNEL_ID"
    ];

    if (isConfigIncomplete('botid', config.bot.id, placeholderTokens) || isConfigIncomplete('bottoken', config.bot.token, placeholderTokens)) {
        log("Missing or incorrect critical configuration.", 'ERROR');
        if (isConfigIncomplete('botid', config.bot.id, placeholderTokens)) {
            log("Bot ID is missing or incorrect. Please replace 'YOUR_BOT_ID' with your actual bot ID in config.json.", 'ERROR');
        }
        if (isConfigIncomplete('bottoken', config.bot.token, placeholderTokens)) {
            log("Bot token is missing or incorrect. Please replace 'YOUR_BOT_TOKEN' with your actual bot token in config.json.", 'ERROR');
        }
        process.exit(1);
    }

    if (!client.commands) {
        client.commands = new Collection();
    }

    const rest = new REST({ version: '10' }).setToken(config.bot.token);
    const { globalCommandArray, devCommandArray } = loadCommands(client, commandsPath);
    await registerCommands(globalCommandArray, devCommandArray, rest, config);
    const watcher = chokidar.watch([commandsPath, './src/functions', './src/schemas'], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    let timeout;

    const registerDebouncedCommands = async () => {
        const { globalCommandArray, devCommandArray } = loadCommands(client, commandsPath);
        await registerCommands(globalCommandArray, devCommandArray, rest, config);
    };

    watcher
        .on('add', (filePath) => {
            if (filePath.includes('schemas')) {
                log(`Schema file added: ${formatFilePath(filePath)}`, 'WARNING');
                return; 
            }

            if (filePath.includes('functions')) {
                log(`Functions file added: ${formatFilePath(filePath)}`, 'WARNING');
                return;
            }

            log(`New command file added: ${formatFilePath(filePath)}`, 'SUCCESS');
            loadCommand(client, filePath);
            addActivity('added', filePath);
            clearTimeout(timeout);
            timeout = setTimeout(registerDebouncedCommands, 5000);
        })
        .on('change', (filePath) => {
            if (filePath.includes('schemas')) {
                log(`Schema file changed: ${formatFilePath(filePath)}`, 'WARNING');
                return;
            }
            if (filePath.includes('functions')) {
                log(`Functions file changed: ${formatFilePath(filePath)}`, 'WARNING')
                return;
            }

            log(`Command file changed: ${formatFilePath(filePath)}`, 'INFO');
            loadCommand(client, filePath);
            addActivity('changed', filePath);
            clearTimeout(timeout);
            timeout = setTimeout(registerDebouncedCommands, 5000);
        })
        .on('unlink', async (filePath) => {
            if (filePath.includes('schemas')) {
                log(`Schema file removed: ${formatFilePath(filePath)}`, 'WARNING');
                return; 
            }

            if (filePath.includes('functions')) {
                log(`Functions file removed: ${formatFilePath(filePath)}`, 'WARNING');
                return;
            }

            const commandName = path.basename(filePath, '.js');
            log(`Command file removed: ${formatFilePath(filePath)}`, 'ERROR');
            client.commands.delete(commandName);
            await unregisterCommand(commandName, rest, config, devCommandArray);
            addActivity('removed', filePath);
            clearTimeout(timeout);
            timeout = setTimeout(registerDebouncedCommands, 5000);
        });

};

module.exports = {
    handleCommands,
    getActivities 
};
