export type SHAPE_RENDER_TYPE = "auto" | "optimizeSpeed" | "crispEdges" | "geometricPrecision";

export const IS_WEB = (function () {
  try {
    return !!process.env.REACT_APP_WEB_ACTIVE;
  } catch (e) {
    return false;
  }
})();

export const LEAD_NAMES = ["FP1-F7", "FP2-F8", "P7-O1", "P8-O2", "FZ-CZ"];

export const SAMPLING_RATE = 64;
export const SEGMENT_DURATION = 6;
export const SEGMENT_LENGTH = SAMPLING_RATE * SEGMENT_DURATION;

export const SPEED_ARRAY = [0, 0.5, 1, 5, 10];

export const PLOT_LINE_COLOR = "#001F4A";
