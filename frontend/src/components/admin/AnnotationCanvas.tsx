import React, { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, Line, FabricImage, Triangle, Group } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  MousePointer, 
  Pencil, 
  Square, 
  Circle as CircleIcon, 
  ArrowRight,
  Trash2,
  Save,
  Palette
} from 'lucide-react';

interface AnnotationCanvasProps {
  imageUrl: string;
  onSave: (annotationData: any, annotatedImage: Blob) => void;
  existingAnnotations?: string;
}

export const AnnotationCanvas = ({ imageUrl, onSave, existingAnnotations }: AnnotationCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw' | 'rectangle' | 'circle' | 'arrow'>('select');
  const [activeColor, setActiveColor] = useState('#ff0000');
  const [isSaving, setIsSaving] = useState(false);

  const colors = [
    '#ff0000', '#00ff00', '#0000ff', '#ffff00', 
    '#ff00ff', '#00ffff', '#ffffff', '#000000'
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f8f9fa',
    });

    // Initialize drawing brush
    canvas.freeDrawingBrush.color = activeColor;
    canvas.freeDrawingBrush.width = 3;

    setFabricCanvas(canvas);
    
    // Load background image
    if (imageUrl) {
      FabricImage.fromURL(imageUrl).then((img) => {
        if (!img) return;
        
        // Scale image to fit canvas
        const scale = Math.min(800 / (img.width || 1), 600 / (img.height || 1));
        img.scale(scale);
        img.set({
          left: (800 - (img.width || 0) * scale) / 2,
          top: (600 - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
        });
        
        canvas.backgroundImage = img;
        canvas.renderAll();
      });
    }

    // Load existing annotations if any
    if (existingAnnotations) {
      try {
        canvas.loadFromJSON(existingAnnotations, canvas.renderAll.bind(canvas));
      } catch (error) {
        console.error('Failed to load existing annotations:', error);
      }
    }

    toast.success('Canvas ready for annotation!');

    return () => {
      canvas.dispose();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.isDrawingMode = activeTool === 'draw';
    
    if (activeTool === 'draw' && fabricCanvas.freeDrawingBrush) {
      fabricCanvas.freeDrawingBrush.color = activeColor;
      fabricCanvas.freeDrawingBrush.width = 3;
    }
  }, [activeTool, activeColor, fabricCanvas]);

  const handleToolClick = (tool: typeof activeTool) => {
    setActiveTool(tool);

    if (!fabricCanvas) return;

    if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        width: 100,
        height: 80,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        fill: 'transparent',
        stroke: activeColor,
        strokeWidth: 3,
        radius: 50,
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    } else if (tool === 'arrow') {
      const line = new Line([50, 50, 150, 50], {
        stroke: activeColor,
        strokeWidth: 3,
        selectable: true,
      });
      
      // Add arrowhead
      const arrowHead = new Triangle({
        left: 145,
        top: 45,
        width: 10,
        height: 10,
        fill: activeColor,
        angle: 90,
      });
      
      const group = new Group([line, arrowHead], {
        left: 100,
        top: 100,
      });
      
      fabricCanvas.add(group);
      fabricCanvas.setActiveObject(group);
    }
  };

  const handleClear = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    // Reload background image
    if (imageUrl) {
      FabricImage.fromURL(imageUrl).then((img) => {
        if (!img) return;
        const scale = Math.min(800 / (img.width || 1), 600 / (img.height || 1));
        img.scale(scale);
        img.set({
          left: (800 - (img.width || 0) * scale) / 2,
          top: (600 - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
        });
        fabricCanvas.backgroundImage = img;
        fabricCanvas.renderAll();
      });
    }
    toast.success('Canvas cleared!');
  };

  const handleSave = async () => {
    if (!fabricCanvas) return;

    setIsSaving(true);
    try {
      // Get annotation data
      const annotationData = fabricCanvas.toJSON();
      
      // Get annotated image as blob
      const dataURL = fabricCanvas.toDataURL({
        format: 'png',
        quality: 1.0,
        multiplier: 1,
      });
      
      // Convert data URL to blob
      const response = await fetch(dataURL);
      const blob = await response.blob();

      await onSave(annotationData, blob);
      toast.success('Annotations saved successfully!');
    } catch (error) {
      toast.error('Failed to save annotations');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          Annotation Tools
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tool Selection */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeTool === 'select' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolClick('select')}
            className="flex items-center gap-2"
          >
            <MousePointer className="h-4 w-4" />
            Select
          </Button>
          <Button
            variant={activeTool === 'draw' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolClick('draw')}
            className="flex items-center gap-2"
          >
            <Pencil className="h-4 w-4" />
            Draw
          </Button>
          <Button
            variant={activeTool === 'rectangle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolClick('rectangle')}
            className="flex items-center gap-2"
          >
            <Square className="h-4 w-4" />
            Rectangle
          </Button>
          <Button
            variant={activeTool === 'circle' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolClick('circle')}
            className="flex items-center gap-2"
          >
            <CircleIcon className="h-4 w-4" />
            Circle
          </Button>
          <Button
            variant={activeTool === 'arrow' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleToolClick('arrow')}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            Arrow
          </Button>
        </div>

        {/* Color Selection */}
        <div className="space-y-2">
          <Label>Annotation Color</Label>
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                className={`w-8 h-8 rounded-full border-2 ${
                  activeColor === color ? 'border-primary' : 'border-border'
                }`}
                style={{ backgroundColor: color }}
                onClick={() => setActiveColor(color)}
              />
            ))}
          </div>
        </div>

        {/* Canvas */}
        <div className="border border-border rounded-lg overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleClear}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Annotations'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};