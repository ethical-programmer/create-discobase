

const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');

// Debounce function to avoid rapid calls
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

function prefixHandler(client, prefixPath) {
    client.prefix = new Collection();

    // Logging function with color-coded messages
    const log = (message, type = 'INFO') => {
        const colors = {
            INFO: chalk.blue.bold('INFO:'),
            SUCCESS: chalk.green.bold('SUCCESS:'),
            ERROR: chalk.red.bold('ERROR:'),
            WARNING: chalk.yellow.bold('WARNING:')
        };
        console.log(colors[type] + ' ' + message);
    };

    // Load a command from a given file path
    const loadCommand = (filePath) => {
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (command.name) {
                client.prefix.set(command.name, command);
                log(`Loaded Prefix command: ${chalk.green(command.name)}`, 'SUCCESS');
            } else {
                log(`Command in ${chalk.yellow(path.basename(filePath))} is missing a name.`, 'WARNING');
            }
        } catch (error) {
            log(`Failed to load prefix command in ${chalk.red(path.basename(filePath))}`, 'ERROR');
            console.error(error);
        }
    };

    // Unload a command by file path
    const unloadCommand = (filePath) => {
        const commandName = path.basename(filePath, '.js');
        if (client.prefix.has(commandName)) {
            client.prefix.delete(commandName);
            log(`Unloaded command: ${chalk.red(commandName)}`, 'SUCCESS');
        } else {
            log(`Command "${chalk.yellow(commandName)}" not found in client collection.`, 'WARNING');
        }
    };

    // Load all commands from the specified directory
    const loadAllCommands = (commandDir) => {
        const commandFiles = fs.readdirSync(commandDir);
        commandFiles.forEach(file => {
            const filePath = path.join(commandDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                loadAllCommands(filePath); // Recursively load commands in subdirectories
            } else if (file.endsWith('.js')) {
                loadCommand(filePath); // Load command files
            }
        });
    };

    loadAllCommands(prefixPath); // Initial load of all commands

    // Watch for changes in the command directory
    const watcher = chokidar.watch(prefixPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    // Debounced functions for loading and unloading commands
    const debouncedLoadCommand = debounce(loadCommand, 500);
    const debouncedUnloadCommand = debounce(unloadCommand, 500);

    // Set up watchers for command file events
    watcher
        .on('add', (filePath) => {
            if (filePath.endsWith('.js')) { // Ensure it's a .js file
                log(`New command file added: ${chalk.green(path.basename(filePath))}`, 'SUCCESS');
                debouncedLoadCommand(filePath);
            }
        })
        .on('change', (filePath) => {
            if (filePath.endsWith('.js')) { // Ensure it's a .js file
                log(`Command file changed: ${chalk.blue(path.basename(filePath))}`, 'INFO');
                debouncedUnloadCommand(filePath);
                debouncedLoadCommand(filePath);
            }
        })
        .on('unlink', (filePath) => {
            if (filePath.endsWith('.js')) { // Ensure it's a .js file
                log(`Command file removed: ${chalk.red(path.basename(filePath))}`, 'ERROR');
                debouncedUnloadCommand(filePath);
            }
        });
}

module.exports = { prefixHandler };

