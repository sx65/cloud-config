const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const multer = require('multer');

const app = express();
const CONFIGS_DIR = path.join(__dirname, 'configs');
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1268594897934352404/CPstA83T43tbGjLfjcK5TcY6yt5F0tDqRFcxr5x2W8yx6OnK6w_9JAgtL2Qfjxg9ZGfB';

const DISCORD_CLIENT_ID = '123';
const DISCORD_CLIENT_SECRET = 'asdsa';
const DISCORD_REDIRECT_URI = 'http://localhost:3000/callback';
const BEARER_TOKEN = '3daXadKo23axfKLax_XKlx1Q13MjddaASSD';

if (!fs.existsSync(CONFIGS_DIR)) {
    fs.mkdirSync(CONFIGS_DIR);
}

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'nigaboy',
    resave: false,
    saveUninitialized: true
}));

const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: 'Too many config uploads from this IP, please try again after an hour'
});

app.get('/login', (req, res) => {
    const authURL = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify`;
    res.redirect(authURL);
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get('/callback', async (req, res) => {
    const code = req.query.code;

    try {
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code,
            redirect_uri: DISCORD_REDIRECT_URI
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
        });

        req.session.user = userResponse.data;
        res.redirect('/');
    } catch (err) {
        console.error('OAuth error:', err);
        res.status(500).send('OAuth error');
    }
});

app.post('/upload-web', uploadLimiter, upload.single('configFile'), (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { gameName, ping } = req.body;
    const configCode = uuidv4();

    let config;
    try {
        config = JSON.parse(req.file.buffer.toString('utf-8'));
    } catch (err) {
        return res.status(400).json({ error: 'Invalid JSON format' });
    }

    const configPath = path.join(CONFIGS_DIR, `${configCode}.json`);

    const configData = {
        gameName,
        ping,
        config,
        discordUserId: req.session.user.id || null
    };

    fs.writeFile(configPath, JSON.stringify(configData), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save config' });
        }

        const embed = {
            title: "New Config Uploaded",
            fields: [
                { name: "Game Name", value: gameName, inline: true },
                { name: "Ping", value: ping.toString(), inline: true },
                { name: "Config Code", value: configCode, inline: false },
                { name: "Discord User ID", value: req.session.user.id || 'null', inline: false }
            ],
            
            timestamp: new Date()
        };

        axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] })
            .then(() => {
                res.status(200).json({ code: configCode });
            })
            .catch((err) => {
                console.error('Failed to send to Discord webhook:', err);
                res.status(500).json({ error: 'Failed to notify via webhook' });
            });
    });
});

app.post('/upload', uploadLimiter, (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${BEARER_TOKEN}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { config, gameName, ping } = req.body;
    const configCode = uuidv4();
    const configPath = path.join(CONFIGS_DIR, `${configCode}.json`);

    const configData = {
        gameName,
        ping,
        config,
        discordUserId: null
    };

    fs.writeFile(configPath, JSON.stringify(configData), (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save config' });
        }

        const embed = {
            title: "New Config Uploaded",
            fields: [
                { name: "Game Name", value: gameName, inline: true },
                { name: "Ping", value: ping.toString(), inline: true },
                { name: "Config Code", value: configCode, inline: false }
            ],
            timestamp: new Date()
        };

        axios.post(DISCORD_WEBHOOK_URL, { embeds: [embed] })
            .then(() => {
                res.status(200).json({ code: configCode });
            })
            .catch((err) => {
                console.error('Failed to send to Discord webhook:', err);
                res.status(500).json({ error: 'Failed to notify via webhook' });
            });
    });
});

app.get('/download/:configCode', (req, res) => {
    const configCode = req.params.configCode;
    const configPath = path.join(CONFIGS_DIR, `${configCode}.json`);

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'Config not found' });
        }
        res.status(200).json({ config: JSON.parse(data) });
    });
});

app.get('/configs', (req, res) => {
    fs.readdir(CONFIGS_DIR, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to list configs' });
        }
        const configs = files.map(file => {
            const configData = JSON.parse(fs.readFileSync(path.join(CONFIGS_DIR, file)));
            const configCode = path.basename(file, '.json');
            return {
                configCode,
                gameName: configData.gameName,
                ping: configData.ping
            };
        });
        res.json(configs);
    });
});

app.get('/config/:configCode', (req, res) => {
    const configCode = req.params.configCode;
    const configPath = path.join(CONFIGS_DIR, `${configCode}.json`);

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(404).json({ error: 'Config not found' });
        }

        const config = JSON.parse(data);
        const configDetails = {
            gameName: config.gameName || 'N/A',
            ping: config.ping || 'N/A',
            configCode,
            discordUserId: config.discordUserId || 'N/A',
            configSource: JSON.stringify(config.config, null, 2)
        };

        res.status(200).json(configDetails);
    });
});


app.get('/session', (req, res) => {
    res.json({ loggedIn: !!req.session.user });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
