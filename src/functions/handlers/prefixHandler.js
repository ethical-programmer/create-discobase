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

// ✅ NEW unified logger
function log(message, type = 'INFO') {
    const timestamp = new Date().toLocaleTimeString();
    let icon, color;

    switch (type.toUpperCase()) {
        case 'SUCCESS':
            icon = '✓';
            color = chalk.green;
            break;
        case 'INFO':
            icon = 'ℹ';
            color = chalk.blue;
            break;
        case 'WARNING':
            icon = '⚠';
            color = chalk.yellow;
            break;
        case 'ERROR':
            icon = '✖';
            color = chalk.red;
            break;
        default:
            icon = '•';
            color = chalk.white;
    }

    const timeBox = chalk.gray(`[${timestamp}]`);
    const typeBox = color.bold(` ${icon} ${type.toUpperCase()} `);
    const formatted = `${timeBox}${typeBox}${chalk.white(' │ ')}${message}`;

    console.log(formatted);
}

function prefixHandler(client, prefixPath) {
    client.prefix = new Collection();

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
            logErrorToFile(error);
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
        commandFiles.forEach((file) => {
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
