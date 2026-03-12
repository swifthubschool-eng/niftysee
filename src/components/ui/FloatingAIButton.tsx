"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Sparkles, MessageSquareCode } from "lucide-react";
import { AIChatModal } from "./AIChatModal";

export function FloatingAIButton() {
  const [position, setPosition] = useState({ x: -100, y: -100 }); // Hide initially until mounted
  const [isMounted, setIsMounted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0, isDragging: false });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Set initial position to bottom right of the screen
    const x = window.innerWidth - 80;
    const y = window.innerHeight - 80;
    setPosition({ x, y });
    setIsMounted(true);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only left click

    // Crucial: Call setPointerCapture *immediately* on mousedown
    // This locks subsequent pointer events to this element even if the mouse moves off it quickly.
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      isDragging: false // Don't set isDragging to true until we actually MOVE
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // If we haven't clicked down at all, ignore
    if (dragRef.current.startX === 0 && dragRef.current.startY === 0) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    // Add a small drag threshold (e.g., 5px) to prevent accidental micro-drags when just clicking
    if (!dragRef.current.isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      dragRef.current.isDragging = true;
      setIsDragging(true);
    }

    if (!dragRef.current.isDragging) return;

    let newX = dragRef.current.initialX + dx;
    let newY = dragRef.current.initialY + dy;

    // Boundary checks to stay within the viewport
    const maxX = window.innerWidth - 60; // Button width + padding
    const maxY = window.innerHeight - 60; // Button height + padding

    newX = Math.max(10, Math.min(newX, maxX));
    newY = Math.max(10, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // Release capture
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);

    const wasDragging = dragRef.current.isDragging;

    // Reset drag state
    dragRef.current = { startX: 0, startY: 0, initialX: 0, initialY: 0, isDragging: false };
    setIsDragging(false);

    // If we were NOT dragging (i.e., didn't cross the 5px threshold), treat it as a click
    if (!wasDragging) {
      setIsChatOpen((prev) => !prev);
    }
  };

  if (!isMounted) return null;

  return (
    <>
      <button
        title="Ask AI"
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate(${position.x}px, ${position.y}px)`,
          // Prevents default touch panning/scrolling while interacting
          touchAction: "none"
        }}
        className={`fixed top-0 left-0 z-[100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.5)] outline-none 
      {isDragging 
        ? "cursor-grabbing opacity-90 transition-none" 
        : "cursor-grab shadow-[inset_0_-2px_10px_rgba(0,0,0,0.2)] transition-opacity duration-200"
      }`}
      >
        {isChatOpen ? (
          <MessageSquareCode className="h-6 w-6" />
        ) : (
          <div className={`relative h-12 w-12 overflow-hidden rounded-full shadow-lg ${!isDragging && "animate-pulse"}`}>
            <Image src="/ai-bot.jpg" alt="AI Assistant" fill className="object-cover" />
          </div>
        )}
      </button>
      <AIChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
