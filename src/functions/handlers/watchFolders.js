const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');

// Define paths
const commandsPath = path.join(__dirname, '../../commands');
const eventsPath = path.join(__dirname, '../../events');
const prefixPath = path.join(__dirname, '../../messages');

// Command, Prefix, and Event templates
const commandTemplate = `
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('your-command')
        .setDescription('Describe your command here.'),
    async execute(interaction, client) {
        // Command execution logic goes here
    }
};
`;

const prefixTemplate = `
//! This is a basic structure for a prefix command in discoBase using discord.js

module.exports = {
    name: 'command-name',

    description: 'command-description.',

    //* Optional: Aliases are alternative names for the command. Example: !p will also trigger the ping command.
    aliases: ['alaises_1', 'aliases_2'],

    // The run function is the main logic that gets executed when the command is called.
    run: async (client, message, args) => {
        // Command execution logic goes here
    },
};
`;

const eventTemplate = `
module.exports = {
    name: 'event-name',
    async execute(eventObject, client) {
        // Event handling logic goes here
    }
};
`;

// File watchers
const commandWatcher = chokidar.watch(commandsPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
});

const eventWatcher = chokidar.watch(eventsPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
});

const prefixWatcher = chokidar.watch(prefixPath, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
});

// Function for colorful console logs
const logWithStyle = (message, type = 'info') => {
    switch (type) {
        case 'success':
            console.log(chalk.green.bold(`✔ ${message}`));
            break;
        case 'error':
            console.log(chalk.red.bold(`✖ ${message}`));
            break;
        case 'info':
            console.log(chalk.blueBright.bold(`ℹ ${message}`));
            break;
        case 'add':
            console.log(chalk.cyan.bold(`➕ ${message}`));
            break;
        default:
            console.log(message);
    }
};

// Function to get relative path from src folder
const getRelativePath = (filePath) => {
    const srcPath = path.join(__dirname, '../../'); // path up to src
    return path.relative(srcPath, filePath);
};

// Watch for new command files
commandWatcher.on('add', (filePath) => {
    const ext = path.extname(filePath);

    if (ext === '.js') {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) throw err;

            if (data.trim().length === 0) {
                fs.writeFile(filePath, commandTemplate.trim(), (err) => {
                    if (err) throw err;
                    logWithStyle(`Added basic command structure to ${getRelativePath(filePath)}`, 'add');
                });
            }
        });
    }
});

// Watch for new prefix files
prefixWatcher.on('add', (filePath) => {
    const ext = path.extname(filePath);

    if (ext === '.js') {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) throw err;

            if (data.trim().length === 0) {
                fs.writeFile(filePath, prefixTemplate.trim(), (err) => {
                    if (err) throw err;
                    logWithStyle(`Added basic prefix command structure to ${getRelativePath(filePath)}`, 'add');
                });
            }
        });
    }
});

// Watch for new event files
eventWatcher.on('add', (filePath) => {
    const ext = path.extname(filePath);
    const eventName = path.basename(filePath, ext);

    if (ext === '.js') {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) throw err;

            if (data.trim().length === 0) {
                fs.writeFile(filePath, eventTemplate.trim(), (err) => {
                    if (err) throw err;
                    logWithStyle(`Added basic event structure for ${eventName} to ${getRelativePath(filePath)}`, 'add');
                });
            }
        });
    }
});

// Error logging for watchers
commandWatcher.on('error', (error) => logWithStyle(`Command watcher error: ${error}`, 'error'));
eventWatcher.on('error', (error) => logWithStyle(`Event watcher error: ${error}`, 'error'));
prefixWatcher.on('error', (error) => logWithStyle(`Prefix watcher error: ${error}`, 'error'));

// Start message
logWithStyle('Watching for new files in commands and events folders...', 'info');
