const fs = require('fs');
const path = require('path');
const { Collection, PermissionsBitField, MessageFlags } = require('discord.js');
const chokidar = require('chokidar');
const chalk = require('chalk');

// Cooldown and rate limit storage
const cooldowns = new Map();
const rateLimits = new Map();

const getTimestamp = () => {
    return chalk.gray(`[${new Date().toLocaleTimeString()}]`);
};

const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
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
        const discobasePath = path.join(__dirname, '../../../discobase.json');
        if (fs.existsSync(discobasePath)) {
            const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
            if (discobaseConfig.errorLogging && discobaseConfig.errorLogging.enabled === false) {
                return;
            }
        }

        ensureErrorDirectoryExists();

        const errorMessage = `${error.name}: ${error.message}\n${error.stack}`;
        const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
        const filePath = path.join(errorsDir, fileName);

        fs.writeFileSync(filePath, errorMessage, 'utf8');
    } catch (err) {
        // Silent fail
    }
}

const getShortPath = (filePath) => path.basename(filePath);

// Helper: Format time remaining
const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};

// Helper: Check cooldown
const checkCooldown = (event, userId) => {
    if (!event.cooldown) return null;
    
    const key = `${event.name}-${event.customId || 'global'}-${userId}`;
    const now = Date.now();
    const cooldownData = cooldowns.get(key);
    
    if (cooldownData && now < cooldownData.expiresAt) {
        const remaining = cooldownData.expiresAt - now;
        return remaining;
    }
    
    cooldowns.set(key, { expiresAt: now + (event.cooldown * 1000) });
    setTimeout(() => cooldowns.delete(key), event.cooldown * 1000);
    return null;
};

// Helper: Check rate limit
const checkRateLimit = (event, interaction) => {
    if (!event.rateLimit) return null;
    
    const { max, window, scope = 'user' } = event.rateLimit;
    let scopeId;
    
    switch (scope) {
        case 'user': scopeId = interaction.user.id; break;
        case 'guild': scopeId = interaction.guild?.id || interaction.user.id; break;
        case 'channel': scopeId = interaction.channel?.id || interaction.user.id; break;
        default: scopeId = interaction.user.id;
    }
    
    const key = `${event.name}-${event.customId || 'global'}-${scope}-${scopeId}`;
    const now = Date.now();
    const limitData = rateLimits.get(key) || { count: 0, resetAt: now + window };
    
    if (now >= limitData.resetAt) {
        limitData.count = 0;
        limitData.resetAt = now + window;
    }
    
    if (limitData.count >= max) {
        return limitData.resetAt - now;
    }
    
    limitData.count++;
    rateLimits.set(key, limitData);
    setTimeout(() => rateLimits.delete(key), window);
    return null;
};

// Helper: Check permissions
const checkPermissions = async (event, interaction) => {
    if (!interaction.guild) return null;
    const errors = [];
    
    if (event.userPermissions && event.userPermissions.length > 0) {
        const member = interaction.member;
        const missingPerms = event.userPermissions.filter(perm => {
            return !member.permissions.has(PermissionsBitField.Flags[perm]);
        });
        if (missingPerms.length > 0) {
            errors.push(`You need: ${missingPerms.join(', ')}`);
        }
    }
    
    if (event.botPermissions && event.botPermissions.length > 0) {
        const botMember = await interaction.guild.members.fetchMe();
        const missingPerms = event.botPermissions.filter(perm => {
            return !botMember.permissions.has(PermissionsBitField.Flags[perm]);
        });
        if (missingPerms.length > 0) {
            errors.push(`I need: ${missingPerms.join(', ')}`);
        }
    }
    
    return errors.length > 0 ? errors : null;
};

