import { gravity, horizontalFriction, verticalFriction } from "../constants";
import { Obstacle, Sink } from "../objects";
import { pad, unpad } from "../padding";

export class Ball {
    private x: number;
    private y: number;
    private radius: number;
    private vx: number;
    private vy: number;
    private ctx: CanvasRenderingContext2D;
    private obstacles: Obstacle[]
    private sinks: Sink[]
    private onFinish: (index: number) => void;
    private onObstacleHit: (x: number, y: number) => void;

    constructor(x: number, y: number, radius: number, ctx: CanvasRenderingContext2D, obstacles: Obstacle[], sinks: Sink[], onFinish: (index: number) => void, onObstacleHit: (x: number, y: number) => void) {
      this.x = x;
      this.y = y;
      this.radius = radius;
      this.vx = 0;
      this.vy = 0;
      this.ctx = ctx;
      this.obstacles = obstacles;
      this.sinks = sinks;
      this.onFinish = onFinish;
      this.onObstacleHit = onObstacleHit;
    }
  
    draw() {
      const unpaddedX = unpad(this.x);
      const unpaddedY = unpad(this.y);

      // Create a radial gradient for the faded center effect
      const gradient = this.ctx.createRadialGradient(
        unpaddedX, unpaddedY, 0, // Inner circle (center)
        unpaddedX, unpaddedY, this.radius // Outer circle (edge of the ball)
      );
      gradient.addColorStop(0, 'rgba(255, 255, 0, 1)'); // Bright yellow at the center
      gradient.addColorStop(1, 'rgba(255, 255, 0, 0.5)'); // Faded yellow at the edges

      this.ctx.beginPath();
      this.ctx.arc(unpaddedX, unpaddedY, this.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = gradient;
      this.ctx.fill();
      this.ctx.closePath();
    }
  
    update() {
      this.vy += gravity;
      this.x += this.vx;
      this.y += this.vy;
  
      // Collision with obstacles
      this.obstacles.forEach(obstacle => {
        const dist = Math.hypot(this.x - obstacle.x, this.y - obstacle.y);
        if (dist < pad(this.radius + obstacle.radius)) {
          // Calculate collision angle
          const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
          // Reflect velocity
          const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
          this.vx = (Math.cos(angle) * speed * horizontalFriction);
          this.vy = Math.sin(angle) * speed * verticalFriction;
  
          // Adjust position to prevent sticking
          const overlap = this.radius + obstacle.radius - unpad(dist);
          this.x += pad(Math.cos(angle) * overlap);
          this.y += pad(Math.sin(angle) * overlap);

          this.onObstacleHit(unpad(obstacle.x), unpad(obstacle.y));
        }
      });
  
      // Collision with sinks
      for (let i = 0; i < this.sinks.length; i++) {
        const sink = this.sinks[i];
        if (
            unpad(this.x) > sink.x - sink.width / 2 &&
            unpad(this.x) < sink.x + sink.width / 2 &&
            (unpad(this.y) + this.radius) > (sink.y - sink.height / 2)
        ) {
            this.vx = 0;
            this.vy = 0;
            this.onFinish(i);
            break;
        }
      }
    }
  
  }