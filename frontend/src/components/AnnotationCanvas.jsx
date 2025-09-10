import React, { useState, useRef, useEffect } from "react";
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Circle,
  Arrow,
  Line,
} from "react-konva";
import {
  Square,
  Circle as CircleIcon,
  ArrowRight,
  Pen,
  Move,
  Save,
  FileText,
} from "lucide-react";

const AnnotationCanvas = ({
  imageUrl,
  annotationJson,
  onSave,
  onGeneratePDF,
  saving,
  generating,
}) => {
  const [image, setImage] = useState(null);
  const [tool, setTool] = useState("select");
  const [annotations, setAnnotations] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentAnnotation, setCurrentAnnotation] = useState(null);
  const stageRef = useRef();

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

  // Load existing annotations when annotationJson changes
  useEffect(() => {
    if (annotationJson && Array.isArray(annotationJson.annotations)) {
      setAnnotations(annotationJson.annotations);
    } else {
      setAnnotations([]);
    }
  }, [annotationJson, imageUrl]);

  const handleMouseDown = (e) => {
    if (tool === "select") return;

    const pos = e.target.getStage().getPointerPosition();
    const id = Date.now().toString();

    let newAnnotation;
    switch (tool) {
      case "rectangle":
        newAnnotation = {
          id,
          type: "rectangle",
          x: pos.x,
          y: pos.y,
          width: 0,
          height: 0,
          stroke: "#3B82F6",
          strokeWidth: 2,
        };
        break;
      case "circle":
        newAnnotation = {
          id,
          type: "circle",
          x: pos.x,
          y: pos.y,
          radius: 0,
          stroke: "#10B981",
          strokeWidth: 2,
        };
        break;
      case "arrow":
        newAnnotation = {
          id,
          type: "arrow",
          points: [pos.x, pos.y, pos.x, pos.y],
          stroke: "#F59E0B",
          strokeWidth: 2,
          fill: "#F59E0B",
        };
        break;
      case "pen":
        newAnnotation = {
          id,
          type: "line",
          points: [pos.x, pos.y],
          stroke: "#EF4444",
          strokeWidth: 2,
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
      case "rectangle":
        updatedAnnotation.width = point.x - currentAnnotation.x;
        updatedAnnotation.height = point.y - currentAnnotation.y;
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(point.x - currentAnnotation.x, 2) +
            Math.pow(point.y - currentAnnotation.y, 2)
        );
        updatedAnnotation.radius = radius;
        break;
      case "arrow":
        updatedAnnotation.points = [
          currentAnnotation.x,
          currentAnnotation.y,
          point.x,
          point.y,
        ];
        break;
      case "pen":
        updatedAnnotation.points = updatedAnnotation.points.concat([
          point.x,
          point.y,
        ]);
        break;
    }

    setCurrentAnnotation(updatedAnnotation);
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return;

    setAnnotations((prev) => [...prev, currentAnnotation]);
    setCurrentAnnotation(null);
    setIsDrawing(false);
  };

  const handleSave = async () => {
  if (!stageRef.current) return;

  // Get the canvas as base64
  const dataURL = stageRef.current.toDataURL();

  // Only pass annotations; let parent handle base64 image
  await onSave({ annotations }, dataURL);
  };

  const renderAnnotation = (annotation) => {
    switch (annotation.type) {
      case "rectangle":
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
          />
        );
      case "line":
        return (
          <Line
            key={annotation.id}
            points={annotation.points}
            stroke={annotation.stroke}
            strokeWidth={annotation.strokeWidth}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      default:
        return null;
    }
  };

  const tools = [
    { id: "select", icon: Move, label: "Select", color: "text-gray-600" },
    {
      id: "rectangle",
      icon: Square,
      label: "Rectangle",
      color: "text-blue-600",
    },
    {
      id: "circle",
      icon: CircleIcon,
      label: "Circle",
      color: "text-green-600",
    },
    { id: "arrow", icon: ArrowRight, label: "Arrow", color: "text-yellow-600" },
    { id: "pen", icon: Pen, label: "Pen", color: "text-red-600" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          {tools.map((t) => {
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
                <Icon className={`h-4 w-4 mr-1 ${t.color}`} />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setAnnotations([]);
              setCurrentAnnotation(null);
              setIsDrawing(false);
            }}
            className="px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear All
          </button>

          <button
            onClick={handleSave}
            disabled={saving || annotations.length === 0}
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

      {/* Canvas */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {image ? (
          <Stage
            ref={stageRef}
            width={Math.min(image.width, 1200)}
            height={Math.min(image.height, 800)}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            className="border"
          >
            <Layer>
              <KonvaImage
                image={image}
                width={Math.min(image.width, 1200)}
                height={Math.min(image.height, 800)}
              />
              {annotations.map(renderAnnotation)}
              {currentAnnotation && renderAnnotation(currentAnnotation)}
            </Layer>
          </Stage>
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
