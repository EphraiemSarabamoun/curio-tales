import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './StoryInputs.css';

const STEPS = [
  {
    id: 'who',
    question: 'Who is your hero?',
    placeholder: 'A brave girl who can talk to animals...',
    color: '#FFB800',
    Icon: HeroIcon,
  },
  {
    id: 'where',
    question: 'Where does it happen?',
    placeholder: 'A glowing forest where stars touch the ground...',
    color: '#A78BFA',
    Icon: PlaceIcon,
  },
  {
    id: 'how',
    question: "What's their quest?",
    placeholder: 'They must find the lost star before sunrise...',
    color: '#7ee8fa',
    Icon: QuestIcon,
  },
];

function HeroIcon({ color }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="18" r="11" fill={color} opacity="0.9" />
      <path d="M12 58 Q12 38 32 36 Q52 38 52 58Z" fill={color} opacity="0.9" />
      <polygon points="32,26 34,31 40,31 35,34.5 37,40 32,36.5 27,40 29,34.5 24,31 30,31"
        fill="white" opacity="0.85" />
    </svg>
  );
}

function PlaceIcon({ color }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <circle cx="32" cy="26" r="14" fill={color} opacity="0.9" />
      <path d="M32 40 L32 58" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      <circle cx="32" cy="26" r="6" fill="white" opacity="0.6" />
    </svg>
  );
}

function QuestIcon({ color }) {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <polygon points="32,4 38,22 58,22 42,34 48,52 32,40 16,52 22,34 6,22 26,22"
        fill={color} opacity="0.9" />
    </svg>
  );
}

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '60%' : '-60%', opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 28 } },
  exit: (dir) => ({ x: dir > 0 ? '-60%' : '60%', opacity: 0, transition: { duration: 0.18 } }),
};

function StoryInputs({ onBack, onGenerate }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState({ who: '', where: '', how: '' });
  const inputRef = useRef(null);

  const current = STEPS[step];

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 320);
    return () => clearTimeout(t);
  }, [step]);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      onGenerate({
        title: "Captain Leo's Space Adventure",
        illustration: 'astronaut',
        pages: [
          {
            text: 'Our hero, Captain Leo, floated through the endless void of space. Stars twinkled like diamonds scattered across black velvet, and the great blue marble of Earth shrank behind him.',
            illustration: 'astronaut',
          },
          {
            text: 'His ship, The Curious Fox, hummed gently as it carried him toward the mysterious signal coming from the rings of Saturn. "What could be out there?" Leo wondered aloud.',
            illustration: 'spaceship',
          },
          {
            text: '"Mission Control, I\'m approaching the source," Leo radioed back. The signal grew stronger, pulsing like a heartbeat. Then, through the golden rings, he saw it — a doorway made of light.',
            illustration: 'saturn',
          },
        ],
      });
    }
  };

  const goPrev = () => {
    if (step === 0) {
      onBack();
    } else {
      setDirection(-1);
      setStep((s) => s - 1);
    }
  };

  const canAdvance = answers[current.id].trim().length > 0;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="si-page">
      {/* Back */}
      <button className="si-back" onClick={goPrev}>
        <span>&#8592;</span> Back
      </button>

      {/* Progress dots */}
      <div className="si-dots">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`si-dot ${i === step ? 'si-dot--active' : ''} ${i < step ? 'si-dot--done' : ''}`}
          />
        ))}
      </div>

      {/* Animated step */}
      <div className="si-stage">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            className="si-step"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {/* Floating icon */}
            <motion.div
              className="si-icon"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <current.Icon color={current.color} />
            </motion.div>

            {/* Question */}
            <h2 className="si-question">{current.question}</h2>

            {/* Input */}
            <input
              ref={inputRef}
              className="si-input"
              type="text"
              placeholder={current.placeholder}
              value={answers[current.id]}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
              }
              onKeyDown={(e) => e.key === 'Enter' && canAdvance && goNext()}
              style={{ '--focus-color': current.color }}
            />

            {/* CTA */}
            <motion.button
              className="si-cta"
              onClick={goNext}
              disabled={!canAdvance}
              style={{ '--cta-color': current.color }}
              whileHover={canAdvance ? { scale: 1.05, y: -3 } : {}}
              whileTap={canAdvance ? { scale: 0.96 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {isLast ? 'Create My Story ✨' : 'Next →'}
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StoryInputs;
