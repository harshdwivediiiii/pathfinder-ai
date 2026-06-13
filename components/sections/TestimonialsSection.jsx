"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "@/components/motion";
import { testimonial } from "@/data/testimonial";

export function TestimonialsSection() {
  return (
<section
  id="stats"
  className="relative py-20 sm:py-24 md:py-32 lg:py-40 overflow-hidden"
>
      <div className="container mx-auto px-4 md:px-6">
        <FadeUp className="max-w-3xl mx-auto text-center mb-20 space-y-4">
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground">
            Trusted by{" "}
            <span className="text-gradient-primary">Professionals</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Hear from career changers, engineers, and leaders who transformed their professional journey.
          </p>
        </FadeUp>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonial.map((t, i) => (
            <StaggerItem key={t.author}>
              <motion.div
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="group relative h-full"
              >
                <div className="relative h-full p-5 sm:p-6 md:p-8 rounded-2xl glass border border-border/40 hover:border-primary/30 transition-all duration-500 flex flex-col">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-sm text-muted-foreground leading-relaxed flex-grow italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-6 mt-4 border-t border-border/30">
                    <Image
                      src={t.image}
                      alt={t.author}
                      width={40}
                      height={40}
                      className="rounded-full ring-2 ring-primary/20 object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-foreground">{t.author}</p>
                      <p className="text-[11px] text-muted-foreground font-medium">
                        {t.role} @ {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
