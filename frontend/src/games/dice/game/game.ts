import Phaser from 'phaser';
import { COLORS, HEIGHT, WIDTH } from './constants';

// ── Public types ──────────────────────────────────────────────────────────────
export interface DiceGameCallbacks {
  onGameReady?: () => void;
}

/**
 * Plain handle the React layer talks to — mirrors Plinko's `createPlinkoGame`.
 * The React side never touches a raw Phaser object.
 */
export type DiceGame = {
  /** Animate the rolled result onto the slider. */
  roll: (resultValue: number, isWin: boolean) => void;
  /** Move the target marker (0–100). */
  setTarget: (userValue: number) => void;
  /** Switch win side. */
  setDirection: (direction: 'Above' | 'Under') => void;
  setCallbacks: (callbacks: DiceGameCallbacks) => void;
  isReady: () => boolean;
  destroy: () => void;
};

const TRACK_MARGIN = 60;
const valueToX = (value: number) => TRACK_MARGIN + (value / 100) * (WIDTH - 2 * TRACK_MARGIN);

// ── Scene ─────────────────────────────────────────────────────────────────────
// ⚠️ SCAFFOLD: this renders a static slider so the route is navigable. The
// team should flesh out the full dice experience here. TODOs are marked below.
class DiceScene extends Phaser.Scene {
  private gfx!: Phaser.GameObjects.Graphics;
  private target = 50;
  private direction: 'Above' | 'Under' = 'Above';
  private resultValue: number | null = null;
  private callbacks: DiceGameCallbacks = {};
  private ready = false;
  private readonly dpr: number;

  constructor(dpr = 1) {
    super({ key: 'DiceScene' });
    this.dpr = dpr;
  }

  create(): void {
    this.cameras.main.setZoom(this.dpr);
    this.cameras.main.centerOn(WIDTH / 2, HEIGHT / 2);
    this.gfx = this.add.graphics();
    this.draw();

    // TODO(team): replace this placeholder with the real scene —
    //   • draggable target handle (pointer events → setTarget + onTargetChange)
    //   • animated result marker that flies to `resultValue` (tween)
    //   • numeric tick labels (0, 25, 50, 75, 100) using SLIDER_LABEL_FONT
    //   • win/loss flash + optional sound on settle
    this.add
      .text(WIDTH / 2, 40, 'Dice scene — TODO', {
        font: '700 18px Poppins, sans-serif',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setResolution(this.dpr);

    this.ready = true;
    this.callbacks.onGameReady?.();
  }

  private draw(): void {
    const y = HEIGHT / 2;
    const left = valueToX(0);
    const right = valueToX(100);
    const split = valueToX(this.target);

    this.gfx.clear();
    // Base track
    this.gfx.fillStyle(COLORS.TRACK, 1);
    this.gfx.fillRoundedRect(left, y - 8, right - left, 16, 8);

    // Win / loss zones split at the target
    const winColor = COLORS.WIN;
    const lossColor = COLORS.LOSS;
    if (this.direction === 'Above') {
      this.gfx.fillStyle(lossColor, 1);
      this.gfx.fillRect(left, y - 8, split - left, 16);
      this.gfx.fillStyle(winColor, 1);
      this.gfx.fillRect(split, y - 8, right - split, 16);
    } else {
      this.gfx.fillStyle(winColor, 1);
      this.gfx.fillRect(left, y - 8, split - left, 16);
      this.gfx.fillStyle(lossColor, 1);
      this.gfx.fillRect(split, y - 8, right - split, 16);
    }

    // Target handle
    this.gfx.fillStyle(COLORS.TARGET, 1);
    this.gfx.fillRoundedRect(split - 5, y - 22, 10, 44, 3);

    // Result marker (static for now — TODO animate)
    if (this.resultValue !== null) {
      this.gfx.fillStyle(COLORS.MARKER, 1);
      this.gfx.fillCircle(valueToX(this.resultValue), y, 12);
    }
  }

  // ── Public API ────────────────────────────────────────────────────────────
  setCallbacks(callbacks: DiceGameCallbacks): void {
    this.callbacks = callbacks;
  }

  isReady(): boolean {
    return this.ready;
  }

  setTarget(userValue: number): void {
    this.target = userValue;
    this.draw();
  }

  setDirection(direction: 'Above' | 'Under'): void {
    this.direction = direction;
    this.draw();
  }

  roll(resultValue: number): void {
    // TODO(team): animate the marker to `resultValue` instead of snapping.
    this.resultValue = resultValue;
    this.draw();
  }
}

// ── Factory ─────────────────────────────────────────────────────────────────
export const createDiceGame = (config: Phaser.Types.Core.GameConfig): DiceGame => {
  const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 2);
  const scene = new DiceScene(dpr);

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
    render: { antialias: true },
    scene,
    ...config,
  });

  return {
    roll: (resultValue) => scene.roll(resultValue),
    setTarget: (userValue) => scene.setTarget(userValue),
    setDirection: (direction) => scene.setDirection(direction),
    setCallbacks: (callbacks) => scene.setCallbacks(callbacks),
    isReady: () => scene.isReady(),
    destroy: () => game.destroy(true),
  };
};
