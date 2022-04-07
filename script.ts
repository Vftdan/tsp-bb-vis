module Model {
    export module Types {
        export class GraphVertex {
            constructor(
                public name: string,
                public x: number,
                public y: number,
            ) {
            }
            public _index?: number;
        }

        export class GraphArc {
            constructor(
                public start: number,
                public end: number,
            ) {
            }
            public _index?: number;
            public _graph?: Graph;
        }

        export interface ReadonlyGraphArcWeights {
            readonly weights: ReadonlyArray<number>;
        }

        export class GraphArcWeights implements ReadonlyGraphArcWeights {
            public readonly weights: number[] = [];
            readonly [notIndexable: number]: undefined;  // Prevent common typo

            constructor(parent?: ReadonlyGraphArcWeights) {
                if (parent)
                    this.weights = parent.weights.slice(0);
            }
        }

        export interface ReadonlyGraph {
            readonly vertices: ReadonlyArray<Readonly<GraphVertex>>;
            readonly vertexCount: number;
            readonly arcs: ReadonlyArray<Readonly<GraphArc>>;
            readonly arcIndices: {readonly [ends: string]: number};
            readonly weights: ReadonlyGraphArcWeights;
            readonly takenArcs: {readonly [arcIndex: number]: boolean | undefined};
            readonly takenStartVertices: {readonly [vertexIndex: number]: boolean | undefined};
            readonly takenEndVertices: {readonly [vertexIndex: number]: boolean | undefined};
            readonly pathForward: {readonly [vertexIndex: number]: number | undefined}
            readonly pathBackward: {readonly [vertexIndex: number]: number | undefined}
            readonly isSolution: boolean;
            verticesFromIndices(indices: number[]): Readonly<GraphVertex>[];
            arcsFromIndices(indices: number[]): Readonly<GraphArc>[];
            getVertexIndex(vertex: Readonly<GraphVertex>): number;
            getArcIndex(arc: Readonly<GraphArc>): number;
            getArcWeight(arc: Readonly<GraphArc>): number;
            getArcFromEnds(start: number, end: number): Readonly<GraphArc> | null;
            getContainingPath(vertexIndex: number): number[];
        }

        export class Graph implements ReadonlyGraph {
            public readonly vertices: GraphVertex[] = [];
            public vertexCount: number = 0;
            public readonly arcs: GraphArc[] = [];
            public readonly arcIndices: {[ends: string]: number} = Object.create(null);
            public readonly weights: GraphArcWeights = new GraphArcWeights();
            public readonly takenArcs = Object.create(null);
            public readonly takenStartVertices = Object.create(null);
            public readonly takenEndVertices = Object.create(null);
            public readonly pathForward = Object.create(null);
            public readonly pathBackward = Object.create(null);
            public readonly isSolution = false;

            public verticesFromIndices(indices: number[]): GraphVertex[] {
                return indices.map(i => this.vertices[i]);
            }

            public arcsFromIndices(indices: number[]): GraphArc[] {
                return indices.map(i => this.arcs[i]);
            }

            public getVertexIndex(vertex: Readonly<GraphVertex>): number {
                if (!vertex)
                    return -1;
                if (typeof vertex._index == 'number' && this.vertices[vertex._index] == vertex)
                    return vertex._index;
                return this.vertices.indexOf(vertex);
            }

            public getArcIndex(arc: Readonly<GraphArc>): number {
                if (!arc)
                    return -1;
                if (typeof arc._index == 'number' && this.arcs[arc._index] == arc)
                    return arc._index;
                return this.arcs.indexOf(arc);
            }

            public getArcWeight(arc: Readonly<GraphArc>): number {
                const idx = this.getArcIndex(arc);
                if (idx < 0)
                    return Infinity;
                return this.weights.weights[idx];
            }

            public getArcFromEnds(start: number, end: number): GraphArc | null {
                for (let i of [start, end])
                    if (!this.vertices.hasOwnProperty(i))
                        return null;
                const ends: string = start + ',' + end;
                let idx = this.arcIndices[ends];
                if (idx === undefined) {
                    return null;
                }
                return this.arcs[idx] || null;
            }

            public getContainingPath(vertexIndex: number): number[] {
                const path = [vertexIndex];
                while (this.takenEndVertices[path[0]] && path.length <= this.vertexCount)
                    path.unshift(this.pathBackward[path[0]]);
                while (this.takenStartVertices[path[path.length - 1]] && path.length <= this.vertexCount)
                    path.push(this.pathForward[path[path.length - 1]]);
                return path;
            }

            public addVertex(x: number, y: number): GraphVertex {
                let idx = this.vertices.length;
                let vertex = new GraphVertex(idx + 1 + '', x, y);
                this.vertices.push(vertex);
                this.vertexCount++;
                vertex._index = idx;
                return vertex;
            }

            public setArc(start: number, end: number, weight: number): GraphArc {
                for (let i of [start, end])
                    if (!this.vertices.hasOwnProperty(i))
                        throw `Vertex with index ${i} does not exist`;
                const ends: string = start + ',' + end;
                let idx = this.arcIndices[ends];
                if (weight < Infinity) {
                    if (idx === undefined) {
                        idx = this.arcs.length;
                        this.arcIndices[ends] = idx;
                    }
                    let arc: GraphArc = this.arcs[idx];
                    if (!arc) {
                        arc = new GraphArc(start, end);
                        arc._index = idx;
                        arc._graph = this;
                        this.arcs[idx] = arc;
                    }
                    this.weights.weights[idx] = weight;
                    return arc;
                } else {
                    if (idx === undefined)
                        return null;
                    this.arcs[idx] = null;
                    this.weights.weights[idx] = Infinity;
                    return null;
                }
            }
        }

        export class TourSetConstraint {
            private static instances: {[value: string]: TourSetConstraint} = Object.create(null);
            constructor(
                public arc: GraphArc,
                public isTaken: boolean,
            ) {
                const value = this.toString();
                if (TourSetConstraint.instances[value])
                    return TourSetConstraint.instances[value];
                TourSetConstraint.instances[value] = this;
            }

            public toString(): string {
                return (this.isTaken ? '' : '~') + this.arc.start + ',' + this.arc.end;
            }
        }

        export class GraphState implements ReadonlyGraph {
            readonly arcIndices: { [p: string]: number };
            readonly arcs: Readonly<Model.Types.GraphArc>[];
            readonly vertices: ReadonlyArray<Readonly<Model.Types.GraphVertex>>;
            readonly vertexCount: number;
            readonly weights: Model.Types.ReadonlyGraphArcWeights;
            readonly takenArcs: {[arcIndex: number]: boolean | undefined};
            readonly takenStartVertices: {[vertexIndex: number]: boolean | undefined};
            readonly takenEndVertices: {[vertexIndex: number]: boolean | undefined};
            readonly pathForward: {[vertexIndex: number]: number | undefined}
            readonly pathBackward: {[vertexIndex: number]: number | undefined}
            isSolution: boolean = false;

            constructor(parent: ReadonlyGraph) {
                this.arcIndices = parent.arcIndices;
                this.arcs = parent.arcs.slice(0);
                this.vertices = parent.vertices;
                this.vertexCount = parent.vertexCount;
                this.weights = new GraphArcWeights(parent.weights);
                this.takenArcs = Object.assign(Object.create(null), parent.takenArcs);
                this.takenStartVertices = Object.assign(Object.create(null), parent.takenStartVertices);
                this.takenEndVertices = Object.assign(Object.create(null), parent.takenEndVertices);
                this.pathForward = Object.assign(Object.create(null), parent.pathForward);
                this.pathBackward = Object.assign(Object.create(null), parent.pathBackward);
            }

            arcsFromIndices = Graph.prototype.arcsFromIndices;
            getArcFromEnds = Graph.prototype.getArcFromEnds;
            getArcIndex = Graph.prototype.getArcIndex;
            getArcWeight = Graph.prototype.getArcWeight;
            getVertexIndex = Graph.prototype.getVertexIndex;
            verticesFromIndices = Graph.prototype.verticesFromIndices;
            getContainingPath = Graph.prototype.getContainingPath;
        }

        export class TourSetNodeState {
            private static instances: {[value: string]: TourSetNodeState} = Object.create(null);
            private static _graph = null;

            private _children: {[constraint: string]: TourSetNodeState} = Object.create(null);
            private _isCalculated = false;
            private _bound: number;

            public readonly constraints: ReadonlyArray<TourSetConstraint>;
            public readonly graph: GraphState;
            private readonly weights: GraphArcWeights;
            public readonly weightReduction: Algo.WeightReduction;
            public isCalculated(): boolean {
                return this._isCalculated;
            }

            constructor(parent?: TourSetNodeState, constraint?: TourSetConstraint) {
                if (!parent) {
                    if (!constraint) {
                        if (TourSetNodeState.instances[''])
                            return TourSetNodeState.instances[''];
                        TourSetNodeState.instances[''] = this;
                        this.constraints = [];
                        this.graph = new GraphState(originalGraph);
                        this.weights = <GraphArcWeights> this.graph.weights;
                        this._bound = 0;
                        this.weightReduction = new Algo.WeightReduction();
                        this.recalculate();
                    }
                    return new TourSetNodeState(new TourSetNodeState(), constraint);
                }
                if (!constraint)
                    return parent;
                let child: TourSetNodeState = parent._children[constraint.toString()];
                if (child)
                    return child;
                this.graph = new GraphState(parent.graph);
                this.weights = <GraphArcWeights> this.graph.weights;
                this._bound = parent._bound;
                this.weightReduction = new Algo.WeightReduction();
                this.applyConstraint(constraint);
                let constraints = parent.constraints.slice(0);
                constraints.push(constraint);
                constraints.sort();  // TODO: Use binary search & splice() instead
                this.constraints = constraints;
                parent._children[constraint.toString()] = this;
                this.recalculate();
            }

            public getBound(): number {
                return this._bound;
            }

            public increaseBound(value: number): void {
                this._bound += value;
            }

            public static createForGraph(graph: ReadonlyGraph, parent?: TourSetNodeState, constraint?: TourSetConstraint) {
                if (this._graph != graph && graph) {  // `this` in static methods refers to the class
                    const o: any = graph;
                    if (!o.__TourSetNodeState_instances)
                        o.__TourSetNodeState_instances = [];
                    this.instances = o.__TourSetNodeState_instances;
                    this._graph = graph;
                }
                const res: TourSetNodeState = new this(parent, constraint);
                if (res.isCalculated())
                    return res;
                res.recalculate();
                return res;
            }

            private recalculate(): void {
                this.weightReduction.performReduction(this);
            }

            private applyConstraint(constraint: TourSetConstraint) {
                const idx = this.graph.getArcIndex(constraint.arc);
                if (!constraint.isTaken) {
                    this.weights.weights[idx] = Infinity;
                    return;
                }
                this.addTakenArc(constraint.arc);
                const path = this.graph.getContainingPath(constraint.arc.start);
                const mayBeSolution = path.length >= this.graph.vertexCount;
                let remainingArc = null;
                for (const a of this.graph.arcs) {
                    if (!a || !isFinite(this.graph.getArcWeight(a)))
                        continue;
                    if (a.start == constraint.arc.start || a.end == constraint.arc.end ||
                        a.start == path[path.length - 1] && a.end == path[0] && !mayBeSolution)
                        this.weights.weights[this.graph.getArcIndex(a)] = Infinity;
                    if (mayBeSolution && a.start == path[path.length - 1] && a.end == path[0]) {
                        remainingArc = a;
                    }
                }
                if (remainingArc) {
                    this.addTakenArc(remainingArc);
                    this.graph.isSolution = true;
                    this.increaseBound(this.graph.getArcWeight(remainingArc));
                    this.weights.weights[this.graph.getArcIndex(remainingArc)] = 0;
                    const revArc = this.graph.getArcFromEnds(remainingArc.end, remainingArc.start);
                    if (revArc) {
                        this.weights.weights[this.graph.getArcIndex(revArc)] = Infinity;
                    }
                }
            }

            private addTakenArc(arc: GraphArc) {
                const idx = this.graph.getArcIndex(arc);
                this.graph.takenArcs[idx] = true;
                this.graph.takenStartVertices[arc.start] = true;
                this.graph.takenEndVertices[arc.end] = true;
                this.graph.pathForward[arc.start] = arc.end;
                this.graph.pathBackward[arc.end] = arc.start;
            }

            public toString(): string {
                return this.constraints.join(';');
            }
        }

        export interface ReadonlyTourSetNode {
            readonly parent: ReadonlyTourSetNode | null;
            readonly leftChild: ReadonlyTourSetNode | null;
            readonly rightChild: ReadonlyTourSetNode | null;
            readonly state: TourSetNodeState;
            readonly separatingArc: GraphArc | null;
        }

        export interface ReadonlyTourSetRootNode extends ReadonlyTourSetNode {
            readonly parent: null;
        }

        export interface ReadonlyTourSetNonRootNode extends ReadonlyTourSetNode {
            readonly parent: ReadonlyTourSetNode;
        }

        export interface ReadonlyTourLeafSetNode extends ReadonlyTourSetNode {
            readonly leftChild: null;
            readonly rightChild: null;
            readonly separatingArc: null;
        }

        export interface ReadonlyTourNonLeafSetNode extends ReadonlyTourSetNode {
            readonly leftChild: ReadonlyTourSetNode;
            readonly rightChild: ReadonlyTourSetNode;
            readonly separatingArc: GraphArc;
        }

        export class TourSetNode implements ReadonlyTourSetNode {
            constructor(
                public readonly tree: TourSetTree,
                public readonly parent: TourSetNode,
                isTaken?: boolean,
            ) {
                if (!parent)
                    this.state = new TourSetNodeState(null, null);
                else
                    this.state = new TourSetNodeState(parent.state, new TourSetConstraint(parent.separatingArc, isTaken));
            }

            public leftChild: TourSetNode;
            public rightChild: TourSetNode;
            public state: TourSetNodeState;
            public separatingArc: GraphArc;

            public focus(): void {
                solutionTreeNode = this;
                if (this.state)
                    currentGraph = this.state.graph;
            }

            public branch(): void {
                if (this.state.graph.isSolution)
                    return;
                this.leftChild = new TourSetNode(this.tree, this, false);
                this.rightChild = new TourSetNode(this.tree, this, true);
            }
        }

        export function compareNodeBounds(a: TourSetNode, b: TourSetNode): number {
            return a.state.getBound() - b.state.getBound();
        }

        export class TourSetTree {
            private readonly _root: TourSetNode;
            public unvisited: (TourSetNode & ReadonlyTourLeafSetNode)[] = [];
            public maxBound: number = Infinity;

            public getRoot(): TourSetNode {return this._root;}

            constructor() {
                this._root = new TourSetNode(this, null);
                this.unvisited.push(<TourSetNode & ReadonlyTourLeafSetNode> this._root);
            }

            public lowestBoundUnvisitedCount(): number {
                if (this.unvisited.length == 0)
                    return 0;
                const bound = this.unvisited[0].state.getBound();
                if (bound > this.maxBound)
                    return 0;
                for (let i = 1; i < this.unvisited.length; ++i)
                    if (this.unvisited[i].state.getBound() > bound)
                        return i;
                return this.unvisited.length;
            }

            public popUnvisited(index?: number): TourSetNode & ReadonlyTourLeafSetNode {
                if (!index)
                    return this.unvisited.shift();
                return this.unvisited.splice(index, 1)[0];
            }

            public pushUnvisited(node: TourSetNode & ReadonlyTourLeafSetNode): void {
                if (!node)
                    return;
                this.unvisited.push(node);
                this.unvisited.sort(compareNodeBounds);  // TODO O(log n)
            }
        }

        export interface Observer {
            update(): void;
        }

        export enum VisualisationState {
            GRAPH_INPUT,
            INITIAL_REDUCTION,
            SOLUTION_SEARCH,
        }

        export enum SolutionSearchState {
            NEXT_NODE_SELECTION,
            BRANCH_ARC_SELECTION,
            BRANCH_LEFT,
            BRANCH_RIGHT,
            ONE_SOLUTION_FOUND,
            ALL_SOLUTIONS_FOUND,
        }

        export let originalGraph: Graph = new Graph();
        export let currentGraph: ReadonlyGraph = originalGraph;
        export let solutionTree: TourSetTree = null;
        export let solutionTreeNode: TourSetNode = null;
        export let visualisationState: VisualisationState = VisualisationState.GRAPH_INPUT;
        export let solutionSearchState: SolutionSearchState = SolutionSearchState.NEXT_NODE_SELECTION;
    }

    export module Algo {
        export interface ArcWithWeight {
            arc: Types.GraphArc;
            weight: number;
        }
        export const DUMMY_ARC_WITH_WEIGHT: Readonly<ArcWithWeight> = {
            arc: null,
            weight: Infinity,
        };
        export function compareArcs(a: ArcWithWeight, b: ArcWithWeight) {
            return a.weight - b.weight;
        }
        export class WeightReduction {
            public rowsSorted: {[startVertex: number]: ArcWithWeight[]} | null = null;
            public columnsSorted: {[endVertex: number]: ArcWithWeight[]} | null = null;
            public futureRowsSorted: {[startVertex: number]: ArcWithWeight[]} | null = null;
            public futureColumnsSorted: {[endVertex: number]: ArcWithWeight[]} | null = null;
            public affectedRows: number[] | null = null;
            public affectedColumns: number[] | null = null;
            public zeroArcs: number[] | null = null;
            public arcRemovalBoundChanges: {[index: number]: number} | null = null;
            public maxBoundChangeZeroArcs: number[] | null = null;

            public calculateMinima(graph: Types.ReadonlyGraph, row: boolean, column: boolean) {
                if (row) {
                    this.rowsSorted = Array(graph.vertices.length);
                    for (let i = 0; i < graph.vertices.length; ++i)
                        this.rowsSorted[i] = [];
                    this.affectedRows = [];
                }
                if (column) {
                    this.columnsSorted = Array(graph.vertices.length);
                    for (let i = 0; i < graph.vertices.length; ++i)
                        this.columnsSorted[i] = [];
                    this.affectedColumns = [];
                }
                for (let i = 0; i < graph.vertices.length; ++i) {
                    if (!graph.vertices[i])
                        continue;
                    if (row && !graph.takenStartVertices[i])
                        this.affectedRows.push(i);
                    if (column && !graph.takenEndVertices[i])
                        this.affectedColumns.push(i);
                }
                for (const arc of graph.arcs) {
                    if (!arc)
                        continue;
                    const withWeight: ArcWithWeight = this.makeArcWithWeigh(arc, graph);
                    if (row)
                        this.rowsSorted[arc.start].push(withWeight);
                    if (column)
                        this.columnsSorted[arc.end].push(withWeight);
                }
                if (row)
                    for (const i in this.rowsSorted)
                        this.rowsSorted[i].sort(compareArcs);
                if (column)
                    for (const i in this.columnsSorted)
                        this.columnsSorted[i].sort(compareArcs);
            }

            public calculateFutureMinima(graph: Types.ReadonlyGraph) {
                if (this.rowsSorted) {
                    this.futureRowsSorted = [];
                    for (const i in this.rowsSorted) {
                        const row = this.rowsSorted[i];
                        const newRow = [];
                        for (const arc of row)
                            newRow.push(this.makeArcWithWeigh(arc.arc, graph));
                        newRow.sort(compareArcs);
                        this.futureRowsSorted[i] = newRow;
                    }
                }
                if (this.columnsSorted) {
                    this.futureColumnsSorted = [];
                    for (const i in this.columnsSorted) {
                        const column = this.columnsSorted[i];
                        const newColumn = [];
                        for (const arc of column)
                            newColumn.push(this.makeArcWithWeigh(arc.arc, graph));
                        newColumn.sort(compareArcs);
                        this.futureColumnsSorted[i] = newColumn;
                    }
                }
            }

            public getBoundChange(rows: number[] | null, columns: number[] | null) {
                rows = rows || this.affectedRows || [];
                columns = columns || this.affectedColumns || [];

                let boundChange = 0;
                for (const i of rows)
                    boundChange += this.rowsSorted[i][0].weight;
                for (const i of columns)
                    boundChange += this.columnsSorted[i][0].weight;
                return boundChange;
            }

            public subtractMinima(graph: Types.ReadonlyGraph, weights: Types.GraphArcWeights, rows: number[] | null, columns: number[] | null) {
                rows = rows || this.affectedRows || [];
                columns = columns || this.affectedColumns || [];
                const rowSet = {};
                const columnSet = {};
                for (const i of rows)
                    rowSet[i] = true;
                for (const i of columns)
                    columnSet[i] = true;

                for (const arc of graph.arcs) {
                    if (!arc)
                        continue;
                    const idx = graph.getArcIndex(arc);
                    if (!isFinite(weights.weights[idx])) {
                        continue;
                    }
                    if (rowSet[arc.start]) {
                        weights.weights[idx] -= this.rowsSorted[arc.start][0].weight;
                    }
                    if (columnSet[arc.end])
                        weights.weights[idx] -= this.columnsSorted[arc.end][0].weight;
                }
            }

            public findZeros(graph: Types.ReadonlyGraph) {
                this.zeroArcs = [];
                this.arcRemovalBoundChanges = Object.create(null);
                this.maxBoundChangeZeroArcs = [];
                const rowSet = {};
                const columnSet = {};
                for (const i of this.affectedRows)
                    rowSet[i] = true;
                for (const i of this.affectedColumns)
                    columnSet[i] = true;

                let maxBoundChange = 0;
                for (const arc of graph.arcs) {
                    if (!arc)
                        continue;
                    const idx = graph.getArcIndex(arc);
                    if (!rowSet[arc.start] || !columnSet[arc.end] || graph.weights.weights[idx] != 0) {
                        continue;
                    }
                    this.zeroArcs.push(idx);
                    const boundChange = this.arcRemovalBoundChanges[idx] =
                        this.getArcWeight(this.futureRowsSorted[arc.start][1]) +
                        this.getArcWeight(this.futureColumnsSorted[arc.end][1]);
                    if (boundChange > maxBoundChange) {
                        this.maxBoundChangeZeroArcs.length = 0;
                        maxBoundChange = boundChange;
                    }
                    if (boundChange == maxBoundChange)
                        this.maxBoundChangeZeroArcs.push(idx);
                }
            }

            private makeArcWithWeigh(arc: Types.GraphArc, graph: Types.ReadonlyGraph, weights?: Types.ReadonlyGraphArcWeights): ArcWithWeight {
                if (!arc)
                    return DUMMY_ARC_WITH_WEIGHT;
                return {
                    arc: arc,
                    weight: this.getArcWeight({arc: arc, weight: Infinity}, graph, weights),
                };
            }

            private getArcWeight(arc: ArcWithWeight, graph?: Types.ReadonlyGraph, weights?: Types.ReadonlyGraphArcWeights): number {
                if (!arc || !arc.arc) {
                    return Infinity;
                }
                if (!graph)
                    return arc.weight;
                let weight: number;
                if (weights && weights != graph.weights) {
                    const idx = graph.getArcIndex(arc.arc);
                    if (idx < 0) {
                        return Infinity;
                    }
                    weight = weights.weights[idx]
                } else {
                    weight = graph.getArcWeight(arc.arc)
                }
                if (!isFinite(weight)) {
                    return Infinity;
                }
                return weight;
            }

            public initialWeights: Types.ReadonlyGraphArcWeights | null = null;
            public intermediateWeights: Types.ReadonlyGraphArcWeights | null = null;
            public finalWeights: Types.ReadonlyGraphArcWeights | null = null;

            public performReduction(state: Types.TourSetNodeState) {
                const weights = <Types.GraphArcWeights> state.graph.weights;
                this.initialWeights = new Types.GraphArcWeights(weights);

                this.calculateMinima(state.graph, true, false);
                this.subtractMinima(state.graph, weights, null, []);
                state.increaseBound(this.getBoundChange(null, []));
                this.intermediateWeights = new Types.GraphArcWeights(weights);

                this.calculateMinima(state.graph, false, true);
                this.subtractMinima(state.graph, weights, [], null);
                state.increaseBound(this.getBoundChange([], null));
                this.finalWeights = new Types.GraphArcWeights(weights);

                this.calculateFutureMinima(state.graph);
                this.findZeros(state.graph);
            }
        }
    }
}

