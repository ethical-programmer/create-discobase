#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { select, text, confirm } = require('@clack/prompts');
const chalk = require('chalk');

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

// Logging function with styling
const logWithStyle = (message, type = 'info') => {
    const styles = {
        success: chalk.green.bold(`✔ ${message}`),
        error: chalk.red.bold(`✖ ${message}`),
        info: chalk.blueBright.bold(`ℹ ${message}`),
    };
    console.log(styles[type] || message);
};

// Function to create a file with content
const createFile = (filePath, template) => {
    fs.writeFile(filePath, template.trim(), (err) => {
        if (err) return logWithStyle(`Error: ${err.message}`, 'error');
        const relativePath = path.relative(path.join(__dirname, 'src'), filePath); 
        logWithStyle(`File created at ${relativePath}`, 'success');
    });
};

// Main execution of the 'generate' command
(async () => {
    // Ask for the file type
    const fileType = await select({
        message: 'Select the type of file to generate:',
        options: [
            { value: 'command', label: 'Command' },
            { value: 'event', label: 'Event' },
            { value: 'prefix', label: 'Prefix Command' }
        ],
    });

    const fileName = await text({
        message: `Enter the name of the ${fileType} file (without extension):`,
        initial: '',
    });

    const folderMap = {
        command: 'commands',
        event: 'events',
        prefix: 'messages'
    };

    const folderSelection = folderMap[fileType];
    const selectedFolderPath = path.join(__dirname, 'src', folderSelection);

    // Check if the folder exists, if not, ask to create it
    if (!fs.existsSync(selectedFolderPath)) {
        const createFolder = await confirm({
            message: `The folder ${folderSelection} does not exist. Do you want to create it?`,
        });

        if (createFolder) {
            fs.mkdirSync(selectedFolderPath, { recursive: true });
            logWithStyle(`Folder ${folderSelection} created successfully.`, 'success');
        } else {
            logWithStyle('Folder creation aborted.', 'error');
            return;
        }
    }

    // Get the subfolders within the selected folder
    let subFolders = fs.readdirSync(selectedFolderPath).filter(item => fs.statSync(path.join(selectedFolderPath, item)).isDirectory());

    // If no subfolders, ask if the user wants to create one
    if (subFolders.length === 0) {
        const createSubfolder = await confirm({
            message: `No subfolders exist in ${folderSelection}. Would you like to create one?`,
        });

        if (createSubfolder) {
            const subfolderName = await text({
                message: `Enter the name of the new subfolder:`,
                initial: '',
            });

            const newSubfolderPath = path.join(selectedFolderPath, subfolderName);
            fs.mkdirSync(newSubfolderPath, { recursive: true });
            logWithStyle(`Subfolder ${subfolderName} created successfully.`, 'success');
            subFolders = [subfolderName];
        } else {
            logWithStyle('Subfolder creation aborted.', 'error');
            return;
        }
    }

    // Let the user select an existing subfolder or create a new one
    const subfolderSelection = await select({
        message: 'Select the subfolder to create the file in (or choose to create a new folder):',
        options: [
            ...subFolders.map(subfolder => ({ value: subfolder, label: subfolder })),
            { value: 'new', label: 'Create new folder' }
        ]
    });

    let subfolderPath;
    if (subfolderSelection === 'new') {
        const newSubfolderName = await text({
            message: 'Enter the name of the new subfolder:',
            initial: '',
        });
        subfolderPath = path.join(selectedFolderPath, newSubfolderName);
        fs.mkdirSync(subfolderPath, { recursive: true });
        logWithStyle(`New subfolder ${newSubfolderName} created successfully.`, 'success');
    } else {
        subfolderPath = path.join(selectedFolderPath, subfolderSelection);
    }

    // Create the file
    const filePath = path.join(subfolderPath, `${fileName}.js`);

    if (fs.existsSync(filePath)) {
        logWithStyle(`File already exists: ${filePath}`, 'error');
    } else {
        createFile(filePath, templates[fileType]);
    }
})();
