    <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      {plans.map((plan) => (
        <StaggerItem key={plan.name}>
          <motion.div
            whileHover={{ y: -4 }}
            className={`relative h-full rounded-2xl border p-8 transition-all duration-500 ${
              plan.popular
                ? "border-primary/40 bg-primary/[0.03] shadow-xl shadow-primary/5"
                : "glass hover:border-primary/30"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest shadow-lg">
                Most Popular
              </div>
            )}

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link href={plan.href} className="block">
                <Button
                  className={`w-full h-12 rounded-xl font-bold ${
                    plan.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                      : "border border-border bg-card text-white hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </StaggerItem>
      ))}
    </StaggerContainer>
  </div>
</section>
