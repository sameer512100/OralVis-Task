import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Circle,
  Arrow,
} from "react-konva";
import {
  Square,
  Circle as CircleIcon,
  ArrowRight,
  Move,
  Save,
  FileText,
} from "lucide-react";

// Tool definitions: shape + color
const TOOL_DEFS = [
  {
    id: "inflamed_gums",
    icon: Square,
    label: "Inflamed/Red gums",
    swatch: "#4B2245", // dark purple
    shape: "rect",
  },
  {
    id: "malaligned",
    icon: CircleIcon,
    label: "Malaligned",
    swatch: "#FFF700", // yellow
    shape: "circle",
  },
  {
    id: "receded_gums",
    icon: Square,
    label: "Receded gums",
    swatch: "#A78A8A", // brownish
    shape: "rect",
  },
  {
    id: "stains",
    icon: ArrowRight,
    label: "Stains",
    swatch: "#FF0000", // red
    shape: "arrow",
  },
  {
    id: "attrition",
    icon: ArrowRight,
    label: "Attrition",
    swatch: "#00E6FF", // cyan
    shape: "arrow",
  },
  {
    id: "crowns",
    icon: CircleIcon,
    label: "Crowns",
    swatch: "#C8007A", // magenta
    shape: "circle",
  },
  {
    id: "select",
    icon: Move,
    label: "Select",
    swatch: "#6B7280",
    shape: null,
  },
];

// Annotation style map
const TOOL_ANNOTATION_MAP = {
  inflamed_gums: {
    stroke: "#4B2245",
    strokeWidth: 3,
  },
  malaligned: {
    stroke: "#FFF700",
    strokeWidth: 3,
  },
  receded_gums: {
    stroke: "#A78A8A",
    strokeWidth: 3,
  },
  stains: {
    stroke: "#FF0000",
    strokeWidth: 3,
    fill: "#FF0000",
  },
  attrition: {
    stroke: "#00E6FF",
    strokeWidth: 3,
    fill: "#00E6FF",
  },
  crowns: {
    stroke: "#C8007A",
    strokeWidth: 3,
  },
};

