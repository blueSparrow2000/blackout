class Vehicle {
    constructor({x, y, radius, color, warningcolor, velocity, damage, health=1,occupied,ridingPlayerID, type}) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.warningcolor = warningcolor
      this.velocity = velocity
      this.damage = damage
      this.health = health
      this.occupied = occupied
      this.ridingPlayerID = ridingPlayerID
      this.type = type
    }
  
    draw(canvas, camX, camY) {
      canvas.beginPath()
      if (this.health<5){
        canvas.fillStyle = this.warningcolor
      }else{
        canvas.fillStyle = this.color
      }

      canvas.arc(this.x-camX, this.y-camY, this.radius, 0, Math.PI * 2, false)
      canvas.fill()

      canvas.beginPath()
      canvas.lineWidth = 4
      canvas.strokeStyle = "black"
      canvas.arc(this.x-camX, this.y-camY, this.radius, 0, Math.PI * 2, false)
      canvas.stroke()

    }
  }

class Car extends Vehicle{
    constructor({x, y, radius, color,warningcolor, velocity, damage, health=1,occupied,ridingPlayerID, type}) {
        super({x, y, radius, color,warningcolor, velocity, damage, health,occupied,ridingPlayerID,type})
    }

}
  