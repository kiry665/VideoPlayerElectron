const electron = require("electron");
const ipc = electron.ipcMain;
const {Menu, dialog, BrowserWindow, app} = require('electron');
const path = require('path');
const url = require('url');
const { initServer } = require("./SocketServer");
const { initClient, sendMessage } = require("./SocketClient");
const settings = require('electron-settings');
const prompt = require('electron-prompt');

settings.configure({ fileName: 'settings.json' });

if (!settings.has('video_server')) {
  settings.set('video_server', 'http://localhost:3001');
  console.log('Установлено значение по умолчанию для video_server');
}
if(!settings.has('socket_server')){
  settings.set('socket_server', 'http://localhost:3000');
  console.log('Установлено значение по умолчанию для socket_server');
}

let win;

function createWindow() {

  win = new BrowserWindow({ 
      width: 800, 
      height: 600,
      webPreferences: {
          nodeIntegration: true,
          contextIsolation: false, // очень важная хрень!!!
          enableRemoteModule: true
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
          createChildWindow();
        }
      },
      { 
        label: 'Закрыть файл',
        click: () => {
          win.webContents.send('reset-player');
          sendMessage('reset')
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
          win.webContents.send('videoscreen-toggle');
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
              initClient(win, settings.getSync('socket_server'));
            }
          },
          {type: 'separator'},
          {
            label: 'Адрес сервера с видео',
            click: () => {
              prompt({
                title: 'Введите ссылку',
                label: 'Адрес сервера с видео',
                type: 'input',
                value: settings.getSync('video_server'),
              }).then((r) => {
                if (r === null) {
                  console.log('Ссылка не введена');
                } else {
                  console.log('Введенная ссылка:', r);
                  settings.set('video_server', r);
                }
              }).catch(console.error);
            }
          },
          {
            label: 'Адрес сервера с сокетом',
            click: () => {
              prompt({
                title: 'Введите ссылку',
                label: 'Адрес сервера с сокетом',
                type: 'input',
                value: settings.getSync('socket_server'),
              }).then((r) => {
                if (r === null) {
                  console.log('Ссылка не введена');
                } else {
                  console.log('Введенная ссылка:', r);
                  settings.set('socket_server', r);
                }
              }).catch(console.error);
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

  //win.webContents.openDevTools();
  
  win.on('close', (e) => {
    e.preventDefault();
    const choice = dialog.showMessageBoxSync(win, {
      type: 'question',
      buttons: ['Нет', 'Да'],
      title: 'Подтверждение закрытия',
      message: 'Вы уверены, что хотите закрыть приложение?'
    });

    if (choice === 1) {
      sendMessage('pause');
      win.destroy();
    }
  });

  win.on('closed', () => {
      win = null
  });
}

function createChildWindow() {
  let childWindow = new BrowserWindow({
    width: 400,
    height: 300,
    parent: win,
    modal: true,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // очень важная хрень!!!
      enableRemoteModule: true
    }
  })
  
  childWindow.loadFile('index2.html');
  //childWindow.openDevTools();
  const link = settings.getSync('video_server').concat('/api/videos')
  try {
    fetch(link)
      .then(response => response.json())
      .then(data => {
        console.log(data);
        childWindow.webContents.send('set-media', data);
      })
      .catch(error => {
        console.error('Ошибка получения данных:', error);
      });
  } catch (error) {
    console.error('Ошибка при выполнении fetch:', error);
  }
}

ipc.on('socket', function(event, arg){
  sendMessage(arg);
});

ipc.on('menu', function(event, arg){
  win.setMenuBarVisibility(arg);
});

ipc.on('select-media', function(event,arg){
  const link = settings.getSync('video_server').concat('/videos/', arg);
  win.webContents.send('opened-file', link);
  sendMessage('link-'+link);
})

app.on('ready', createWindow);

let port = 3000;

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

