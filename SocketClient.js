const io = require('socket.io-client');
const settings = require('electron-settings');
settings.configure({ fileName: 'settings.json' });

const client = module.exports = { 
    initClient,
    sendMessage,
    socket : null
};

function initClient(win, server){
    return new Promise((resolve, reject) => {
        
        if (client.socket) {
            console.log('Client: Socket already initialized');
            return resolve();
        }

        client.socket = io(server);

        client.socket.on('connect', () => {
            console.log('Client: Connected to server');
            win.webContents.send('status-ready');
            resolve();
        });

        client.socket.on('error', (error) => {
            console.error('Client: Error connecting to server:', error);
            reject(error);
        });

        client.socket.on('message', (message) => {
            console.log('Client: Received message from server:', message);
            switch (message){
                case 'play':
                    win.webContents.send('video-play');
                    break;
                case 'pause':
                    win.webContents.send('video-pause');
                    break;
                case 'forward':
                    win.webContents.send('video-forward');
                    break;
                case 'backward':
                    win.webContents.send('video-backward');
                    break;
                case 'reset':
                    win.webContents.send('reset-player');
                    break;
                default:
                    if (message.startsWith('st-')) {
                        const currentTimeStr = message.slice(3);
                        const currentTime = parseFloat(currentTimeStr);
                        win.webContents.send('video-setTime', currentTime);
                    }else if(message.startsWith('link-')){
                        const link = message.slice(5);
                        let video_server = settings.getSync('video_server');
                        const fullUrl = `${video_server}/videos/${link}`;
                        console.log(fullUrl);
                        win.webContents.send('opened-file', fullUrl);
                    }
                    break;
            }
        });
    });
}

function sendMessage(message){
    if (!client.socket) {
        console.error('Client: Socket not initialized!');
        return;
    }

    client.socket.emit('message', message);
}