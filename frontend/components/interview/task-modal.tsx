import React from "react";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { X, GripHorizontal } from "lucide-react";
import { Button } from "../common/ui-primitives";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskDescription: string;
}

export const TaskModal = ({ isOpen, onClose, taskDescription }: TaskModalProps) => {
  const controls = useDragControls();

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
          className="fixed top-24 right-24 z-50 w-96 h-[500px] min-w-[320px] min-h-[200px] bg-white rounded-xl border border-gray-200 shadow-2xl flex flex-col resize overflow-hidden"
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};
