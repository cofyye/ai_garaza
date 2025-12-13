import { useState, useRef, useEffect } from "react";

export const useVideoStream = () => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startVideo = async () => {
    try {
      console.log("📹 Starting camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log("📹 Camera started successfully");
      }
    } catch (error) {
      console.error("📹 Camera error:", error);
      alert("Could not access camera. Please allow camera permissions.");
      setIsVideoOn(false);
    }
  };

  const stopVideo = () => {
    console.log("📹 Stopping camera...");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("📹 Track stopped:", track.kind);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    const newVideoState = !isVideoOn;
    setIsVideoOn(newVideoState);

    if (newVideoState) {
      startVideo();
    } else {
      stopVideo();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    isVideoOn,
    videoRef,
    toggleVideo,
  };
};
