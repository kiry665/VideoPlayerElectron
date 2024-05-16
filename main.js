const electron = require("electron");
const prompt = require('electron-prompt');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const {Menu} = require('electron');
const path = require('path');
const url = require('url');
const { initServer } = require("./SocketServer");
const { initClient, sendMessage } = require("./SocketClient");
const { type } = require("os");
const ipc = electron.ipcMain;
const dialog = require('electron').dialog;

let win;

function createWindow() {

    win = new BrowserWindow({ 
        width: 800, 
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false // очень важная хрень!!!
        }
    });

    win.loadFile('index.html');

    const menuTemplate = [
        {
          label: 'Файл',
          submenu: [
            { 
              label: 'Открыть файл с компьютера',
              click: () => {
                dialog.showOpenDialog(win, {
                  properties: ['openFile'],
                  filters: [{ name: 'Видеофайлы', extensions: ['mp4', 'avi', 'mkv'] }]
                }).then(result => {
                  if (!result.canceled && result.filePaths.length > 0) {
                    win.webContents.send('opened-file', result.filePaths[0]);
                  }
                }).catch(err => {
                  console.error(err);
                });
              }
            },
            {
              label: 'Открыть файл с сервера',
              click: () => {
                prompt({
                  title: 'Введите ссылку',
                  label: 'Ссылка:',
                  value: 'http://localhost:3001/videos/',
                  inputAttrs: {
                    type: 'url'
                  },
                  type: 'input'
                }).then((result) => {
                  if (result === null) {
                    console.log('Ссылка не введена');
                  } else {
                    console.log('Введенная ссылка:', result);
                    win.webContents.send('opened-file', result)
                  }
                }).catch(console.error);                
              }
            },
            { 
              label: 'Закрыть файл',
              click: () => {
                win.webContents.send('reset-player')
              } 
            },
            { type: 'separator' },
            { label: 'Выход', role: 'quit' }
          ]
        },
        {
          label: 'Плеер',
          submenu: [
            {
              label: 'Плей/Пауза',
              accelerator: 'Space',
              click: () =>{
                win.webContents.send('video-toggle');
              }
            },
            {
              label: 'Вперёд',
              accelerator: 'Right',
              click: () => {
                win.webContents.send('video-forward');
                sendMessage('forward');
              }
            },
            {
              label: 'Назад',
              accelerator: 'Left',
              click: () => {
                win.webContents.send('video-backward');
                sendMessage('backward');
              }
            },
            {type: 'separator'},
            {
              label: 'Полноэкранный режим',
              accelerator: 'f',
              click: () => {
                console.log('full');
              }
            }
          ]
        },
        {
            label: 'Комната',
            submenu:[
                {
                  label: 'Создать комнату',
                  click: () => {
                    initServer();
                  }
                },
                {
                  label: 'Подключится к комнате',
                  click: () => {
                    initClient(win);
                  }
                }
            ]
        },
        {
            label: 'Разработка',
            submenu:[
                {
                  label: 'Показать консоль',
                  click: () => {
                      win.webContents.openDevTools();
                  }  
                },
                {
                  label: 'Внешний плей',
                  click: () => {
                    win.webContents.send('video-play');
                  }
                },
                {
                  label: 'Внешний пауза',
                  click: () => {
                    win.webContents.send('video-pause');
                  }
                }
            ]
        }
      ];
      

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    win.webContents.openDevTools();

    win.on('closed', () => {
        win = null
    });
}

ipc.on('socket', function(event, arg){
  sendMessage(arg);
});

ipc.on('menu', function(event, arg){
  win.setMenuBarVisibility(arg);
})

app.on('ready', createWindow);

let port = 3000; // Порт по умолчанию
if (process.argv.length > 2) {
    const argPort = parseInt(process.argv[2]);
    if (!isNaN(argPort)) {
        port = argPort;
    }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (win === null) {
    createWindow();
  }
});

