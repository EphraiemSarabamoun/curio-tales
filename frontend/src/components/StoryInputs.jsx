import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generatePage } from '../api';
import { useVoiceInput } from '../hooks/useVoiceInput';
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const voice = useVoiceInput();

  const current = STEPS[step];

  useEffect(() => {
    voice.resetTranscript();
  }, [step]);

  useEffect(() => {
    if (voice.transcript) {
      setAnswers((prev) => ({ ...prev, [current.id]: voice.transcript }));
    }
  }, [voice.transcript]);

  const goNext = async () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep((s) => s + 1);
    } else {
      setIsGenerating(true);
      setError('');
      try {
        const res = await generatePage({
          who: answers.who,
          where: answers.where,
          how: answers.how,
        });
        onGenerate(res);
      } catch (err) {
        setError(err.message);
        setIsGenerating(false);
      }
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

  const canAdvance = answers[current.id].trim().length > 0 && !isGenerating;
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

            {/* Voice input */}
            <button
              className={`si-mic-btn ${voice.isListening ? 'si-mic-btn--listening' : ''}`}
              onClick={() => voice.isListening ? voice.stopListening() : voice.startListening()}
              disabled={isGenerating}
              style={{ '--mic-color': current.color }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>

            <div className="si-transcript" style={{ '--mic-color': current.color }}>
              {answers[current.id] && !voice.isListening && (
                <p className="si-transcript-final">{answers[current.id]}</p>
              )}
              {voice.isListening && (
                <p className="si-transcript-interim">
                  {voice.interimTranscript || 'Listening...'}
                </p>
              )}
              {!answers[current.id] && !voice.isListening && (
                <p className="si-transcript-hint">{current.placeholder}</p>
              )}
            </div>

            {voice.error && <p className="si-error">{voice.error}</p>}

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
              {isLast ? (isGenerating ? 'Creating your story...' : 'Create My Story ✨') : 'Next →'}
            </motion.button>

            {error && <p className="si-error">{error}</p>}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default StoryInputs;
