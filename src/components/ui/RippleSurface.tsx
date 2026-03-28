"use client";

import React, { useCallback, useState } from "react";
import { motion } from "framer-motion";

type Ripple = { id: number; x: number; y: number };

type RippleSurfaceProps = {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
};

/**
 * Adds a subtle material-style ripple on pointer down. Children should fill the surface (e.g. link as flex).
 */
const RippleSurface: React.FC<RippleSurfaceProps> = ({
  children,
  className,
  disabled,
}) => {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLSpanElement>) => {
      if (disabled) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const id = typeof performance !== "undefined" ? performance.now() : Date.now();
      setRipples((prev) => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
      window.setTimeout(() => {
        setRipples((prev) => prev.filter((x) => x.id !== id));
      }, 700);
    },
    [disabled],
  );

  return (
    <span
      className={className}
      style={{ position: "relative", display: "inline-flex", overflow: "hidden", borderRadius: "inherit" }}
      onPointerDown={onPointerDown}
    >
      {ripples.map((rip) => (
        <motion.span
          key={rip.id}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 3.2, opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            left: rip.x,
            top: rip.y,
            zIndex: 0,
            width: 48,
            height: 48,
            marginLeft: -24,
            marginTop: -24,
            borderRadius: "50%",
            pointerEvents: "none",
            background: "radial-gradient(circle, rgba(255,255,255,0.55) 0%, transparent 65%)",
          }}
        />
      ))}
      {children}
    </span>
  );
};

export default RippleSurface;
