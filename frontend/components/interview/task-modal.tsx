import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, GripHorizontal, Maximize2 } from "lucide-react";
import { Button } from "../common/ui-primitives";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskDescription: string;
}

export const TaskModal = ({
  isOpen,
  onClose,
  taskDescription,
}: TaskModalProps) => {
  const controls = useDragControls();
  const [size, setSize] = useState({ width: 384, height: 500 });
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const handleResizeStart = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  };

  const handleResizeMove = (e: PointerEvent) => {
    if (!isResizing) return;
    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    setSize({
      width: Math.max(
        320,
        Math.min(window.innerWidth * 0.9, startPos.current.width + deltaX)
      ),
      height: Math.max(
        200,
        Math.min(window.innerHeight * 0.9, startPos.current.height + deltaY)
      ),
    });
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      window.addEventListener("pointermove", handleResizeMove);
      window.addEventListener("pointerup", handleResizeEnd);
      return () => {
        window.removeEventListener("pointermove", handleResizeMove);
        window.removeEventListener("pointerup", handleResizeEnd);
      };
    }
  }, [isResizing]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          drag
          dragControls={controls}
          dragMomentum={false}
          // Prevent dragging off-screen too much
          dragConstraints={{ left: -500, right: 500, top: -100, bottom: 500 }}
          style={{ width: size.width, height: size.height }}
          className="fixed top-24 right-24 z-50 bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header - Drag Handle */}
          <div
            onPointerDown={(e) => controls.start(e)}
            className="h-12 bg-gray-50 border-b border-gray-100 flex items-center justify-between px-4 cursor-move select-none shrink-0"
          >
            <div className="flex items-center gap-2 text-gray-700 font-medium">
              <GripHorizontal className="h-4 w-4 text-gray-400" />
              <span>Current Task</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-gray-200"
              // Stop propagation to prevent drag start when clicking close
              onPointerDown={(e) => e.stopPropagation()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 overflow-y-auto text-sm text-gray-600 leading-relaxed bg-white">
            <div className="prose prose-sm max-w-none">
              <p className="whitespace-pre-wrap">{taskDescription}</p>
            </div>
          </div>

          {/* Resize Handle */}
          <div
            onPointerDown={handleResizeStart}
            className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize group"
          >
            <div className="absolute bottom-1 right-1">
              <Maximize2 className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
