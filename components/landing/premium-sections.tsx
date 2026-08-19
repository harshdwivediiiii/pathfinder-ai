'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Brain,
  Zap,
  TrendingUp,
  Mic2,
  DollarSign,
  Compass,
  Lightbulb,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const features: Feature[] = [
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Resume Builder',
    description:
      'AI-powered resume creation that optimizes for ATS systems and hiring managers.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: <Brain className="w-6 h-6" />,
    title: 'ATS Analyzer',
    description:
      'Real-time feedback on your resume compliance with applicant tracking systems.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Resume Roast',
    description:
      'Get honest, actionable feedback on your resume with specific improvements.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Job Match Scoring',
    description:
      'Find perfect-fit roles with intelligent matching algorithms.',
    color: 'from-emerald-500 to-green-500',
  },
  {
    icon: <Mic2 className="w-6 h-6" />,
    title: 'AI Mock Interviews',
    description:
      'Practice with AI interviewers and get detailed performance analytics.',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: 'Salary Negotiation',
    description:
      'Master salary discussions with AI-powered negotiation coaching.',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: <Compass className="w-6 h-6" />,
    title: 'Career Roadmap',
    description:
      'Personalized career growth paths tailored to your goals and skills.',
    color: 'from-rose-500 to-pink-500',
  },
  {
    icon: <Lightbulb className="w-6 h-6" />,
    title: 'Skill Gap Analyzer',
    description:
      'Identify missing skills and get targeted learning recommendations.',
    color: 'from-teal-500 to-cyan-500',
  },
];

const pricingPlans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      'Basic resume builder',
      'ATS analysis (limited)',
      'Job match scoring',
      'Community access',
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For serious job seekers',
    features: [
      'Everything in Free',
      'Advanced resume builder',
      'Unlimited ATS analysis',
      'AI Mock interviews (10/month)',
      'Career roadmap',
      'Salary negotiation coach',
    ],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$49',
    period: '/month',
    description: 'For career transformation',
    features: [
      'Everything in Pro',
      'Unlimited mock interviews',
      'Priority support',
      'Custom learning paths',
      'LinkedIn optimization',
      'Portfolio builder',
      '1-on-1 coaching calls',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Senior Product Manager',
    image: '👩‍💼',
    quote:
      'PathFinder AI helped me land my dream role at a top tech company. The interview prep was game-changing!',
  },
  {
    name: 'Marcus Johnson',
    role: 'Full Stack Developer',
    image: '👨‍💻',
    quote:
      'The resume optimization tools saved me hours. I got 3x more interview callbacks after using it.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Design Director',
    image: '👩‍🎨',
    quote:
      'The career roadmap feature gave me clarity on where to focus my learning. Highly recommend!',
  },
];

const faqs = [
  {
    question: 'How accurate is the ATS analyzer?',
    answer:
      'Our ATS analyzer uses machine learning trained on thousands of job descriptions and hiring patterns. It has an 94% accuracy rate for predicting ATS compatibility.',
  },
  {
    question: 'Can I export my resume in different formats?',
    answer:
      'Yes! Export to PDF, Word, or plain text. All formats are optimized for ATS compatibility.',
  },
  {
    question: 'How do the mock interviews work?',
    answer:
      'Our AI interviewer conducts realistic interviews, provides real-time feedback, and generates a detailed performance report after each session.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Absolutely. We use enterprise-grade encryption and comply with GDPR and SOC 2 standards.',
  },
];

interface FeaturesGridProps {
  className?: string;
}

export const FeaturesGrid: React.FC<FeaturesGridProps> = ({ className = '' }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {features.map((feature, index) => (
        <motion.div key={index} variants={itemVariants} className="group h-full">
          <div className="relative h-full p-6 rounded-2xl glass border border-border/40 hover:border-primary/30 transition-all duration-500 overflow-hidden hover:shadow-lg hover:shadow-primary/10">
            <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.color} rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-all duration-500`} />

            <div className="relative z-10 space-y-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

interface PricingGridProps {
  className?: string;
}

export const PricingGrid: React.FC<PricingGridProps> = ({ className = '' }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`grid grid-cols-1 md:grid-cols-3 gap-8 ${className}`}
    >
      {pricingPlans.map((plan, index) => (
        <motion.div key={index} variants={itemVariants} className="h-full">
          <div
            className={`relative h-full p-8 rounded-3xl transition-all duration-500 overflow-hidden group ${
              plan.highlighted
                ? 'glass border border-primary/50 shadow-2xl shadow-primary/20 md:scale-105'
                : 'glass border border-border/40 hover:border-border/80'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />
            )}

            <div className="relative z-10 space-y-8">
              {plan.highlighted && (
                <Badge variant="default" className="bg-primary text-primary-foreground px-4 py-1">
                  Most Popular
                </Badge>
              )}

              <div>
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              <div>
                <span className="text-5xl font-bold text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-muted-foreground ml-2">
                    {plan.period}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                variant="default"
                size="lg"
                className={`w-full h-12 rounded-xl font-bold transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {plan.cta}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

interface TestimonialsProps {
  className?: string;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ className = '' }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${className}`}
    >
      {testimonials.map((testimonial, index) => (
        <motion.div key={index} variants={itemVariants} className="group">
          <div className="p-8 rounded-2xl glass border border-border/40 hover:border-primary/30 transition-all duration-500 h-full space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {`"${testimonial.quote}"`}
            </p>
            <div className="flex items-center gap-4 pt-4 border-t border-border/30">
              <div className="text-3xl">{testimonial.image}</div>
              <div>
                <p className="font-bold text-foreground">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">
                  {testimonial.role}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

interface FAQProps {
  className?: string;
}

export const FAQ: React.FC<FAQProps> = ({ className = '' }) => {
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={`space-y-4 max-w-3xl mx-auto ${className}`}
    >
      {faqs.map((faq, index) => (
        <motion.div key={index} variants={itemVariants}>
          <button
            onClick={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            className="w-full p-6 rounded-2xl glass border border-border/40 hover:border-primary/30 transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground text-lg">
                {faq.question}
              </h4>
              <motion.svg
                animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-5 h-5 text-primary flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </motion.svg>
            </div>
            <motion.div
              initial={false}
              animate={{
                height: expandedIndex === index ? 'auto' : 0,
                opacity: expandedIndex === index ? 1 : 0,
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <p className="text-muted-foreground mt-4 leading-relaxed">
                {faq.answer}
              </p>
            </motion.div>
          </button>
        </motion.div>
      ))}
    </motion.div>
  );
};