module Presentation {
    export module PresentationModel {
        import Observer = Model.Types.Observer;

        export enum GraphVertexStyle {
            UNFOCUSED,
            FOCUSED,
        }
        export enum GraphArcStyle {
            UNFOCUSED,
            FOCUSED,
        }
        export enum GraphEdgeStyle {
            UNFOCUSED,
            FOCUSED,
        }
        export interface GraphVertex {
            style: GraphVertexStyle;
            x: number;
            y: number;
            index: number;
            modelIndex: number;
        }
        export interface GraphArcWeight {
            style: GraphArcStyle;
            x: number;
            y: number;
            rotation: number;
            isZero: boolean;
            label: string;
            weight: number;
            isMin: boolean;  // rank = 1 or 2 depending on context
            isTaken: boolean;
            size: number;
            fillPart: number;
            modelIndex: number;
        }
        export interface GraphEdge {
            style: GraphEdgeStyle;
            forward: GraphArcWeight | null;
            backward: GraphArcWeight | null;
            start: GraphVertex;
            end: GraphVertex;
            index: number;
        }

        export interface GraphPresentationModel extends Model.Types.Observer {
            readonly vertices: ReadonlyArray<GraphVertex>;
            readonly edges: ReadonlyArray<GraphEdge>;
            readonly observers: Observer[];
            readonly isEditable: boolean;
            readonly isReductionShown: boolean;
            readonly reductionMin: number | null;
            readonly bound: number;
            readonly boundMax: number;
            readonly boundDelta: number;
            convertArc(modelArc: Readonly<Model.Types.GraphArc>): GraphArcWeight | null;
        }

