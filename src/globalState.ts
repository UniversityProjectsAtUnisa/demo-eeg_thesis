import { create } from "zustand";
import { FileWithPath } from "@mantine/dropzone";
import { SEGMENT_DURATION } from "./settings";
import { normalizeSegments } from "./utils";

export interface RawFileData {
  data: number[][][];
  preds: number[];
}

export type Point = { x: number; y: number };
export type Line = Point[];

export interface Event {
  data: Line[];
  startSeconds: number;
  endSeconds: number;
}

export interface FileData {
  sampleSegments: Line[][];
  predictions: number[];
}

export interface GlobalStoreState {
  fileData?: FileData;
  loadFile: (file: FileWithPath) => Promise<void>;
}

const useGlobalStore = create<GlobalStoreState>((set) => ({
  loadFile: async (file: FileWithPath) => {
    const textData = await file.text();
    const { data, preds: predictions }: RawFileData = JSON.parse(textData);

    const normalizedSegments = await normalizeSegments(data);

    const sampleSegments = normalizedSegments.map((seg, a) =>
      seg.map((lead, b) =>
        lead.map((y: number, i: number) => {
          if (isNaN(y)){
            console.log(`NAN ${a} ${b} ${i}`)
          }
          return ({
          x: i,
          y: -y,
        })})
      )
    );


    set({ fileData: { sampleSegments, predictions } });
  },
}));

// SELECTORS
export const fileDataSelector = (s: GlobalStoreState) => s.fileData;
export const loadFileSelector = (s: GlobalStoreState) => s.loadFile;

export default useGlobalStore;
