import Phaser from 'phaser';
import { COLORS, HEIGHT, INDICATOR_FONT, SLIDER, WIDTH } from './constants';
import { SliderManager } from './slider';
import type { DiceDirection } from '../gameLogic';

export interface DiceGameCallbacks {
  onGameReady?: () => void;
  /** Fired when the player drags the target on the slider. */
  onTargetChange?: (value: number) => void;
}

/** Plain handle the React layer talks to (mirrors Plinko's createPlinkoGame). */
export type DiceGame = {
  /** Animate the rolled result along the slider. */
  roll: (resultValue: number, isWin: boolean) => void;
  setTarget: (value: number) => void;
  setDirection: (direction: DiceDirection) => void;
  setCallbacks: (callbacks: DiceGameCallbacks) => void;
  isReady: () => boolean;
  destroy: () => void;
};

const INDICATOR_Y = SLIDER.Y - 54;
const DIAMOND = 48;

class DiceScene extends Phaser.Scene {
  private slider!: SliderManager;
  private indicator!: Phaser.GameObjects.Container;
  private diamond!: Phaser.GameObjects.Graphics;
  private indicatorText!: Phaser.GameObjects.Text;
  private rollTween?: Phaser.Tweens.Tween;
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

    this.slider = new SliderManager(this);
    this.slider.setCallbacks({
      onValueChange: (value) => {
        this.indicator.x = this.slider.valueToX(value);
        this.indicatorText.setText('');
        this.callbacks.onTargetChange?.(value);
      },
    });
    this.slider.create();
    this.buildIndicator();

    this.ready = true;
    this.callbacks.onGameReady?.();

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready
        .then(() => {
          this.slider.refreshFonts();
          this.indicatorText.setFont(INDICATOR_FONT);
        })
        .catch(() => {
          /* fallback font is fine */
        });
    }
  }

  private buildIndicator(): void {
    this.diamond = this.add.graphics();
    this.drawDiamond(COLORS.INDICATOR);
    this.indicatorText = this.add
      .text(0, 0, '', { font: INDICATOR_FONT, color: '#0b1418' })
      .setOrigin(0.5)
      .setResolution(this.dpr);
    this.indicator = this.add
      .container(this.slider.valueToX(this.slider.getSplit()), INDICATOR_Y, [this.diamond, this.indicatorText])
      .setDepth(10);
  }

  private drawDiamond(color: number): void {
    const s = DIAMOND;
    this.diamond.clear();
    this.diamond.fillStyle(color, 1);
    this.diamond.beginPath();
    this.diamond.moveTo(0, -s / 2);
    this.diamond.lineTo(s / 2, 0);
    this.diamond.lineTo(0, s / 2);
    this.diamond.lineTo(-s / 2, 0);
    this.diamond.closePath();
    this.diamond.fillPath();
  }

  // ── Public API ──────────────────────────────────────────────────────────────
  setCallbacks(callbacks: DiceGameCallbacks): void {
    this.callbacks = callbacks;
  }

  isReady(): boolean {
    return this.ready;
  }

  setTarget(value: number): void {
    this.slider.setSplit(value);
    if (this.indicator && !this.indicatorText.text) {
      this.indicator.x = this.slider.valueToX(value);
    }
  }

  setDirection(direction: DiceDirection): void {
    this.slider.setDirection(direction);
  }

  roll(resultValue: number, isWin: boolean): void {
    this.drawDiamond(isWin ? COLORS.GREEN_TOP : COLORS.RED_TOP);
    this.indicatorText.setText(resultValue.toFixed(2));
    this.rollTween?.stop();
    this.rollTween = this.tweens.add({
      targets: this.indicator,
      x: this.slider.valueToX(resultValue),
      duration: 500,
      ease: 'Cubic.easeOut',
    });
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
    roll: (resultValue, isWin) => scene.roll(resultValue, isWin),
    setTarget: (value) => scene.setTarget(value),
    setDirection: (direction) => scene.setDirection(direction),
    setCallbacks: (callbacks) => scene.setCallbacks(callbacks),
    isReady: () => scene.isReady(),
    destroy: () => game.destroy(true),
  };
};
