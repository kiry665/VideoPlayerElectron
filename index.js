const ipc = require('electron').ipcRenderer;
const videojs = require('video.js');
const { sendMessage } = require('./SocketClient');
var videoPlayer = videojs('videoPlayer');



var isProgrammaticSeek = false;
var isProgrammaticPlayPause = false;
var isFileOpen = false;

ipc.on('opened-file', function(event,arg){
    console.log(arg);
    videoPlayer.src({src: arg});
    videoPlayer.load();
    isFileOpen = true;
})

ipc.on('open-url', function(event, arg){
    
    console.log(arg);
    videoPlayer.src({src: arg, type: 'video/youtube'});
    videoPlayer.load();
    isFileOpen = true;
})

ipc.on('reset-player', function(event){
    
    videoPlayer.reset();
    isFileOpen = false;
})

ipc.on('video-toggle', function(event){
    
    if (videoPlayer.paused()) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
})

ipc.on('video-play', function(event){
    
    isProgrammaticPlayPause = true;
    videoPlayer.play();
})

ipc.on('video-pause', function(event){
    
    isProgrammaticPlayPause = true;
    videoPlayer.pause();
})

ipc.on('video-forward', function(event){
    
    isProgrammaticSeek = true;
    var currentTime = videoPlayer.currentTime();
    var duration = videoPlayer.duration();
    var newTime = currentTime + 10;
    videoPlayer.currentTime(Math.min(newTime, duration));
})

ipc.on('video-backward', function(event){
    
    isProgrammaticSeek = true;
    var currentTime = videoPlayer.currentTime();
    var newTime = currentTime - 10;
    videoPlayer.currentTime(Math.max(newTime, 0));
})

ipc.on('video-setTime', function(event,arg){
    
    isProgrammaticSeek = true;
    videoPlayer.currentTime(arg);
})

videoPlayer.on('play', function() {
    
    if(isProgrammaticPlayPause){
        isProgrammaticPlayPause = false;
        return;
    }
    console.log('Видео начало воспроизведение');
    ipc.send('socket', 'play');
});

videoPlayer.on('pause', function() {
    
    if(isProgrammaticPlayPause){
        isProgrammaticPlayPause = false;
        return
    }
    console.log('Видео перестало воспроизведение');
    ipc.send('socket', 'pause');
});

videoPlayer.on('seeked', function() {
    
    if (isProgrammaticSeek){
        isProgrammaticSeek = false;
        return
    }
    const currentTime = videoPlayer.currentTime();
    ipc.send('socket', 'st-'+currentTime);
    console.log('Время изменено пользователем:', currentTime);
});

videoPlayer.on('fullscreenchange', function(event) {
    if (videoPlayer.isFullscreen()) {
      console.log('Видео перешло в полноэкранный режим');
      ipc.send('menu', false);
    } else {
      ipc.send('menu', true);
    }
  });
