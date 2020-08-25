/// <reference types="react" />
import { ProvenanceGraph } from '@visdesignlab/trrack';
export interface UndoRedoConfig<T, S extends string, A> {
    undoCallback: () => void;
    redoCallback: () => void;
    graph?: ProvenanceGraph<T, S, A>;
}
declare function UndoRedoButton<T, S extends string, A>({ graph, undoCallback, redoCallback }: UndoRedoConfig<T, S, A>): JSX.Element | null;
export default UndoRedoButton;
