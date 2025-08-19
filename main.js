const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let loginWindow;
let credentials = {};

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadFile('index.html');
}

function createLoginWindow() {
    loginWindow = new BrowserWindow({
        width: 400,
        height: 300,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        },
        parent: mainWindow,
        modal: true,
        show: false
    });

    loginWindow.loadFile('login.html');

    loginWindow.once('ready-to-show', () => {
        loginWindow.show();
    });

    ipcMain.handle('submit-login', (event, creds) => {
        credentials = creds;
        loginWindow.close(); 
        createMainWindow();
    });
}

app.whenReady().then(createLoginWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('post-to-bluesky', async (event, postData) => {
    const BskyAgent = require('@atproto/api').BskyAgent;
    const fs = require('fs');

    const agent = new BskyAgent({
        service: 'https://bsky.social'
    });

    try {
        await agent.login({
            identifier: credentials.identifier,
            password: credentials.password,
        });

        const images = [];
        for (let i = 0; i < postData.images.length; i++) {
            const file = fs.readFileSync(postData.images[i]);
            const imageBuffer = Buffer.from(file);
            const { data } = await agent.uploadBlob(imageBuffer, { encoding: 'image/jpeg' });
            images.push({
                alt: postData.altTexts[i],
                image: data.blob
            });
        }

        await agent.post({
            text: postData.text,
            embed: {
                $type: 'app.bsky.embed.images',
                images: images
            },
            createdAt: postData.postDate,
        });

        return { success: true };
    } catch (error) {
        console.error('Failed to post to Bluesky:', error);
        return { success: false, error: error.message };
    }
});