const eventsHandler = async (client, eventsPath) => {
    client.events = new Collection();
    client.components = new Collection();
    client.activeEventListeners = new Map();

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
                
                // Create wrapped execute function with customId and auto-detected componentType filtering
                const wrappedExecute = async (...args) => {
                    const interaction = args[0];
                    
                    // Priority: Skip if this is a slash command and event has customId
                    // Slash commands should ONLY be handled by interactionCreate.js without customId
                    if (event.customId && interaction && interaction.isChatInputCommand && interaction.isChatInputCommand()) {
                        return; // Skip - slash commands don't use customId filtering
                    }
                    
                    // If customId is specified, filter interactions
                    if (event.customId) {
                        // Only apply filtering for interaction events with customId
                        if (interaction && interaction.customId) {
                            const customIds = Array.isArray(event.customId) ? event.customId : [event.customId];
                            
                            // Check if interaction's customId matches any of the specified customIds
                            if (!customIds.includes(interaction.customId)) {
                                return; // Skip execution if customId doesn't match
                            }
                            
                            // Auto-detect component type from first interaction
                            // Store the component type for this event on first run
                            if (!event._detectedComponentType && interaction.componentType !== undefined) {
                                event._detectedComponentType = interaction.componentType;
                            }
                            
                            // Filter by detected component type
                            if (event._detectedComponentType !== undefined) {
                                // Check if interaction's componentType matches the detected type
                                if (interaction.componentType !== event._detectedComponentType) {
                                    return; // Skip if component type doesn't match detected type
                                }
                            }
                        } else {
                            // If customId is specified but interaction doesn't have one, skip
                            return;
                        }
                    }
                    
                    // Check permissions, cooldown, and rate limits
                    if (interaction && interaction.user) {
                        const permErrors = await checkPermissions(event, interaction);
                        if (permErrors) {
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({
                                    content: `❌ **Missing Permissions**\n${permErrors.join('\n')}`,
                                    flags: MessageFlags.Ephemeral
                                }).catch(() => {});
                            }
                            return;
                        }
                        
                        const cooldownRemaining = checkCooldown(event, interaction.user.id);
                        if (cooldownRemaining) {
                            const timeLeft = formatTime(cooldownRemaining);
                            const message = event.cooldownMessage 
                                ? event.cooldownMessage.replace('{time}', timeLeft)
                                : `⏱️ Please wait ${timeLeft} before using this again.`;
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({ content: message, flags: MessageFlags.Ephemeral }).catch(() => {});
                            }
                            return;
                        }
                        
                        const rateLimitRemaining = checkRateLimit(event, interaction);
                        if (rateLimitRemaining) {
                            const timeLeft = formatTime(rateLimitRemaining);
                            if (!interaction.replied && !interaction.deferred) {
                                await interaction.reply({
                                    content: `⚠️ You're doing that too much! Try again in ${timeLeft}.`,
                                    flags: MessageFlags.Ephemeral
                                }).catch(() => {});
                            }
                            return;
                        }
                    }
                    
                    // Execute the event
                    await event.execute(...args, client);
                };
                
                if (event.once) {
                    client.once(event.name, wrappedExecute);
                } else {
                    client.on(event.name, wrappedExecute);
                }

                // Store the listener for safe removal
                client.activeEventListeners.set(file, { name: event.name, listener: wrappedExecute });

                console.log(
                    `${getTimestamp()} ` +
                    chalk.green.bold('SUCCESS: ') +
                    `Loaded event: ${chalk.cyan.bold(event.name)} from ${chalk.yellow(getShortPath(file))}`
                );
            } else {
                console.warn(
                    `${getTimestamp()} ` +
                    chalk.yellow.bold('WARNING: ') +
                    `File ${chalk.yellow(getShortPath(file))} does not export a valid event name or customId.`
                );
            }
        } catch (error) {
            console.error(
                `${getTimestamp()} ` +
                chalk.red.bold('ERROR: ') +
                `Failed to load event/component from ${chalk.yellow(getShortPath(file))}:`,
                error
            );
            logErrorToFile(error);
        }
    };

    const loadSchema = (file) => {
        try {
            delete require.cache[require.resolve(file)];
            const schema = require(file);

            console.log(
                `${getTimestamp()} ` +
                chalk.green.bold('SUCCESS: ') +
                `Loaded schema from ${chalk.yellow(getShortPath(file))}`
            );
        } catch (error) {
            console.error(
                `${getTimestamp()} ` +
                chalk.red.bold('ERROR: ') +
                `Failed to load schema from ${chalk.yellow(getShortPath(file))}:`,
                error
            );
            logErrorToFile(error);
        }
    };

    const unloadEvent = (file) => {
        try {
            const listenerData = client.activeEventListeners.get(file);

            if (listenerData) {
                const { name, listener } = listenerData;
                
                // Safely remove the specific listener
                client.removeListener(name, listener);
                
                // Clean up tracking maps
                client.activeEventListeners.delete(file);
                if (client.events.has(name)) {
                    client.events.delete(name);
                }

                console.log(
                    `${getTimestamp()} ` +
                    chalk.blue.bold('UNLOAD: ') +
                    `Unloaded event: ${chalk.cyan.bold(name)}`
                );
            }
        } catch (error) {
            console.error(
                `${getTimestamp()} ` +
                chalk.red.bold('ERROR: ') +
                `Failed to unload from ${chalk.yellow(getShortPath(file))}:`,
                error
            );
            logErrorToFile(error);
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

    loadAllEvents(eventsPath);
    loadAllSchemas(path.join(__dirname, '../../schemas'));

    const watcher = chokidar.watch([eventsPath, path.join(__dirname, '../../schemas')], {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: true,
        ignored: [
            path.join(__dirname, '../../functions/**'),
        ],
    });

    watcher
        .on('add', (filePath) => {
            if (filePath.endsWith('.js')) {
                console.log(
                    `${getTimestamp()} ` +
                    chalk.blue.bold('WATCHER: ') +
                    `New file added: ${chalk.yellow.bold(getShortPath(filePath))}`
                );
                if (filePath.includes('schemas')) {
                    loadSchema(filePath);
                } else {
                    loadEvent(filePath);
                }
            }
        })
        .on('change', (filePath) => {
            console.log(
                `${getTimestamp()} ` +
                chalk.blue.bold('WATCHER: ') +
                `File changed: ${chalk.yellow.bold(getShortPath(filePath))}`
            );
            if (filePath.includes('schemas')) {
                loadSchema(filePath);
            } else {
                unloadEvent(filePath);
                loadEvent(filePath);
            }
        })
        .on('unlink', (filePath) => {
            console.log(
                `${getTimestamp()} ` +
                chalk.blue.bold('WATCHER: ') +
                `File removed: ${chalk.yellow.bold(getShortPath(filePath))}`
            );
            if (filePath.includes('schemas')) {
                // nothing to unload for schema
            } else {
                unloadEvent(filePath);
            }
        });
};

module.exports = { eventsHandler };
