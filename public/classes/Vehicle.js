class Vehicle {
    constructor({x, y, radius, color, velocity, damage, health=1}) {
      this.x = x
      this.y = y
      this.radius = radius
      this.color = color
      this.velocity = velocity
      this.damage = damage
      this.health = health
    }
  
    draw(canvas, camX, camY) {
      canvas.beginPath()
      canvas.arc(this.x-camX, this.y-camY, this.radius, 0, Math.PI * 2, false)
      canvas.fillStyle = this.color
      canvas.fill()
    }
  }

class Car extends Vehicle{
    constructor({x, y, radius, color, velocity, damage, health=1}) {
        super({x, y, radius, color, velocity, damage, health})
    }

}
  