    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
      <div className="flex items-center justify-center relative w-full aspect-square max-w-sm mx-auto">
        {/* Ambient Background Glow */}
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative w-full h-full flex items-center justify-center glass rounded-full border border-border/50 shadow-2xl p-8">
          <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="currentGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ec4899" stopOpacity="0.2" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Animated Axis Lines & Concentric Rings */}
            {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
              <motion.circle
                key={idx}
                cx={100} cy={100} r={80 * scale}
                fill="none" stroke="oklch(var(--border) / 0.4)" strokeWidth="1" strokeDasharray="3 3"
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: "easeOut" }}
                viewport={{ once: true }}
                style={{ transformOrigin: "100px 100px" }}
              />
            ))}
            
            {skills.map((_, i) => {
              const p = polarToCart(i * angleStep, 80);
              return (
                <motion.line
                  key={i} x1={100} y1={100} x2={p.x} y2={p.y}
                  stroke="oklch(var(--border) / 0.4)" strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                  viewport={{ once: true }}
                />
              );
            })}

            {/* Target Polygon */}
            <motion.path
              d={targetPath}
              fill="oklch(var(--primary) / 0.05)"
              stroke="oklch(var(--primary) / 0.4)"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 1 }}
              viewport={{ once: true }}
              style={{ transformOrigin: "100px 100px" }}
            />

            {/* Current Polygon */}
            <motion.path
              d={currentPath}
              fill="url(#currentGradient)"
              stroke="#60a5fa"
              strokeWidth="2"
              filter="url(#glow)"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.5, delay: 1.2, ease: "easeInOut" }}
              viewport={{ once: true }}
            />

            {/* Vertices Dots for Current */}
            {currentPoints.map((p, i) => (
              <motion.circle
                key={`dot-${i}`}
                cx={p.x} cy={p.y} r={4}
                className="fill-background"
                stroke="#60a5fa"
                strokeWidth="2"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ type: "spring", delay: 1.5 + i * 0.1 }}
                viewport={{ once: true }}
                style={{ transformOrigin: `${p.x}px ${p.y}px` }}
              />
            ))}
          </svg>

          {/* HTML Labels for crisp typography */}
          {skills.map((s, i) => {
            const p = polarToCart(i * angleStep, 115); // Push labels further out
            return (
              <motion.div
                key={s.name}
                className="absolute whitespace-nowrap z-10"
                style={{
                  left: `${(p.x / 200) * 100}%`,
                  top: `${(p.y / 200) * 100}%`,
                  x: "-50%",
                  y: "-50%"
                }}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border shadow-sm text-[10px] font-bold uppercase tracking-widest text-foreground shadow-xl">
                  {s.name}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div className="space-y-5">
        <StaggerContainer>
          {skills.map((s) => {
            const gap = s.target - s.current;
            return (
              <StaggerItem key={s.name}>
                <div className="glass rounded-xl p-5 border border-border/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-foreground">{s.name}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Current: {s.current}%</span>
                      <span className="text-primary">Target: {s.target}%</span>
                      <span className={`font-bold ${gap > 0 ? "text-orange-500" : "text-emerald-500"}`}>
                        Gap: {gap > 0 ? `+${gap}` : gap}%
                      </span>
                    </div>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <motion.div
                      className="absolute inset-0 rounded-full bg-muted/20"
                      initial={{ width: "0%" }}
                      whileInView={{ width: `${s.target}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    />
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 relative z-10"
                      initial={{ width: "0%" }}
                      whileInView={{ width: `${s.current}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        <FadeUp delay={0.4}>
          <div className="flex items-center gap-4 justify-center pt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary" />
              <span>Current</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-sm bg-primary/30 border border-dashed border-primary/50" />
              <span>Target</span>
            </div>
          </div>
        </FadeUp>
      </div>
    </div>
  </div>
</section>
