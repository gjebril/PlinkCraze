export const SCALE = 1;

export const ASSET_PATHS = {
  IMAGES: '/games/Dice/assets/images',
  SOUNDS: '/games/Dice/assets/sounds',
};

export const IMAGE_KEYS = {
  BG_DARK: 'background-dark',
  HANDLE: 'handle',
  DIAMOND: 'diamond',
  DIAMOND_RED: 'diamond-red',
};

export const SOUND_KEYS = {
  START: 'start',
  CLICK: 'click',
  SLIDE: 'slide',
  WIN: 'win',
};

export const SOUND_VOLUMES = {
  START: 0.7,
  CLICK: 0.7,
  SLIDE: 0.8,
  WIN: 1.0,
};

export const LAYOUT_CONFIG = {
  SLIDER_Y_PERCENT: 0.6,
  RESULT_TEXT_Y_PERCENT: 0.25,
};

export const SLIDER_CONFIG = {
  THUMB_WIDTH: 65,
  THUMB_HEIGHT_MULTIPLIER: 2.5,
  TICK_WIDTH: 4,
  TICK_HEIGHT: 12,
  CLICK_COOLDOWN: 50,
};

export const COLORS = {
  BACKGROUND: '#232930',
  BORDER: 0x37474f,
  GAP: 0x232930,
  SLIDER_BG: 0x3e4b5b,
  THUMB_BG: 0x00d1e0,
  THUMB_BG_SHADOW: 0x000000,
  THUMB_BG_SHADOW_ALPHA: 0.3,
  THUMB_LINE: 0x007777,
  TICK: 0x232930,
  RED_TOP: 0xff3490,
  RED_BOTTOM: 0xad0743,
  GREEN_TOP: 0x2fff2b,
  GREEN_BOTTOM: 0x008b05,
  RESULT_TEXT: '#00ff00',
  RESULT_TEXT_LOSS: '#D10552',
  LABEL_TEXT: '#FFFFFF',
  LABEL_SHADOW: '#000000',
};

export const TEXT_STYLES = {
  RESULT_TEXT: {
    fontFamily: 'DM Sans',
    fill: COLORS.RESULT_TEXT,
    fontStyle: '500',
    stroke: COLORS.RESULT_TEXT,
    strokeThickness: 5,
    letterSpacing: -1.5,
  },
  INDICATOR_TEXT: {
    fontSize: 56,
    fontFamily: 'DM Sans',
    fill: COLORS.RESULT_TEXT,
    fontStyle: '500',
  },
  LABEL_TEXT: {
    fontSize: 36,
    fontFamily: 'DM Sans',
    fill: COLORS.LABEL_TEXT,
    shadow: {
      offsetX: 2,
      offsetY: 2,
      color: COLORS.LABEL_SHADOW,
      blur: 2,
      fill: true,
    },
  },
};

export const ANIMATION_CONFIG = {
  FIRST_ROLL_DURATION: 700,
  SUBSEQUENT_ROLL_DURATION: 600,
  EASE: 'Cubic.easeOut',
  INITIAL_ALPHA: 0,
  INITIAL_SCALE: 0.2,
};

export const SLIDER_LABELS = [0, 25, 50, 75, 100];

export const THUMB_LINES = {
  START: -6,
  END: 6,
  STEP: 6,
};

export interface ViewConfig {
  readonly inputEnabled: boolean;
  readonly showResultText: boolean;
  readonly soundEnabled: boolean;
  readonly sliderY: (gameHeight: number) => number;
  readonly indicatorInitialAlpha: number;
  readonly indicatorInitialScale: (gameScale: number) => number;
  readonly indicatorInitialValue: (splitValue: number) => number;
  readonly indicatorTextFontSize: number;
  readonly resultTextFontSize: number;
  readonly labelTextFontSize: number;
  readonly indicatorImageScale: number;
  readonly sliderRadius: number;
  readonly sliderOuterRadius: number;
  readonly sliderGap: number;
  readonly sliderBorderWidth: number;
  readonly sliderHeight: number;
  readonly thumbScale: number;
  readonly thumbOffsetY: number;
  readonly labelYOffset: number;
  readonly sliderMarginPercent: number;
  readonly indicatorGap: number;
}

const NORMAL_VIEW_BASE = {
  inputEnabled: true,
  showResultText: true,
  soundEnabled: true,
  sliderY: (gameHeight: number) => gameHeight * LAYOUT_CONFIG.SLIDER_Y_PERCENT,
  indicatorInitialAlpha: ANIMATION_CONFIG.INITIAL_ALPHA,
  indicatorInitialScale: (gameScale: number) => ANIMATION_CONFIG.INITIAL_SCALE * gameScale,
  indicatorInitialValue: () => 0,
  indicatorTextFontSize: 38,
  labelTextFontSize: 28,
  indicatorImageScale: 0.57,
  sliderRadius: 5,
  sliderOuterRadius: 40,
  sliderGap: 20,
  sliderBorderWidth: 14,
  sliderHeight: 14,
  thumbScale: 0.55,
  thumbOffsetY: 3,
  labelYOffset: 30,
  sliderMarginPercent: 0.11,
  indicatorGap: 20,
} as const;

export const VIEW_CONFIGS: Record<'normal' | 'compact' | 'mobile', ViewConfig> = {
  normal: {
    ...NORMAL_VIEW_BASE,
    resultTextFontSize: 130,
  },
  mobile: {
    ...NORMAL_VIEW_BASE,
    resultTextFontSize: 130,
    sliderRadius: 5,
    sliderOuterRadius: 60,
    sliderGap: 30,
    sliderBorderWidth: 20,
    sliderHeight: 20,
    thumbScale: 0.8,
    thumbOffsetY: 3,
    labelYOffset: 30,
    labelTextFontSize: 36,
    sliderMarginPercent: 0.09,
    indicatorImageScale: 0.8,
    indicatorTextFontSize: 55,
    indicatorGap: 25,
  },
  compact: {
    inputEnabled: false,
    showResultText: false,
    soundEnabled: false,
    sliderY: (gameHeight: number) => gameHeight * LAYOUT_CONFIG.SLIDER_Y_PERCENT,
    indicatorInitialAlpha: 1,
    indicatorInitialScale: (gameScale: number) => gameScale,
    indicatorInitialValue: (splitValue: number) => splitValue,
    indicatorTextFontSize: 16,
    labelTextFontSize: 40,
    indicatorImageScale: 0.25,
    resultTextFontSize: 130,
    sliderRadius: 5,
    sliderOuterRadius: 40,
    sliderGap: 20,
    sliderBorderWidth: 14,
    sliderHeight: 14,
    thumbScale: 0.55,
    thumbOffsetY: 3,
    labelYOffset: 30,
    sliderMarginPercent: 0.11,
    indicatorGap: 20,
  },
};
