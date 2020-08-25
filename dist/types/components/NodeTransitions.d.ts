import { BundleMap } from '../Utils/BundleMap';
export default function nodeTransitions(xOffset: number, yOffset: number, clusterOffset: number, backboneOffset: number, duration: number | undefined, nodeList: any[], nodeMap: any, annotationOpen: number, annotationHeight: number, bundleMap?: BundleMap): {
    enter: (data: any) => {
        x: number[];
        y: number[];
        opactiy: number;
        timing: {
            duration: number;
        };
    };
    leave: (data: any) => {
        x: number;
        y: number;
        opacity: number;
    };
    update: (data: any) => {
        x: number[];
        y: number[];
        opactiy: number;
        timing: {
            duration: number;
        };
    };
    start: (data: any) => {
        x: number;
        y: number;
        opacity: number;
    };
};