const AnnotationCanvas = (
  { imageUrl, annotationJson, onSave, onGeneratePDF, saving, generating, submissionId },
  ref
) => {
  const [image, setImage] = useState(null);
  const [tool, setTool] = useState("select");
  const [annotations, setAnnotations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState(null);
  const [draftSavedAt, setDraftSavedAt] = useState("");
  const stageRef = useRef();
  const draftKey = submissionId ? `annotation-draft:${submissionId}` : null;

  // Load image
  useEffect(() => {
    if (imageUrl) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
      };
      img.src = imageUrl;
    }
  }, [imageUrl]);

  // Load existing annotations
  useEffect(() => {
    let storedDraft = null;
    if (draftKey) {
      try {
        storedDraft = JSON.parse(localStorage.getItem(draftKey) || "null");
      } catch {
        storedDraft = null;
      }
    }

    const initialAnnotations = Array.isArray(storedDraft?.annotations)
      ? storedDraft.annotations
      : Array.isArray(annotationJson?.annotations)
      ? annotationJson.annotations
      : [];

    setAnnotations(initialAnnotations);
    setHasChanges(false);
    setSelectedAnnotationId(null);
    setZoom(1);
    setHistory([initialAnnotations]);
    setHistoryIndex(0);
    setDraftSavedAt(storedDraft?.savedAt || "");
  }, [annotationJson, draftKey, imageUrl]);

  useEffect(() => {
    if (!draftKey || !hasChanges) return undefined;

    const intervalId = window.setInterval(() => {
      const payload = {
        annotations,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
      setDraftSavedAt(payload.savedAt);
    }, 25000);

    return () => window.clearInterval(intervalId);
  }, [annotations, draftKey, hasChanges]);

  useEffect(() => {
    if (!draftKey || !hasChanges) return;

    const payload = {
      annotations,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(draftKey, JSON.stringify(payload));
    setDraftSavedAt(payload.savedAt);
  }, [annotations, draftKey, hasChanges]);

  const pushHistory = (nextAnnotations) => {
    setHistoryIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      setHistory((prev) => {
        const truncated = prev.slice(0, nextIndex);
        return [...truncated, nextAnnotations];
      });
      return nextIndex;
    });
  };

  const updateAnnotationAt = (annotationId, updater) => {
    setAnnotations((prev) => {
      const next = prev.map((annotation) =>
        annotation.id === annotationId ? updater(annotation) : annotation
      );
      pushHistory(next);
      return next;
    });
    setHasChanges(true);
  };

  const moveAnnotation = (annotation, deltaX, deltaY) => {
    switch (annotation.type) {
      case "rect":
        return {
          ...annotation,
          x: annotation.x + deltaX,
          y: annotation.y + deltaY,
        };
      case "circle":
        return {
          ...annotation,
          x: annotation.x + deltaX,
          y: annotation.y + deltaY,
        };
      case "arrow":
        return {
          ...annotation,
          points: annotation.points.map((point, index) =>
            index % 2 === 0 ? point + deltaX : point + deltaY
          ),
        };
      default:
        return annotation;
    }
  };

  // Mouse events
  const handleMouseDown = (e) => {
    if (tool === "select") return;

    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString();

    let newAnnotation;
    switch (tool) {
      case "inflamed_gums":
        newAnnotation = {
          id,
          type: "rect",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          ...TOOL_ANNOTATION_MAP.inflamed_gums,
        };
        break;
      case "malaligned":
        newAnnotation = {
          id,
          type: "circle",
          x: pos.x,
          y: pos.y,
          radius: 0,
          ...TOOL_ANNOTATION_MAP.malaligned,
        };
        break;
      case "receded_gums":
        newAnnotation = {
          id,
          type: "rect",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          ...TOOL_ANNOTATION_MAP.receded_gums,
        };
        break;
      case "stains":
        newAnnotation = {
          id,
          type: "arrow",
          points: [pos.x, pos.y, pos.x, pos.y],
          ...TOOL_ANNOTATION_MAP.stains,
        };
        break;
      case "attrition":
        newAnnotation = {
          id,
          type: "arrow",
          points: [pos.x, pos.y, pos.x, pos.y],
          ...TOOL_ANNOTATION_MAP.attrition,
        };
        break;
      case "crowns":
        newAnnotation = {
          id,
          type: "circle",
          x: pos.x,
          y: pos.y,
          radius: 0,
          ...TOOL_ANNOTATION_MAP.crowns,
        };
        break;
      default:
        return;
    }

    setCurrentAnnotation(newAnnotation);
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !currentAnnotation) return;

    const stage = e.target.getStage();
    const point = stage.getPointerPosition();

    let updatedAnnotation = { ...currentAnnotation };

    switch (tool) {
      case "inflamed_gums":
      case "receded_gums":
        updatedAnnotation.width = point.x - currentAnnotation.x;
        updatedAnnotation.height = point.y - currentAnnotation.y;
        break;
      case "malaligned":
      case "crowns":
        updatedAnnotation.radius = Math.sqrt(
          Math.pow(point.x - currentAnnotation.x, 2) +
            Math.pow(point.y - currentAnnotation.y, 2)
        );
        break;
      case "stains":
      case "attrition":
        updatedAnnotation.points = [
          currentAnnotation.points[0],
          currentAnnotation.points[1],
          point.x,
          point.y,
        ];
        break;
    }

    setCurrentAnnotation(updatedAnnotation);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setAnnotations((prev) => {
      const next = [...prev, currentAnnotation];
      pushHistory(next);
      return next;
    });
    setCurrentAnnotation(null);
    setIsDrawing(false);
    setHasChanges(true);
  };

  // Clear all annotations
  const handleClear = () => {
    setAnnotations([]);
    pushHistory([]);
    setCurrentAnnotation(null);
    setSelectedAnnotationId(null);
    setIsDrawing(false);
    setHasChanges(true);
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const nextIndex = historyIndex - 1;
    const prevAnnotations = history[nextIndex] || [];
    setHistoryIndex(nextIndex);
    setAnnotations(prevAnnotations);
    setHasChanges(true);
  };

  const handleRedo = () => {
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    const nextAnnotations = history[nextIndex] || [];
    setHistoryIndex(nextIndex);
    setAnnotations(nextAnnotations);
    setHasChanges(true);
  };

  const handleDeleteSelected = () => {
    if (!selectedAnnotationId) return;
    const nextAnnotations = annotations.filter(
      (annotation) => annotation.id !== selectedAnnotationId
    );
    setAnnotations(nextAnnotations);
    pushHistory(nextAnnotations);
    setSelectedAnnotationId(null);
    setHasChanges(true);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if (tool !== "select") return;
      if ((event.key === "Delete" || event.key === "Backspace") && selectedAnnotationId) {
        event.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [tool, selectedAnnotationId, annotations]);

  // Save only if there are changes
  const handleSave = async () => {
    if (!stageRef.current || !hasChanges) return;
    const dataURL = stageRef.current.toDataURL();
    await onSave({ annotations }, dataURL);
    if (draftKey) {
      localStorage.removeItem(draftKey);
      setDraftSavedAt("");
    }
    setHasChanges(false);
  };

  const renderAnnotation = (annotation) => {
    const isSelected = annotation.id === selectedAnnotationId;

    switch (annotation.type) {
      case "rect":
        return (
          <Rect
            key={annotation.id}
            x={annotation.x}
            y={annotation.y}
            width={annotation.width}
            height={annotation.height}
            stroke={annotation.stroke}
            strokeWidth={annotation.strokeWidth}
            fill="transparent"
            draggable={tool === "select"}
            onClick={() => {
              if (tool === "select") setSelectedAnnotationId(annotation.id);
            }}
            onTap={() => {
              if (tool === "select") setSelectedAnnotationId(annotation.id);
            }}
            onDragEnd={(event) => {
              if (tool !== "select") return;
              const node = event.target;
              const deltaX = node.x() - annotation.x;
              const deltaY = node.y() - annotation.y;
              const nextAnnotation = moveAnnotation(annotation, deltaX, deltaY);
              updateAnnotationAt(annotation.id, () => nextAnnotation);
            }}
            strokeDash={isSelected ? [8, 4] : undefined}
          />
        );
      case "circle":
        return (
          <Circle
            key={annotation.id}
            x={annotation.x}
            y={annotation.y}
            radius={annotation.radius}
            stroke={annotation.stroke}
            strokeWidth={annotation.strokeWidth}
            fill="transparent"
            draggable={tool === "select"}
            onClick={() => {
              if (tool === "select") setSelectedAnnotationId(annotation.id);
            }}
            onTap={() => {
              if (tool === "select") setSelectedAnnotationId(annotation.id);
            }}
            onDragEnd={(event) => {
              if (tool !== "select") return;
              const node = event.target;
              const deltaX = node.x() - annotation.x;
              const deltaY = node.y() - annotation.y;
              const nextAnnotation = moveAnnotation(annotation, deltaX, deltaY);
              updateAnnotationAt(annotation.id, () => nextAnnotation);
            }}
            dash={isSelected ? [8, 4] : undefined}
          />
        );
      case "arrow":
        return (
          <Arrow
            key={annotation.id}
            points={annotation.points}
            stroke={annotation.stroke}
            strokeWidth={annotation.strokeWidth}
            fill={annotation.fill}
            pointerLength={10}
            pointerWidth={10}
            draggable={false}
            onClick={() => {
              if (tool === "select") setSelectedAnnotationId(annotation.id);
            }}
            onTap={() => {
              if (tool === "select") setSelectedAnnotationId(annotation.id);
            }}
            dash={isSelected ? [8, 4] : undefined}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {tool === "select" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Select mode is active. Click an annotation to select it, drag to move it, or press Delete/Backspace to remove it.
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          {TOOL_DEFS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTool(t.id)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  tool === t.id
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title={t.label}
              >
                <Icon className="h-4 w-4 mr-1" style={{ color: t.swatch }} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Undo
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Redo
          </button>

          <button
            onClick={handleClear}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedAnnotationId}
            className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Delete Selected
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Annotation
          </button>

          <button
            onClick={onGeneratePDF}
            disabled={generating || annotations.length === 0}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Generate PDF
          </button>
        </div>
      </div>

      {draftSavedAt && hasChanges && (
        <p className="px-1 text-xs text-gray-500">
          Draft auto-saved locally at {new Date(draftSavedAt).toLocaleString()}
        </p>
      )}

      {/* Canvas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {image ? (
          <div className="p-3">
            <div className="overflow-auto border rounded">
              <Stage
                ref={stageRef}
                width={Math.min(image.width * zoom, 1600)}
                height={Math.min(image.height * zoom, 1000)}
                scaleX={zoom}
                scaleY={zoom}
                onMouseDown={handleMouseDown}
                onMousemove={handleMouseMove}
                onMouseup={handleMouseUp}
                className="bg-white"
              >
                <Layer>
                  <KonvaImage image={image} />
                  {annotations.map(renderAnnotation)}
                  {currentAnnotation && renderAnnotation(currentAnnotation)}
                </Layer>
              </Stage>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm text-gray-600">Zoom</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
              <span className="text-sm text-gray-600 w-12 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnotationCanvas;
