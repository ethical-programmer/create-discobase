

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const chokidar = require('chokidar');
const chalk = require('chalk');

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

// Shorten file paths for cleaner logs
const getShortPath = (filePath) => path.basename(filePath);

const eventsHandler = async (client, eventsPath) => {
    client.events = new Collection();

    const getFilesRecursively = (dir) => {
        let files = [];
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            if (fs.statSync(fullPath).isDirectory()) {
                files = [...files, ...getFilesRecursively(fullPath)];
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

            if (event.name) {
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
            } else {
                console.warn(chalk.yellow.bold('WARNING: ') + `File ${chalk.yellow(getShortPath(file))} does not export a valid event name.`);
            }
        } catch (error) {
            console.error(chalk.red.bold('ERROR: ') + `Failed to load event from ${chalk.yellow(getShortPath(file))}:`, error);
        }
    };

    const loadSchema = (file) => {
        try {
            delete require.cache[require.resolve(file)];
            const schema = require(file);

            // Handle schema loading logic here (if necessary)
            console.log(chalk.green.bold('SUCCESS: ') + `Loaded schema from ${chalk.yellow(getShortPath(file))}`);
        } catch (error) {
            console.error(chalk.red.bold('ERROR: ') + `Failed to load schema from ${chalk.yellow(getShortPath(file))}:`, error);
        }
    };

    const unloadEvent = (file) => {
        const event = require(file);
        if (event.name && client.events.has(event.name)) {
            client.removeAllListeners(event.name);
            client.events.delete(event.name);
            console.log(`Unloaded event: ${event.name}`);
        } else {
            console.log(
                chalk.yellow.bold('WARNING: ') +
                `Event "${chalk.red(getShortPath(file))}" not found in client collection.`
            );
        }
    };

    const loadAllEvents = (eventDir) => {
        const eventFiles = getFilesRecursively(eventDir);
        eventFiles.forEach(file => loadEvent(file));
    };

    const loadAllSchemas = (schemasDir) => {
        const schemaFiles = getFilesRecursively(schemasDir);
        schemaFiles.forEach(file => loadSchema(file));
    };

    // Load events and schemas from the specified paths
    loadAllEvents(eventsPath);
    loadAllSchemas(path.join(__dirname, '../../schemas'));

    // Watch for changes in events and schemas, but ignore functions
    const watcher = chokidar.watch([eventsPath, path.join(__dirname, '../../schemas')], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
        ignored: [
            path.join(__dirname, '../../functions/**'), // Ignore all changes in the functions directory
        ],
    });

    watcher
        .on('add', (filePath) => {
            if (filePath.endsWith('.js')) {
                console.log(chalk.blue.bold('WATCHER: ') + `New file added: ${chalk.yellow.bold(getShortPath(filePath))}`);
                if (filePath.includes('schemas')) {
                    loadSchema(filePath); // Load as schema
                } else {
                    loadEvent(filePath); // Load as event
                }
            }
        })
        .on('change', (filePath) => {
            console.log(chalk.blue.bold('WATCHER: ') + `File changed: ${chalk.yellow.bold(getShortPath(filePath))}`);
            if (filePath.includes('schemas')) {
                loadSchema(filePath); // Load as schema
            } else {
                // Unload and reload event if it's not a schema
                unloadEvent(filePath);
                loadEvent(filePath);
            }
        })
        .on('unlink', (filePath) => {
            console.log(chalk.blue.bold('WATCHER: ') + `File removed: ${chalk.yellow.bold(getShortPath(filePath))}`);
            if (filePath.includes('schemas')) {
                // Handle schema removal if necessary
            } else {
                unloadEvent(filePath);
            }
        });
};



module.exports = { eventsHandler };
