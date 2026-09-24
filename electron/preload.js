const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('mtApp', {
  onBeforeClose: (callback) => ipcRenderer.on('app:before-close', callback),
  confirmReadyToClose: () => ipcRenderer.send('app:ready-to-close'),
});
