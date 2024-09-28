const { Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');

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

    const log = (message, type = 'INFO') => {
        const colors = {
            INFO: chalk.blue.bold('INFO:'),
            SUCCESS: chalk.green.bold('SUCCESS:'),
            ERROR: chalk.red.bold('ERROR:'),
            WARNING: chalk.yellow.bold('WARNING:')
        };
        console.log(colors[type] + ' ' + message);
    };

    const loadCommand = (filePath) => {
        try {
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);

            if (command.name) {
                client.prefix.set(command.name, command);
                log(`Loaded command: ${chalk.green(command.name)}`, 'SUCCESS');
            } else {
                log(`Command in ${chalk.yellow(path.basename(filePath))} is missing a name.`, 'WARNING');
            }
        } catch (error) {
            log(`Failed to load command in ${chalk.red(path.basename(filePath))}`, 'ERROR');
            console.error(error);
        }
    };

    const unloadCommand = (filePath) => {
        const commandName = path.basename(filePath, '.js');
        if (client.prefix.has(commandName)) {
            client.prefix.delete(commandName);
            log(`Unloaded command: ${chalk.red(commandName)}`, 'SUCCESS');
        } else {
            log(`Command "${chalk.yellow(commandName)}" not found in client collection.`, 'WARNING');
        }
    };

    const loadAllCommands = (commandDir) => {
        const commandFiles = fs.readdirSync(commandDir);
        commandFiles.forEach(file => {
            const filePath = path.join(commandDir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // If it's a directory, recurse into it
                loadAllCommands(filePath);
            } else if (file.endsWith('.js')) {
                // If it's a JS file, load the command
                loadCommand(filePath);
            }
        });
    };

    // Load all initial commands
    loadAllCommands(prefixPath);

    // Watch for changes in the command files
    const watcher = chokidar.watch(prefixPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    const debouncedLoadCommand = debounce(loadCommand, 5000);
    const debouncedUnloadCommand = debounce(unloadCommand, 5000);

    watcher
        .on('add', (filePath) => {
            log(`New command file added: ${chalk.green(path.basename(filePath))}`, 'SUCCESS');
            debouncedLoadCommand(filePath);
        })
        .on('change', (filePath) => {
            log(`Command file changed: ${chalk.blue(path.basename(filePath))}`, 'INFO');
            debouncedUnloadCommand(filePath);
            debouncedLoadCommand(filePath); 
        })
        .on('unlink', (filePath) => {
            log(`Command file removed: ${chalk.red(path.basename(filePath))}`, 'ERROR');
            debouncedUnloadCommand(filePath);
        });
}

module.exports = { prefixHandler };
