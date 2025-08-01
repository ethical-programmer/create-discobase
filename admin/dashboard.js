const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const chalk = require('chalk');
const port = 3000;
const client = require('../src/index')
const multer = require('multer');
const upload = multer();
const { getActivities } = require('../src/functions/handlers/handleCommands');

app.use(bodyParser.urlencoded({ extended: true }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Configure static file serving with proper options
app.use(express.static(path.join(__dirname, 'files'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css');
        }
    }
}));

app.use(upload.fields([{ name: 'new-bot-avatar' }, { name: 'new-bot-banner' }]));



function loadConfig() {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return {};
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, './index.html'));
});


app.get('/api/bot-info', async (req, res) => {
    try {

        const fetchedUser = await client.users.fetch(client.user.id, { force: true });
        const botStatus = client.presence.status;
        const botName = client.user.username;
        const botAvatar = `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;

        const botId = client.user.id;
        const botBanner = `https://cdn.discordapp.com/banners/${client.user.id}/${fetchedUser.banner}.png`;

        const isVerified = client.user.verified;
        res.json({
            botStatus,
            botName,
            botId,
            botBanner,
            botAvatar,
            isVerified
        })
    } catch (err) {
        console.error('Error fetching bot info:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
})

const MONGOOSE_STATES = {
    0: 'Disconnected',
    1: 'Active',
    2: 'Connecting',
    3: 'Disconnecting'
}

const WEBSOCKET_STATES = {
    0: 'Stable',
    1: 'Connecting',
    2: 'Reconnecting',
    3: 'Idle',
    4: 'Nearly Ready',
    5: 'Disconnected',
    6: 'Loading',
    7: 'Identifying',
    8: 'Resuming'
}
    

app.get('/api/bot-data2', async (req, res) => {
    try {
        // API Response Time (measure actual API processing time)

        const config = loadConfig();

        let mongoose, databaseConnection = 'Unknown';

        try {
            mongoose = require('mongoose');
            databaseConnection = MONGOOSE_STATES[mongoose.connection.readyState];
        } catch (error) { /* do nothing */ }

        try {
            if (!mongoose) { // only run if mongoose doesn't exist
                if (!config.database?.mongodbUrl) {
                    databaseConnection = 'Not Configured';
                } else {

                    mongoose = require('mongodb');
                    const client = new MongoClient(config.database.mongodbUrl, {
                        serverSelectionTimeoutMS: 5000
                    });

                    await client.connect();
                    await client.db().admin().ping();
                    databaseConnection = 'Active';
                    await client.close();
                }
            }
        } catch (error) { /* do nothing */ }
        
        // WebSocket Connection Status
        let websocketConnection = WEBSOCKET_STATES[client.ws?.status] ?? 'Unknown';
        
        // Memory Usage
        const memoryUsage = process.memoryUsage();
        const memoryStats = {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        };
        
        // System Status Overview
        let systemStatus = 'All systems operational';
        
        // Determine overall system status
        if ( websocketConnection === 'Disconnected' || databaseConnection === 'Error') {
            systemStatus = 'Some systems degraded';
        }
        
        if (websocketConnection === 'Disconnected') {
            systemStatus = 'Systems experiencing issues';
        }
        
        const systemData = {
            // System Status Overview
            systemStatus: {
                message: systemStatus,
                operational: systemStatus === 'All systems operational'
            },
            
            
            // Connection Status
            connections: {
                database: {
                    status: databaseConnection
                },
                websocket: {
                    status: websocketConnection,
                    connected: client.ws?.status === 0
                }
            },
            
            // Memory Usage
            memory: {
                ...memoryStats,
                status: memoryStats.percentage > 90 ? 'Critical' : memoryStats.percentage > 70 ? 'Warning' : 'Good'
            }
        };
        
        res.json(systemData);
        
    } catch (error) {
        console.error('Error fetching system status:', error);
        res.status(500).json({
            systemStatus: {
                message: 'System error occurred',
                operational: false
            },
            error: 'Failed to fetch system status',
            message: error.message
        });
    }
});

app.post('/api/update-bot', async (req, res) => {
    const { newBotName } = req.body;

    if (newBotName) {
        try {
            await client.user.setUsername(newBotName);
        } catch (error) {
            console.error('Error updating bot name:', error);
            return res.json({ success: false, message: 'Failed to update bot name' });
        }
    }

    // Update bot avatar if provided
    const avatarFile = req.files['new-bot-avatar']?.[0];
    if (avatarFile) {
        try {
            await client.user.setAvatar(avatarFile.buffer); // Use buffer for the image
        } catch (error) {
            console.error('Error updating bot avatar:', error);
            return res.json({ success: false, message: 'Failed to update bot avatar' });
        }
    }

    const bannerFile = req.files['new-bot-banner']?.[0];
    if (bannerFile) {
        try {
            await client.user.setBanner(bannerFile.buffer);
        } catch (error) {
            console.error('Error updating bot banner:', error);
            return res.json({ success: false, message: 'Failed to update bot banner' });
        }
    }

    return res.json({ success: true });
});

app.get('/api/guilds', async (req, res) => {
    const guildsData = client.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL(),
        memberCount: guild.memberCount,
    }));

    res.json(guildsData);
});

