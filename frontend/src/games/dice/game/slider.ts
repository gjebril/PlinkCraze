import Phaser from 'phaser';
import { COLORS, LABEL_FONT, MAX_VALUE, MIN_VALUE, SLIDER, SLIDER_LABELS, WIDTH } from './constants';
import type { DiceDirection } from '../gameLogic';

export interface SliderCallbacks {
  onValueChange?: (value: number) => void;
}

/**
 * Graphics-based dice slider, ported from the reference dice game:
 * rounded border → gap → track → masked red/green gradient → thumb → ticks/labels.
 * Click or drag anywhere on the track to set the target.
 */
export class SliderManager {
  private readonly scene: Phaser.Scene;
  private readonly x: number;
  private readonly y: number;
  private readonly width: number;
  private readonly height = SLIDER.HEIGHT;
  private readonly radius = SLIDER.RADIUS;

  private split = 50;
  private direction: DiceDirection = 'Above';
  private dragging = false;

  private bgGfx!: Phaser.GameObjects.Graphics;
  private gradGfx!: Phaser.GameObjects.Graphics;
  private maskGfx!: Phaser.GameObjects.Graphics;
  private thumbGfx!: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];

  private callbacks: SliderCallbacks = {};

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const margin = WIDTH * SLIDER.MARGIN_PCT;
    this.x = margin;
    this.y = SLIDER.Y;
    this.width = WIDTH - margin * 2;
  }

  setCallbacks(callbacks: SliderCallbacks): void {
    this.callbacks = callbacks;
  }

  getSplit(): number {
    return this.split;
  }

  valueToX(value: number): number {
    return this.x + (value / 100) * this.width;
  }

  private xToValue(xCoord: number): number {
    return ((xCoord - this.x) / this.width) * 100;
  }

  create(): void {
    this.bgGfx = this.scene.add.graphics().setDepth(0);
    this.gradGfx = this.scene.add.graphics().setDepth(1);
    this.thumbGfx = this.scene.add.graphics().setDepth(3);

    // Clip the gradient to the rounded track.
    this.maskGfx = this.scene.add.graphics();
    this.maskGfx.fillStyle(0xffffff, 1);
    this.maskGfx.fillRoundedRect(this.x, this.y, this.width, this.height, this.radius);
    this.maskGfx.setVisible(false);
    this.gradGfx.setMask(this.maskGfx.createGeometryMask());

    this.drawStatic();
    this.drawLabels();
    this.draw();

    // Click / drag interaction over the track region.
    const pad = 24;
    const zone = this.scene.add
      .zone(this.x, this.y - pad, this.width, this.height + pad * 2)
      .setOrigin(0)
      .setInteractive({ useHandCursor: true });

    const apply = (pointerX: number) => {
      const clampedX = Phaser.Math.Clamp(pointerX, this.valueToX(MIN_VALUE), this.valueToX(MAX_VALUE));
      this.setSplit(this.xToValue(clampedX), true);
    };

    zone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.dragging = true;
      apply(p.x);
    });
    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.dragging) apply(p.x);
    });
    this.scene.input.on('pointerup', () => {
      this.dragging = false;
    });
  }

  setSplit(value: number, emit = false): void {
    const rounded = Phaser.Math.Clamp(Math.round(value), MIN_VALUE, MAX_VALUE);
    if (rounded === this.split) return;
    this.split = rounded;
    this.draw();
    if (emit) this.callbacks.onValueChange?.(this.split);
  }

  setDirection(direction: DiceDirection): void {
    this.direction = direction;
    this.draw();
  }

  /** Static frame: outer border, gap, and track background (drawn once). */
  private drawStatic(): void {
    const { GAP, BORDER, OUTER_RADIUS } = SLIDER;
    const g = this.bgGfx;
    g.clear();
    g.fillStyle(COLORS.BORDER, 1);
    g.fillRoundedRect(
      this.x - GAP - BORDER,
      this.y - GAP - BORDER,
      this.width + (GAP + BORDER) * 2,
      this.height + (GAP + BORDER) * 2,
      OUTER_RADIUS,
    );
    g.fillStyle(COLORS.GAP, 1);
    g.fillRoundedRect(
      this.x - GAP,
      this.y - GAP,
      this.width + GAP * 2,
      this.height + GAP * 2,
      OUTER_RADIUS - BORDER,
    );
    g.fillStyle(COLORS.SLIDER_BG, 1);
    g.fillRoundedRect(this.x, this.y, this.width, this.height, this.radius);
  }

  /** Dynamic: the win/loss gradient split and the thumb. */
  private draw(): void {
    const splitX = this.valueToX(this.split);
    const isAbove = this.direction === 'Above';
    const left = isAbove
      ? { top: COLORS.RED_TOP, bottom: COLORS.RED_BOTTOM }
      : { top: COLORS.GREEN_TOP, bottom: COLORS.GREEN_BOTTOM };
    const right = isAbove
      ? { top: COLORS.GREEN_TOP, bottom: COLORS.GREEN_BOTTOM }
      : { top: COLORS.RED_TOP, bottom: COLORS.RED_BOTTOM };

    this.gradGfx.clear();
    const leftW = splitX - this.x;
    if (leftW > 0) {
      this.gradGfx.fillGradientStyle(left.top, left.top, left.bottom, left.bottom, 1);
      this.gradGfx.fillRect(this.x, this.y, leftW, this.height);
    }
    const rightW = this.x + this.width - splitX;
    if (rightW > 0) {
      this.gradGfx.fillGradientStyle(right.top, right.top, right.bottom, right.bottom, 1);
      this.gradGfx.fillRect(splitX, this.y, rightW, this.height);
    }

    // Thumb: a cyan handle straddling the track at the split.
    const tw = SLIDER.THUMB_LINE_WIDTH;
    const th = this.height + 22;
    this.thumbGfx.clear();
    this.thumbGfx.fillStyle(COLORS.THUMB, 1);
    this.thumbGfx.fillRoundedRect(splitX - tw / 2, this.y + this.height / 2 - th / 2, tw, th, 4);
    this.thumbGfx.fillStyle(COLORS.THUMB_LINE, 1);
    this.thumbGfx.fillRect(splitX - 1, this.y + this.height / 2 - th / 2 + 4, 2, th - 8);
  }

  private drawLabels(): void {
    const labelY = this.y + this.height + SLIDER.GAP + SLIDER.BORDER + 18;
    const tickY = this.y + this.height + SLIDER.GAP + SLIDER.BORDER / 2 - SLIDER.TICK_HEIGHT / 2;
    SLIDER_LABELS.forEach((val) => {
      const x = this.valueToX(val);
      const tick = this.scene.add.graphics().setDepth(1);
      tick.fillStyle(COLORS.TICK, 1);
      tick.fillRect(x - SLIDER.TICK_WIDTH / 2, tickY, SLIDER.TICK_WIDTH, SLIDER.TICK_HEIGHT);
      const label = this.scene.add
        .text(x, labelY, String(val), { font: LABEL_FONT, color: '#ffffff' })
        .setOrigin(0.5)
        .setAlpha(0.7);
      this.labels.push(label);
    });
  }

  /** Re-apply the label font once Poppins has loaded. */
  refreshFonts(): void {
    this.labels.forEach((l) => l.setFont(LABEL_FONT));
  }

  destroy(): void {
    this.bgGfx?.destroy();
    this.gradGfx?.destroy();
    this.thumbGfx?.destroy();
    this.maskGfx?.destroy();
    this.labels.forEach((l) => l.destroy());
  }
}
