const io = require('socket.io')();

const server = module.exports = { 
    initServer
};

function initServer(){
    const clients = new Set();

    io.on('connection', (socket) => {
        console.log('Server: New client connected');
        
        // Добавить новое соединение в хранилище
        clients.add(socket);
    
        // Обработка события 'message' от клиента
        socket.on('message', (message) => {
            console.log('Server: Received message from client:', message);
            
            // Отправить сообщение всем клиентам, кроме отправителя
            clients.forEach((clientSocket) => {
                if (clientSocket !== socket) {
                    clientSocket.emit('message', message);
                }
                //clientSocket.emit('message', message);
            });
        });
    });

    
    const PORT = process.env.PORT || 3000;
    io.listen(PORT);
    console.log(`Server: Server start on ${PORT}`);
}
