const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const chokidar = require('chokidar');
const chalk = require('chalk'); // Add chalk for coloring the console

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};

// Shorten file paths for cleaner logs
const getShortPath = (filePath) => path.basename(filePath);

const eventsHandler = async (client, eventsPath) => {
    client.events = new Collection();

    const getEventFiles = (dir) => {
        let files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                // Recursively get files from subdirectories
                files = [...files, ...getEventFiles(fullPath)];
            } else if (item.endsWith('.js')) {
                files.push(fullPath);
            }
        }

        return files;
    };

    const loadEvent = (file) => {
        try {
            delete require.cache[require.resolve(file)];
            const event = require(file);

            client.events.set(event.name, event);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }

            console.log(
                chalk.green.bold('SUCCESS: ') +
                `Loaded event: ${chalk.cyan.bold(event.name)} from ${chalk.yellow(getShortPath(file))}`
            );
        } catch (error) {
            console.error(chalk.red.bold('ERROR: ') + `Failed to load event from ${chalk.yellow(getShortPath(file))}:`, error);
        }
    };

    const unloadEvent = (file) => {
        const event = require(file);
        if (event.name && client.events.has(event.name)) {
            client.removeAllListeners(event.name);
            client.events.delete(event.name);
            console.log(
                chalk.magenta.bold('INFO: ') +
                `Unloaded event: ${chalk.cyan.bold(event.name)}`
            );
        } else {
            console.log(
                chalk.yellow.bold('WARNING: ') +
                `Event "${chalk.red(getShortPath(file))}" not found in client collection.`
            );
        }
    };

    const loadAllEvents = (eventDir) => {
        const eventFiles = getEventFiles(eventDir);
        eventFiles.forEach(file => loadEvent(file));
    };

    loadAllEvents(eventsPath);

    const watcher = chokidar.watch(eventsPath, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
    });

    const debouncedLoadEvent = debounce(loadEvent, 5000);
    const debouncedUnloadEvent = debounce(unloadEvent, 5000);

    watcher
        .on('add', (filePath) => {
            console.log(chalk.blue.bold('WATCHER: ') + `New event file added: ${chalk.yellow.bold(getShortPath(filePath))}`);
            debouncedLoadEvent(filePath);
        })
        .on('change', (filePath) => {
            console.log(chalk.blue.bold('WATCHER: ') + `Event file changed: ${chalk.yellow.bold(getShortPath(filePath))}`);
            debouncedUnloadEvent(filePath);
            debouncedLoadEvent(filePath);
        })
        .on('unlink', (filePath) => {
            console.log(chalk.blue.bold('WATCHER: ') + `Event file removed: ${chalk.yellow.bold(getShortPath(filePath))}`);
            debouncedUnloadEvent(filePath);
        });
};

module.exports = { eventsHandler };
