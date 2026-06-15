import { gravity, horizontalFriction, verticalFriction } from './constants';
import { Obstacle, Sink } from './objects';
import { pad, unpad } from './padding';

/**
 * Headless ball physics — ported verbatim from the original canvas `Ball`
 * class, with all rendering stripped out. The Phaser scene owns drawing and
 * simply reads `x`/`y` each frame after calling `update()`.
 *
 * Keeping this math byte-for-byte identical is what guarantees a given start
 * position still lands in the sink that outcomes.json predetermined.
 */
export class BallBody {
  public x: number;
  public y: number;
  public readonly radius: number;
  private vx = 0;
  private vy = 0;
  public settled = false;

  private readonly obstacles: Obstacle[];
  private readonly sinks: Sink[];
  private readonly onFinish: (index: number) => void;
  private readonly onObstacleHit: (x: number, y: number) => void;

  constructor(
    x: number,
    y: number,
    radius: number,
    obstacles: Obstacle[],
    sinks: Sink[],
    onFinish: (index: number) => void,
    onObstacleHit: (x: number, y: number) => void,
  ) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.obstacles = obstacles;
    this.sinks = sinks;
    this.onFinish = onFinish;
    this.onObstacleHit = onObstacleHit;
  }

  /** Unpadded screen-space position for rendering. */
  get screenX(): number {
    return unpad(this.x);
  }

  get screenY(): number {
    return unpad(this.y);
  }

  update(): void {
    if (this.settled) return;

    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Collision with obstacles
    this.obstacles.forEach((obstacle) => {
      const dist = Math.hypot(this.x - obstacle.x, this.y - obstacle.y);
      if (dist < pad(this.radius + obstacle.radius)) {
        const angle = Math.atan2(this.y - obstacle.y, this.x - obstacle.x);
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.vx = Math.cos(angle) * speed * horizontalFriction;
        this.vy = Math.sin(angle) * speed * verticalFriction;

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
        unpad(this.y) + this.radius > sink.y - sink.height / 2
      ) {
        this.vx = 0;
        this.vy = 0;
        this.settled = true;
        this.onFinish(i);
        break;
      }
    }
  }
}
