class ObjectEntity {
    constructor({objecttype, health}) {
      this.objecttype = objecttype
      this.health = health
      this.originalHealth = health
    }
    draw(canvas, camX, camY) {
    }
  }
  
  class Wall extends ObjectEntity {
      constructor({objecttype, health, objectinfo}) {
          super({objecttype, health})
          this.linewidth = objectinfo.width
          this.start = objectinfo.start
          this.end = objectinfo.end
          this.color = objectinfo.color
          this.orientation = objectinfo.orientation
  
      }
      draw(canvas, camX, camY) { // on the ground
          canvas.beginPath()
          canvas.moveTo(this.start.x-camX,this.start.y-camY)
          canvas.lineTo(this.end.x-camX,this.end.y-camY)
          canvas.lineWidth = this.linewidth * (this.health)/this.originalHealth
          canvas.stroke()
      }
      drawShade(playerX,playerY){
        // const PSX = this.start.x - playerX
        // const PSY = this.start.y - playerY
        // const PSInvserse = Math.floor(15*SCREENWIDTH/Math.hypot(PSX,PSY))
  
        // const PEX = this.end.x - playerX
        // const PEY = this.end.y - playerY
        // const PEInverse = Math.floor(15*SCREENWIDTH/Math.hypot(PEX,PEY))
  
        // canvas.beginPath();
        // canvas.moveTo(this.start.x, this.start.y);
        // canvas.lineTo(this.start.x + PSX*PSInvserse, this.start.y + PSY*PSInvserse);
        // canvas.lineTo(this.end.x + PEX*PEInverse, this.end.y + PEY*PEInverse);
        // canvas.lineTo(this.end.x, this.end.y);
        // canvas.closePath();
        // canvas.fill();
  
  
      }
      checkVisibility(playerx,playery, entity){ /*player pos in {x:, y:}  / entity: mutable object (players) */
        // if (this.orientation==='vertical'){
        //   if ( (playerx - this.start.x > 0 && entity.x - this.start.x < 0) ||  (playerx - this.start.x < 0 && entity.x - this.start.x > 0) ){
        //     // same code for speed
        //     const line1 = (entity.x - this.start.x)*(playery - this.start.y) - (entity.y - this.start.y)*(playerx - this.start.x)
        //     const line2 = (entity.x - this.end.x)*(playery - this.end.y) - (entity.y - this.end.y)*(playerx - this.end.x)
        //     if ( (line1 > 0 && line2 < 0) || (line1 < 0 && line2 > 0) ){
        //       entity.visible = false
        //     }
        //   }
        // } 
        // else{ // horizontal
        //   if ( (playery - this.start.y > 0 && entity.y - this.start.y < 0) ||  (playery - this.start.y < 0 && entity.y - this.start.y > 0) ){
        //     // same code for speed
        //     const line1 = (entity.x - this.start.x)*(playery - this.start.y) - (entity.y - this.start.y)*(playerx - this.start.x)
        //     const line2 = (entity.x - this.end.x)*(playery - this.end.y) - (entity.y - this.end.y)*(playerx - this.end.x)
        //     if ( (line1 > 0 && line2 < 0) || (line1 < 0 && line2 > 0) ){
        //       entity.visible = false
        //     }
        //   }
        // }
  
      }
}
  
  
  class Hut extends ObjectEntity {
      constructor({objecttype, health, objectinfo}) {
          super({objecttype, health})
          this.x = objectinfo.center.x
          this.y = objectinfo.center.y
          this.radius = objectinfo.radius
          this.color = objectinfo.color
          //console.log(objecttype, health, objectinfo)
      }
      draw(canvas, camX, camY) { // on the ground
          canvas.beginPath()
          canvas.arc(this.x-camX, this.y-camY, this.radius , 0, Math.PI * 2, false)
          canvas.fill()

      }
      drawShade(playerX,playerY){
       //pass 
      }
      checkVisibility(playerpos, entity){ /*player pos in {x:, y:}  / entity also*/
      //pass
      }
}
  