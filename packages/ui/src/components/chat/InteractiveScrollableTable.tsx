import React, { useRef, useEffect, useState } from "react";

interface InteractiveScrollableTableProps {
  children: React.ReactNode;
  maxWidth?: string;
}

export function InteractiveScrollableTable({
  children,
  maxWidth = "400px",
}: InteractiveScrollableTableProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [clientWidth, setClientWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScrollInfo = () => {
      setScrollLeft(container.scrollLeft);
      setScrollWidth(container.scrollWidth);
      setClientWidth(container.clientWidth);
    };

    // Initial measurement
    updateScrollInfo();

    // Listen for scroll events with passive option
    container.addEventListener("scroll", updateScrollInfo, { passive: true });

    // Listen for resize
    const resizeObserver = new ResizeObserver(updateScrollInfo);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", updateScrollInfo);
      resizeObserver.disconnect();
    };
  }, []);

  const handleScrollbarClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const container = containerRef.current;
    if (!container) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scrollbarWidth = rect.width;
    const maxScrollLeft = scrollWidth - clientWidth;
    const newScrollLeft = (clickX / scrollbarWidth) * maxScrollLeft;

    container.scrollLeft = newScrollLeft;
  };

  const handleThumbMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const startX = e.clientX;
    const startScrollLeft = scrollLeft;
    const maxScrollLeft = scrollWidth - clientWidth;
    const scrollbarWidth =
      e.currentTarget.parentElement?.getBoundingClientRect().width || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const deltaScrollLeft = (deltaX / scrollbarWidth) * maxScrollLeft;
      const newScrollLeft = Math.max(
        0,
        Math.min(maxScrollLeft, startScrollLeft + deltaScrollLeft),
      );

      const container = containerRef.current;
      if (container) {
        container.scrollLeft = newScrollLeft;
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Calculate scrollbar thumb position and width
  const canScroll =
    scrollWidth > clientWidth && scrollWidth > 0 && clientWidth > 0;
  const thumbWidth = canScroll
    ? Math.max((clientWidth / scrollWidth) * 100, 20)
    : 100;
  const thumbPosition = canScroll
    ? (scrollLeft / (scrollWidth - clientWidth)) * (100 - thumbWidth)
    : 0;

  return (
    <div style={{ position: "relative", maxWidth, overflow: "hidden" }}>
      <div
        ref={containerRef}
        style={{
          border: "1px solid #ddd",
          borderRadius: "4px",
          width: "100%",
          margin: "4px 0",
          backgroundColor: "#fafafa",
          paddingBottom: "8px",
          overflowX: "auto",
          overflowY: "hidden",
          position: "relative",
          // Hide native scrollbars
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        className="interactive-table-container"
      >
        <style>{`
          .interactive-table-container::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {children}
      </div>

      {/* Custom scrollbar */}
      {canScroll && (
        <div
          style={{
            position: "absolute",
            bottom: "2px",
            left: "2px",
            right: "2px",
            height: "6px",
            backgroundColor: "#ddd",
            borderRadius: "3px",
            cursor: "pointer",
            opacity: 0.8,
            border: "1px solid #999",
          }}
          onClick={handleScrollbarClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.7";
          }}
        >
          {/* Scrollbar thumb */}
          <div
            style={{
              position: "absolute",
              left: `${thumbPosition}%`,
              width: `${thumbWidth}%`,
              height: "100%",
              backgroundColor: isDragging ? "#555" : "#999",
              borderRadius: "3px",
              transition: isDragging ? "none" : "background-color 0.2s",
              cursor: "grab",
              border: "1px solid #777",
            }}
            onMouseDown={handleThumbMouseDown}
            onMouseEnter={(e) => {
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = "#777";
                e.currentTarget.style.cursor = "grab";
              }
            }}
            onMouseLeave={(e) => {
              if (!isDragging) {
                e.currentTarget.style.backgroundColor = "#999";
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