app.get('/api/bot-stats', async (req, res) => {
    try {
        const totalServers = client.guilds.cache.size;
        const totalCommands = (client.commands ? client.commands.size : 0) + (client.prefix ? client.prefix.size : 0);
        const botName = client.user.username;
        const botIcon = `https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.png`;
        let totalUsers = 0;
        client.guilds.cache.forEach(guild => {
            totalUsers += guild.memberCount;
        });

        res.json({
            totalServers,
            totalUsers,
            totalCommands,
            botName,
            botIcon
        });
    } catch (err) {
        console.error('Error fetching bot stats:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Change from '/update-config' to '/api/update-config'
app.post('/api/update-config', (req, res) => {
    // Load the existing config
    const currentConfig = loadConfig();

    // Update only the fields that are provided
    const newConfig = {
        bot: {
            ...currentConfig.bot,
            ...(req.body.token && { token: req.body.token }),
            ...(req.body.id && { id: req.body.id }),
            ...(req.body.admins && { admins: req.body.admins.split(',') }),
            ...(req.body.ownerId && { ownerId: req.body.ownerId }),
            ...(req.body.developerCommandsServerIds && {
                developerCommandsServerIds: req.body.developerCommandsServerIds.split(','),
            }),
        },
        database: {
            ...(currentConfig.database || {}),
            ...(req.body.mongodbUrl && { mongodbUrl: req.body.mongodbUrl }),
        },
        logging: {
            ...(currentConfig.logging || {}),
            ...(req.body.guildJoinLogsId && { guildJoinLogsId: req.body.guildJoinLogsId }),
            ...(req.body.guildLeaveLogsId && { guildLeaveLogsId: req.body.guildLeaveLogsId }),
            ...(req.body.commandLogsChannelId && { commandLogsChannelId: req.body.commandLogsChannelId }),
            ...(req.body.errorLogs && { errorLogs: req.body.errorLogs }),
        },
        prefix: {
            ...(currentConfig.prefix || {}),
            ...(req.body.prefix && { value: req.body.prefix }),
        },
    };

    fs.writeFileSync(path.join(__dirname, '../config.json'), JSON.stringify(newConfig, null, 2));
    res.json({ success: true, message: 'Config updated successfully' }); // Changed from redirect to JSON response
});

app.get('/api/commands', (req, res) => {
    const slashCommandsDir = path.join(__dirname, '../src/commands');
    const prefixCommandsDir = path.join(__dirname, '../src/messages');
    const commands = {
        slash: [],
        prefix: []
    };

    // A function to read commands from a directory
    function readCommands(dir, commandArray, type) {
        return new Promise((resolve, reject) => {
            fs.readdir(dir, (err, files) => {
                if (err) {
                    return reject(`Error reading ${type} commands`);
                }

                const promises = files.map(file => {
                    const filePath = path.join(dir, file);
                    return new Promise((resolveFile, rejectFile) => {
                        fs.stat(filePath, (err, stats) => {
                            if (err) {
                                return rejectFile('Error reading file stats');
                            }

                            if (stats.isDirectory()) {
                                readCommands(filePath, commandArray, type).then(resolveFile).catch(rejectFile);
                            } else if (path.extname(file) === '.js') {
                                const command = require(filePath);
                                if (type === 'slash') {
                                    commandArray.push({
                                        name: command.data.name,
                                        description: command.data.description
                                    });
                                } else {
                                    commandArray.push({
                                        name: command.name,
                                        description: command.description
                                    });
                                }
                                resolveFile();
                            } else {
                                resolveFile(); // Handle non-JS files gracefully
                            }
                        });
                    });
                });

                // Wait for all promises to resolve
                Promise.all(promises).then(resolve).catch(reject);
            });
        });
    }

    // Read slash commands and then prefix commands
    readCommands(slashCommandsDir, commands.slash, 'slash')
        .then(() => readCommands(prefixCommandsDir, commands.prefix, 'prefix'))
        .then(() => {
            res.json(commands); // Send response after both commands are read
        })
        .catch(err => {
            console.error(err);
            res.status(500).json({ error: err });
        });
});

app.get('/api/activities', (req, res) => {
    try {
        const activities = getActivities();


        // Ensure activities is an array and has the correct structure
        if (!Array.isArray(activities)) {
            console.log('Activities is not an array, returning empty array');
            return res.json([]);
        }

        // Transform activities to ensure correct structure
        const transformedActivities = activities.map(activity => ({
            type: activity.type || activity.action || 'info',
            message: activity.message || activity.filePath || 'Unknown activity',
            timestamp: activity.timestamp || new Date().toLocaleTimeString()
        }));

        res.json(transformedActivities);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch activities' });
    }
});

app.get('/api/config', (req, res) => {
    const configPath = path.join(__dirname, '../config.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        res.json(config);
    } else {
        res.json({});
    }
});

app.get('/api/errors', (req, res) => {
    const errorsDir = path.join(__dirname, '../errors'); // Path to the errors folder

    // Ensure that the folder exists
    if (!fs.existsSync(errorsDir)) {
        return res.json({ errors: [], message: 'No errors found' });
    }

    // Read the files from the errors folder
    fs.readdir(errorsDir, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to read error logs' });
        }

        // Sort files by date (latest first)
        files.sort((a, b) => fs.statSync(path.join(errorsDir, b)).mtime - fs.statSync(path.join(errorsDir, a)).mtime);

        // Prepare an array to store errors
        const errorLogs = [];

        // Read the content of each error file
        files.forEach(file => {
            const filePath = path.join(errorsDir, file);
            const content = fs.readFileSync(filePath, 'utf8');
            errorLogs.push({ fileName: file, content });
        });

        // Send the error logs to the front-end
        res.json({ errors: errorLogs });
    });
});

// Add this before your routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Start the server
app.listen(port, () => {
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    console.log(
        chalk.gray(`[${timestamp}]`) + ' ' +
        chalk.green.bold('SUCCESS: ') +
        'Admin dashboard running at ' +
        chalk.underline.blue(`http://localhost:${port}`)
    );
});
