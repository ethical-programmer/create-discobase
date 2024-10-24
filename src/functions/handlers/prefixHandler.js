

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
                log(`Loaded Prefix command: ${chalk.green(command.name)}`, 'SUCCESS');
            } else {
                log(`Command in ${chalk.yellow(path.basename(filePath))} is missing a name.`, 'WARNING');
            }
        } catch (error) {
            log(`Failed to load prefix command in ${chalk.red(path.basename(filePath))}`, 'ERROR');
            console.error(error);
            logErrorToFile(error)
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
                loadAllCommands(filePath);
            } else if (file.endsWith('.js')) {
                loadCommand(filePath); 
            }
        });
    };

    loadAllCommands(prefixPath);

    const watcher = chokidar.watch(prefixPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    const debouncedLoadCommand = debounce(loadCommand, 500);
    const debouncedUnloadCommand = debounce(unloadCommand, 500);

    watcher
        .on('add', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`New command file added: ${chalk.green(path.basename(filePath))}`, 'SUCCESS');
                debouncedLoadCommand(filePath);
            }
        })
        .on('change', (filePath) => {
            if (filePath.endsWith('.js')) { 
                log(`Command file changed: ${chalk.blue(path.basename(filePath))}`, 'INFO');
                debouncedUnloadCommand(filePath);
                debouncedLoadCommand(filePath);
            }
        })
        .on('unlink', (filePath) => {
            if (filePath.endsWith('.js')) {
                log(`Command file removed: ${chalk.red(path.basename(filePath))}`, 'ERROR');
                debouncedUnloadCommand(filePath);
            }
        });
}

module.exports = { prefixHandler };

