const io = require('socket.io-client');

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
                default:
                    if (message.startsWith('st-')) {
                        const currentTimeStr = message.slice(3);
                        const currentTime = parseFloat(currentTimeStr);
                        win.webContents.send('video-setTime', currentTime);
                    }else if(message.startsWith('link-')){
                        const link = message.slice(5);
                        win.webContents.send('opened-file', link);
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