#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { select, text, confirm } = require('@clack/prompts');
const chalk = require('chalk');

// 🎨 Define gradient colors for premium look
const gradient = chalk.hex('#57F287'); // Discord green
const accent = chalk.hex('#5865F2');   // Discord blurple
const errorColor = chalk.hex('#ED4245'); // Discord red

const symbols = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
};

// 🌟 Logging function with styling & emojis
const logWithStyle = (message, type = 'info') => {
    const timestamp = chalk.gray(`[${new Date().toLocaleTimeString()}]`);
    const styled = {
        success: `${timestamp} ${gradient.bold(symbols.success)} ${chalk.whiteBright(message)}`,
        error: `${timestamp} ${errorColor.bold(symbols.error)} ${chalk.whiteBright(message)}`,
        info: `${timestamp} ${accent.bold(symbols.info)} ${chalk.whiteBright(message)}`
    };
    console.log(styled[type] || message);
};

// Templates for different file types
const templates = {
    command: `const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('your-command')
        .setDescription('Describe your command here.'),

    async execute(interaction, client) {
        // Command execution logic goes here
    }
};`,
    prefix: `//! This is a basic structure for a prefix command in discoBase using discord.js

module.exports = {
    name: 'command-name',
    description: 'command-description.',
    aliases: ['alias_1', 'alias_2'],
    run: async (client, message, args) => {
        // Command execution logic goes here
    },
};`,
    event: `module.exports = {
    name: 'event-name',
    async execute(eventObject, client) {
        // Event handling logic goes here
    }
};`
};

// 🗂️ Create file with content & fancy logs
const createFile = (filePath, template) => {
    fs.writeFile(filePath, template.trim(), (err) => {
        if (err) return logWithStyle(`Error: ${err.message}`, 'error');
        const relativePath = path.relative(path.join(__dirname, 'src'), filePath);
        logWithStyle(`✨ File created at: ${chalk.cyanBright(relativePath)}`, 'success');
    });
};

// 🚀 Main execution
(async () => {
    logWithStyle('Welcome to discoBase file generator 🛠️', 'info');

    const fileType = await select({
        message: '📂 Select the type of file to generate:',
        options: [
            { value: 'command', label: 'Command' },
            { value: 'event', label: 'Event' },
            { value: 'prefix', label: 'Prefix Command' }
        ],
    });

    const fileName = await text({
        message: `📝 Enter the name of the ${fileType} file (without extension):`,
        initial: '',
    });

    const folderMap = {
        command: 'commands',
        event: 'events',
        prefix: 'messages'
    };

    const folderSelection = folderMap[fileType];
    const selectedFolderPath = path.join(__dirname, 'src', folderSelection);

    if (!fs.existsSync(selectedFolderPath)) {
        const createFolder = await confirm({
            message: `🚫 Folder ${folderSelection} does not exist. Create it?`,
        });

        if (createFolder) {
            fs.mkdirSync(selectedFolderPath, { recursive: true });
            logWithStyle(`📁 Folder ${chalk.greenBright(folderSelection)} created successfully.`, 'success');
        } else {
            logWithStyle('❌ Folder creation aborted.', 'error');
            return;
        }
    }

    let subFolders = fs.readdirSync(selectedFolderPath).filter(item => fs.statSync(path.join(selectedFolderPath, item)).isDirectory());

    if (subFolders.length === 0) {
        const createSubfolder = await confirm({
            message: `📂 No subfolders exist in ${folderSelection}. Create one?`,
        });

        if (createSubfolder) {
            const subfolderName = await text({
                message: `🗂️ Enter the name of the new subfolder:`,
                initial: '',
            });

            const newSubfolderPath = path.join(selectedFolderPath, subfolderName);
            fs.mkdirSync(newSubfolderPath, { recursive: true });
            logWithStyle(`📁 Subfolder ${chalk.greenBright(subfolderName)} created successfully.`, 'success');
            subFolders = [subfolderName];
        } else {
            logWithStyle('❌ Subfolder creation aborted.', 'error');
            return;
        }
    }

    const subfolderSelection = await select({
        message: '📂 Select the subfolder to create the file in:',
        options: [
            ...subFolders.map(subfolder => ({ value: subfolder, label: subfolder })),
            { value: 'new', label: '➕ Create new folder' }
        ]
    });

    let subfolderPath;
    if (subfolderSelection === 'new') {
        const newSubfolderName = await text({
            message: '🗂️ Enter the name of the new subfolder:',
            initial: '',
        });
        subfolderPath = path.join(selectedFolderPath, newSubfolderName);
        fs.mkdirSync(subfolderPath, { recursive: true });
        logWithStyle(`📁 New subfolder ${chalk.greenBright(newSubfolderName)} created successfully.`, 'success');
    } else {
        subfolderPath = path.join(selectedFolderPath, subfolderSelection);
    }

    const filePath = path.join(subfolderPath, `${fileName}.js`);

    if (fs.existsSync(filePath)) {
        logWithStyle(`⚠️ File already exists: ${chalk.yellowBright(filePath)}`, 'error');
    } else {
        createFile(filePath, templates[fileType]);
    }
})();