        export enum SolutionTreeNodeStyle {
            UNFOCUSED,
            FOCUSED,
        }

        export enum SolutionTreeEdgeStyle {
            UNFOCUSED,
            FOCUSED,
        }

        export interface SolutionTreeNode {
            bound: number;
            separatingArc: ReadonlyArray<number> | null;
            level: number;
            xOffset: number;
            style: SolutionTreeNodeStyle;
            model: Model.Types.TourSetNode;
            parent: SolutionTreeNode | null;
            left: SolutionTreeNode | null;
            right: SolutionTreeNode | null;
            isSolution: boolean;
        }

        export interface SolutionTreeEdge {
            style: SolutionTreeEdgeStyle;
            parent: SolutionTreeNode;
            child: SolutionTreeNode;
            isTaken: boolean;
        }

        export interface SolutionTreePresentationModel extends Model.Types.Observer {
            readonly nodes: ReadonlyArray<SolutionTreeNode>;
            readonly nodesByLevel: ReadonlyArray<ReadonlyArray<SolutionTreeNode>>;
            readonly edges: ReadonlyArray<SolutionTreeEdge>;
            readonly maxDepth: number;
            readonly maxWidth: number;
            readonly observers: Observer[];
        }

        function calculateRotation(x1: number, y1: number, x2: number, y2: number) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            if (!dx && !dy)
                return 0;
            return Math.atan2(dy, dx);
            // if (!dx || !(dx / dy))
            //     return dy > 0 ? Math.PI / 2 : -Math.PI / 2;
            // if (!dy || !(dy / dx))
            //     return dx > 0 ? 0 : Math.PI;
            // return dx > 0 ? Math.atan(dy / dx) : -Math.PI / 2;
        }

        export enum ReductionStep {
            INITIAL,
            MIN_FOUND,
            REDUCED,
        }
        export let reductionStep: ReductionStep = ReductionStep.INITIAL;
        export let reductionIsIngoing = false;
        export let focusedVertex = -1;

        export const graph: GraphPresentationModel = <GraphPresentationModel> {
            update() {
                this.vertices = [];
                this._modelToPresentationVertexIndices = Object.create(null);
                const model = Model.Types.currentGraph;
                let recalculateBoundMax = false;
                if (this.isEditable && Model.Types.originalGraph != model)
                    recalculateBoundMax = true;
                this.isEditable = Model.Types.originalGraph == model;
                this.reductionMin = null;
                for (const v of model.vertices) {
                    if (!v)
                        continue;
                    const pv = {
                        style: GraphVertexStyle.FOCUSED,
                        x: v.x,
                        y: v.y,
                        index: this.vertices.length,
                        modelIndex: model.getVertexIndex(v),
                    };
                    if (focusedVertex != -1 && focusedVertex != pv.modelIndex)
                        pv.style = GraphVertexStyle.UNFOCUSED;
                    this.vertices.push(pv);
                    this._modelToPresentationVertexIndices[pv.modelIndex] = pv.index;
                }

                this.isReductionShown = (Model.Types.solutionTreeNode && Model.Types.solutionTreeNode.state && focusedVertex != -1) || false;
                if (recalculateBoundMax && Model.Types.solutionTree) {
                    const root = Model.Types.solutionTree.getRoot();
                    if (root.state) {
                        let boundMax = 0;
                        for (const i in root.state.weightReduction.affectedRows) {
                            const row = root.state.weightReduction.rowsSorted[i];
                            let weight: number;
                            if (row && row.length && isFinite(weight = row[row.length - 1].weight))
                                boundMax += weight;
                        }
                        for (const i in root.state.weightReduction.affectedColumns) {
                            const column = root.state.weightReduction.columnsSorted[i];
                            let weight: number;
                            if (column && column.length && isFinite(weight = column[column.length - 1].weight))
                                boundMax += weight;
                        }
                        this.boundMax = boundMax;
                    } else if (!this.boundMax)
                        this.boundMax = 1;
                }
                this.boundDelta = 0;
                if (Model.Types.solutionTreeNode && Model.Types.solutionTreeNode.state) {
                    this.bound = Model.Types.solutionTreeNode.state.getBound();
                    if (this.isReductionShown) {
                        if (reductionStep == ReductionStep.MIN_FOUND) {
                            this.boundDelta = Model.Types.solutionTreeNode.state.weightReduction.getBoundChange(
                                reductionIsIngoing ? [] : [focusedVertex],
                                reductionIsIngoing ? [focusedVertex] : [],
                            );
                        }
                        const previousBound = Model.Types.solutionTreeNode.parent ? Model.Types.solutionTreeNode.parent.state.getBound() : 0;
                        let rows = null, columns = null;
                        if (reductionIsIngoing) {
                            let index = Model.Types.solutionTreeNode.state.weightReduction.affectedColumns.indexOf(focusedVertex);
                            if (reductionStep == ReductionStep.REDUCED)
                                ++index;
                            columns = Model.Types.solutionTreeNode.state.weightReduction.affectedColumns.slice(0, index);
                        } else {
                            columns = [];
                            let index = Model.Types.solutionTreeNode.state.weightReduction.affectedRows.indexOf(focusedVertex);
                            if (reductionStep == ReductionStep.REDUCED)
                                ++index;
                            rows = Model.Types.solutionTreeNode.state.weightReduction.affectedColumns.slice(0, index);
                        }
                        this.bound = previousBound + Model.Types.solutionTreeNode.state.weightReduction.getBoundChange(rows, columns);
                    }
                }

                this.edges = [];
                this._edgeEndsToIndices = Object.create(null);
                for (const arc of model.arcs) {
                    if (!arc)
                        continue;
                    let modelIndex;
                    let weight = model.weights.weights[modelIndex = model.getArcIndex(arc)];
                    const reductionVertexNumber = reductionIsIngoing ? arc.end : arc.start;
                    if (this.isReductionShown) {
                        const threshold = reductionStep == ReductionStep.REDUCED ? focusedVertex + 1 : focusedVertex;
                        if (reductionVertexNumber >= threshold && !reductionIsIngoing)
                            weight = Model.Types.solutionTreeNode.state.weightReduction.initialWeights.weights[modelIndex];
                        else if (reductionVertexNumber < threshold && !reductionIsIngoing || reductionVertexNumber >= threshold && reductionIsIngoing)
                            weight = Model.Types.solutionTreeNode.state.weightReduction.intermediateWeights.weights[modelIndex];
                        else if (reductionVertexNumber < threshold && reductionIsIngoing)
                            weight = Model.Types.solutionTreeNode.state.weightReduction.finalWeights.weights[modelIndex];
                    }
                    if (typeof weight != 'number' || isNaN(weight))
                        continue;
                    if (weight == Infinity) {
                        if (!model.takenArcs[modelIndex])
                            continue;
                        weight = 0;
                    }
                    let start: GraphVertex = this.vertices[this._modelToPresentationVertexIndices[arc.start]];
                    let end:   GraphVertex = this.vertices[this._modelToPresentationVertexIndices[arc.end]];

                    const pa: GraphArcWeight = {
                        style: GraphArcStyle.FOCUSED,
                        x: (start.x + end.x) / 2,
                        y: (start.y + end.y) / 2,
                        rotation: calculateRotation(start.x, start.y, end.x, end.y),
                        isZero: weight == 0,
                        label: weight != 0 ? weight.toString() : '',
                        weight: weight,
                        isMin: false,
                        isTaken: model.takenArcs[modelIndex] || false,
                        size: Math.max(Math.sqrt(weight), .5) * 16,
                        fillPart: 0,
                        modelIndex: modelIndex,
                    };
                    if (this.isReductionShown && focusedVertex != reductionVertexNumber)
                        pa.style = GraphArcStyle.UNFOCUSED;
                    if (focusedVertex == reductionVertexNumber && this.isReductionShown) {
                        const weightReduction = Model.Types.solutionTreeNode.state.weightReduction;
                        if (reductionIsIngoing && weightReduction.columnsSorted || !reductionIsIngoing && weightReduction.rowsSorted) {
                            const sorted = reductionIsIngoing ? weightReduction.columnsSorted[arc.end] : weightReduction.rowsSorted[arc.start];
                            switch (reductionStep) {
                                case Presentation.PresentationModel.ReductionStep.INITIAL:
                                    break;
                                case Presentation.PresentationModel.ReductionStep.MIN_FOUND: {
                                    const min = sorted[0].weight;
                                    this.reductionMin = min;
                                    if (min == weight) {
                                        pa.isMin = true;
                                    } else {
                                        pa.fillPart = Math.sqrt(min / weight);
                                    }
                                    break;
                                }
                                case Presentation.PresentationModel.ReductionStep.REDUCED: {
                                    if (sorted[0].weight == sorted[1].weight)
                                        break;
                                    const min = sorted[1].weight - sorted[0].weight;
                                    this.reductionMin = min;
                                    if (min == weight) {
                                        pa.isMin = true;
                                    } else {
                                        pa.fillPart = min / weight;
                                    }
                                }
                            }
                        }
                    }
                    const keyFw = arc.start + ',' + arc.end;
                    const keyBk = arc.end + ',' + arc.start;
                    let edgeIdx: number;
                    let edge: GraphEdge;
                    if (typeof (edgeIdx = this._edgeEndsToIndices[keyBk]) == 'number') {
                        edge = this.edges[edgeIdx];
                        edge.backward = pa;
                        if (pa.style != GraphArcStyle.UNFOCUSED)
                            edge.style = GraphEdgeStyle.FOCUSED;
                        continue;
                    }
                    if (typeof (edgeIdx = this._edgeEndsToIndices[keyFw]) == 'number') {
                        edge = this.edges[edgeIdx];
                        console.error('Duplicate arc: ' + keyFw)
                        edge.forward = pa;
                        continue;
                    }
                    edgeIdx = this.edges.length;
                    this._edgeEndsToIndices[keyFw] = edgeIdx;
                    edge = {
                        style: pa.style == GraphArcStyle.UNFOCUSED ? GraphEdgeStyle.UNFOCUSED : GraphEdgeStyle.FOCUSED,
                        start: start,
                        end: end,
                        forward: pa,
                        backward: null,
                        index: edgeIdx,
                    };
                    this.edges.push(edge);
                }
                for (const o of this.observers) {
                    if (!o)
                        continue;
                    o.update();
                }
            },
            convertArc(modelArc: Readonly<Model.Types.GraphArc>): GraphArcWeight | null {
                if (!modelArc)
                    return null;
                const keyFw = modelArc.start + ',' + modelArc.end;
                const keyBk = modelArc.end + ',' + modelArc.start;
                let edgeIdx: number;
                let edge: GraphEdge;
                if (typeof (edgeIdx = this._edgeEndsToIndices[keyBk]) == 'number') {
                    edge = this.edges[edgeIdx];
                    return edge.backward;
                }
                if (typeof (edgeIdx = this._edgeEndsToIndices[keyFw]) == 'number') {
                    edge = this.edges[edgeIdx];
                    return edge.forward;
                }
                return null;
            },
            vertices: [],
            edges: [],
            observers: [],
            isEditable: true,
            isReductionShown: false,
            reductionMin: null,
            bound: 1,
            boundMax: 0,
            boundDelta: 0,
            _modelToPresentationVertexIndices: Object.create(null),
            _edgeEndsToIndices: Object.create(null),
        };

