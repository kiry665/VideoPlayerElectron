const ipc = require('electron').ipcRenderer;

const select = document.getElementById('mediaSelect');
const okBtn = document.getElementById('OkBtn');
const cancelBtn = document.getElementById('CancelBtn');

okBtn.addEventListener('click', function(){
  console.log(select.value);
  ipc.send('select-media', select.value);
  window.close();
})

cancelBtn.addEventListener('click', function(){
  window.close();
})

ipc.on('set-media', function(event,arg){
    
    arg.forEach(file => {
      const option = document.createElement('option');
      option.value = file;
      option.text = file;
      select.appendChild(option);
    })
})