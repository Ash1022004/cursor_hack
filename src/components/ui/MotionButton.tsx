"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import btnStyles from "@/styles/components/ui/MotionButton.module.css";

type MotionButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children?: React.ReactNode;
};

const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, children, type = "button", whileHover, whileTap, transition, ...rest }, ref) => {
    const reduce = useReducedMotion();
    const combined = [btnStyles.motionBtn, className].filter(Boolean).join(" ");

    return (
      <motion.button
        ref={ref}
        type={type}
        className={combined}
        whileHover={reduce ? undefined : (whileHover ?? { scale: 1.05 })}
        whileTap={reduce ? undefined : (whileTap ?? { scale: 0.95 })}
        transition={
          reduce
            ? undefined
            : (transition ?? { type: "spring", stiffness: 420, damping: 22 })
        }
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = "MotionButton";

export default MotionButton;
