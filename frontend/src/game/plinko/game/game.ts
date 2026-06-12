import Phaser from 'phaser';
import {
  COLORS,
  HEIGHT,
  PlinkoViewMode,
  RIPPLE_DURATION,
  RIPPLE_MAX_RADIUS,
  SINK_SHAKE_DURATION,
  SINK_SHAKE_INTENSITY,
  WIDTH,
  ballRadius,
  obstacleRadius,
} from './constants';
import { Obstacle, Sink, createObstacles, createSinks } from './objects';
import { BallBody } from './physics';
import { pad, unpad } from './padding';
import { getMultiplierColor } from '../utils';

// ── Public types ──────────────────────────────────────────────────────────────
export interface PlinkoResult {
  /** Padded start X coordinate from the imitation outcome table. */
  point: number;
  multiplier: number;
  pattern: string[];
}

export interface PlinkoGameCallbacks {
  onGameReady?: () => void;
  /** Fired the moment a ball settles into a sink. */
  onBallLanded?: (sinkIndex: number, multiplier: number) => void;
}

/** Plain handle the React layer talks to — never a raw Phaser object. */
export type PlinkoGame = {
  drop: (result: PlinkoResult) => void;
  setCallbacks: (callbacks: PlinkoGameCallbacks) => void;
  setMuted: (muted: boolean) => void;
  isReady: () => boolean;
  destroy: () => void;
};

interface Ripple {
  x: number;
  y: number;
  startTime: number;
}

const SINK_GAP = obstacleRadius * 2;
const SINK_CORNER_RADIUS = 5;

// ── Scene ───────────────────────────────────────────────────────────────────
class PlinkoScene extends Phaser.Scene {
  private obstacles: Obstacle[] = [];
  private sinks: Sink[] = [];
  private balls: BallBody[] = [];
  private ripples: Ripple[] = [];
  private shakingSinks = new Map<number, number>();

  private pegGfx!: Phaser.GameObjects.Graphics;
  private dynamicGfx!: Phaser.GameObjects.Graphics;
  private sinkLabels: Phaser.GameObjects.Text[] = [];

  private callbacks: PlinkoGameCallbacks = {};
  private ready = false;
  private readonly viewMode: PlinkoViewMode;

  constructor(viewMode: PlinkoViewMode = 'normal') {
    super({ key: 'PlinkoScene' });
    this.viewMode = viewMode;
  }

  create(): void {
    this.obstacles = createObstacles();
    this.sinks = createSinks();

    this.pegGfx = this.add.graphics();
    this.dynamicGfx = this.add.graphics();

    this.drawPegs();
    this.createSinkLabels();

    this.ready = true;
    this.callbacks.onGameReady?.();
  }

  update(): void {
    this.dynamicGfx.clear();
    this.drawSinks();
    this.drawRipples();
    this.stepBalls();
  }

  // ── Public API (driven by the handle) ──────────────────────────────────────
  setCallbacks(callbacks: PlinkoGameCallbacks): void {
    this.callbacks = callbacks;
  }

  isReady(): boolean {
    return this.ready;
  }

  drop(result: PlinkoResult): void {
    const startX = result.point || pad(WIDTH / 2 + 13);
    const ball = new BallBody(
      startX,
      pad(50),
      ballRadius,
      this.obstacles,
      this.sinks,
      (index) => this.handleBallLanded(index),
      (x, y) => this.addRipple(x, y),
    );
    this.balls.push(ball);
  }

