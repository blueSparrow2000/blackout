## Required
- npm
- express
- socket.io
- line-circle-collision
- tmx-parser
- nodemon (optional)

Do: npm i tmx-parser


Also need 'Tiled' app


Initial code based on: 
https://www.youtube.com/watch?v=4GQCkW23rTU


## How to run the server
- npm run dev


or 


- nodemon src/backend.js


## How to join the server
 - on hosting device


 URL: localhost:5000


 - on other device



 URL: [hosting device ip - use ipconfig]:5000


 for example: 192.168.0.27:5000

 ## Sample run
<p align="center">Start screen<br /></p>


![interface](../main/run_images/intro.png)

<p align="center">Ingame<br /></p>


![interface](../main/run_images/ingame.png)

<p align="center">map: Wilderness<br /></p>


![interface](../main/run_images/minimap_Wilderness_no_frame.png)


<p align="center">map: Sahara<br /></p>


![interface](../main/run_images/minimap_Sahara_no_frame.png)



 ## Version history
2024.2.3 Basic multiplayer with camera


2024.2.4 Making compatiable with my other multiplayer game


2024.2.5 Added Scope & House


2024.2.6 Added Vehicles: Car, Fennek(BRDM), APC


2024.2.7 Added new map: Sahara / New weapon: tankBuster / New vehicle: tank & turret / Skin system: (username) HALO, VOID is added / Frontend optimization


Future plan
- Code separation (backend) to modules
- Add mines (item)
- Add 2-person car (vehicle)
- Add skin system
- Add door & window (object entity)


## Various Tips
- Maps should be square & need to specify tile number of one side 
- Also Maps should have two layer: layer1 is for ground, layer2 is for ceiling/plants etc.
- minimap size should be fixed to 550 with frame(used in game) and 512 without frame(used for location calculation)


Tiled tip: If you hover over a tile and press ALT+C, tile (col,row) value is copied to a clipboard. Use it when map making!