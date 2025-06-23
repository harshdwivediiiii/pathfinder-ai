"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue } from "framer-motion";

export default function InteractiveBackground({ isDarkMode }) {
  const [hasMounted, setHasMounted] = useState(false);
  const [floatingCircles, setFloatingCircles] = useState([]);
  const [mouseCircle, setMouseCircle] = useState({
    x: 0,
    y: 0,
    size: 150,
    color: isDarkMode ? "#FFFFFF33" : "#00000033", // semi-transparent white or black
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const randomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  useEffect(() => {
    setHasMounted(true);

    const createMovement = () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      directionX: Math.random() > 0.5 ? 1 : -1,
      directionY: Math.random() > 0.5 ? 1 : -1,
      speedX: Math.random() * 0.5 + 0.3,
      speedY: Math.random() * 0.5 + 0.3,
      size: Math.random() * 100 + 50,
      color: randomColor(),
    });

    const circles = Array.from({ length: 50 }, createMovement);
    setFloatingCircles(circles);

    const interval = setInterval(() => {
      setFloatingCircles((prevCircles) =>
        prevCircles.map((circle) => {
          let newX = circle.x + circle.directionX * circle.speedX;
          let newY = circle.y + circle.directionY * circle.speedY;

          if (newX > window.innerWidth || newX < 0) circle.directionX *= -1;
          if (newY > window.innerHeight || newY < 0) circle.directionY *= -1;

          return {
            ...circle,
            x: newX,
            y: newY,
          };
        })
      );
    }, 16);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      setMouseCircle((prev) => ({
        ...prev,
        x: e.clientX,
        y: e.clientY,
      }));
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  if (!hasMounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-gray-100 dark:bg-black">
      {floatingCircles.map((circle, index) => (
        <motion.div
          key={index}
          className="absolute pointer-events-none rounded-full blur-lg"
          style={{
            width: circle.size,
            height: circle.size,
            backgroundColor: circle.color,
            top: circle.y,
            left: circle.x,
            transform: "translate(-50%, -50%)",
            opacity: 0.5,
          }}
        />
      ))}

      <motion.div
        className="absolute pointer-events-none rounded-full blur-3xl"
        style={{
          width: mouseCircle.size,
          height: mouseCircle.size,
          backgroundColor: mouseCircle.color,
          top: mouseCircle.y,
          left: mouseCircle.x,
          transform: "translate(-50%, -50%)",
          opacity: 0.7,
        }}
      />
    </div>
  );
}