  private handleBallLanded(index: number): void {
    const sink = this.sinks[index];
    this.shakingSinks.set(index, this.time.now + SINK_SHAKE_DURATION);
    this.callbacks.onBallLanded?.(index, sink?.multiplier ?? 0);
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  private drawPegs(): void {
    this.pegGfx.clear();
    this.pegGfx.fillStyle(COLORS.OBSTACLE, 1);
    this.obstacles.forEach((o) => {
      this.pegGfx.fillCircle(unpad(o.x), unpad(o.y), o.radius);
    });
  }

  private createSinkLabels(): void {
    const fontSize = this.viewMode === 'mobile' ? '12px' : '14px';
    this.sinks.forEach((sink) => {
      const { text } = getMultiplierColor(sink.multiplier);
      const label = this.add
        .text(0, 0, `${sink.multiplier}x`, {
          fontFamily: 'Arial, sans-serif',
          fontSize,
          fontStyle: 'bold',
          color: text,
        })
        .setOrigin(0.5);
      this.sinkLabels.push(label);
    });
  }

  private drawSinks(): void {
    for (let i = 0; i < this.sinks.length; i++) {
      const sink = this.sinks[i];
      let offsetX = 0;
      let offsetY = 0;

      const shakeEnd = this.shakingSinks.get(i);
      if (shakeEnd && this.time.now < shakeEnd) {
        const intensity = (shakeEnd - this.time.now) / SINK_SHAKE_DURATION;
        offsetX = (Math.random() - 0.5) * SINK_SHAKE_INTENSITY * intensity;
        offsetY = (Math.random() - 0.5) * SINK_SHAKE_INTENSITY * intensity;
      } else if (shakeEnd) {
        this.shakingSinks.delete(i);
      }

      const { fill } = getMultiplierColor(sink.multiplier);
      const x = sink.x - SINK_GAP / 2 + offsetX;
      const y = sink.y - sink.height / 2 + offsetY;
      const width = sink.width - SINK_GAP / 4;
      const height = sink.height;

      this.dynamicGfx.fillStyle(fill, 1);
      this.dynamicGfx.fillRoundedRect(x, y, width, height, SINK_CORNER_RADIUS);
      this.dynamicGfx.lineStyle(1, COLORS.SINK_BORDER, 0.2);
      this.dynamicGfx.strokeRoundedRect(x, y, width, height, SINK_CORNER_RADIUS);

      const label = this.sinkLabels[i];
      if (label) {
        label.setPosition(x + width / 2, y + height / 2);
      }
    }
  }

  private addRipple(x: number, y: number): void {
    this.ripples.push({ x, y, startTime: this.time.now });
  }

  private drawRipples(): void {
    this.ripples = this.ripples.filter((ripple) => {
      const elapsed = this.time.now - ripple.startTime;
      const progress = elapsed / RIPPLE_DURATION;
      if (progress >= 1) return false;

      const eased = 1 - Math.pow(1 - progress, 3);
      const radius = RIPPLE_MAX_RADIUS * eased;
      const opacity = Math.pow(1 - progress, 2) * 0.6;

      this.dynamicGfx.lineStyle(1.5, COLORS.RIPPLE, opacity);
      this.dynamicGfx.strokeCircle(ripple.x, ripple.y, radius);
      return true;
    });
  }

  private stepBalls(): void {
    this.balls = this.balls.filter((ball) => {
      ball.update();

      this.dynamicGfx.fillStyle(COLORS.BALL_CENTER, 1);
      this.dynamicGfx.fillCircle(ball.screenX, ball.screenY, ball.radius);

      // Drop settled balls one frame after they land so the final
      // resting frame is still drawn.
      return !ball.settled;
    });
  }
}

// ── Factory: wraps the scene behind a plain handle ───────────────────────────
export const createPlinkoGame = (
  config: Phaser.Types.Core.GameConfig,
  viewMode: PlinkoViewMode = 'normal',
): PlinkoGame => {
  const scene = new PlinkoScene(viewMode);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH,
    height: HEIGHT,
    backgroundColor: COLORS.BACKGROUND,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH,
      height: HEIGHT,
    },
    render: { antialias: true },
    scene,
    ...config,
  });

  return {
    drop: (result) => scene.drop(result),
    setCallbacks: (callbacks) => scene.setCallbacks(callbacks),
    setMuted: () => {
      /* no sounds in the minimal build — kept for API parity */
    },
    isReady: () => scene.isReady(),
    destroy: () => game.destroy(true),
  };
};