        export const solutionTree: SolutionTreePresentationModel = <SolutionTreePresentationModel> {
            update() {
                this.nodes = [];
                this.nodesByLevel = [];
                this.edges = [];
                if (!Model.Types.solutionTree) {
                    return;
                }
                this._fillNodes(Model.Types.solutionTree.getRoot(), null);
                this.maxDepth = this.nodesByLevel.length;
                this.maxWidth = 0;
                this._adjustOffsets();
                for (const o of this.observers) {
                    if (!o)
                        continue;
                    o.update();
                }
            },
            _fillNodes(node: Model.Types.TourSetNode, pParent: SolutionTreeNode | null): SolutionTreeNode | null {
                if (!node)
                    return null;
                const pNode: SolutionTreeNode = {
                    bound: node.state.getBound(),
                    separatingArc: null,
                    level: pParent ? pParent.level + 1 : 0,
                    xOffset: 0,
                    style: node == Model.Types.solutionTreeNode ? SolutionTreeNodeStyle.FOCUSED : SolutionTreeNodeStyle.UNFOCUSED,
                    model: node,
                    parent: pParent,
                    left: null,
                    right: null,
                    isSolution: node.state.graph.isSolution,
                };
                if (node.parent && node.parent == Model.Types.solutionTreeNode) {
                    if (Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_LEFT && node == node.parent.rightChild)
                        return null;
                    if (
                        (Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_LEFT && node == node.parent.leftChild)
                        ||
                        (Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_RIGHT && node == node.parent.rightChild)
                    )
                        pNode.style = SolutionTreeNodeStyle.FOCUSED;
                }
                if (node.separatingArc) {
                    pNode.separatingArc = [node.separatingArc.start, node.separatingArc.end];
                }
                this.nodes.push(pNode);
                if (!this.nodesByLevel[pNode.level])
                    this.nodesByLevel[pNode.level] = [];
                pNode.xOffset = this.nodesByLevel[pNode.level].length;
                this.nodesByLevel[pNode.level].push(pNode);
                pNode.left = this._fillNodes(node.leftChild, pNode)
                pNode.right = this._fillNodes(node.rightChild, pNode)
                if (pNode.left)
                    this.edges.push({
                        style: pNode.style == SolutionTreeNodeStyle.FOCUSED && pNode.left.style == SolutionTreeNodeStyle.FOCUSED ? SolutionTreeEdgeStyle.FOCUSED : SolutionTreeEdgeStyle.UNFOCUSED,
                        parent: pNode,
                        child: pNode.left,
                        isTaken: false,
                    });
                if (pNode.right)
                    this.edges.push({
                        style: pNode.style == SolutionTreeNodeStyle.FOCUSED && pNode.right.style == SolutionTreeNodeStyle.FOCUSED ? SolutionTreeEdgeStyle.FOCUSED : SolutionTreeEdgeStyle.UNFOCUSED,
                        parent: pNode,
                        child: pNode.right,
                        isTaken: true,
                    });
                return pNode;
            },
            _adjustOffsets() {
                for (let i = this.nodesByLevel.length - 1; i >= 0; --i) {
                    for (let j = 0; j < this.nodesByLevel[i].length; ++j) {
                        const node: SolutionTreeNode = this.nodesByLevel[i][j];
                        let x: number = node.xOffset;
                        if (j) {
                            x = Math.max(x, this.nodesByLevel[i][j - 1].xOffset + 1);
                        }
                        if (node.parent) {
                            x = Math.max(x, node.parent.xOffset - 0.5);
                        }
                        if (node.left) {
                            let cx = node.left.xOffset;
                            if (node.right)
                                cx = (cx + node.right.xOffset) / 2;
                            else
                                cx += .5;
                            x = Math.max(x, cx);
                        }
                        node.xOffset = x;
                        this.maxWidth = Math.max(this.maxWidth, x + 1);
                    }
                }
                // for (let i = 1; i < this.nodesByLevel.length; ++i) {
                //     for (let j = this.nodesByLevel[i].length - 1; j >= 0; --j) {
                //         const node: SolutionTreeNode = this.nodesByLevel[i][j];
                //         let x: number = node.xOffset;
                //         const px = node.parent.xOffset + (node.parent.right == node ? 0.5 : -0.5);
                //         if (x >= px)
                //             continue;
                //         if (j < this.nodesByLevel[i].length - 1) {
                //             x = Math.min(px, this.nodesByLevel[i][j + 1].xOffset - 1);
                //         } else {
                //             x = px;
                //             this.maxWidth = Math.max(this.maxWidth, x + 1);
                //         }
                //         node.xOffset = x;
                //     }
                // }
            },
            nodes: [],
            nodesByLevel: [],
            edges: [],
            maxDepth: 0,
            maxWidth: 0,
            observers: [],
        };
    }

    export type MouseHandler = {(type: 'click' | 'down' | 'up' | 'move', e: MouseEvent, x: number, y: number): void};
    export type VertexInputHandler = {(e: InputEvent | KeyboardEvent | FocusEvent | null, startVertex: number, endVertex: number, value: string): void};
    export interface MouseHandling {
        mouseHandler: MouseHandler | null;
    }

    export interface View extends MouseHandling {
        render(): void;
        init(g: GraphicLibrary.Factory, parentNode: HTMLElement): void;
    }

    export module GraphicLibrary {
        export interface Factory {
            create(parentNode: HTMLElement, width: number, height: number): Instance;
        }

        export interface Instance extends MouseHandling {
            strokeWidth: number;
            readonly width: number;
            readonly height: number;
            clear(): void;
            pushTransformation(): void;
            popTransformation(): void;
            transformRotate(angle: number): void;
            transformTranslate(x: number, y: number): void;
            resize(width: number, height: number): void;
            drawText(x: number, y: number, xAlign: -1 | 0 | 1, yAlign: -1 | 0 | 1, fg: string, text: string): void;
            drawCircle(cx: number, cy: number, r: number, bg?: string | null, fg?: string | null, text?: string | null): void;
            drawLine(x1: number, y1: number, x2: number, y2: number, fg: string): void;
            drawPolygon(points: ArrayLike<{x: number, y: number}>, bg?: string | null, fg?: string | null, text?: string | null): void;
            drawArrow?(x1: number, y1: number, x2: number, y2: number, fg: string): void;
            drawDiamond?(cx: number, cy: number, rx: number, ry: number, bg?: string | null, fg?: string | null, text?: string | null): void;
        }

        export interface AllMethods extends Readonly<Instance> {
            drawArrow(x1: number, y1: number, x2: number, y2: number, fg: string): void;
            drawDiamond(cx: number, cy: number, rx: number, ry: number, bg?: string | null, fg?: string | null, text?: string | null): void;
        }

        export function addOptionalMethods<T extends Instance>(instance: T): AllMethods & Readonly<T> {
            const obj: Readonly<T> & any = Object.create(instance);
            if (!obj.drawArrow)
                obj.drawArrow = function (x1: number, y1: number, x2: number, y2: number, fg: string): void {
                    this.drawLine(x1, y1, x2, y2, fg);
                    const dx = x2 - x1;
                    const dy = y2 - y1;
                    const a = Math.atan2(dy, dx);
                    const s = Math.sin(a);
                    const c = Math.cos(a);
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const headLength = Math.min(length * .75, this.strokeWidth * 8);
                    const headSemiwidth = Math.min(headLength * .75, this.strokeWidth * 3);
                    const hx1 = -headLength * c - headSemiwidth * s;
                    const hx2 = -headLength * c + headSemiwidth * s;
                    const hy1 = -headLength * s + headSemiwidth * c;
                    const hy2 = -headLength * s - headSemiwidth * c;
                    this.drawPolygon([{x: x2 + hx1, y: y2 + hy1}, {x: x2, y: y2}, {x: x2 + hx2, y: y2 + hy2}], fg);
                }
            if (!obj.drawDiamond)
                obj.drawDiamond = function (cx: number, cy: number, rx: number, ry: number, bg?: string | null, fg?: string | null, text?: string | null) {
                    this.drawPolygon([{x: cx - rx, y: cy}, {x: cx, y: cy + ry}, {x: cx + rx, y: cy}, {x: cx, y: cy - ry}, {x: cx - rx, y: cy}], bg, fg, text);
                }
            return obj;
        }

        export class CanvasImplementation implements Instance {
            private static readonly SCALE = 4;

            public strokeWidth: number = 1;
            public canvas: HTMLCanvasElement;
            public ctx: CanvasRenderingContext2D;
            public mouseHandler = null;
            public width = 0;
            public height = 0;

            public constructor(width: number, height: number) {
                this.canvas = document.createElement('canvas')
                this.ctx = this.canvas.getContext('2d');
                this.resize(width, height);
                for (const [domName, localName] of <({[0]: keyof GlobalEventHandlersEventMap, [1]: string} & Array<any>)[]> [
                    ['click', 'click'],
                    ['mousedown', 'down'],
                    ['mouseup', 'up'],
                    ['mousemove', 'move'],
                ])
                    this.canvas.addEventListener(domName, (e: MouseEvent) => {
                        const handler = this.mouseHandler;
                        const coords = this.extractMouseCoordinates(e);
                        if (handler)
                            handler(localName, e, coords.x, coords.y);
                    }, false);
            }

            clear(): void {
                this.ctx.clearRect(0, 0, this.width, this.height);
            }

            popTransformation(): void {
                this.ctx.restore();
            }

            pushTransformation(): void {
                this.ctx.save();
            }

            transformRotate(angle: number): void {
                this.ctx.rotate(angle);
            }

            transformTranslate(x: number, y: number): void {
                this.ctx.translate(x, y);
            }

            resize(width: number, height: number) {
                this.canvas.width = width * CanvasImplementation.SCALE;
                this.canvas.height = height * CanvasImplementation.SCALE;
                this.canvas.style.width = width + 'px';
                this.canvas.style.height = height + 'px';
                this.width = width;
                this.height = height;
                this.ctx.resetTransform();
                this.ctx.scale(CanvasImplementation.SCALE, CanvasImplementation.SCALE);
            }

            drawCircle(cx: number, cy: number, r: number, bg?: string | null, fg?: string | null, text?: string | null): void {
                this.ctx.beginPath();
                this.ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
                this.ctx.closePath();
                this.finishPath(bg, fg);
                if (text)
                    this.drawText(cx, cy, 0, 0, fg, text);
            }

            drawLine(x1: number, y1: number, x2: number, y2: number, fg: string): void {
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.finishPath(null, fg);
            }

            drawPolygon(points: ArrayLike<{ x: number; y: number }>, bg?: string | null, fg?: string | null, text?: string | null): void {
                if (!points[0])
                    return;
                this.ctx.beginPath();
                this.ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; ++i)
                    this.ctx.lineTo(points[i].x, points[i].y);
                this.finishPath(bg, fg);
                if (text) {
                    let x = 0, y = 0;
                    for (let i = 0; i < points.length; ++i) {
                        x += points[i].x;
                        y += points[i].y;
                    }
                    this.drawText(x / points.length, y / points.length, 0, 0, fg, text);
                }
            }

            drawText(x: number, y: number, xAlign: -1 | 0 | 1, yAlign: -1 | 0 | 1, fg: string, text: string): void {
                if (xAlign < -0)
                    this.ctx.textAlign = 'left';
                else if (xAlign > 0)
                    this.ctx.textAlign = 'right';
                else
                    this.ctx.textAlign = 'center';

                if (yAlign < -0)
                    this.ctx.textBaseline = 'top';  // y axis goes down
                else if (yAlign > 0)
                    this.ctx.textBaseline = 'bottom';
                else
                    this.ctx.textBaseline = 'middle';

                this.ctx.fillStyle = fg;  // sic
                this.ctx.fillText(text, x, y);
            }

            finishPath(bg?: string | null, fg?: string | null) {
                if (fg) {
                    this.ctx.lineWidth = this.strokeWidth;
                    this.ctx.strokeStyle = fg;
                    this.ctx.stroke();
                }
                if (bg) {
                    this.ctx.fillStyle = bg;
                    this.ctx.fill();
                }
            }

            public extractMouseCoordinates(event: {clientX: number, clientY: number}): {x: number, y: number} {
                const r = this.canvas.getBoundingClientRect();
                const scale = this.canvas.width / CanvasImplementation.SCALE / r.width;
                return {
                    x: (event.clientX - r.left) / scale,
                    y: (event.clientY - r.top) / scale,
                }
            }
        }

        export const canvasFactory: Factory = {
            create(parentNode: HTMLElement, width: number, height: number): Presentation.GraphicLibrary.Instance {
                const result = new CanvasImplementation(width, height);
                parentNode.appendChild(result.canvas);
                return result;
            }
        };
    }

    function numberToString(n: number): string {
        if (isFinite(n))
            return n + '';
        if (n == Infinity)
            return '\u221e';
        if (n == -Infinity)
            return '-\u221e';
        return '?';
    }

    export module Views {
        import Observer = Model.Types.Observer;
        import GraphEdgeStyle = Presentation.PresentationModel.GraphEdgeStyle;
        import GraphArcWeight = Presentation.PresentationModel.GraphArcWeight;
        import GraphArcStyle = Presentation.PresentationModel.GraphArcStyle;
        import GraphVertexStyle = Presentation.PresentationModel.GraphVertexStyle;

        abstract class BaseView implements View, Observer {
            protected _dirty: boolean = true;
            abstract render(): void;

            update(): void {
                this._dirty = true;
                requestAnimationFrame(() => {
                    if (this._dirty)
                        this.render()
                });
            }

            abstract init(g: Presentation.GraphicLibrary.Factory, parentNode: HTMLElement);
            mouseHandler = null;
        }

        abstract class GraphicalView extends BaseView {
            protected width = 480;
            protected height = 320;
            protected drawing: GraphicLibrary.Instance;
            protected drawingExtended: GraphicLibrary.AllMethods;

            init(g: Presentation.GraphicLibrary.Factory, parentNode: HTMLElement): void {
                this.drawing = g.create(parentNode, this.width, this.height);
                this.drawingExtended = GraphicLibrary.addOptionalMethods(this.drawing);
                this.drawing.mouseHandler = (type, e, x, y) => {
                    if (this.mouseHandler)
                        this.mouseHandler(type, e, x, y);
                };
                this.render();
            }
        }

        export enum ColorIndex {
            // graph vertex
            GRAPH_VERTEX_UNFOCUSED,
            GRAPH_VERTEX_FOCUSED,
            GRAPH_VERTEX_FG,

            // graph edge
            GRAPH_EDGE_UNFOCUSED,
            GRAPH_EDGE_FOCUSED,

            // graph arc weight
            GRAPH_ARC_WEIGHT_UNFOCUSED,
            GRAPH_ARC_WEIGHT_FOCUSED,
            GRAPH_ARC_WEIGHT_MIN_BG,
            GRAPH_ARC_WEIGHT_NONMIN_BG,

            // table cell
            TABLE_CELL_FOCUSED,
            TABLE_CELL_UNFOCUSED,
            TABLE_CELL_MIN,
            TABLE_CELL_INFINITE,
            TABLE_CELL_TAKEN,

            // bound bar
            BOUND_BAR_FREE,
            BOUND_BAR_DELTA,
            BOUND_BAR_DELTA_FG,
            BOUND_BAR_OCCUPIED,
            BOUND_BAR_OCCUPIED_FG,
            BOUND_BAR_MAX_BOUND_OVERLAY,

            // solution tree
            SOLUTION_TREE_UNFOCUSED,
            SOLUTION_TREE_FOCUSED,
            SOLUTION_TREE_NONSOLUTION_BG,
            SOLUTION_TREE_SOLUTION_BG,
        }

        export const colors: {[key in ColorIndex]: string} = {
            [ColorIndex.GRAPH_VERTEX_UNFOCUSED]: "#8b8b8b",
            [ColorIndex.GRAPH_VERTEX_FOCUSED]: "#000000",
            [ColorIndex.GRAPH_VERTEX_FG]: "#e0e6fe",
            [ColorIndex.GRAPH_EDGE_UNFOCUSED]: "#8b8b8b",
            [ColorIndex.GRAPH_EDGE_FOCUSED]: "#000000",
            [ColorIndex.GRAPH_ARC_WEIGHT_UNFOCUSED]: "#8b8b8b",
            [ColorIndex.GRAPH_ARC_WEIGHT_FOCUSED]: "#000000",
            [ColorIndex.GRAPH_ARC_WEIGHT_MIN_BG]: "#6861fe",
            [ColorIndex.GRAPH_ARC_WEIGHT_NONMIN_BG]: "#c0befe",
            [ColorIndex.TABLE_CELL_FOCUSED]: "#ffffff",
            [ColorIndex.TABLE_CELL_UNFOCUSED]: "#cccccc",
            [ColorIndex.TABLE_CELL_MIN]: "#7da7d8",
            [ColorIndex.TABLE_CELL_INFINITE]: "#333333",
            [ColorIndex.TABLE_CELL_TAKEN]: "#000000",
            [ColorIndex.BOUND_BAR_FREE]: "#cccccc",
            [ColorIndex.BOUND_BAR_DELTA]: "#7da7d8",
            [ColorIndex.BOUND_BAR_DELTA_FG]: "#333333",
            [ColorIndex.BOUND_BAR_OCCUPIED]: "#000000",
            [ColorIndex.BOUND_BAR_OCCUPIED_FG]: "#ffffff",
            [ColorIndex.BOUND_BAR_MAX_BOUND_OVERLAY]: "#ce181e",
            [ColorIndex.SOLUTION_TREE_UNFOCUSED]: "#8b8b8b",
            [ColorIndex.SOLUTION_TREE_FOCUSED]: "#000000",
            [ColorIndex.SOLUTION_TREE_NONSOLUTION_BG]: "#ffffff",
            [ColorIndex.SOLUTION_TREE_SOLUTION_BG]: "#add58a",
        };

        export class GraphView extends GraphicalView {
            render(): void {
                this.drawing.clear();
                const pmodel = PresentationModel.graph;
                for (const e of pmodel.edges) {
                    this.drawingExtended.drawLine(e.start.x, e.start.y, e.end.x, e.end.y,
                        colors[e.style == GraphEdgeStyle.FOCUSED ?
                            ColorIndex.GRAPH_EDGE_FOCUSED : ColorIndex.GRAPH_EDGE_UNFOCUSED]);
                        if (e.forward)
                            this.drawArcWeight(e.forward);
                        if (e.backward)
                            this.drawArcWeight(e.backward);
                }

                for (const v of pmodel.vertices) {
                    this.drawing.drawCircle(v.x, v.y, 8, colors[v.style == GraphVertexStyle.FOCUSED ?
                        ColorIndex.GRAPH_VERTEX_FOCUSED : ColorIndex.GRAPH_VERTEX_UNFOCUSED]);
                    this.drawing.drawText(v.x, v.y, 0, 0, colors[ColorIndex.GRAPH_VERTEX_FG],
                        Model.Types.originalGraph.vertices[v.modelIndex].name);
                }

                this._dirty = false;
            }

            private drawArcWeight(a: GraphArcWeight): void {
                this.drawing.pushTransformation();
                try {
                    this.drawing.transformTranslate(a.x, a.y);
                    this.drawing.transformRotate(a.rotation);
                    const width = a.size;
                    const length = a.size * 1.5;
                    this.drawing.transformTranslate(-length * .4, 0);
                    const p1 = {x: 0, y: 0};
                    const p2 = {x: 0, y: -width};
                    const p3 = {x: length, y: 0};
                    const p4 = {x: 0, y: width};  // for taken
                    const fg = colors[a.style == GraphArcStyle.FOCUSED ? ColorIndex.GRAPH_ARC_WEIGHT_FOCUSED : ColorIndex.GRAPH_ARC_WEIGHT_UNFOCUSED];
                    const bg = a.isZero ? fg : (a.isMin ? colors[ColorIndex.GRAPH_ARC_WEIGHT_MIN_BG] : null);
                    if (a.fillPart) {
                        const partP1 = {x: length * (1 - a.fillPart), y: 0};
                        const partP2 = {x: partP1.x, y: -width * a.fillPart};
                        this.drawing.drawPolygon([partP1, partP2, p3], colors[ColorIndex.GRAPH_ARC_WEIGHT_NONMIN_BG], null);
                    }
                    this.drawing.drawPolygon(a.isTaken ? [p2, p3, p4] : [p1, p2, p3], bg, fg, a.isZero ? null : a.label);
                } finally {
                    this.drawing.popTransformation();
                }
            }
        }

        interface WithReferencedEdge {
            referencedEdge: number[];
        }
        interface WithReferencedVertex {
            referencedVertex: number;
            referencedVertexIsIngoing: boolean;
        }
        export class TableView extends BaseView {
            private element: HTMLTableElement;
            private headerRow: HTMLTableRowElement;
            private shownVertices: number[] = [];
            private vertexIndices: number[] = [];
            private isContenteditable = true;

            public inputHandler: VertexInputHandler | null = null;

            init(g: Presentation.GraphicLibrary.Factory | null, parentNode: HTMLElement): void {
                this.element = document.createElement('table');
                this.element.className = 'tspbbvis-tableview';
                this.headerRow = document.createElement('tr');
                for (let i = 0; i < 2; ++i)
                    this.headerRow.appendChild(document.createElement('td'));
                (<HTMLElement> this.headerRow.lastChild).innerText = 'min';
                this.element.appendChild(this.headerRow);
                const bottomRow = document.createElement('tr');
                for (let i = 0; i < 2; ++i)
                    bottomRow.appendChild(document.createElement('td'));
                (<HTMLElement> bottomRow.firstChild).innerText = 'min';
                this.element.appendChild(bottomRow);
                parentNode.appendChild(this.element);

                this.render();
            }

            render(): void {
                const pmodel = PresentationModel.graph;
                const model = Model.Types.currentGraph;
                const updateEditable = pmodel.isEditable != this.isContenteditable;
                this.isContenteditable = pmodel.isEditable;
                const oldChildren = Array.prototype.slice.call(this.element.children, 0);
                const existingVertices = {};
                for (const v of pmodel.vertices) {
                    let modelIndex;
                    if (typeof this.vertexIndices[modelIndex = v.modelIndex] != 'number') {
                        this.createVertex(modelIndex, oldChildren);
                    }
                    existingVertices[modelIndex] = true;
                }
                oldChildren.push(this.element);
                for (let i = 0; i < this.shownVertices.length; ++i) {
                    let modelIndex;
                    if (!existingVertices[modelIndex = this.shownVertices[i]]) {
                        this.removeVertex(modelIndex, oldChildren);
                        --i;
                    }
                }
                for (const row of <HTMLElement[]> Array.prototype.slice.call(this.element.children, 0))
                    for (const cell of <(HTMLElement & WithReferencedEdge & WithReferencedVertex)[]> Array.prototype.slice.call(row.children)) {
                        if (!cell.referencedEdge) {
                            if (typeof cell.referencedVertex == 'number') {
                                if (pmodel.isReductionShown && PresentationModel.reductionStep == PresentationModel.ReductionStep.MIN_FOUND && cell.referencedVertex == PresentationModel.focusedVertex && cell.referencedVertexIsIngoing == PresentationModel.reductionIsIngoing)
                                    cell.innerText = numberToString(pmodel.reductionMin);
                                else
                                    cell.innerHTML = '';
                            }
                            continue;
                        }
                        let weight = Infinity;
                        let sup: HTMLElement | null = null;
                        if (cell.referencedEdge.length == 2) {
                            if (updateEditable)
                                cell.contentEditable = this.getContenteditable(cell.referencedEdge[0], cell.referencedEdge[1]);
                            if (cell == document.activeElement)
                                continue;
                            const arc = model.getArcFromEnds(cell.referencedEdge[0], cell.referencedEdge[1]);
                            const pArc = pmodel.convertArc(arc);
                            if (pArc) {
                                weight = pArc.weight;
                                if (pArc.style == PresentationModel.GraphArcStyle.UNFOCUSED) {
                                    cell.style.backgroundColor = colors[ColorIndex.TABLE_CELL_UNFOCUSED];
                                } else if (pArc.isMin) {
                                    cell.style.backgroundColor = colors[ColorIndex.TABLE_CELL_MIN];
                                } else {
                                    cell.style.backgroundColor = colors[ColorIndex.TABLE_CELL_FOCUSED];
                                }
                                if (Model.Types.visualisationState == Model.Types.VisualisationState.SOLUTION_SEARCH &&
                                    Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION) {
                                    const weightReduction = Model.Types.solutionTreeNode.state.weightReduction;
                                    const idx = model.getArcIndex(arc);
                                    if (weightReduction.zeroArcs.indexOf(idx) >= 0) {
                                        sup = document.createElement('sup');
                                        sup.innerText = numberToString(weightReduction.arcRemovalBoundChanges[idx]);
                                    }
                                }
                            } else {
                                cell.style.backgroundColor = colors[pmodel.isEditable ? ColorIndex.TABLE_CELL_FOCUSED : ColorIndex.TABLE_CELL_INFINITE];
                            }
                            if (model.takenArcs[model.getArcIndex(arc)])
                                cell.style.backgroundColor = colors[ColorIndex.TABLE_CELL_TAKEN];
                        }
                        if (isFinite(weight))
                            cell.innerText = numberToString(weight);
                        else
                            cell.innerHTML = '';
                        if (sup)
                            cell.appendChild(sup);
                    }

                this._dirty = false;
            }

            private removeVertex(modelIndex: number, parentElements: HTMLElement[]) {
                for (const parent of parentElements) {
                    const child = this.getVertexChild(parent, modelIndex);
                    if (!child)
                        continue;
                    parent.removeChild(child);
                }
                const idx = this.vertexIndices[modelIndex];
                this.vertexIndices[modelIndex] = undefined;
                this.shownVertices.splice(idx, 1)
                for (let i = modelIndex + 1; i < this.vertexIndices.length; ++i)
                    if (typeof this.vertexIndices[i] == 'number')
                        --this.vertexIndices[i];
            }

            private createVertex(modelIndex: number, oldChildren: HTMLElement[]) {
                const row = document.createElement('tr');
                const nameCell = document.createElement('td');
                const name = Model.Types.currentGraph.vertices[modelIndex].name;
                const idx = this.getInsertionIndex(modelIndex);
                this.vertexIndices[modelIndex] = idx;
                this.shownVertices.splice(idx, 0, modelIndex);
                for (let i = modelIndex + 1; i < this.vertexIndices.length; ++i)
                    if (typeof this.vertexIndices[i] == 'number')
                        ++this.vertexIndices[i];
                nameCell.innerText = name;
                row.appendChild(nameCell);
                for (let i = 0; i < Model.Types.currentGraph.vertices.length; ++i) {
                    if (!Model.Types.currentGraph.vertices[i])
                        continue;
                    const cell = this.createEditableCell(modelIndex, i);
                    row.appendChild(cell);
                }
                row.appendChild(this.createMinCell(modelIndex, false));
                this.insertVertexChild(this.element, modelIndex, row);
                for (const child of oldChildren) {
                    let cell: HTMLTableCellElement;
                    if (child.previousSibling && child.nextSibling)
                        cell = this.createEditableCell((<WithReferencedEdge & HTMLTableCellElement> child.children[1]).referencedEdge[0], modelIndex);
                    else if (!child.nextSibling)
                        cell = this.createMinCell(modelIndex, true);
                    else
                        cell = document.createElement('td');
                    if (!child.previousSibling)
                        cell.innerText = name;
                    this.insertVertexChild(child, modelIndex, cell);
                }
            }

            private getContenteditable(start: number, end: number): string {
                return (this.isContenteditable && (start != end)) + '';
            }

            private getInsertionIndex(modelIndex: number): number {
                let idx;
                if (typeof (idx = this.vertexIndices[modelIndex]) == 'number')
                    return idx;
                idx = 0;
                while (idx < this.shownVertices.length && this.shownVertices[idx] < modelIndex)
                    ++idx;
                return idx;
            }

            private insertVertexChild(parentNode: HTMLElement, vertexNumber: number, childNode: HTMLElement) {
                const idx = this.getInsertionIndex(vertexNumber);
                parentNode.insertBefore(childNode, parentNode.childNodes[idx + 1]);
            }

            private getVertexChild(parentNode: HTMLElement, vertexNumber: number): HTMLElement | null {
                let idx;
                if (typeof (idx = this.vertexIndices[vertexNumber]) == 'number')
                    return parentNode[idx + 1];
            }

            private createMinCell(vertex: number, isIngoing: boolean): HTMLTableCellElement & WithReferencedVertex {
                const td = <HTMLTableCellElement & WithReferencedVertex> document.createElement('td');
                td.referencedVertex = vertex;
                td.referencedVertexIsIngoing = isIngoing;
                return td;
            }

            private createEditableCell(startVertex: number, endVertex: number): HTMLTableCellElement & WithReferencedEdge {
                const td = <HTMLTableCellElement & WithReferencedEdge> document.createElement('td');
                td.contentEditable = this.getContenteditable(startVertex, endVertex);
                td.className = 'weight-data';
                td.referencedEdge = [startVertex, endVertex];
                const view = this;
                const handler = function (e) {
                    if (view.inputHandler && td.referencedEdge.length == 2)
                        view.inputHandler(e, td.referencedEdge[0], td.referencedEdge[1], td.innerText);
                };
                td.addEventListener('input', handler, false);
                td.addEventListener('blur', handler, false);
                return td;
            }
        }

        export class ControlsView extends BaseView {
            continueButton: HTMLButtonElement;
            reductionNavigationGroup: HTMLElement;
            reductionStepButtons: HTMLButtonElement[];
            reductionDirectionRadiobuttons: HTMLInputElement[];

            init(g: Presentation.GraphicLibrary.Factory | null, parentNode: HTMLElement): void {
                this.continueButton = document.createElement('button');
                this.continueButton.innerText = '>>';
                this.continueButton.addEventListener('click', function (e) {
                    Controller.controller.onContinueClick(e);
                }, false);
                parentNode.appendChild(this.continueButton);
                this.reductionNavigationGroup = document.createElement('div');
                this.reductionNavigationGroup.style.display = 'hidden';
                this.reductionStepButtons = [
                    document.createElement('button'),
                    document.createElement('button'),
                ];
                this.reductionStepButtons[0].innerText = '<';
                this.reductionStepButtons[1].innerText = '>';
                this.reductionStepButtons[0].addEventListener('click', function (e) {Controller.controller.onChangeReductionStep(e, true);}, false)
                this.reductionStepButtons[1].addEventListener('click', function (e) {Controller.controller.onChangeReductionStep(e, false);}, false)
                this.reductionNavigationGroup.appendChild(this.reductionStepButtons[0]);
                this.reductionNavigationGroup.appendChild(this.reductionStepButtons[1]);
                this.reductionDirectionRadiobuttons = [];
                for (let i = 0; i < 2; ++i) {
                    const rb = document.createElement('input');
                    const label = document.createElement('label');
                    rb.type = 'radio';
                    rb.name = 'reduction-direction'
                    if (i == 0) {
                        label.innerText = 'Reduce outgoing';
                        rb.addEventListener('change', function (e) {
                            if (this.checked)
                                Controller.controller.onChangeReductionDirection(e, false);
                        }, false);
                    } else {
                        label.innerText = 'Reduce ingoing';
                        rb.addEventListener('change', function (e) {
                            if (this.checked)
                                Controller.controller.onChangeReductionDirection(e, true);
                        }, false);
                    }
                    label.insertBefore(rb, label.firstChild);
                    this.reductionDirectionRadiobuttons.push(rb);
                    this.reductionNavigationGroup.appendChild(label);
                }
                parentNode.appendChild(this.reductionNavigationGroup);
                this.render();
            }

            render(): void {
                switch (Model.Types.visualisationState) {
                    case Model.Types.VisualisationState.GRAPH_INPUT:
                        this.continueButton.innerText = 'Submit graph';
                        break;
                    case Model.Types.VisualisationState.INITIAL_REDUCTION:
                        this.continueButton.innerText = 'To solution search';
                        break;
                    case Model.Types.VisualisationState.SOLUTION_SEARCH:
                        this.continueButton.innerText = 'Continue';
                        break;
                }
                if (PresentationModel.graph.isReductionShown) {
                    this.reductionNavigationGroup.style.display = 'block';
                    if (PresentationModel.reductionIsIngoing)
                        this.reductionDirectionRadiobuttons[1].checked = true;
                    else
                        this.reductionDirectionRadiobuttons[0].checked = true;
                } else {
                    this.reductionNavigationGroup.style.display = 'none';
                }
                this._dirty = false;
            }
        }


        export class InfoView extends BaseView {
            public element: HTMLElement;

            init(g: Presentation.GraphicLibrary.Factory | null, parentNode: HTMLElement): void {
                this.element = document.createElement('div');
                parentNode.appendChild(this.element);
                this.render();
            }

            render(): void {
                switch (Model.Types.visualisationState) {
                    case Model.Types.VisualisationState.GRAPH_INPUT:
                        this.element.innerText = 'Click to place vertices\nEnter arc weights into the table (row is arc start, column is arc end)';
                        break;
                    case Model.Types.VisualisationState.INITIAL_REDUCTION:
                        this.element.innerText = 'Initial reduction';
                        break;
                    case Model.Types.VisualisationState.SOLUTION_SEARCH:
                        this.element.innerText = 'Solution search';
                        switch (Model.Types.solutionSearchState) {
                            case Model.Types.SolutionSearchState.NEXT_NODE_SELECTION:
                                this.element.innerText += '\nSelect the next unused tour set tree node with the lowest bound'
                                break;
                            case Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION:
                                this.element.innerText += '\nSelect the zero arc with the highest change of bound in case of deletion'
                                this.element.innerText += '\nUpper indices denote this change'
                                break;
                            case Model.Types.SolutionSearchState.BRANCH_LEFT:
                                this.element.innerText += '\nTour subset without the arc'
                                break;
                            case Model.Types.SolutionSearchState.BRANCH_RIGHT:
                                this.element.innerText += '\nTour subset with the arc'
                                break;
                            case Model.Types.SolutionSearchState.ONE_SOLUTION_FOUND:
                                this.element.innerText += '\nThis is one of the solutions'
                                break;
                            case Model.Types.SolutionSearchState.ALL_SOLUTIONS_FOUND:
                                this.element.innerText += '\nNo more solutions'
                                break;
                        }
                        break;
                }
                if (PresentationModel.graph.isReductionShown) {
                    this.element.innerText += '\nReducing ' + (PresentationModel.reductionIsIngoing ? 'ingoing' : 'outgoing') +
                        ' arcs';
                    this.element.innerText += '\nVertex ' + Model.Types.currentGraph.vertices[PresentationModel.focusedVertex].name;
                    switch (PresentationModel.reductionStep) {
                        case Presentation.PresentationModel.ReductionStep.INITIAL:
                            this.element.innerText += '\nBefore reduction';
                            break;
                        case Presentation.PresentationModel.ReductionStep.MIN_FOUND:
                            this.element.innerText += '\nFind lowest weight = ' + numberToString(PresentationModel.graph.reductionMin);
                            break;
                        case Presentation.PresentationModel.ReductionStep.REDUCED:
                            this.element.innerText += '\nAfter reduction; next lowest weight will be ' + numberToString(PresentationModel.graph.reductionMin || 0);
                            break;
                    }
                }
                this._dirty = false;
            }
        }

        export class BoundBarView extends BaseView {
            element: HTMLElement;
            partFree: HTMLElement;
            partDelta: HTMLElement;
            partOccupied: HTMLElement;
            overlayContainer: HTMLElement;
            overlayMaxBound: HTMLElement;

            init(g: Presentation.GraphicLibrary.Factory | null, parentNode: HTMLElement) {
                this.element = document.createElement('div');
                this.partFree = document.createElement('div');
                this.partDelta = document.createElement('div');
                this.partOccupied = document.createElement('div');
                this.overlayContainer = document.createElement('div');
                this.overlayMaxBound = document.createElement('div');
                this.partFree.style.backgroundColor = colors[ColorIndex.BOUND_BAR_FREE];
                this.partDelta.style.backgroundColor = colors[ColorIndex.BOUND_BAR_DELTA];
                this.partDelta.style.color = colors[ColorIndex.BOUND_BAR_DELTA_FG];
                this.partOccupied.style.backgroundColor = colors[ColorIndex.BOUND_BAR_OCCUPIED];
                this.partOccupied.style.color = colors[ColorIndex.BOUND_BAR_OCCUPIED_FG];
                this.overlayMaxBound.style.backgroundColor = colors[ColorIndex.BOUND_BAR_MAX_BOUND_OVERLAY];
                this.element.appendChild(this.partFree);
                this.element.appendChild(this.partDelta);
                this.element.appendChild(this.partOccupied);
                this.element.appendChild(this.overlayContainer);
                this.overlayContainer.appendChild(this.overlayMaxBound);
                this.element.className = 'tspbbvis-boundbarview';
                this.overlayContainer.className = 'tspbbvis-boundbarview-overlay';
                parentNode.appendChild(this.element);
                this.render();
            }

            render(): void {
                const pmodel = PresentationModel.graph;
                if (pmodel.isEditable) {
                    this.partOccupied.innerHTML = '';
                    this.partDelta.innerHTML = '';
                    this.setPartValues(0, 0, Infinity);
                    return;
                }
                this.partOccupied.innerText = numberToString(pmodel.bound);
                this.partDelta.innerText = numberToString(pmodel.boundDelta);
                let maxBound = Infinity;
                if (Model.Types.solutionTree) {
                    maxBound = Model.Types.solutionTree.maxBound;
                }
                this.setPartValues(pmodel.bound / pmodel.boundMax, pmodel.boundDelta / pmodel.boundMax, maxBound / pmodel.boundMax);
                this._dirty = false;
            }

            private setPartValues(occupied, delta, maxBound) {
                this.overlayMaxBound.style.height = (1 - Math.min(1, maxBound)) * 100 + '%';
                if (!isFinite(occupied)) {
                    this.partFree.style.height = '0%';
                    this.partDelta.style.height = '0%';
                    this.partOccupied.style.height = '100%';
                    return;
                }
                this.partOccupied.style.height = occupied * 100 + '%';
                if (!isFinite(delta)) {
                    this.partFree.style.height = '0%';
                    this.partDelta.style.height = (1 - occupied) * 100 + '%';
                    return;
                }
                this.partFree.style.height = (1 - occupied - delta) * 100 + '%';
                this.partDelta.style.height = delta * 100 + '%';
            }
        }

        export class TreeView extends GraphicalView {
            private static readonly LEVEL_HEIGHT = 80;
            private static readonly NODE_WIDTH = 80;

            render(): void {
                const pmodel = PresentationModel.solutionTree;
                const width = pmodel.maxWidth * TreeView.NODE_WIDTH;
                const height = pmodel.maxDepth * TreeView.LEVEL_HEIGHT;
                if (this.drawing.width < width || this.drawing.height < height)
                    this.drawing.resize(Math.max(width, this.drawing.width), Math.max(height, this.drawing.height));
                this.drawing.clear();

                for (const edge of pmodel.edges) {
                    const [sx, sy] = this.getNodeCenter(edge.parent);
                    const [ex, ey] = this.getNodeCenter(edge.child);
                    const tx = .2 * sx + .8 * ex;
                    const ty = .2 * sy + .8 * ey - 20;
                    const color = colors[edge.style == PresentationModel.SolutionTreeEdgeStyle.UNFOCUSED
                        ? ColorIndex.SOLUTION_TREE_UNFOCUSED
                        : ColorIndex.SOLUTION_TREE_FOCUSED];
                    this.drawingExtended.drawArrow(sx, sy + 30, ex, ey - 30, color);
                    this.drawing.drawText(tx, ty, 0, 1, color, edge.isTaken ? '\u2208' : '\u2209');
                }

                for (const node of pmodel.nodes) {
                    const fg = colors[node.style == PresentationModel.SolutionTreeNodeStyle.UNFOCUSED
                        ? ColorIndex.SOLUTION_TREE_UNFOCUSED
                        : ColorIndex.SOLUTION_TREE_FOCUSED];
                    const bg = colors[node.isSolution
                        ? ColorIndex.SOLUTION_TREE_SOLUTION_BG
                        : ColorIndex.SOLUTION_TREE_NONSOLUTION_BG];
                    const [x, y] = this.getNodeCenter(node);
                    this.drawing.drawCircle(x, y, 30, bg, fg, 'b = ' + numberToString(node.bound));
                    if (node.separatingArc)
                        this.drawingExtended.drawDiamond(x, y + 30, 30, 15, bg, fg,
                            Model.Types.originalGraph.vertices[node.separatingArc[0]].name + '; ' + Model.Types.originalGraph.vertices[node.separatingArc[1]].name
                        );
                }

                this._dirty = false;
            }

            private getNodeCenter(node: PresentationModel.SolutionTreeNode): number[] {
                const x = node.xOffset * TreeView.NODE_WIDTH;
                const y = node.level * TreeView.LEVEL_HEIGHT;
                return [x + 40, y + 40];
            }
        }
    }

    export module Controller {
        export interface IController {
            onGraphViewClick(e: MouseEvent | null, x: number, y: number): void;
            onWeightInput(e: InputEvent | KeyboardEvent | FocusEvent | null, startVertex: number, endVertex: number, value: string);
            onContinueClick(e: MouseEvent | null);
            onChangeReductionDirection(e: Event | null, isIngoing: boolean);
            onChangeReductionStep(e: Event | null, backward: boolean);
        }

        let currentController: IController;

        export const controller: IController = {
            onGraphViewClick(e: MouseEvent | null, x: number, y: number) {
                if (currentController)
                    currentController.onGraphViewClick(e, x, y);
            },

            onWeightInput(e: InputEvent | KeyboardEvent | FocusEvent | null, startVertex: number, endVertex: number, value: string) {
                if (currentController)
                    currentController.onWeightInput(e, startVertex, endVertex, value);
            },

            onContinueClick(e: MouseEvent | null) {
                if (currentController)
                    currentController.onContinueClick(e);
            },

            onChangeReductionDirection(e: Event | null, isIngoing: boolean) {
                if (currentController)
                    currentController.onChangeReductionDirection(e, isIngoing);
            },

            onChangeReductionStep(e: Event | null, backward: boolean) {
                if (currentController)
                    currentController.onChangeReductionStep(e, backward);
            },
        };

        class GraphInputController implements IController {
            onGraphViewClick(e: MouseEvent | null, x: number, y: number) {
                Model.Types.originalGraph.addVertex(x, y);
                PresentationModel.graph.update();
            }

            onWeightInput(e: InputEvent | KeyboardEvent | FocusEvent | null, startVertex: number, endVertex: number, value: string) {
                const numericValue = parseFloat(value);
                if (!isFinite(numericValue) || startVertex == endVertex)
                    Model.Types.originalGraph.setArc(startVertex, endVertex, Infinity);
                else
                    Model.Types.originalGraph.setArc(startVertex, endVertex, numericValue);
                PresentationModel.graph.update();
            }

            onContinueClick(e: MouseEvent) {
                if (Model.Types.currentGraph.vertexCount <= 2) {
                    alert('Not enough vertices');
                    return;
                }
                Model.Types.visualisationState = Model.Types.VisualisationState.INITIAL_REDUCTION;
                Model.Types.solutionTree = new Model.Types.TourSetTree();
                const root = Model.Types.solutionTree.getRoot();
                root.focus();
                currentController = new InitialReductionController();
                PresentationModel.focusedVertex = 0;
                while (!Model.Types.currentGraph.vertices[PresentationModel.focusedVertex])
                    ++PresentationModel.focusedVertex;
                PresentationModel.graph.update();
            }

            onChangeReductionDirection(e: Event | null, isIngoing: boolean) {
            }

            onChangeReductionStep(e: Event | null, backward: boolean) {
            }
        }

        class InitialReductionController implements IController {
            onContinueClick(e: MouseEvent | null) {
                PresentationModel.focusedVertex = -1;
                currentController = new SolutionSearchController();
                Model.Types.visualisationState = Model.Types.VisualisationState.SOLUTION_SEARCH;
                PresentationModel.graph.update();
                PresentationModel.solutionTree.update();
            }

            onGraphViewClick(e: MouseEvent | null, x: number, y: number): void {
            }

            onWeightInput(e: InputEvent | KeyboardEvent | FocusEvent | null, startVertex: number, endVertex: number, value: string) {
            }

            onChangeReductionDirection(e: Event | null, isIngoing: boolean) {
                PresentationModel.reductionIsIngoing = isIngoing;
                PresentationModel.graph.update();
            }

            onChangeReductionStep(e: Event | null, backward: boolean) {
                if (backward)
                    PresentationModel.reductionStep--;
                else
                    PresentationModel.reductionStep++;
                if (PresentationModel.reductionStep > PresentationModel.ReductionStep.REDUCED) {
                    PresentationModel.reductionStep = PresentationModel.ReductionStep.INITIAL;
                    do {
                        if (++PresentationModel.focusedVertex >= Model.Types.currentGraph.vertices.length) {
                            PresentationModel.focusedVertex = 0;
                            while (!Model.Types.currentGraph.vertices[PresentationModel.focusedVertex])
                                ++PresentationModel.focusedVertex;
                            PresentationModel.reductionIsIngoing = !PresentationModel.reductionIsIngoing;
                            break;
                        }
                    } while (!Model.Types.currentGraph.vertices[PresentationModel.focusedVertex]);
                } else if (PresentationModel.reductionStep < PresentationModel.ReductionStep.INITIAL) {
                    PresentationModel.reductionStep = PresentationModel.ReductionStep.REDUCED;
                    do {
                        if (--PresentationModel.focusedVertex < 0) {
                            PresentationModel.focusedVertex = Model.Types.currentGraph.vertices.length - 1;
                            while (!Model.Types.currentGraph.vertices[PresentationModel.focusedVertex])
                                --PresentationModel.focusedVertex;
                            PresentationModel.reductionIsIngoing = !PresentationModel.reductionIsIngoing;
                            break;
                        }
                    } while (!Model.Types.currentGraph.vertices[PresentationModel.focusedVertex]);
                }
                PresentationModel.graph.update();
            }
        }

        class SolutionSearchController implements IController {
            onChangeReductionDirection(e: Event | null, isIngoing: boolean) {
            }

            onChangeReductionStep(e: Event | null, backward: boolean) {
            }

            onContinueClick(e: MouseEvent | null) {
                switch (Model.Types.solutionSearchState) {
                    case Model.Types.SolutionSearchState.NEXT_NODE_SELECTION:
                        if (!Model.Types.solutionTree.lowestBoundUnvisitedCount()) {
                            Model.Types.solutionSearchState = Model.Types.SolutionSearchState.ALL_SOLUTIONS_FOUND;
                            break;
                        }
                        Model.Types.solutionTree.popUnvisited().focus();  // TODO give choice
                        Model.Types.solutionSearchState = Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION;
                        break;
                    case Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION:
                        Model.Types.solutionTreeNode.separatingArc = Model.Types.currentGraph.arcs[
                            Model.Types.solutionTreeNode.state.weightReduction.maxBoundChangeZeroArcs[0]  // TODO give choice
                        ];
                        if (Model.Types.currentGraph.isSolution) {
                            Model.Types.solutionTree.maxBound = Model.Types.solutionTreeNode.state.getBound();
                            Model.Types.solutionSearchState = Model.Types.SolutionSearchState.ONE_SOLUTION_FOUND;
                            break;
                        }
                        Model.Types.solutionTreeNode.branch();
                        Model.Types.solutionTree.pushUnvisited(<any> Model.Types.solutionTreeNode.leftChild);
                        Model.Types.solutionTree.pushUnvisited(<any> Model.Types.solutionTreeNode.rightChild);
                        Model.Types.currentGraph = Model.Types.solutionTreeNode.leftChild.state.graph;
                        Model.Types.solutionSearchState = Model.Types.SolutionSearchState.BRANCH_LEFT;
                        break;
                    case Model.Types.SolutionSearchState.BRANCH_LEFT:
                        Model.Types.currentGraph = Model.Types.solutionTreeNode.rightChild.state.graph;
                        Model.Types.solutionSearchState = Model.Types.SolutionSearchState.BRANCH_RIGHT;
                        break;
                    case Model.Types.SolutionSearchState.BRANCH_RIGHT:
                    case Model.Types.SolutionSearchState.ONE_SOLUTION_FOUND:
                        Model.Types.currentGraph = Model.Types.solutionTreeNode.state.graph;
                        Model.Types.solutionSearchState = Model.Types.SolutionSearchState.NEXT_NODE_SELECTION;
                        break;
                    case Model.Types.SolutionSearchState.ALL_SOLUTIONS_FOUND:
                        // TODO consider free navigation state
                        break;
                }
                PresentationModel.graph.update();
                PresentationModel.solutionTree.update();
            }

            onGraphViewClick(e: MouseEvent | null, x: number, y: number): void {
            }

            onWeightInput(e: InputEvent | KeyboardEvent | FocusEvent | null, startVertex: number, endVertex: number, value: string) {
            }
        }

        currentController = new GraphInputController();

        export function graphViewMouseHandler(type: string, e: MouseEvent, x: number, y: number) {
            if (type == 'click')
                controller.onGraphViewClick(e, x, y);
        }
    }
}

