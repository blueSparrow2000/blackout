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
const PLAYERRADIUS = 16 
const PLAYERSPEED = 2 // pixel
const PLAYERHEALTH = 8
const PLAYERHEALTHMAX = 8
const GUNHEARRANGE = 700
const PLAYER_JOIN_DELAY = 1000

//to check if there exists any player left
let USERCOUNT = [0]

// for bullets
const FRICTION = 0.999//0.992

// enemy setting (manual)
const SPAWNENEMYFLAG = true
let ENEMYSPAWNRATE = 10000
let ENEMYNUM = 3
let ENEMYCOUNT = 0

const GROUNDITEMFLAG = true 
let GHOSTENEMY = false

const gunInfo = {
    'railgun':{travelDistance:0, damage: 3, shake:0, num: 1, fireRate: 1000, projectileSpeed:0, magSize:2, reloadTime: 1800, ammotype:'battery', size: {length:50, width:5}}, // pierce walls and entities
    'CrossBow':{travelDistance:650, damage: 10, shake:0, num: 1, fireRate: 100, projectileSpeed:8, magSize: 1, reloadTime: 1400, ammotype:'bolt', size: {length:21, width:2}}, 
    'GuideGun':{travelDistance:800, damage: 3, shake:0, num: 1, fireRate: 2100, projectileSpeed:6, magSize: 5, reloadTime: 1800, ammotype:'superconductor', size: {length:35, width:8}}, 
    
    'M1':{travelDistance:2000, damage: 5, shake:0, num: 1, fireRate: 1600, projectileSpeed:42, magSize: 5, reloadTime: 4000, ammotype:'7mm', size: {length:42, width:3}}, 
    'mk14':{travelDistance:1000, damage: 3, shake:1, num: 1, fireRate: 600, projectileSpeed:32, magSize:14, reloadTime: 3300, ammotype:'7mm', size: {length:34, width:2} }, 
    'SLR':{travelDistance:1200, damage: 3.5, shake:1, num: 1, fireRate: 350, projectileSpeed:36, magSize: 10, reloadTime: 2700, ammotype:'7mm', size: {length:38, width:2}}, 
    'AWM':{travelDistance:2400, damage: 9, shake:0, num: 1, fireRate: 2000, projectileSpeed:30, magSize:  7, reloadTime: 4000, ammotype:'7mm', size: {length:50, width:3}}, 
    //'Kar98k':{travelDistance:2000, damage: 8, shake:2, num: 1, fireRate: 1600, projectileSpeed:38, magSize: 5, reloadTime: 3500, ammotype:'7mm', size: {length:44, width:3}}, 
    
    'pistol':{travelDistance:500, damage: 1, shake:3, num: 1, fireRate: 300, projectileSpeed:15, magSize:15, reloadTime: 1100, ammotype:'5mm', size: {length:17, width:2}}, 
    'M249':{travelDistance:800, damage: 1, shake:1, num: 1, fireRate: 75, projectileSpeed:23, magSize:150, reloadTime: 7400, ammotype:'5mm', size: {length:28, width:6}},
    'VSS':{travelDistance:1000, damage: 1, shake:1, num: 1, fireRate: 100, projectileSpeed:19, magSize:10, reloadTime: 2300, ammotype:'5mm' , size: {length:27, width:2}}, 
    'ak47':{travelDistance:700, damage: 1, shake:1, num: 1, fireRate: 100, projectileSpeed:21, magSize:30, reloadTime: 1000, ammotype:'5mm', size: {length:28, width:3}}, 
    'FAMAS':{travelDistance:650, damage: 1, shake:2, num: 1, fireRate: 80, projectileSpeed:17, magSize: 30, reloadTime: 3200, ammotype:'5mm', size: {length:22, width:3}}, 
    
    's686':{travelDistance:260, damage: 1, shake:5, num: 5, fireRate: 180, projectileSpeed:10, magSize:2, reloadTime: 1200, ammotype:'12G', size: {length:13, width:5}},
    'DBS':{travelDistance:300, damage: 1, shake:3, num: 3, fireRate: 400, projectileSpeed:13, magSize:14, reloadTime: 6000, ammotype:'12G', size: {length:16, width:5}},
    'usas12':{travelDistance:400, damage: 1, shake:3, num: 2, fireRate: 180, projectileSpeed:14, magSize:5, reloadTime: 2300, ammotype:'12G', size: {length:18, width:4}},
    
    'ump45':{travelDistance:680, damage: 0.5, shake:2, num: 1, fireRate: 90, projectileSpeed:15, magSize:25, reloadTime: 2800, ammotype:'45ACP', size: {length:19, width:4}},
    'vector':{travelDistance:600, damage: 0.5, shake:1, num: 1, fireRate: 50, projectileSpeed:17, magSize:19, reloadTime: 2600, ammotype:'45ACP', size: {length:18, width:3}},
    'mp5':{travelDistance:650, damage: 0.5, shake:1, num: 1, fireRate: 70, projectileSpeed:19, magSize:30, reloadTime: 2100, ammotype:'45ACP', size: {length:20, width:3}},
    
    'fist':{travelDistance:12, damage: 0.2, shake:0, num: 1, fireRate: 300, projectileSpeed:3, magSize:0, reloadTime: 0, ammotype:'bio', size: {length:12, width:2}},
    'knife':{travelDistance:15, damage: 0.4, shake:0, num: 1, fireRate: 200, projectileSpeed:3, magSize:0, reloadTime: 0, ammotype:'sharp', size: {length:14, width:1}},
    'bat':{travelDistance:18, damage: 1, shake:0, num: 1, fireRate: 500, projectileSpeed:3, magSize:0, reloadTime: 0, ammotype:'hard', size: {length:18, width:1.5}},
}
const consumableInfo = {
    'bandage': {size:{length:8, width:8}, color: 'gray', healamount: 2 },
    'medkit': {size:{length:12, width:12}, color: 'gray', healamount: PLAYERHEALTHMAX},
}


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
        // give server info to a frontend
        socket.emit('serverVars', {gunInfo, consumableInfo, PLAYERSPEED})

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


        socket.on('shoot', (angle)=>{
            function addProjectile(){
                projectileId++
               
                const shakeProj = 1
                const bulletSpeed = 30
                const velocity = { // with shake!
                  x: Math.cos(angle) * bulletSpeed + (Math.random()-0.5) * shakeProj,
                  y: Math.sin(angle) * bulletSpeed + (Math.random()-0.5) * shakeProj
                }
                const radius = 5
            
                const travelDistance = 2000
                const projDamage =  3
            
                backEndProjectiles[projectileId] = {
                    x:backEndPlayers[socket.id].x, y:backEndPlayers[socket.id].y, radius,velocity, speed:bulletSpeed, playerId: socket.id, travelDistance, projDamage, gunName:"AWM"
                }
              }
              if (backEndPlayers[socket.id]){
                for (let i=0;i< 1;i++){
                    addProjectile()
                  }
              }

        } )


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
    
  // update projectiles
  for (const id in backEndProjectiles){
    let BULLETDELETED = false
    let projGET = backEndProjectiles[id]
    const PROJECTILERADIUS = projGET.radius
    let myspeed = projGET.speed

    projGET.velocity.x *= FRICTION
    projGET.velocity.y *= FRICTION
    myspeed *= FRICTION

    projGET.x += projGET.velocity.x
    projGET.y += projGET.velocity.y

    projGET.travelDistance -= myspeed
    // travel distance check for projectiles
    if (projGET.travelDistance <= 0){
      BULLETDELETED = true
      delete backEndProjectiles[id]
      continue // dont reference projectile that does not exist
    }

    // boundary check for projectiles
    if (projGET.x - PROJECTILERADIUS >= MAPWIDTH ||
        projGET.x + PROJECTILERADIUS <= 0 ||
        projGET.y - PROJECTILERADIUS >= MAPHEIGHT ||
        projGET.y + PROJECTILERADIUS <= 0 
      ) {
      BULLETDELETED = true
      delete backEndProjectiles[id]
      continue // dont reference projectile that does not exist
    }

    let COLLISIONTOLERANCE = 1 // px
        // collision detection with players
        for (const playerId in backEndPlayers) {
        let backEndPlayer = backEndPlayers[playerId]
        const DISTANCE = Math.hypot(projGET.x - backEndPlayer.x - PLAYERRADIUS, projGET.y - backEndPlayer.y - PLAYERRADIUS)
            if ((projGET.playerId !== playerId) && (DISTANCE < PROJECTILERADIUS + PLAYERRADIUS + COLLISIONTOLERANCE)) {
                // who got hit
                if (backEndPlayer){ // safe
                //const armoredDamage = armorEffect(backEndPlayer.wearingarmorID, projGET.projDamage)
                const armoredDamage = projGET.projDamage
                if (DISTANCE < PROJECTILERADIUS + PLAYERRADIUS + COLLISIONTOLERANCE/2){ // accurate/nice timming shot 
                    backEndPlayer.health -= armoredDamage
                } else{ // not accurate shot
                    backEndPlayer.health -= armoredDamage/2
                }
                if (backEndPlayer.health <= 0){ //check again
                    // who shot projectile
                    if (backEndPlayers[projGET.playerId]){ // safe
                    backEndPlayers[projGET.playerId].score ++
                    }
                    safeDeletePlayer(playerId)} 
                }
                // delete projectile after inspecting who shot the projectile & calculating damage
                BULLETDELETED = true
                delete backEndProjectiles[id] 
                break // only one player can get hit by a projectile
            }
        }
    }

    io.emit('updateFrontEnd',{backEndPlayers, backEndEnemies, backEndProjectiles, backEndObjects, backEndItems})
}, TICKRATE)

