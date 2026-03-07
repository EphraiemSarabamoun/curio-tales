import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';

const PARTICLES_CONFIG = {
  fullScreen: false,
  fpsLimit: 60,
  particles: {
    number: { value: 38, density: { enable: true } },
    color: { value: ['#FFB800', '#A78BFA', '#ffffff', '#7ee8fa'] },
    shape: { type: 'circle' },
    opacity: {
      value: { min: 0.08, max: 0.55 },
      animation: { enable: true, speed: 0.6, sync: false },
    },
    size: {
      value: { min: 1, max: 2.5 },
      animation: { enable: true, speed: 0.8, sync: false },
    },
    move: {
      enable: true,
      speed: 0.35,
      direction: 'none',
      random: true,
      straight: false,
      outModes: 'out',
    },
  },
  detectRetina: true,
};

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.16 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 22 } },
};

const scalePop = {
  hidden: { opacity: 0, scale: 0.55 },
  visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

function BookLogo() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      {/* Left page */}
      <path d="M40 8 Q24 5 6 14 L6 52 Q24 43 40 46 Z" fill="#FFB800" />
      {/* Text lines left */}
      <line x1="13" y1="24" x2="35" y2="20" stroke="rgba(0,0,0,0.18)" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="31" x2="35" y2="27" stroke="rgba(0,0,0,0.18)" strokeWidth="2" strokeLinecap="round" />
      <line x1="13" y1="38" x2="26" y2="35" stroke="rgba(0,0,0,0.18)" strokeWidth="2" strokeLinecap="round" />
      {/* Right page */}
      <path d="M40 8 Q56 5 74 14 L74 52 Q56 43 40 46 Z" fill="#A78BFA" />
      {/* Text lines right */}
      <line x1="45" y1="20" x2="67" y2="24" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      <line x1="45" y1="27" x2="67" y2="31" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      <line x1="45" y1="34" x2="57" y2="38" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" />
      {/* Spine */}
      <line x1="40" y1="8" x2="40" y2="46" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" />
      {/* Star above */}
      <polygon
        points="40,0 42,5 47,5 43,8 45,13 40,10 35,13 37,8 33,5 38,5"
        fill="#FFB800"
      />
    </svg>
  );
}

function Welcome({ onStart, onLibrary }) {
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setEngineReady(true));
  }, []);

  const particlesLoaded = useCallback(() => {}, []);

  return (
    <div className="welcome">
      {engineReady && (
        <Particles
          className="welcome-particles"
          particlesLoaded={particlesLoaded}
          options={PARTICLES_CONFIG}
        />
      )}

      <motion.div
        className="welcome-content"
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={scalePop}>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BookLogo />
          </motion.div>
        </motion.div>

        <motion.h1 className="welcome-title" variants={fadeUp}>
          Curio
        </motion.h1>

        <motion.p className="welcome-tagline" variants={fadeUp}>
          Your imagination. Your story.
        </motion.p>

        <motion.div variants={fadeUp}>
          <motion.button
            className="welcome-cta"
            onClick={onStart}
            whileHover={{ scale: 1.05, y: -3 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            Start Your Adventure
          </motion.button>
        </motion.div>

        <motion.div variants={fadeUp}>
          <motion.button
            className="welcome-library"
            onClick={onLibrary}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            My Library
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Welcome;
