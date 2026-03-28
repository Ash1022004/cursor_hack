"use client";

import { forwardRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import btnStyles from "@/styles/components/ui/MotionButton.module.css";

type MotionButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string;
};

const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ className, children, type = "button", ...rest }, ref) => {
    const reduce = useReducedMotion();
    const combined = [btnStyles.motionBtn, className].filter(Boolean).join(" ");

    if (reduce) {
      return (
        <button ref={ref} type={type} className={combined} {...rest}>
          {children}
        </button>
      );
    }

    return (
      <motion.button
        ref={ref}
        type={type}
        className={combined}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 420, damping: 22 }}
        {...rest}
      >
        {children}
      </motion.button>
    );
  }
);

MotionButton.displayName = "MotionButton";

export default MotionButton;
