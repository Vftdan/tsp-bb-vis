var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Model;
(function (Model) {
    var Types;
    (function (Types) {
        var GraphVertex = /** @class */ (function () {
            function GraphVertex(name, x, y) {
                this.name = name;
                this.x = x;
                this.y = y;
            }
            return GraphVertex;
        }());
        Types.GraphVertex = GraphVertex;
        var GraphArc = /** @class */ (function () {
            function GraphArc(start, end) {
                this.start = start;
                this.end = end;
            }
            return GraphArc;
        }());
        Types.GraphArc = GraphArc;
        var GraphArcWeights = /** @class */ (function () {
            function GraphArcWeights(parent) {
                this.weights = [];
                if (parent)
                    this.weights = parent.weights.slice(0);
            }
            return GraphArcWeights;
        }());
        Types.GraphArcWeights = GraphArcWeights;
        var Graph = /** @class */ (function () {
            function Graph() {
                this.vertices = [];
                this.vertexCount = 0;
                this.arcs = [];
                this.arcIndices = Object.create(null);
                this.weights = new GraphArcWeights();
                this.takenArcs = Object.create(null);
                this.takenStartVertices = Object.create(null);
                this.takenEndVertices = Object.create(null);
                this.pathForward = Object.create(null);
                this.pathBackward = Object.create(null);
                this.isSolution = false;
            }
            Graph.prototype.verticesFromIndices = function (indices) {
                var _this = this;
                return indices.map(function (i) { return _this.vertices[i]; });
            };
            Graph.prototype.arcsFromIndices = function (indices) {
                var _this = this;
                return indices.map(function (i) { return _this.arcs[i]; });
            };
            Graph.prototype.getVertexIndex = function (vertex) {
                if (!vertex)
                    return -1;
                if (typeof vertex._index == 'number' && this.vertices[vertex._index] == vertex)
                    return vertex._index;
                return this.vertices.indexOf(vertex);
            };
            Graph.prototype.getArcIndex = function (arc) {
                if (!arc)
                    return -1;
                if (typeof arc._index == 'number' && this.arcs[arc._index] == arc)
                    return arc._index;
                return this.arcs.indexOf(arc);
            };
            Graph.prototype.getArcWeight = function (arc) {
                var idx = this.getArcIndex(arc);
                if (idx < 0)
                    return Infinity;
                return this.weights.weights[idx];
            };
            Graph.prototype.getArcFromEnds = function (start, end) {
                for (var _i = 0, _a = [start, end]; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (!this.vertices.hasOwnProperty(i))
                        return null;
                }
                var ends = start + ',' + end;
                var idx = this.arcIndices[ends];
                if (idx === undefined) {
                    return null;
                }
                return this.arcs[idx] || null;
            };
            Graph.prototype.getContainingPath = function (vertexIndex) {
                var path = [vertexIndex];
                while (this.takenEndVertices[path[0]] && path.length <= this.vertexCount)
                    path.unshift(this.pathBackward[path[0]]);
                while (this.takenStartVertices[path[path.length - 1]] && path.length <= this.vertexCount)
                    path.push(this.pathForward[path[path.length - 1]]);
                return path;
            };
            Graph.prototype.addVertex = function (x, y) {
                var idx = this.vertices.length;
                var vertex = new GraphVertex(idx + 1 + '', x, y);
                this.vertices.push(vertex);
                this.vertexCount++;
                vertex._index = idx;
                return vertex;
            };
            Graph.prototype.setArc = function (start, end, weight) {
                for (var _i = 0, _a = [start, end]; _i < _a.length; _i++) {
                    var i = _a[_i];
                    if (!this.vertices.hasOwnProperty(i))
                        throw "Vertex with index " + i + " does not exist";
                }
                var ends = start + ',' + end;
                var idx = this.arcIndices[ends];
                if (weight < Infinity) {
                    if (idx === undefined) {
                        idx = this.arcs.length;
                        this.arcIndices[ends] = idx;
                    }
                    var arc = this.arcs[idx];
                    if (!arc) {
                        arc = new GraphArc(start, end);
                        arc._index = idx;
                        arc._graph = this;
                        this.arcs[idx] = arc;
                    }
                    this.weights.weights[idx] = weight;
                    return arc;
                }
                else {
                    if (idx === undefined)
                        return null;
                    this.arcs[idx] = null;
                    this.weights.weights[idx] = Infinity;
                    return null;
                }
            };
            return Graph;
        }());
        Types.Graph = Graph;
        var TourSetConstraint = /** @class */ (function () {
            function TourSetConstraint(arc, isTaken) {
                this.arc = arc;
                this.isTaken = isTaken;
                var value = this.toString();
                if (TourSetConstraint.instances[value])
                    return TourSetConstraint.instances[value];
                TourSetConstraint.instances[value] = this;
            }
            TourSetConstraint.prototype.toString = function () {
                return (this.isTaken ? '' : '~') + this.arc.start + ',' + this.arc.end;
            };
            TourSetConstraint.instances = Object.create(null);
            return TourSetConstraint;
        }());
        Types.TourSetConstraint = TourSetConstraint;
        var GraphState = /** @class */ (function () {
            function GraphState(parent) {
                this.isSolution = false;
                this.arcsFromIndices = Graph.prototype.arcsFromIndices;
                this.getArcFromEnds = Graph.prototype.getArcFromEnds;
                this.getArcIndex = Graph.prototype.getArcIndex;
                this.getArcWeight = Graph.prototype.getArcWeight;
                this.getVertexIndex = Graph.prototype.getVertexIndex;
                this.verticesFromIndices = Graph.prototype.verticesFromIndices;
                this.getContainingPath = Graph.prototype.getContainingPath;
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
            return GraphState;
        }());
        Types.GraphState = GraphState;
        var TourSetNodeState = /** @class */ (function () {
            function TourSetNodeState(parent, constraint) {
                this._children = Object.create(null);
                this._isCalculated = false;
                if (!parent) {
                    if (!constraint) {
                        if (TourSetNodeState.instances[''])
                            return TourSetNodeState.instances[''];
                        TourSetNodeState.instances[''] = this;
                        this.constraints = [];
                        this.graph = new GraphState(Types.originalGraph);
                        this.weights = this.graph.weights;
                        this._bound = 0;
                        this.weightReduction = new Algo.WeightReduction();
                        this.recalculate();
                    }
                    return new TourSetNodeState(new TourSetNodeState(), constraint);
                }
                if (!constraint)
                    return parent;
                var child = parent._children[constraint.toString()];
                if (child)
                    return child;
                this.graph = new GraphState(parent.graph);
                this.weights = this.graph.weights;
                this._bound = parent._bound;
                this.weightReduction = new Algo.WeightReduction();
                this.applyConstraint(constraint);
                var constraints = parent.constraints.slice(0);
                constraints.push(constraint);
                constraints.sort(); // TODO: Use binary search & splice() instead
                this.constraints = constraints;
                parent._children[constraint.toString()] = this;
                this.recalculate();
            }
            TourSetNodeState.prototype.isCalculated = function () {
                return this._isCalculated;
            };
            TourSetNodeState.prototype.getBound = function () {
                return this._bound;
            };
            TourSetNodeState.prototype.increaseBound = function (value) {
                this._bound += value;
            };
            TourSetNodeState.createForGraph = function (graph, parent, constraint) {
                if (this._graph != graph && graph) { // `this` in static methods refers to the class
                    var o = graph;
                    if (!o.__TourSetNodeState_instances)
                        o.__TourSetNodeState_instances = [];
                    this.instances = o.__TourSetNodeState_instances;
                    this._graph = graph;
                }
                var res = new this(parent, constraint);
                if (res.isCalculated())
                    return res;
                res.recalculate();
                return res;
            };
            TourSetNodeState.prototype.recalculate = function () {
                this.weightReduction.performReduction(this);
            };
            TourSetNodeState.prototype.applyConstraint = function (constraint) {
                var idx = this.graph.getArcIndex(constraint.arc);
                if (!constraint.isTaken) {
                    this.weights.weights[idx] = Infinity;
                    return;
                }
                this.addTakenArc(constraint.arc);
                var path = this.graph.getContainingPath(constraint.arc.start);
                var mayBeSolution = path.length >= this.graph.vertexCount;
                var remainingArc = null;
                for (var _i = 0, _a = this.graph.arcs; _i < _a.length; _i++) {
                    var a = _a[_i];
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
                    var revArc = this.graph.getArcFromEnds(remainingArc.end, remainingArc.start);
                    if (revArc) {
                        this.weights.weights[this.graph.getArcIndex(revArc)] = Infinity;
                    }
                }
            };
            TourSetNodeState.prototype.addTakenArc = function (arc) {
                var idx = this.graph.getArcIndex(arc);
                this.graph.takenArcs[idx] = true;
                this.graph.takenStartVertices[arc.start] = true;
                this.graph.takenEndVertices[arc.end] = true;
                this.graph.pathForward[arc.start] = arc.end;
                this.graph.pathBackward[arc.end] = arc.start;
            };
            TourSetNodeState.prototype.toString = function () {
                return this.constraints.join(';');
            };
            TourSetNodeState.instances = Object.create(null);
            TourSetNodeState._graph = null;
            return TourSetNodeState;
        }());
        Types.TourSetNodeState = TourSetNodeState;
        var TourSetNode = /** @class */ (function () {
            function TourSetNode(tree, parent, isTaken) {
                this.tree = tree;
                this.parent = parent;
                if (!parent)
                    this.state = new TourSetNodeState(null, null);
                else
                    this.state = new TourSetNodeState(parent.state, new TourSetConstraint(parent.separatingArc, isTaken));
            }
            TourSetNode.prototype.focus = function () {
                Types.solutionTreeNode = this;
                if (this.state)
                    Types.currentGraph = this.state.graph;
            };
            TourSetNode.prototype.branch = function () {
                if (this.state.graph.isSolution)
                    return;
                this.leftChild = new TourSetNode(this.tree, this, false);
                this.rightChild = new TourSetNode(this.tree, this, true);
            };
            return TourSetNode;
        }());
        Types.TourSetNode = TourSetNode;
        function compareNodeBounds(a, b) {
            return a.state.getBound() - b.state.getBound();
        }
        Types.compareNodeBounds = compareNodeBounds;
        var TourSetTree = /** @class */ (function () {
            function TourSetTree() {
                this.unvisited = [];
                this.maxBound = Infinity;
                this._root = new TourSetNode(this, null);
                this.unvisited.push(this._root);
            }
            TourSetTree.prototype.getRoot = function () { return this._root; };
            TourSetTree.prototype.lowestBoundUnvisitedCount = function () {
                if (this.unvisited.length == 0)
                    return 0;
                var bound = this.unvisited[0].state.getBound();
                if (bound > this.maxBound)
                    return 0;
                for (var i = 1; i < this.unvisited.length; ++i)
                    if (this.unvisited[i].state.getBound() > bound)
                        return i;
                return this.unvisited.length;
            };
            TourSetTree.prototype.popUnvisited = function (index) {
                if (!index)
                    return this.unvisited.shift();
                return this.unvisited.splice(index, 1)[0];
            };
            TourSetTree.prototype.pushUnvisited = function (node) {
                if (!node)
                    return;
                this.unvisited.push(node);
                this.unvisited.sort(compareNodeBounds); // TODO O(log n)
            };
            return TourSetTree;
        }());
        Types.TourSetTree = TourSetTree;
        var VisualisationState;
        (function (VisualisationState) {
            VisualisationState[VisualisationState["GRAPH_INPUT"] = 0] = "GRAPH_INPUT";
            VisualisationState[VisualisationState["INITIAL_REDUCTION"] = 1] = "INITIAL_REDUCTION";
            VisualisationState[VisualisationState["SOLUTION_SEARCH"] = 2] = "SOLUTION_SEARCH";
        })(VisualisationState = Types.VisualisationState || (Types.VisualisationState = {}));
        var SolutionSearchState;
        (function (SolutionSearchState) {
            SolutionSearchState[SolutionSearchState["NEXT_NODE_SELECTION"] = 0] = "NEXT_NODE_SELECTION";
            SolutionSearchState[SolutionSearchState["BRANCH_ARC_SELECTION"] = 1] = "BRANCH_ARC_SELECTION";
            SolutionSearchState[SolutionSearchState["BRANCH_LEFT"] = 2] = "BRANCH_LEFT";
            SolutionSearchState[SolutionSearchState["BRANCH_RIGHT"] = 3] = "BRANCH_RIGHT";
            SolutionSearchState[SolutionSearchState["ONE_SOLUTION_FOUND"] = 4] = "ONE_SOLUTION_FOUND";
            SolutionSearchState[SolutionSearchState["ALL_SOLUTIONS_FOUND"] = 5] = "ALL_SOLUTIONS_FOUND";
        })(SolutionSearchState = Types.SolutionSearchState || (Types.SolutionSearchState = {}));
        Types.originalGraph = new Graph();
        Types.currentGraph = Types.originalGraph;
        Types.solutionTree = null;
        Types.solutionTreeNode = null;
        Types.visualisationState = VisualisationState.GRAPH_INPUT;
        Types.solutionSearchState = SolutionSearchState.NEXT_NODE_SELECTION;
    })(Types = Model.Types || (Model.Types = {}));
    var Algo;
    (function (Algo) {
        Algo.DUMMY_ARC_WITH_WEIGHT = {
            arc: null,
            weight: Infinity
        };
        function compareArcs(a, b) {
            return a.weight - b.weight;
        }
        Algo.compareArcs = compareArcs;
        var WeightReduction = /** @class */ (function () {
            function WeightReduction() {
                this.rowsSorted = null;
                this.columnsSorted = null;
                this.futureRowsSorted = null;
                this.futureColumnsSorted = null;
                this.affectedRows = null;
                this.affectedColumns = null;
                this.zeroArcs = null;
                this.arcRemovalBoundChanges = null;
                this.maxBoundChangeZeroArcs = null;
                this.initialWeights = null;
                this.intermediateWeights = null;
                this.finalWeights = null;
            }
            WeightReduction.prototype.calculateMinima = function (graph, row, column) {
                if (row) {
                    this.rowsSorted = Array(graph.vertices.length);
                    for (var i = 0; i < graph.vertices.length; ++i)
                        this.rowsSorted[i] = [];
                    this.affectedRows = [];
                }
                if (column) {
                    this.columnsSorted = Array(graph.vertices.length);
                    for (var i = 0; i < graph.vertices.length; ++i)
                        this.columnsSorted[i] = [];
                    this.affectedColumns = [];
                }
                for (var i = 0; i < graph.vertices.length; ++i) {
                    if (!graph.vertices[i])
                        continue;
                    if (row && !graph.takenStartVertices[i])
                        this.affectedRows.push(i);
                    if (column && !graph.takenEndVertices[i])
                        this.affectedColumns.push(i);
                }
                for (var _i = 0, _a = graph.arcs; _i < _a.length; _i++) {
                    var arc = _a[_i];
                    if (!arc)
                        continue;
                    var withWeight = this.makeArcWithWeigh(arc, graph);
                    if (row)
                        this.rowsSorted[arc.start].push(withWeight);
                    if (column)
                        this.columnsSorted[arc.end].push(withWeight);
                }
                if (row)
                    for (var i in this.rowsSorted)
                        this.rowsSorted[i].sort(compareArcs);
                if (column)
                    for (var i in this.columnsSorted)
                        this.columnsSorted[i].sort(compareArcs);
            };
            WeightReduction.prototype.calculateFutureMinima = function (graph) {
                if (this.rowsSorted) {
                    this.futureRowsSorted = [];
                    for (var i in this.rowsSorted) {
                        var row = this.rowsSorted[i];
                        var newRow = [];
                        for (var _i = 0, row_1 = row; _i < row_1.length; _i++) {
                            var arc = row_1[_i];
                            newRow.push(this.makeArcWithWeigh(arc.arc, graph));
                        }
                        newRow.sort(compareArcs);
                        this.futureRowsSorted[i] = newRow;
                    }
                }
                if (this.columnsSorted) {
                    this.futureColumnsSorted = [];
                    for (var i in this.columnsSorted) {
                        var column = this.columnsSorted[i];
                        var newColumn = [];
                        for (var _a = 0, column_1 = column; _a < column_1.length; _a++) {
                            var arc = column_1[_a];
                            newColumn.push(this.makeArcWithWeigh(arc.arc, graph));
                        }
                        newColumn.sort(compareArcs);
                        this.futureColumnsSorted[i] = newColumn;
                    }
                }
            };
            WeightReduction.prototype.getBoundChange = function (rows, columns) {
                rows = rows || this.affectedRows || [];
                columns = columns || this.affectedColumns || [];
                var boundChange = 0;
                for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
                    var i = rows_1[_i];
                    boundChange += this.rowsSorted[i][0].weight;
                }
                for (var _a = 0, columns_1 = columns; _a < columns_1.length; _a++) {
                    var i = columns_1[_a];
                    boundChange += this.columnsSorted[i][0].weight;
                }
                return boundChange;
            };
            WeightReduction.prototype.subtractMinima = function (graph, weights, rows, columns) {
                rows = rows || this.affectedRows || [];
                columns = columns || this.affectedColumns || [];
                var rowSet = {};
                var columnSet = {};
                for (var _i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
                    var i = rows_2[_i];
                    rowSet[i] = true;
                }
                for (var _a = 0, columns_2 = columns; _a < columns_2.length; _a++) {
                    var i = columns_2[_a];
                    columnSet[i] = true;
                }
                for (var _b = 0, _c = graph.arcs; _b < _c.length; _b++) {
                    var arc = _c[_b];
                    if (!arc)
                        continue;
                    var idx = graph.getArcIndex(arc);
                    if (!isFinite(weights.weights[idx])) {
                        continue;
                    }
                    if (rowSet[arc.start]) {
                        weights.weights[idx] -= this.rowsSorted[arc.start][0].weight;
                    }
                    if (columnSet[arc.end])
                        weights.weights[idx] -= this.columnsSorted[arc.end][0].weight;
                }
            };
            WeightReduction.prototype.findZeros = function (graph) {
                this.zeroArcs = [];
                this.arcRemovalBoundChanges = Object.create(null);
                this.maxBoundChangeZeroArcs = [];
                var rowSet = {};
                var columnSet = {};
                for (var _i = 0, _a = this.affectedRows; _i < _a.length; _i++) {
                    var i = _a[_i];
                    rowSet[i] = true;
                }
                for (var _b = 0, _c = this.affectedColumns; _b < _c.length; _b++) {
                    var i = _c[_b];
                    columnSet[i] = true;
                }
                var maxBoundChange = 0;
                for (var _d = 0, _e = graph.arcs; _d < _e.length; _d++) {
                    var arc = _e[_d];
                    if (!arc)
                        continue;
                    var idx = graph.getArcIndex(arc);
                    if (!rowSet[arc.start] || !columnSet[arc.end] || graph.weights.weights[idx] != 0) {
                        continue;
                    }
                    this.zeroArcs.push(idx);
                    var boundChange = this.arcRemovalBoundChanges[idx] =
                        this.getArcWeight(this.futureRowsSorted[arc.start][1]) +
                            this.getArcWeight(this.futureColumnsSorted[arc.end][1]);
                    if (boundChange > maxBoundChange) {
                        this.maxBoundChangeZeroArcs.length = 0;
                        maxBoundChange = boundChange;
                    }
                    if (boundChange == maxBoundChange)
                        this.maxBoundChangeZeroArcs.push(idx);
                }
            };
            WeightReduction.prototype.makeArcWithWeigh = function (arc, graph, weights) {
                if (!arc)
                    return Algo.DUMMY_ARC_WITH_WEIGHT;
                return {
                    arc: arc,
                    weight: this.getArcWeight({ arc: arc, weight: Infinity }, graph, weights)
                };
            };
            WeightReduction.prototype.getArcWeight = function (arc, graph, weights) {
                if (!arc || !arc.arc) {
                    return Infinity;
                }
                if (!graph)
                    return arc.weight;
                var weight;
                if (weights && weights != graph.weights) {
                    var idx = graph.getArcIndex(arc.arc);
                    if (idx < 0) {
                        return Infinity;
                    }
                    weight = weights.weights[idx];
                }
                else {
                    weight = graph.getArcWeight(arc.arc);
                }
                if (!isFinite(weight)) {
                    return Infinity;
                }
                return weight;
            };
            WeightReduction.prototype.performReduction = function (state) {
                var weights = state.graph.weights;
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
            };
            return WeightReduction;
        }());
        Algo.WeightReduction = WeightReduction;
    })(Algo = Model.Algo || (Model.Algo = {}));
})(Model || (Model = {}));
var Presentation;
(function (Presentation) {
    var PresentationModel;
    (function (PresentationModel) {
        var GraphVertexStyle;
        (function (GraphVertexStyle) {
            GraphVertexStyle[GraphVertexStyle["UNFOCUSED"] = 0] = "UNFOCUSED";
            GraphVertexStyle[GraphVertexStyle["FOCUSED"] = 1] = "FOCUSED";
        })(GraphVertexStyle = PresentationModel.GraphVertexStyle || (PresentationModel.GraphVertexStyle = {}));
        var GraphArcStyle;
        (function (GraphArcStyle) {
            GraphArcStyle[GraphArcStyle["UNFOCUSED"] = 0] = "UNFOCUSED";
            GraphArcStyle[GraphArcStyle["FOCUSED"] = 1] = "FOCUSED";
            GraphArcStyle[GraphArcStyle["SELECTABLE"] = 2] = "SELECTABLE";
        })(GraphArcStyle = PresentationModel.GraphArcStyle || (PresentationModel.GraphArcStyle = {}));
        var GraphEdgeStyle;
        (function (GraphEdgeStyle) {
            GraphEdgeStyle[GraphEdgeStyle["UNFOCUSED"] = 0] = "UNFOCUSED";
            GraphEdgeStyle[GraphEdgeStyle["FOCUSED"] = 1] = "FOCUSED";
        })(GraphEdgeStyle = PresentationModel.GraphEdgeStyle || (PresentationModel.GraphEdgeStyle = {}));
        var SolutionTreeNodeStyle;
        (function (SolutionTreeNodeStyle) {
            SolutionTreeNodeStyle[SolutionTreeNodeStyle["UNFOCUSED"] = 0] = "UNFOCUSED";
            SolutionTreeNodeStyle[SolutionTreeNodeStyle["FOCUSED"] = 1] = "FOCUSED";
            SolutionTreeNodeStyle[SolutionTreeNodeStyle["SELECTABLE"] = 2] = "SELECTABLE";
        })(SolutionTreeNodeStyle = PresentationModel.SolutionTreeNodeStyle || (PresentationModel.SolutionTreeNodeStyle = {}));
        var SolutionTreeEdgeStyle;
        (function (SolutionTreeEdgeStyle) {
            SolutionTreeEdgeStyle[SolutionTreeEdgeStyle["UNFOCUSED"] = 0] = "UNFOCUSED";
            SolutionTreeEdgeStyle[SolutionTreeEdgeStyle["FOCUSED"] = 1] = "FOCUSED";
        })(SolutionTreeEdgeStyle = PresentationModel.SolutionTreeEdgeStyle || (PresentationModel.SolutionTreeEdgeStyle = {}));
        function calculateRotation(x1, y1, x2, y2) {
            var dx = x2 - x1;
            var dy = y2 - y1;
            if (!dx && !dy)
                return 0;
            return Math.atan2(dy, dx);
            // if (!dx || !(dx / dy))
            //     return dy > 0 ? Math.PI / 2 : -Math.PI / 2;
            // if (!dy || !(dy / dx))
            //     return dx > 0 ? 0 : Math.PI;
            // return dx > 0 ? Math.atan(dy / dx) : -Math.PI / 2;
        }
        var ReductionStep;
        (function (ReductionStep) {
            ReductionStep[ReductionStep["INITIAL"] = 0] = "INITIAL";
            ReductionStep[ReductionStep["MIN_FOUND"] = 1] = "MIN_FOUND";
            ReductionStep[ReductionStep["REDUCED"] = 2] = "REDUCED";
        })(ReductionStep = PresentationModel.ReductionStep || (PresentationModel.ReductionStep = {}));
        PresentationModel.reductionStep = ReductionStep.INITIAL;
        PresentationModel.reductionIsIngoing = false;
        PresentationModel.focusedVertex = -1;
        PresentationModel.graph = {
            update: function () {
                this.vertices = [];
                this._modelToPresentationVertexIndices = Object.create(null);
                var model = Model.Types.currentGraph;
                var recalculateBoundMax = false;
                if (this.isEditable && Model.Types.originalGraph != model)
                    recalculateBoundMax = true;
                this.isEditable = Model.Types.originalGraph == model;
                this.reductionMin = null;
                for (var _i = 0, _a = model.vertices; _i < _a.length; _i++) {
                    var v = _a[_i];
                    if (!v)
                        continue;
                    var pv = {
                        style: GraphVertexStyle.FOCUSED,
                        x: v.x,
                        y: v.y,
                        index: this.vertices.length,
                        modelIndex: model.getVertexIndex(v)
                    };
                    if (PresentationModel.focusedVertex != -1 && PresentationModel.focusedVertex != pv.modelIndex)
                        pv.style = GraphVertexStyle.UNFOCUSED;
                    this.vertices.push(pv);
                    this._modelToPresentationVertexIndices[pv.modelIndex] = pv.index;
                }
                this.isReductionShown = (Model.Types.solutionTreeNode && Model.Types.solutionTreeNode.state && PresentationModel.focusedVertex != -1) || false;
                if (recalculateBoundMax && Model.Types.solutionTree) {
                    var root = Model.Types.solutionTree.getRoot();
                    if (root.state) {
                        var boundMax = 0;
                        for (var i in root.state.weightReduction.affectedRows) {
                            var row = root.state.weightReduction.rowsSorted[i];
                            var weight = void 0;
                            if (row && row.length && isFinite(weight = row[row.length - 1].weight))
                                boundMax += weight;
                        }
                        for (var i in root.state.weightReduction.affectedColumns) {
                            var column = root.state.weightReduction.columnsSorted[i];
                            var weight = void 0;
                            if (column && column.length && isFinite(weight = column[column.length - 1].weight))
                                boundMax += weight;
                        }
                        this.boundMax = boundMax;
                    }
                    else if (!this.boundMax)
                        this.boundMax = 1;
                }
                this.boundDelta = 0;
                if (Model.Types.solutionTreeNode && Model.Types.solutionTreeNode.state) {
                    this.bound = Model.Types.solutionTreeNode.state.getBound();
                    if (this.isReductionShown) {
                        if (PresentationModel.reductionStep == ReductionStep.MIN_FOUND) {
                            this.boundDelta = Model.Types.solutionTreeNode.state.weightReduction.getBoundChange(PresentationModel.reductionIsIngoing ? [] : [PresentationModel.focusedVertex], PresentationModel.reductionIsIngoing ? [PresentationModel.focusedVertex] : []);
                        }
                        var previousBound = Model.Types.solutionTreeNode.parent ? Model.Types.solutionTreeNode.parent.state.getBound() : 0;
                        var rows = null, columns = null;
                        if (PresentationModel.reductionIsIngoing) {
                            var index = Model.Types.solutionTreeNode.state.weightReduction.affectedColumns.indexOf(PresentationModel.focusedVertex);
                            if (PresentationModel.reductionStep == ReductionStep.REDUCED)
                                ++index;
                            columns = Model.Types.solutionTreeNode.state.weightReduction.affectedColumns.slice(0, index);
                        }
                        else {
                            columns = [];
                            var index = Model.Types.solutionTreeNode.state.weightReduction.affectedRows.indexOf(PresentationModel.focusedVertex);
                            if (PresentationModel.reductionStep == ReductionStep.REDUCED)
                                ++index;
                            rows = Model.Types.solutionTreeNode.state.weightReduction.affectedColumns.slice(0, index);
                        }
                        this.bound = previousBound + Model.Types.solutionTreeNode.state.weightReduction.getBoundChange(rows, columns);
                    }
                }
                this.edges = [];
                this._edgeEndsToIndices = Object.create(null);
                for (var _b = 0, _c = model.arcs; _b < _c.length; _b++) {
                    var arc = _c[_b];
                    if (!arc)
                        continue;
                    var modelIndex = void 0;
                    var weight = model.weights.weights[modelIndex = model.getArcIndex(arc)];
                    var reductionVertexNumber = PresentationModel.reductionIsIngoing ? arc.end : arc.start;
                    if (this.isReductionShown) {
                        var threshold = PresentationModel.reductionStep == ReductionStep.REDUCED ? PresentationModel.focusedVertex + 1 : PresentationModel.focusedVertex;
                        if (reductionVertexNumber >= threshold && !PresentationModel.reductionIsIngoing)
                            weight = Model.Types.solutionTreeNode.state.weightReduction.initialWeights.weights[modelIndex];
                        else if (reductionVertexNumber < threshold && !PresentationModel.reductionIsIngoing || reductionVertexNumber >= threshold && PresentationModel.reductionIsIngoing)
                            weight = Model.Types.solutionTreeNode.state.weightReduction.intermediateWeights.weights[modelIndex];
                        else if (reductionVertexNumber < threshold && PresentationModel.reductionIsIngoing)
                            weight = Model.Types.solutionTreeNode.state.weightReduction.finalWeights.weights[modelIndex];
                    }
                    if (typeof weight != 'number' || isNaN(weight))
                        continue;
                    if (weight == Infinity) {
                        if (!model.takenArcs[modelIndex])
                            continue;
                        weight = 0;
                    }
                    var start = this.vertices[this._modelToPresentationVertexIndices[arc.start]];
                    var end = this.vertices[this._modelToPresentationVertexIndices[arc.end]];
                    var pa = {
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
                        modelIndex: modelIndex
                    };
                    if (this.isReductionShown && PresentationModel.focusedVertex != reductionVertexNumber)
                        pa.style = GraphArcStyle.UNFOCUSED;
                    if (Model.Types.visualisationState == Model.Types.VisualisationState.SOLUTION_SEARCH && Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION) {
                        if (Model.Types.solutionTreeNode.state.weightReduction.maxBoundChangeZeroArcs.indexOf(modelIndex) >= 0)
                            pa.style = GraphArcStyle.SELECTABLE;
                    }
                    if (PresentationModel.focusedVertex == reductionVertexNumber && this.isReductionShown) {
                        var weightReduction = Model.Types.solutionTreeNode.state.weightReduction;
                        if (PresentationModel.reductionIsIngoing && weightReduction.columnsSorted || !PresentationModel.reductionIsIngoing && weightReduction.rowsSorted) {
                            var sorted = PresentationModel.reductionIsIngoing ? weightReduction.columnsSorted[arc.end] : weightReduction.rowsSorted[arc.start];
                            switch (PresentationModel.reductionStep) {
                                case Presentation.PresentationModel.ReductionStep.INITIAL:
                                    break;
                                case Presentation.PresentationModel.ReductionStep.MIN_FOUND: {
                                    var min = sorted[0].weight;
                                    this.reductionMin = min;
                                    if (min == weight) {
                                        pa.isMin = true;
                                    }
                                    else {
                                        pa.fillPart = Math.sqrt(min / weight);
                                    }
                                    break;
                                }
                                case Presentation.PresentationModel.ReductionStep.REDUCED: {
                                    if (sorted[0].weight == sorted[1].weight)
                                        break;
                                    var min = sorted[1].weight - sorted[0].weight;
                                    this.reductionMin = min;
                                    if (min == weight) {
                                        pa.isMin = true;
                                    }
                                    else {
                                        pa.fillPart = min / weight;
                                    }
                                }
                            }
                        }
                    }
                    var keyFw = arc.start + ',' + arc.end;
                    var keyBk = arc.end + ',' + arc.start;
                    var edgeIdx = void 0;
                    var edge = void 0;
                    if (typeof (edgeIdx = this._edgeEndsToIndices[keyBk]) == 'number') {
                        edge = this.edges[edgeIdx];
                        edge.backward = pa;
                        if (pa.style != GraphArcStyle.UNFOCUSED)
                            edge.style = GraphEdgeStyle.FOCUSED;
                        continue;
                    }
                    if (typeof (edgeIdx = this._edgeEndsToIndices[keyFw]) == 'number') {
                        edge = this.edges[edgeIdx];
                        console.error('Duplicate arc: ' + keyFw);
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
                        index: edgeIdx
                    };
                    this.edges.push(edge);
                }
                for (var _d = 0, _e = this.observers; _d < _e.length; _d++) {
                    var o = _e[_d];
                    if (!o)
                        continue;
                    o.update();
                }
            },
            convertArc: function (modelArc) {
                if (!modelArc)
                    return null;
                var keyFw = modelArc.start + ',' + modelArc.end;
                var keyBk = modelArc.end + ',' + modelArc.start;
                var edgeIdx;
                var edge;
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
            _edgeEndsToIndices: Object.create(null)
        };
        PresentationModel.solutionTree = {
            update: function () {
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
                for (var _i = 0, _a = this.observers; _i < _a.length; _i++) {
                    var o = _a[_i];
                    if (!o)
                        continue;
                    o.update();
                }
            },
            _fillNodes: function (node, pParent) {
                if (!node)
                    return null;
                var pNode = {
                    bound: node.state.getBound(),
                    separatingArc: null,
                    level: pParent ? pParent.level + 1 : 0,
                    xOffset: 0,
                    style: node == Model.Types.solutionTreeNode ? SolutionTreeNodeStyle.FOCUSED : SolutionTreeNodeStyle.UNFOCUSED,
                    model: node,
                    parent: pParent,
                    left: null,
                    right: null,
                    isSolution: node.state.graph.isSolution
                };
                if (Model.Types.solutionSearchState == Model.Types.SolutionSearchState.NEXT_NODE_SELECTION) {
                    var index = Model.Types.solutionTree.unvisited.indexOf(node);
                    if (index >= 0 && index < Model.Types.solutionTree.lowestBoundUnvisitedCount())
                        pNode.style = SolutionTreeNodeStyle.SELECTABLE;
                }
                if (node.parent && node.parent == Model.Types.solutionTreeNode) {
                    if (Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_LEFT && node == node.parent.rightChild)
                        return null;
                    if ((Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_LEFT && node == node.parent.leftChild)
                        ||
                            (Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_RIGHT && node == node.parent.rightChild))
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
                pNode.left = this._fillNodes(node.leftChild, pNode);
                pNode.right = this._fillNodes(node.rightChild, pNode);
                if (pNode.left)
                    this.edges.push({
                        style: pNode.style == SolutionTreeNodeStyle.FOCUSED && pNode.left.style == SolutionTreeNodeStyle.FOCUSED ? SolutionTreeEdgeStyle.FOCUSED : SolutionTreeEdgeStyle.UNFOCUSED,
                        parent: pNode,
                        child: pNode.left,
                        isTaken: false
                    });
                if (pNode.right)
                    this.edges.push({
                        style: pNode.style == SolutionTreeNodeStyle.FOCUSED && pNode.right.style == SolutionTreeNodeStyle.FOCUSED ? SolutionTreeEdgeStyle.FOCUSED : SolutionTreeEdgeStyle.UNFOCUSED,
                        parent: pNode,
                        child: pNode.right,
                        isTaken: true
                    });
                return pNode;
            },
            _adjustOffsets: function () {
                for (var i = this.nodesByLevel.length - 1; i >= 0; --i) {
                    for (var j = 0; j < this.nodesByLevel[i].length; ++j) {
                        var node = this.nodesByLevel[i][j];
                        var x = node.xOffset;
                        if (j) {
                            x = Math.max(x, this.nodesByLevel[i][j - 1].xOffset + 1);
                        }
                        if (node.parent) {
                            x = Math.max(x, node.parent.xOffset - 0.5);
                        }
                        if (node.left) {
                            var cx = node.left.xOffset;
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
            observers: []
        };
    })(PresentationModel = Presentation.PresentationModel || (Presentation.PresentationModel = {}));
    var GraphicLibrary;
    (function (GraphicLibrary) {
        function addOptionalMethods(instance) {
            var obj = Object.create(instance);
            if (!obj.drawArrow)
                obj.drawArrow = function (x1, y1, x2, y2, fg) {
                    this.drawLine(x1, y1, x2, y2, fg);
                    var dx = x2 - x1;
                    var dy = y2 - y1;
                    var a = Math.atan2(dy, dx);
                    var s = Math.sin(a);
                    var c = Math.cos(a);
                    var length = Math.sqrt(dx * dx + dy * dy);
                    var headLength = Math.min(length * .75, this.strokeWidth * 8);
                    var headSemiwidth = Math.min(headLength * .75, this.strokeWidth * 3);
                    var hx1 = -headLength * c - headSemiwidth * s;
                    var hx2 = -headLength * c + headSemiwidth * s;
                    var hy1 = -headLength * s + headSemiwidth * c;
                    var hy2 = -headLength * s - headSemiwidth * c;
                    this.drawPolygon([{ x: x2 + hx1, y: y2 + hy1 }, { x: x2, y: y2 }, { x: x2 + hx2, y: y2 + hy2 }], fg);
                };
            if (!obj.drawDiamond)
                obj.drawDiamond = function (cx, cy, rx, ry, bg, fg, text) {
                    this.drawPolygon([{ x: cx - rx, y: cy }, { x: cx, y: cy + ry }, { x: cx + rx, y: cy }, { x: cx, y: cy - ry }, { x: cx - rx, y: cy }], bg, fg, text);
                };
            return obj;
        }
        GraphicLibrary.addOptionalMethods = addOptionalMethods;
        var CanvasImplementation = /** @class */ (function () {
            function CanvasImplementation(width, height) {
                var _this = this;
                this.strokeWidth = 1;
                this.mouseHandler = null;
                this.width = 0;
                this.height = 0;
                this.canvas = document.createElement('canvas');
                this.ctx = this.canvas.getContext('2d');
                this.resize(width, height);
                var _loop_1 = function (domName, localName) {
                    this_1.canvas.addEventListener(domName, function (e) {
                        var handler = _this.mouseHandler;
                        var coords = _this.extractMouseCoordinates(e);
                        if (handler)
                            handler(localName, e, coords.x, coords.y);
                    }, false);
                };
                var this_1 = this;
                for (var _i = 0, _a = [
                    ['click', 'click'],
                    ['mousedown', 'down'],
                    ['mouseup', 'up'],
                    ['mousemove', 'move'],
                ]; _i < _a.length; _i++) {
                    var _b = _a[_i], domName = _b[0], localName = _b[1];
                    _loop_1(domName, localName);
                }
            }
            CanvasImplementation.prototype.clear = function () {
                this.ctx.clearRect(0, 0, this.width, this.height);
            };
            CanvasImplementation.prototype.popTransformation = function () {
                this.ctx.restore();
            };
            CanvasImplementation.prototype.pushTransformation = function () {
                this.ctx.save();
            };
            CanvasImplementation.prototype.transformRotate = function (angle) {
                this.ctx.rotate(angle);
            };
            CanvasImplementation.prototype.transformTranslate = function (x, y) {
                this.ctx.translate(x, y);
            };
            CanvasImplementation.prototype.resize = function (width, height) {
                this.canvas.width = width * CanvasImplementation.SCALE;
                this.canvas.height = height * CanvasImplementation.SCALE;
                this.canvas.style.width = width + 'px';
                this.canvas.style.height = height + 'px';
                this.width = width;
                this.height = height;
                this.ctx.resetTransform();
                this.ctx.scale(CanvasImplementation.SCALE, CanvasImplementation.SCALE);
            };
            CanvasImplementation.prototype.drawCircle = function (cx, cy, r, bg, fg, text) {
                this.ctx.beginPath();
                this.ctx.ellipse(cx, cy, r, r, 0, 0, Math.PI * 2);
                this.ctx.closePath();
                this.finishPath(bg, fg);
                if (text)
                    this.drawText(cx, cy, 0, 0, fg, text);
            };
            CanvasImplementation.prototype.drawLine = function (x1, y1, x2, y2, fg) {
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
                this.finishPath(null, fg);
            };
            CanvasImplementation.prototype.drawPolygon = function (points, bg, fg, text) {
                if (!points[0])
                    return;
                this.ctx.beginPath();
                this.ctx.moveTo(points[0].x, points[0].y);
                for (var i = 1; i < points.length; ++i)
                    this.ctx.lineTo(points[i].x, points[i].y);
                this.finishPath(bg, fg);
                if (text) {
                    var x = 0, y = 0;
                    for (var i = 0; i < points.length; ++i) {
                        x += points[i].x;
                        y += points[i].y;
                    }
                    this.drawText(x / points.length, y / points.length, 0, 0, fg, text);
                }
            };
            CanvasImplementation.prototype.drawText = function (x, y, xAlign, yAlign, fg, text) {
                if (xAlign < -0)
                    this.ctx.textAlign = 'left';
                else if (xAlign > 0)
                    this.ctx.textAlign = 'right';
                else
                    this.ctx.textAlign = 'center';
                if (yAlign < -0)
                    this.ctx.textBaseline = 'top'; // y axis goes down
                else if (yAlign > 0)
                    this.ctx.textBaseline = 'bottom';
                else
                    this.ctx.textBaseline = 'middle';
                this.ctx.fillStyle = fg; // sic
                this.ctx.fillText(text, x, y);
            };
            CanvasImplementation.prototype.finishPath = function (bg, fg) {
                if (fg) {
                    this.ctx.lineWidth = this.strokeWidth;
                    this.ctx.strokeStyle = fg;
                    this.ctx.stroke();
                }
                if (bg) {
                    this.ctx.fillStyle = bg;
                    this.ctx.fill();
                }
            };
            CanvasImplementation.prototype.extractMouseCoordinates = function (event) {
                var r = this.canvas.getBoundingClientRect();
                var scale = this.canvas.width / CanvasImplementation.SCALE / r.width;
                return {
                    x: (event.clientX - r.left) / scale,
                    y: (event.clientY - r.top) / scale
                };
            };
            CanvasImplementation.SCALE = 4;
            return CanvasImplementation;
        }());
        GraphicLibrary.CanvasImplementation = CanvasImplementation;
        GraphicLibrary.canvasFactory = {
            create: function (parentNode, width, height) {
                var result = new CanvasImplementation(width, height);
                parentNode.appendChild(result.canvas);
                return result;
            }
        };
    })(GraphicLibrary = Presentation.GraphicLibrary || (Presentation.GraphicLibrary = {}));
    function numberToString(n) {
        if (isFinite(n))
            return n + '';
        if (n == Infinity)
            return '\u221e';
        if (n == -Infinity)
            return '-\u221e';
        return '?';
    }
    var Views;
    (function (Views) {
        var _a;
        var GraphEdgeStyle = Presentation.PresentationModel.GraphEdgeStyle;
        var GraphArcStyle = Presentation.PresentationModel.GraphArcStyle;
        var GraphVertexStyle = Presentation.PresentationModel.GraphVertexStyle;
        var BaseView = /** @class */ (function () {
            function BaseView() {
                this._dirty = true;
                this.mouseHandler = null;
            }
            BaseView.prototype.update = function () {
                var _this = this;
                this._dirty = true;
                requestAnimationFrame(function () {
                    if (_this._dirty)
                        _this.render();
                });
            };
            return BaseView;
        }());
        var GraphicalView = /** @class */ (function (_super) {
            __extends(GraphicalView, _super);
            function GraphicalView() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.width = 480;
                _this.height = 320;
                return _this;
            }
            GraphicalView.prototype.init = function (g, parentNode) {
                var _this = this;
                this.drawing = g.create(parentNode, this.width, this.height);
                this.drawingExtended = GraphicLibrary.addOptionalMethods(this.drawing);
                this.drawing.mouseHandler = function (type, e, x, y) {
                    if (_this.mouseHandler)
                        _this.mouseHandler(type, e, x, y);
                };
                this.render();
            };
            return GraphicalView;
        }(BaseView));
        var ColorIndex;
        (function (ColorIndex) {
            // graph vertex
            ColorIndex[ColorIndex["GRAPH_VERTEX_UNFOCUSED"] = 0] = "GRAPH_VERTEX_UNFOCUSED";
            ColorIndex[ColorIndex["GRAPH_VERTEX_FOCUSED"] = 1] = "GRAPH_VERTEX_FOCUSED";
            ColorIndex[ColorIndex["GRAPH_VERTEX_FG"] = 2] = "GRAPH_VERTEX_FG";
            // graph edge
            ColorIndex[ColorIndex["GRAPH_EDGE_UNFOCUSED"] = 3] = "GRAPH_EDGE_UNFOCUSED";
            ColorIndex[ColorIndex["GRAPH_EDGE_FOCUSED"] = 4] = "GRAPH_EDGE_FOCUSED";
            // graph arc weight
            ColorIndex[ColorIndex["GRAPH_ARC_WEIGHT_UNFOCUSED"] = 5] = "GRAPH_ARC_WEIGHT_UNFOCUSED";
            ColorIndex[ColorIndex["GRAPH_ARC_WEIGHT_FOCUSED"] = 6] = "GRAPH_ARC_WEIGHT_FOCUSED";
            ColorIndex[ColorIndex["GRAPH_ARC_WEIGHT_MIN_BG"] = 7] = "GRAPH_ARC_WEIGHT_MIN_BG";
            ColorIndex[ColorIndex["GRAPH_ARC_WEIGHT_NONMIN_BG"] = 8] = "GRAPH_ARC_WEIGHT_NONMIN_BG";
            // table cell
            ColorIndex[ColorIndex["TABLE_CELL_FOCUSED"] = 9] = "TABLE_CELL_FOCUSED";
            ColorIndex[ColorIndex["TABLE_CELL_UNFOCUSED"] = 10] = "TABLE_CELL_UNFOCUSED";
            ColorIndex[ColorIndex["TABLE_CELL_SELECTABLE"] = 11] = "TABLE_CELL_SELECTABLE";
            ColorIndex[ColorIndex["TABLE_CELL_MIN"] = 12] = "TABLE_CELL_MIN";
            ColorIndex[ColorIndex["TABLE_CELL_INFINITE"] = 13] = "TABLE_CELL_INFINITE";
            ColorIndex[ColorIndex["TABLE_CELL_TAKEN"] = 14] = "TABLE_CELL_TAKEN";
            // bound bar
            ColorIndex[ColorIndex["BOUND_BAR_FREE"] = 15] = "BOUND_BAR_FREE";
            ColorIndex[ColorIndex["BOUND_BAR_DELTA"] = 16] = "BOUND_BAR_DELTA";
            ColorIndex[ColorIndex["BOUND_BAR_DELTA_FG"] = 17] = "BOUND_BAR_DELTA_FG";
            ColorIndex[ColorIndex["BOUND_BAR_OCCUPIED"] = 18] = "BOUND_BAR_OCCUPIED";
            ColorIndex[ColorIndex["BOUND_BAR_OCCUPIED_FG"] = 19] = "BOUND_BAR_OCCUPIED_FG";
            ColorIndex[ColorIndex["BOUND_BAR_MAX_BOUND_OVERLAY"] = 20] = "BOUND_BAR_MAX_BOUND_OVERLAY";
            // solution tree
            ColorIndex[ColorIndex["SOLUTION_TREE_UNFOCUSED"] = 21] = "SOLUTION_TREE_UNFOCUSED";
            ColorIndex[ColorIndex["SOLUTION_TREE_FOCUSED"] = 22] = "SOLUTION_TREE_FOCUSED";
            ColorIndex[ColorIndex["SOLUTION_TREE_SELECTABLE"] = 23] = "SOLUTION_TREE_SELECTABLE";
            ColorIndex[ColorIndex["SOLUTION_TREE_NONSOLUTION_BG"] = 24] = "SOLUTION_TREE_NONSOLUTION_BG";
            ColorIndex[ColorIndex["SOLUTION_TREE_SOLUTION_BG"] = 25] = "SOLUTION_TREE_SOLUTION_BG";
        })(ColorIndex = Views.ColorIndex || (Views.ColorIndex = {}));
        Views.colors = (_a = {},
            _a[ColorIndex.GRAPH_VERTEX_UNFOCUSED] = "#8b8b8b",
            _a[ColorIndex.GRAPH_VERTEX_FOCUSED] = "#000000",
            _a[ColorIndex.GRAPH_VERTEX_FG] = "#e0e6fe",
            _a[ColorIndex.GRAPH_EDGE_UNFOCUSED] = "#8b8b8b",
            _a[ColorIndex.GRAPH_EDGE_FOCUSED] = "#000000",
            _a[ColorIndex.GRAPH_ARC_WEIGHT_UNFOCUSED] = "#8b8b8b",
            _a[ColorIndex.GRAPH_ARC_WEIGHT_FOCUSED] = "#000000",
            _a[ColorIndex.GRAPH_ARC_WEIGHT_MIN_BG] = "#6861fe",
            _a[ColorIndex.GRAPH_ARC_WEIGHT_NONMIN_BG] = "#c0befe",
            _a[ColorIndex.TABLE_CELL_FOCUSED] = "#ffffff",
            _a[ColorIndex.TABLE_CELL_UNFOCUSED] = "#cccccc",
            _a[ColorIndex.TABLE_CELL_SELECTABLE] = "#d8a77d",
            _a[ColorIndex.TABLE_CELL_MIN] = "#7da7d8",
            _a[ColorIndex.TABLE_CELL_INFINITE] = "#333333",
            _a[ColorIndex.TABLE_CELL_TAKEN] = "#000000",
            _a[ColorIndex.BOUND_BAR_FREE] = "#cccccc",
            _a[ColorIndex.BOUND_BAR_DELTA] = "#7da7d8",
            _a[ColorIndex.BOUND_BAR_DELTA_FG] = "#333333",
            _a[ColorIndex.BOUND_BAR_OCCUPIED] = "#000000",
            _a[ColorIndex.BOUND_BAR_OCCUPIED_FG] = "#ffffff",
            _a[ColorIndex.BOUND_BAR_MAX_BOUND_OVERLAY] = "#ce181e",
            _a[ColorIndex.SOLUTION_TREE_UNFOCUSED] = "#8b8b8b",
            _a[ColorIndex.SOLUTION_TREE_FOCUSED] = "#000000",
            _a[ColorIndex.SOLUTION_TREE_SELECTABLE] = "#fe6861",
            _a[ColorIndex.SOLUTION_TREE_NONSOLUTION_BG] = "#ffffff",
            _a[ColorIndex.SOLUTION_TREE_SOLUTION_BG] = "#add58a",
            _a);
        var GraphView = /** @class */ (function (_super) {
            __extends(GraphView, _super);
            function GraphView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            GraphView.prototype.render = function () {
                this.drawing.clear();
                var pmodel = PresentationModel.graph;
                for (var _i = 0, _a = pmodel.edges; _i < _a.length; _i++) {
                    var e = _a[_i];
                    this.drawingExtended.drawLine(e.start.x, e.start.y, e.end.x, e.end.y, Views.colors[e.style == GraphEdgeStyle.FOCUSED ?
                        ColorIndex.GRAPH_EDGE_FOCUSED : ColorIndex.GRAPH_EDGE_UNFOCUSED]);
                    if (e.forward)
                        this.drawArcWeight(e.forward);
                    if (e.backward)
                        this.drawArcWeight(e.backward);
                }
                for (var _b = 0, _c = pmodel.vertices; _b < _c.length; _b++) {
                    var v = _c[_b];
                    this.drawing.drawCircle(v.x, v.y, 8, Views.colors[v.style == GraphVertexStyle.FOCUSED ?
                        ColorIndex.GRAPH_VERTEX_FOCUSED : ColorIndex.GRAPH_VERTEX_UNFOCUSED]);
                    this.drawing.drawText(v.x, v.y, 0, 0, Views.colors[ColorIndex.GRAPH_VERTEX_FG], Model.Types.originalGraph.vertices[v.modelIndex].name);
                }
                this._dirty = false;
            };
            GraphView.prototype.drawArcWeight = function (a) {
                var _a;
                this.drawing.pushTransformation();
                try {
                    this.drawing.transformTranslate(a.x, a.y);
                    this.drawing.transformRotate(a.rotation);
                    var width = a.size;
                    var length_1 = a.size * 1.5;
                    this.drawing.transformTranslate(-length_1 * .4, 0);
                    var p1 = { x: 0, y: 0 };
                    var p2 = { x: 0, y: -width };
                    var p3 = { x: length_1, y: 0 };
                    var p4 = { x: 0, y: width }; // for taken
                    var fg = Views.colors[(_a = {},
                        _a[GraphArcStyle.UNFOCUSED] = ColorIndex.GRAPH_ARC_WEIGHT_UNFOCUSED,
                        _a[GraphArcStyle.FOCUSED] = ColorIndex.GRAPH_ARC_WEIGHT_FOCUSED,
                        _a[GraphArcStyle.SELECTABLE] = ColorIndex.GRAPH_ARC_WEIGHT_FOCUSED,
                        _a)[a.style]];
                    var bg = a.isZero ? fg : (a.isMin ? Views.colors[ColorIndex.GRAPH_ARC_WEIGHT_MIN_BG] : null);
                    if (a.fillPart) {
                        var partP1 = { x: length_1 * (1 - a.fillPart), y: 0 };
                        var partP2 = { x: partP1.x, y: -width * a.fillPart };
                        this.drawing.drawPolygon([partP1, partP2, p3], Views.colors[ColorIndex.GRAPH_ARC_WEIGHT_NONMIN_BG], null);
                    }
                    this.drawing.drawPolygon(a.isTaken ? [p2, p3, p4] : [p1, p2, p3], bg, fg, a.isZero ? null : a.label);
                }
                finally {
                    this.drawing.popTransformation();
                }
            };
            return GraphView;
        }(GraphicalView));
        Views.GraphView = GraphView;
        var TableView = /** @class */ (function (_super) {
            __extends(TableView, _super);
            function TableView() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this.shownVertices = [];
                _this.vertexIndices = [];
                _this.isContenteditable = true;
                _this.inputHandler = null;
                return _this;
            }
            TableView.prototype.init = function (g, parentNode) {
                this.element = document.createElement('table');
                this.element.className = 'tspbbvis-tableview';
                this.headerRow = document.createElement('tr');
                for (var i = 0; i < 2; ++i)
                    this.headerRow.appendChild(document.createElement('td'));
                this.headerRow.lastChild.innerText = 'min';
                this.element.appendChild(this.headerRow);
                var bottomRow = document.createElement('tr');
                for (var i = 0; i < 2; ++i)
                    bottomRow.appendChild(document.createElement('td'));
                bottomRow.firstChild.innerText = 'min';
                this.element.appendChild(bottomRow);
                parentNode.appendChild(this.element);
                this.render();
            };
            TableView.prototype.render = function () {
                var pmodel = PresentationModel.graph;
                var model = Model.Types.currentGraph;
                var updateEditable = pmodel.isEditable != this.isContenteditable;
                this.isContenteditable = pmodel.isEditable;
                var oldChildren = Array.prototype.slice.call(this.element.children, 0);
                var existingVertices = {};
                for (var _i = 0, _a = pmodel.vertices; _i < _a.length; _i++) {
                    var v = _a[_i];
                    var modelIndex = void 0;
                    if (typeof this.vertexIndices[modelIndex = v.modelIndex] != 'number') {
                        this.createVertex(modelIndex, oldChildren);
                    }
                    existingVertices[modelIndex] = true;
                }
                oldChildren.push(this.element);
                for (var i = 0; i < this.shownVertices.length; ++i) {
                    var modelIndex = void 0;
                    if (!existingVertices[modelIndex = this.shownVertices[i]]) {
                        this.removeVertex(modelIndex, oldChildren);
                        --i;
                    }
                }
                for (var _b = 0, _c = Array.prototype.slice.call(this.element.children, 0); _b < _c.length; _b++) {
                    var row = _c[_b];
                    for (var _d = 0, _e = Array.prototype.slice.call(row.children); _d < _e.length; _d++) {
                        var cell = _e[_d];
                        if (!cell.referencedEdge) {
                            if (typeof cell.referencedVertex == 'number') {
                                if (pmodel.isReductionShown && PresentationModel.reductionStep == PresentationModel.ReductionStep.MIN_FOUND && cell.referencedVertex == PresentationModel.focusedVertex && cell.referencedVertexIsIngoing == PresentationModel.reductionIsIngoing)
                                    cell.innerText = numberToString(pmodel.reductionMin);
                                else
                                    cell.innerHTML = '';
                            }
                            continue;
                        }
                        var weight = Infinity;
                        var sup = null;
                        if (cell.referencedEdge.length == 2) {
                            if (updateEditable)
                                cell.contentEditable = this.getContenteditable(cell.referencedEdge[0], cell.referencedEdge[1]);
                            if (cell == document.activeElement)
                                continue;
                            var arc = model.getArcFromEnds(cell.referencedEdge[0], cell.referencedEdge[1]);
                            var pArc = pmodel.convertArc(arc);
                            if (pArc) {
                                weight = pArc.weight;
                                if (pArc.style == PresentationModel.GraphArcStyle.UNFOCUSED) {
                                    cell.style.backgroundColor = Views.colors[ColorIndex.TABLE_CELL_UNFOCUSED];
                                }
                                else if (pArc.style == PresentationModel.GraphArcStyle.SELECTABLE) {
                                    cell.style.backgroundColor = Views.colors[ColorIndex.TABLE_CELL_SELECTABLE];
                                }
                                else if (pArc.isMin) {
                                    cell.style.backgroundColor = Views.colors[ColorIndex.TABLE_CELL_MIN];
                                }
                                else {
                                    cell.style.backgroundColor = Views.colors[ColorIndex.TABLE_CELL_FOCUSED];
                                }
                                if (Model.Types.visualisationState == Model.Types.VisualisationState.SOLUTION_SEARCH &&
                                    Model.Types.solutionSearchState == Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION) {
                                    var weightReduction = Model.Types.solutionTreeNode.state.weightReduction;
                                    var idx = model.getArcIndex(arc);
                                    if (weightReduction.zeroArcs.indexOf(idx) >= 0) {
                                        sup = document.createElement('sup');
                                        sup.innerText = numberToString(weightReduction.arcRemovalBoundChanges[idx]);
                                    }
                                }
                            }
                            else {
                                cell.style.backgroundColor = Views.colors[pmodel.isEditable ? ColorIndex.TABLE_CELL_FOCUSED : ColorIndex.TABLE_CELL_INFINITE];
                            }
                            if (model.takenArcs[model.getArcIndex(arc)])
                                cell.style.backgroundColor = Views.colors[ColorIndex.TABLE_CELL_TAKEN];
                        }
                        if (isFinite(weight))
                            cell.innerText = numberToString(weight);
                        else
                            cell.innerHTML = '';
                        if (sup)
                            cell.appendChild(sup);
                    }
                }
                this._dirty = false;
            };
            TableView.prototype.removeVertex = function (modelIndex, parentElements) {
                for (var _i = 0, parentElements_1 = parentElements; _i < parentElements_1.length; _i++) {
                    var parent_1 = parentElements_1[_i];
                    var child = this.getVertexChild(parent_1, modelIndex);
                    if (!child)
                        continue;
                    parent_1.removeChild(child);
                }
                var idx = this.vertexIndices[modelIndex];
                this.vertexIndices[modelIndex] = undefined;
                this.shownVertices.splice(idx, 1);
                for (var i = modelIndex + 1; i < this.vertexIndices.length; ++i)
                    if (typeof this.vertexIndices[i] == 'number')
                        --this.vertexIndices[i];
            };
            TableView.prototype.createVertex = function (modelIndex, oldChildren) {
                var row = document.createElement('tr');
                var nameCell = document.createElement('td');
                var name = Model.Types.currentGraph.vertices[modelIndex].name;
                var idx = this.getInsertionIndex(modelIndex);
                this.vertexIndices[modelIndex] = idx;
                this.shownVertices.splice(idx, 0, modelIndex);
                for (var i = modelIndex + 1; i < this.vertexIndices.length; ++i)
                    if (typeof this.vertexIndices[i] == 'number')
                        ++this.vertexIndices[i];
                nameCell.innerText = name;
                row.appendChild(nameCell);
                for (var i = 0; i < Model.Types.currentGraph.vertices.length; ++i) {
                    if (!Model.Types.currentGraph.vertices[i])
                        continue;
                    var cell = this.createEditableCell(modelIndex, i);
                    row.appendChild(cell);
                }
                row.appendChild(this.createMinCell(modelIndex, false));
                this.insertVertexChild(this.element, modelIndex, row);
                for (var _i = 0, oldChildren_1 = oldChildren; _i < oldChildren_1.length; _i++) {
                    var child = oldChildren_1[_i];
                    var cell = void 0;
                    if (child.previousSibling && child.nextSibling)
                        cell = this.createEditableCell(child.children[1].referencedEdge[0], modelIndex);
                    else if (!child.nextSibling)
                        cell = this.createMinCell(modelIndex, true);
                    else
                        cell = document.createElement('td');
                    if (!child.previousSibling)
                        cell.innerText = name;
                    this.insertVertexChild(child, modelIndex, cell);
                }
            };
            TableView.prototype.getContenteditable = function (start, end) {
                return (this.isContenteditable && (start != end)) + '';
            };
            TableView.prototype.getInsertionIndex = function (modelIndex) {
                var idx;
                if (typeof (idx = this.vertexIndices[modelIndex]) == 'number')
                    return idx;
                idx = 0;
                while (idx < this.shownVertices.length && this.shownVertices[idx] < modelIndex)
                    ++idx;
                return idx;
            };
            TableView.prototype.insertVertexChild = function (parentNode, vertexNumber, childNode) {
                var idx = this.getInsertionIndex(vertexNumber);
                parentNode.insertBefore(childNode, parentNode.childNodes[idx + 1]);
            };
            TableView.prototype.getVertexChild = function (parentNode, vertexNumber) {
                var idx;
                if (typeof (idx = this.vertexIndices[vertexNumber]) == 'number')
                    return parentNode[idx + 1];
            };
            TableView.prototype.createMinCell = function (vertex, isIngoing) {
                var td = document.createElement('td');
                td.referencedVertex = vertex;
                td.referencedVertexIsIngoing = isIngoing;
                return td;
            };
            TableView.prototype.createEditableCell = function (startVertex, endVertex) {
                var td = document.createElement('td');
                td.contentEditable = this.getContenteditable(startVertex, endVertex);
                td.className = 'weight-data';
                td.referencedEdge = [startVertex, endVertex];
                var view = this;
                var inputHandler = function (e) {
                    if (view.inputHandler && td.referencedEdge.length == 2)
                        view.inputHandler(e, td.referencedEdge[0], td.referencedEdge[1], td.innerText);
                };
                var clickHandler = function (e) {
                    if (view.mouseHandler && td.referencedEdge.length == 2)
                        view.mouseHandler('click', e, td.referencedEdge[1], td.referencedEdge[0]);
                };
                td.addEventListener('input', inputHandler, false);
                td.addEventListener('blur', inputHandler, false);
                td.addEventListener('click', clickHandler, false);
                return td;
            };
            return TableView;
        }(BaseView));
        Views.TableView = TableView;
        var ControlsView = /** @class */ (function (_super) {
            __extends(ControlsView, _super);
            function ControlsView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            ControlsView.prototype.init = function (g, parentNode) {
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
                this.reductionStepButtons[0].addEventListener('click', function (e) { Controller.controller.onChangeReductionStep(e, true); }, false);
                this.reductionStepButtons[1].addEventListener('click', function (e) { Controller.controller.onChangeReductionStep(e, false); }, false);
                this.reductionNavigationGroup.appendChild(this.reductionStepButtons[0]);
                this.reductionNavigationGroup.appendChild(this.reductionStepButtons[1]);
                this.reductionDirectionRadiobuttons = [];
                for (var i = 0; i < 2; ++i) {
                    var rb = document.createElement('input');
                    var label = document.createElement('label');
                    rb.type = 'radio';
                    rb.name = 'reduction-direction';
                    if (i == 0) {
                        label.innerText = 'Reduce outgoing';
                        rb.addEventListener('change', function (e) {
                            if (this.checked)
                                Controller.controller.onChangeReductionDirection(e, false);
                        }, false);
                    }
                    else {
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
            };
            ControlsView.prototype.render = function () {
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
                }
                else {
                    this.reductionNavigationGroup.style.display = 'none';
                }
                this._dirty = false;
            };
            return ControlsView;
        }(BaseView));
        Views.ControlsView = ControlsView;
        var InfoView = /** @class */ (function (_super) {
            __extends(InfoView, _super);
            function InfoView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            InfoView.prototype.init = function (g, parentNode) {
                this.element = document.createElement('div');
                parentNode.appendChild(this.element);
                this.render();
            };
            InfoView.prototype.render = function () {
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
                                this.element.innerText += '\nSelect the next unused tour set tree node with the lowest bound';
                                break;
                            case Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION:
                                this.element.innerText += '\nSelect the zero arc with the highest change of bound in case of deletion';
                                this.element.innerText += '\nUpper indices denote this change';
                                break;
                            case Model.Types.SolutionSearchState.BRANCH_LEFT:
                                this.element.innerText += '\nTour subset without the arc';
                                break;
                            case Model.Types.SolutionSearchState.BRANCH_RIGHT:
                                this.element.innerText += '\nTour subset with the arc';
                                break;
                            case Model.Types.SolutionSearchState.ONE_SOLUTION_FOUND:
                                this.element.innerText += '\nThis is one of the solutions';
                                break;
                            case Model.Types.SolutionSearchState.ALL_SOLUTIONS_FOUND:
                                this.element.innerText += '\nNo more solutions';
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
            };
            return InfoView;
        }(BaseView));
        Views.InfoView = InfoView;
        var BoundBarView = /** @class */ (function (_super) {
            __extends(BoundBarView, _super);
            function BoundBarView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            BoundBarView.prototype.init = function (g, parentNode) {
                this.element = document.createElement('div');
                this.partFree = document.createElement('div');
                this.partDelta = document.createElement('div');
                this.partOccupied = document.createElement('div');
                this.overlayContainer = document.createElement('div');
                this.overlayMaxBound = document.createElement('div');
                this.partFree.style.backgroundColor = Views.colors[ColorIndex.BOUND_BAR_FREE];
                this.partDelta.style.backgroundColor = Views.colors[ColorIndex.BOUND_BAR_DELTA];
                this.partDelta.style.color = Views.colors[ColorIndex.BOUND_BAR_DELTA_FG];
                this.partOccupied.style.backgroundColor = Views.colors[ColorIndex.BOUND_BAR_OCCUPIED];
                this.partOccupied.style.color = Views.colors[ColorIndex.BOUND_BAR_OCCUPIED_FG];
                this.overlayMaxBound.style.backgroundColor = Views.colors[ColorIndex.BOUND_BAR_MAX_BOUND_OVERLAY];
                this.element.appendChild(this.partFree);
                this.element.appendChild(this.partDelta);
                this.element.appendChild(this.partOccupied);
                this.element.appendChild(this.overlayContainer);
                this.overlayContainer.appendChild(this.overlayMaxBound);
                this.element.className = 'tspbbvis-boundbarview';
                this.overlayContainer.className = 'tspbbvis-boundbarview-overlay';
                parentNode.appendChild(this.element);
                this.render();
            };
            BoundBarView.prototype.render = function () {
                var pmodel = PresentationModel.graph;
                if (pmodel.isEditable) {
                    this.partOccupied.innerHTML = '';
                    this.partDelta.innerHTML = '';
                    this.setPartValues(0, 0, Infinity);
                    return;
                }
                this.partOccupied.innerText = numberToString(pmodel.bound);
                this.partDelta.innerText = numberToString(pmodel.boundDelta);
                var maxBound = Infinity;
                if (Model.Types.solutionTree) {
                    maxBound = Model.Types.solutionTree.maxBound;
                }
                this.setPartValues(pmodel.bound / pmodel.boundMax, pmodel.boundDelta / pmodel.boundMax, maxBound / pmodel.boundMax);
                this._dirty = false;
            };
            BoundBarView.prototype.setPartValues = function (occupied, delta, maxBound) {
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
            };
            return BoundBarView;
        }(BaseView));
        Views.BoundBarView = BoundBarView;
        var TreeView = /** @class */ (function (_super) {
            __extends(TreeView, _super);
            function TreeView() {
                return _super !== null && _super.apply(this, arguments) || this;
            }
            TreeView.prototype.render = function () {
                var _a, _b;
                var pmodel = PresentationModel.solutionTree;
                var width = pmodel.maxWidth * TreeView.NODE_WIDTH;
                var height = pmodel.maxDepth * TreeView.LEVEL_HEIGHT;
                if (this.drawing.width < width || this.drawing.height < height)
                    this.drawing.resize(Math.max(width, this.drawing.width), Math.max(height, this.drawing.height));
                this.drawing.clear();
                for (var _i = 0, _c = pmodel.edges; _i < _c.length; _i++) {
                    var edge = _c[_i];
                    var _d = this.getNodeCenter(edge.parent), sx = _d[0], sy = _d[1];
                    var _e = this.getNodeCenter(edge.child), ex = _e[0], ey = _e[1];
                    var tx = .2 * sx + .8 * ex;
                    var ty = .2 * sy + .8 * ey - 20;
                    var color = Views.colors[(_a = {},
                        _a[PresentationModel.SolutionTreeEdgeStyle.UNFOCUSED] = ColorIndex.SOLUTION_TREE_UNFOCUSED,
                        _a[PresentationModel.SolutionTreeEdgeStyle.FOCUSED] = ColorIndex.SOLUTION_TREE_FOCUSED,
                        _a)[edge.style]];
                    this.drawingExtended.drawArrow(sx, sy + 30, ex, ey - 30, color);
                    this.drawing.drawText(tx, ty, 0, 1, color, edge.isTaken ? '\u2208' : '\u2209');
                }
                for (var _f = 0, _g = pmodel.nodes; _f < _g.length; _f++) {
                    var node = _g[_f];
                    var fg = Views.colors[(_b = {},
                        _b[PresentationModel.SolutionTreeNodeStyle.UNFOCUSED] = ColorIndex.SOLUTION_TREE_UNFOCUSED,
                        _b[PresentationModel.SolutionTreeNodeStyle.FOCUSED] = ColorIndex.SOLUTION_TREE_FOCUSED,
                        _b[PresentationModel.SolutionTreeNodeStyle.SELECTABLE] = ColorIndex.SOLUTION_TREE_SELECTABLE,
                        _b)[node.style]];
                    var bg = Views.colors[node.isSolution
                        ? ColorIndex.SOLUTION_TREE_SOLUTION_BG
                        : ColorIndex.SOLUTION_TREE_NONSOLUTION_BG];
                    var _h = this.getNodeCenter(node), x = _h[0], y = _h[1];
                    this.drawing.drawCircle(x, y, 30, bg, fg, 'b = ' + numberToString(node.bound));
                    if (node.separatingArc)
                        this.drawingExtended.drawDiamond(x, y + 30, 30, 15, bg, fg, Model.Types.originalGraph.vertices[node.separatingArc[0]].name + '; ' + Model.Types.originalGraph.vertices[node.separatingArc[1]].name);
                }
                this._dirty = false;
            };
            TreeView.prototype.getNodeCenter = function (node) {
                var x = node.xOffset * TreeView.NODE_WIDTH;
                var y = node.level * TreeView.LEVEL_HEIGHT;
                return [x + 40, y + 40];
            };
            TreeView.unproject = function (x, y) {
                return [(x - 40) / TreeView.NODE_WIDTH, (y - 40) / TreeView.LEVEL_HEIGHT];
            };
            TreeView.LEVEL_HEIGHT = 80;
            TreeView.NODE_WIDTH = 80;
            return TreeView;
        }(GraphicalView));
        Views.TreeView = TreeView;
    })(Views = Presentation.Views || (Presentation.Views = {}));
    var Controller;
    (function (Controller) {
        var currentController;
        Controller.controller = {
            onGraphViewClick: function (e, x, y) {
                if (currentController)
                    currentController.onGraphViewClick(e, x, y);
            },
            onWeightInput: function (e, startVertex, endVertex, value) {
                if (currentController)
                    currentController.onWeightInput(e, startVertex, endVertex, value);
            },
            onWeightClick: function (e, startVertex, endVertex) {
                if (currentController)
                    currentController.onWeightClick(e, startVertex, endVertex);
            },
            onContinueClick: function (e) {
                if (currentController)
                    currentController.onContinueClick(e);
            },
            onChangeReductionDirection: function (e, isIngoing) {
                if (currentController)
                    currentController.onChangeReductionDirection(e, isIngoing);
            },
            onChangeReductionStep: function (e, backward) {
                if (currentController)
                    currentController.onChangeReductionStep(e, backward);
            },
            onTreeViewClick: function (e, x, y) {
                if (currentController)
                    currentController.onTreeViewClick(e, x, y);
            }
        };
        var GraphInputController = /** @class */ (function () {
            function GraphInputController() {
            }
            GraphInputController.prototype.onGraphViewClick = function (e, x, y) {
                Model.Types.originalGraph.addVertex(x, y);
                PresentationModel.graph.update();
            };
            GraphInputController.prototype.onWeightInput = function (e, startVertex, endVertex, value) {
                var numericValue = parseFloat(value);
                if (!isFinite(numericValue) || startVertex == endVertex)
                    Model.Types.originalGraph.setArc(startVertex, endVertex, Infinity);
                else
                    Model.Types.originalGraph.setArc(startVertex, endVertex, numericValue);
                PresentationModel.graph.update();
            };
            GraphInputController.prototype.onWeightClick = function (e, startVertex, endVertex) {
            };
            GraphInputController.prototype.onContinueClick = function (e) {
                if (Model.Types.currentGraph.vertexCount <= 2) {
                    alert('Not enough vertices');
                    return;
                }
                Model.Types.visualisationState = Model.Types.VisualisationState.INITIAL_REDUCTION;
                Model.Types.solutionTree = new Model.Types.TourSetTree();
                var root = Model.Types.solutionTree.getRoot();
                root.focus();
                currentController = new InitialReductionController();
                PresentationModel.focusedVertex = 0;
                while (!Model.Types.currentGraph.vertices[PresentationModel.focusedVertex])
                    ++PresentationModel.focusedVertex;
                PresentationModel.graph.update();
            };
            GraphInputController.prototype.onChangeReductionDirection = function (e, isIngoing) {
            };
            GraphInputController.prototype.onChangeReductionStep = function (e, backward) {
            };
            GraphInputController.prototype.onTreeViewClick = function (e, x, y) {
            };
            return GraphInputController;
        }());
        var InitialReductionController = /** @class */ (function () {
            function InitialReductionController() {
            }
            InitialReductionController.prototype.onContinueClick = function (e) {
                PresentationModel.focusedVertex = -1;
                currentController = new SolutionSearchController();
                Model.Types.visualisationState = Model.Types.VisualisationState.SOLUTION_SEARCH;
                PresentationModel.graph.update();
                PresentationModel.solutionTree.update();
            };
            InitialReductionController.prototype.onGraphViewClick = function (e, x, y) {
            };
            InitialReductionController.prototype.onWeightInput = function (e, startVertex, endVertex, value) {
            };
            InitialReductionController.prototype.onWeightClick = function (e, startVertex, endVertex) {
                PresentationModel.focusedVertex = PresentationModel.reductionIsIngoing ? endVertex : startVertex;
                PresentationModel.reductionStep = PresentationModel.ReductionStep.INITIAL;
                PresentationModel.graph.update();
            };
            InitialReductionController.prototype.onChangeReductionDirection = function (e, isIngoing) {
                PresentationModel.reductionIsIngoing = isIngoing;
                PresentationModel.graph.update();
            };
            InitialReductionController.prototype.onChangeReductionStep = function (e, backward) {
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
                }
                else if (PresentationModel.reductionStep < PresentationModel.ReductionStep.INITIAL) {
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
            };
            InitialReductionController.prototype.onTreeViewClick = function (e, x, y) {
            };
            return InitialReductionController;
        }());
        var SolutionSearchController = /** @class */ (function () {
            function SolutionSearchController() {
            }
            SolutionSearchController.prototype.onChangeReductionDirection = function (e, isIngoing) {
            };
            SolutionSearchController.prototype.onChangeReductionStep = function (e, backward) {
            };
            SolutionSearchController.prototype.onContinueClick = function (e) {
                switch (Model.Types.solutionSearchState) {
                    case Model.Types.SolutionSearchState.NEXT_NODE_SELECTION:
                        if (!Model.Types.solutionTree.lowestBoundUnvisitedCount()) {
                            Model.Types.solutionSearchState = Model.Types.SolutionSearchState.ALL_SOLUTIONS_FOUND;
                            break;
                        }
                        Model.Types.solutionTree.popUnvisited().focus();
                        Model.Types.solutionSearchState = Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION;
                        break;
                    case Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION:
                        Model.Types.solutionTreeNode.separatingArc = Model.Types.currentGraph.arcs[Model.Types.solutionTreeNode.state.weightReduction.maxBoundChangeZeroArcs[0] // TODO give choice
                        ];
                        if (Model.Types.currentGraph.isSolution) {
                            Model.Types.solutionTree.maxBound = Model.Types.solutionTreeNode.state.getBound();
                            Model.Types.solutionSearchState = Model.Types.SolutionSearchState.ONE_SOLUTION_FOUND;
                            break;
                        }
                        if (!Model.Types.solutionTreeNode.separatingArc) {
                            Model.Types.solutionSearchState = Model.Types.SolutionSearchState.NEXT_NODE_SELECTION;
                            break;
                        }
                        Model.Types.solutionTreeNode.branch();
                        Model.Types.solutionTree.pushUnvisited(Model.Types.solutionTreeNode.leftChild);
                        Model.Types.solutionTree.pushUnvisited(Model.Types.solutionTreeNode.rightChild);
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
            };
            SolutionSearchController.prototype.onGraphViewClick = function (e, x, y) {
            };
            SolutionSearchController.prototype.onWeightInput = function (e, startVertex, endVertex, value) {
            };
            SolutionSearchController.prototype.onWeightClick = function (e, startVertex, endVertex) {
                if (Model.Types.solutionSearchState != Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION)
                    return;
                var arc = Model.Types.currentGraph.getArcFromEnds(startVertex, endVertex);
                var modelIndex = Model.Types.currentGraph.getArcIndex(arc);
                if (Model.Types.solutionTreeNode.state.weightReduction.maxBoundChangeZeroArcs.indexOf(modelIndex) < 0)
                    return;
                Model.Types.solutionTreeNode.separatingArc = arc;
                if (Model.Types.currentGraph.isSolution) {
                    // Should be unreachable
                    Model.Types.solutionTree.maxBound = Model.Types.solutionTreeNode.state.getBound();
                    Model.Types.solutionSearchState = Model.Types.SolutionSearchState.ONE_SOLUTION_FOUND;
                }
                else {
                    Model.Types.solutionTreeNode.branch();
                    Model.Types.solutionTree.pushUnvisited(Model.Types.solutionTreeNode.leftChild);
                    Model.Types.solutionTree.pushUnvisited(Model.Types.solutionTreeNode.rightChild);
                    Model.Types.currentGraph = Model.Types.solutionTreeNode.leftChild.state.graph;
                    Model.Types.solutionSearchState = Model.Types.SolutionSearchState.BRANCH_LEFT;
                }
                PresentationModel.graph.update();
                PresentationModel.solutionTree.update();
            };
            SolutionSearchController.prototype.onTreeViewClick = function (e, x, y) {
                if (Model.Types.solutionSearchState != Model.Types.SolutionSearchState.NEXT_NODE_SELECTION)
                    return;
                var pmodel = PresentationModel.solutionTree;
                if (y < -.5 || y > pmodel.maxDepth - .5)
                    return;
                var level = Math.max(0, Math.min(Math.round(y), pmodel.maxDepth - 1));
                var levelNodes = pmodel.nodesByLevel[level];
                for (var i = 0; i < levelNodes.length; ++i) {
                    // TODO binary search
                    var node = levelNodes[i];
                    var dx = x - node.xOffset;
                    if (Math.abs(dx) > 0.5)
                        continue;
                    var model = Model.Types.solutionTree;
                    var nodeIndex = model.unvisited.indexOf(node.model);
                    if (nodeIndex < 0 || nodeIndex >= model.lowestBoundUnvisitedCount())
                        continue;
                    Model.Types.solutionTree.popUnvisited(nodeIndex).focus();
                    Model.Types.solutionSearchState = Model.Types.SolutionSearchState.BRANCH_ARC_SELECTION;
                    PresentationModel.graph.update();
                    PresentationModel.solutionTree.update();
                    break;
                }
            };
            return SolutionSearchController;
        }());
        currentController = new GraphInputController();
        function graphViewMouseHandler(type, e, x, y) {
            if (type == 'click')
                Controller.controller.onGraphViewClick(e, x, y);
        }
        Controller.graphViewMouseHandler = graphViewMouseHandler;
        function treeViewMouseHandler(type, e, x, y) {
            var _a;
            if (type == 'click') {
                _a = Views.TreeView.unproject(x, y), x = _a[0], y = _a[1];
                Controller.controller.onTreeViewClick(e, x, y);
            }
        }
        Controller.treeViewMouseHandler = treeViewMouseHandler;
        function tableViewMouseHandler(type, e, x, y) {
            if (type == 'click') {
                currentController.onWeightClick(e, y, x);
            }
        }
        Controller.tableViewMouseHandler = tableViewMouseHandler;
    })(Controller = Presentation.Controller || (Presentation.Controller = {}));
})(Presentation || (Presentation = {}));
addEventListener('load', function () {
    var graphView = new Presentation.Views.GraphView();
    var tableView = new Presentation.Views.TableView();
    var controlsView = new Presentation.Views.ControlsView();
    var infoView = new Presentation.Views.InfoView();
    var boundBarView = new Presentation.Views.BoundBarView();
    var treeView = new Presentation.Views.TreeView();
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
    treeView.mouseHandler = Presentation.Controller.treeViewMouseHandler;
    tableView.mouseHandler = Presentation.Controller.tableViewMouseHandler;
}, false);
