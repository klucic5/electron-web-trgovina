const electron = require("electron");
const url = require("url");
const path = require("path");
const db = require("./lib/connection").db;

const { app, BrowserWindow, Menu, ipcMain } = electron;

let mainWindow, addWindow;
let artiklList = []

app.on("ready", () => {
    mainWindow = new BrowserWindow({
        center: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            enableRemoteModule: true,
        }
    });
    mainWindow.setResizable(false);
    mainWindow.loadURL(path.join(__dirname, 'pages/mainWindow.html'));
    const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
    Menu.setApplicationMenu(mainMenu);
    mainWindow.on('close', () => {
        app.quit();
    })
    ipcMain.on("artikl:close", () => {
        app.quit();
    })
    ipcMain.on("newArtikl:close", () => {
        addWindow.close()
        addWindow = null
    })
    ipcMain.on("newArtikl:save", (err, data) => {
        if(data && data.artiklValue){
            db.query("INSERT INTO artikl SET naziv = ?", data.artiklValue, (err, res, fields) => {
                if(res.insertId > 0){
                    let artikl = {
                        id: res.insertId,
                        naziv: data.artiklValue
                    }
                    artiklList.push(artikl)

                    mainWindow.webContents.send("artikl:addItem", {
                        id: res.insertId,
                        naziv: data.artiklValue
                    })
                }
            })
            if(data.ref == "newForm"){
                addWindow.close()
                addWindow = null
            }
        }
    })
    mainWindow.webContents.once("dom-ready", () => {
        db.query("SELECT * FROM artikl", (error, results, fields) => {
            mainWindow.webContents.send("initApp", results)
        })
    })
    ipcMain.on("artikl:remove", (err, id) => {
        db.query("DELETE FROM artikl WHERE id = ?", id, (err, res, fields) => {
            
            if(res.affectedRows > 0){
                mainWindow.webContents.send("artikl:delSuccess", true)
            }
        })
    })

})



const mainMenuTemplate = [
    {
        label: "Web trgovina",
        submenu: [
            {
                label: "Dodaj novi",
                accelerator: process.platform == "darwin" ? "Command+N" : "Ctrl+N",
                click(){
                    createWindow();
                }
            },
            {
                label: "Izađi",
                accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
                role: "quit"
            }
        ]
    },
    
]

if(process.platform == "darwin"){
    mainMenuTemplate.unshift({
        label: app.getName(),
        role: "ARTIKL"
    })
}



function createWindow(){
    addWindow = new BrowserWindow({
        width: 479,
        height: 176,
        title: "Web trgovina",
        frame: false,
        modal: true,
        parent: mainWindow,
     
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    addWindow.setResizable(false);
    addWindow.loadURL(path.join(__dirname, 'pages/newArtikl.html'));
   

    addWindow.on('close', () => {
        addWindow = null;
    })

}

function getArtiklList(){
    return artiklList
}