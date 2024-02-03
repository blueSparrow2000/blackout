// server constants
const TICKRATE = 15
const SCREENWIDTH = 1024
const SCREENHEIGHT = 576

const MAPWIDTH = 128*30
const MAPHEIGHT = 128*30

const express = require('express');
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

const loadMap = require("./mapLoader")

// Server Data
const backEndPlayers = {}
const backEndEnemies = {}
const backEndProjectiles = {}
const backEndItems = {}
backEndItems[0] = {
    itemtype: 'melee', groundx:0, groundy:0, size:{length:5, width:5}, name:'fist', color:'black', iteminfo:{ammo:'inf', ammotype:'bio'} ,onground:false, myID: 0, deleteRequest:false
}
const backEndObjects = {}
let enemyId = 0
let projectileId = 0
let itemsId = 0
let objectId = 0

// player attributes
const INVENTORYSIZE = 4
const PLAYERRADIUS = 10 //16
const PLAYERSPEED = TICKRATE/5 // pixel
const PLAYERHEALTH = 8
const PLAYERHEALTHMAX = 8
const GUNHEARRANGE = 700
const PLAYER_JOIN_DELAY = 3000

//to check if there exists any player left
let USERCOUNT = [0]

// for bullets
const FRICTION = 0.992//0.992

// enemy setting (manual)
const SPAWNENEMYFLAG = true
let ENEMYSPAWNRATE = 10000
let ENEMYNUM = 3
let ENEMYCOUNT = 0

const GROUNDITEMFLAG = true 
let GHOSTENEMY = false



function safeDeletePlayer(playerId){
    delete backEndPlayers[playerId]
}

function Moveplayer(playerGIVEN, WW, AA, SS, DD){
    if (WW){
      playerGIVEN.y -= PLAYERSPEED
    }
    if (AA){
      playerGIVEN.x -= PLAYERSPEED
    }
    if (SS){
      playerGIVEN.y += PLAYERSPEED
    }
    if (DD){
      playerGIVEN.x += PLAYERSPEED
    }
    const playerSides = {
      left: playerGIVEN.x - playerGIVEN.radius,
      right: playerGIVEN.x + playerGIVEN.radius,
      top: playerGIVEN.y - playerGIVEN.radius,
      bottom: playerGIVEN.y + playerGIVEN.radius
    }
  
    if (playerSides.left<0){ // restore position for backend
      playerGIVEN.x = playerGIVEN.radius
    }
    if (playerSides.right>MAPWIDTH){ // restore position for backend
      playerGIVEN.x = MAPWIDTH - playerGIVEN.radius
    }
    if (playerSides.top<0){ // restore position for backend
      playerGIVEN.y = playerGIVEN.radius
    }
    if (playerSides.bottom>MAPHEIGHT){ // restore position for backend
      playerGIVEN.y = MAPHEIGHT - playerGIVEN.radius
    }
  
    // check boundary with objects also
    //borderCheckWithObjects(playerGIVEN)
  }
  

async function main(){
    const map2D = await loadMap();

    io.on("connect", (socket) => {
        console.log("user connected",socket.id);
        socket.emit('map',map2D)

        // remove player when disconnected (F5 etc.)
        socket.on('disconnect',(reason) => {
            console.log(reason)
            delete backEndPlayers[socket.id]
        })

        // initialize game when clicking button (submit name)
        socket.on('initGame',({username,playerX, playerY, playerColor})=>{
            // initialize inventory with fist
            let inventory =  new Array(INVENTORYSIZE).fill().map(() => (backEndItems[0])) // array points to references - fist can be shared for all players

            playerJoinTimeout = setTimeout(function(){
            clearTimeout(playerJoinTimeout);
            backEndPlayers[socket.id] = {
                x:playerX,
                y:playerY,
                color: playerColor,
                radius: PLAYERRADIUS,
                score: 0,
                health: PLAYERHEALTH,
                username,
                inventory, // size 4
                currentSlot: 1, // 1~4
                mousePos: {x:0,y:0},
                wearingarmorID: -1
            };
            USERCOUNT[0]++;
            } ,PLAYER_JOIN_DELAY)

        })

        ///////////////////////////////// Frequent key-downs update ///////////////////////////////////////////////
        // update frequent keys at once (Movement & hold shoot)  //always fire hold = true since space was pressed
        socket.on('moveNshootUpdate', ({WW, AA, SS, DD, x, y})=>{
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
            // Movement analysis
            Moveplayer(backEndPlayer, WW, AA, SS, DD)
            socket.emit('holdSpace')
        })

        // update frequent keys at once (Movement only)
        socket.on('movingUpdate', ({WW, AA, SS, DD, x, y})=>{
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
            // Movement analysis
            Moveplayer(backEndPlayer, WW, AA, SS, DD)
        })

        // always fire hold = true since space was pressed
        socket.on('holdUpdate', ({x, y}) => {
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
            socket.emit('holdSpace')
        })

        // hear player's mouse pos changes 
        socket.on('playermousechange', ({x,y})=>{
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){return}
            backEndPlayer.mousePos = {x,y}
        })

        ///////////////////////////////// Non-Frequent key-downs update ////////////////////////////////////////////
        socket.on('keydown',({keycode}) => {
            let backEndPlayer = backEndPlayers[socket.id]
            if (!backEndPlayer){ // if player was removed, do nothing
            return
            }

            // NOT A MOVEMENT
            switch(keycode) {
            case 'Digit1':
                //console.log('Digit1 presssed')
                backEndPlayer.currentSlot = 1
                break
            case 'Digit2':
                //console.log('Digit2 presssed')
                backEndPlayer.currentSlot = 2
                break
            case 'Digit3':
                //console.log('Digit3 presssed')
                backEndPlayer.currentSlot = 3
                break
            case 'Digit4':
                //console.log('Digit4 presssed')
                backEndPlayer.currentSlot = 4
                break
            case 'KeyF':
                //console.log('f presssed')
                socket.emit('interact',backEndItems)
                break
            case 'KeyG':
                //console.log('g presssed')
                break
            case 'KeyR':
                //console.log('r presssed')
                socket.emit('reload')
                break
            default:
                break
            }
        })
      });


}


app.use(express.static("public"));
httpServer.listen(5000);

main();

// backend ticker - update periodically server info to clients
setInterval(() => {
    io.emit('updateFrontEnd',{backEndPlayers, backEndEnemies, backEndProjectiles, backEndObjects, backEndItems})
}, TICKRATE)