addEventListener('load', function () {
    const graphView = new Presentation.Views.GraphView();
    const tableView = new Presentation.Views.TableView();
    const controlsView = new Presentation.Views.ControlsView();
    const infoView = new Presentation.Views.InfoView();
    const boundBarView = new Presentation.Views.BoundBarView();
    const treeView = new Presentation.Views.TreeView();
    Presentation.PresentationModel.graph.observers.push(graphView);
    Presentation.PresentationModel.graph.observers.push(tableView);
    Presentation.PresentationModel.graph.observers.push(controlsView);
    Presentation.PresentationModel.graph.observers.push(infoView);
    Presentation.PresentationModel.graph.observers.push(boundBarView);
    Presentation.PresentationModel.solutionTree.observers.push(treeView);
    graphView.init(Presentation.GraphicLibrary.canvasFactory, document.getElementById("deploy-graph"));
    graphView.mouseHandler = Presentation.Controller.graphViewMouseHandler;
    tableView.init(null, document.getElementById("deploy-table"));
    tableView.inputHandler = Presentation.Controller.controller.onWeightInput.bind(Presentation.Controller.controller);
    controlsView.init(null, document.getElementById("deploy-controls"));
    infoView.init(null, document.getElementById("deploy-info"));
    boundBarView.init(null, document.getElementById("deploy-bar"));
    treeView.init(Presentation.GraphicLibrary.canvasFactory, document.getElementById("deploy-tree"));
}, false);
