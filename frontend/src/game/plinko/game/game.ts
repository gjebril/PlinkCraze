import Phaser from 'phaser';
import {
  BALL_DRAW_RADIUS,
  BIN_BOTTOM_EDGE,
  BIN_CORNER_RADIUS,
  BIN_HEIGHT,
  BIN_LABEL_FONT,
  BIN_LABEL_FONT_MOBILE,
  BIN_ROW_Y,
  BIN_TEXT_COLOR,
  BIN_WIDTH,
  COLORS,
  HEIGHT,
  PEG_DRAW_RADIUS,
  PlinkoViewMode,
  RIPPLE_DURATION,
  RIPPLE_MAX_RADIUS,
  SINK_SHAKE_DURATION,
  SINK_SHAKE_INTENSITY,
  WIDTH,
  ballRadius,
} from './constants';
import { Obstacle, Sink, binCenterX, createObstacles, createSinks } from './objects';
import { BallBody } from './physics';
import { pad, unpad } from './padding';
import { formatMultiplier, getBinColor } from '../utils';

// ── Public types ──────────────────────────────────────────────────────────────
export interface PlinkoResult {
  /** Padded start X coordinate from the imitation outcome table. */
  point: number;
  multiplier: number;
  pattern: string[];
}

export interface PlinkoGameCallbacks {
  onGameReady?: () => void;
  /**
   * Fired the moment a ball settles into a sink.
   * `startX` is the (padded) start position that produced this landing —
   * used by the simulation tool to regenerate the outcome table.
   */
  onBallLanded?: (sinkIndex: number, multiplier: number, startX: number) => void;
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
  private readonly dpr: number;

  constructor(viewMode: PlinkoViewMode = 'normal', dpr = 1) {
    super({ key: 'PlinkoScene' });
    this.viewMode = viewMode;
    this.dpr = dpr;
  }

  create(): void {
    // The world is authored at WIDTH×HEIGHT; render it at device-pixel
    // resolution (zoom = dpr) so the board stays crisp on hi-DPI screens.
    this.cameras.main.setZoom(this.dpr);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);

    this.obstacles = createObstacles();
    this.sinks = createSinks();

    this.pegGfx = this.add.graphics();
    this.dynamicGfx = this.add.graphics();

    this.drawPegs();
    this.createSinkLabels();

    this.ready = true;
    this.callbacks.onGameReady?.();

    // If Poppins finishes loading after the labels were rasterised, re-apply
    // the font so they pick it up (never blocks game start).
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      const font = this.viewMode === 'mobile' ? BIN_LABEL_FONT_MOBILE : BIN_LABEL_FONT;
      document.fonts.ready
        .then(() => this.sinkLabels.forEach((label) => label.setFont(font)))
        .catch(() => {
          /* ignore — fallback font is fine */
        });
    }
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
      (index) => this.handleBallLanded(index, startX),
      (x, y) => this.addRipple(x, y),
    );
    this.balls.push(ball);
  }

  private handleBallLanded(index: number, startX: number): void {
    const sink = this.sinks[index];
    this.shakingSinks.set(index, this.time.now + SINK_SHAKE_DURATION);
    this.callbacks.onBallLanded?.(index, sink?.multiplier ?? 0, startX);
  }

  // ── Drawing ─────────────────────────────────────────────────────────────────
  private drawPegs(): void {
    this.pegGfx.clear();
    this.pegGfx.fillStyle(COLORS.OBSTACLE, 1);
    this.obstacles.forEach((o) => {
      this.pegGfx.fillCircle(unpad(o.x), unpad(o.y), PEG_DRAW_RADIUS);
    });
  }

  private createSinkLabels(): void {
    const font = this.viewMode === 'mobile' ? BIN_LABEL_FONT_MOBILE : BIN_LABEL_FONT;
    this.sinks.forEach((sink) => {
      const label = this.add
        .text(0, 0, formatMultiplier(sink.multiplier), { font, color: BIN_TEXT_COLOR })
        .setOrigin(0.5)
        .setResolution(this.dpr);
      this.sinkLabels.push(label);
    });
  }

  // Bins are positioned from the peg coordinate system (gap midpoints) so they
  // can never drift out of alignment with the pyramid.
  private drawSinks(): void {
    for (let i = 0; i < this.sinks.length; i++) {
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

      const { fill, darkFill } = getBinColor(i);
      const x = binCenterX(i) - BIN_WIDTH / 2 + offsetX;
      const y = BIN_ROW_Y - BIN_HEIGHT / 2 + offsetY;

      // Darker slab underneath, then the main face 3px shorter → bottom lip.
      this.dynamicGfx.fillStyle(darkFill, 1);
      this.dynamicGfx.fillRoundedRect(x, y, BIN_WIDTH, BIN_HEIGHT, BIN_CORNER_RADIUS);
      this.dynamicGfx.fillStyle(fill, 1);
      this.dynamicGfx.fillRoundedRect(x, y, BIN_WIDTH, BIN_HEIGHT - BIN_BOTTOM_EDGE, BIN_CORNER_RADIUS);

      const label = this.sinkLabels[i];
      if (label) {
        label.setPosition(x + BIN_WIDTH / 2, y + (BIN_HEIGHT - BIN_BOTTOM_EDGE) / 2);
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

      this.dynamicGfx.fillStyle(COLORS.BALL_FILL, 1);
      this.dynamicGfx.fillCircle(ball.screenX, ball.screenY, BALL_DRAW_RADIUS);

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
  // Cap at 2× so 3×/4× displays don't create an enormous backing canvas.
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
  const scene = new PlinkoScene(viewMode, dpr);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: WIDTH * dpr,
    height: HEIGHT * dpr,
    backgroundColor: COLORS.BACKGROUND,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: WIDTH * dpr,
      height: HEIGHT * dpr,
    },
    render: { antialias: true, roundPixels: false },
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
