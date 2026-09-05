import React from 'react';
import { motion } from 'motion/react';

interface CodexLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  animated?: boolean;
  className?: string;
  textColor?: string;
  subtitleClassName?: string;
  layout?: 'vertical' | 'horizontal';
}

export const CodexLogo: React.FC<CodexLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  animated = true,
  className = '',
  textColor = '#0f172a',
  subtitleClassName = 'text-slate-700',
  layout = 'vertical',
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.85 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
        duration: 0.6,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  };

  const blockVariants = (xDir: number, yDir: number) => ({
    hidden: { opacity: 0, x: xDir * 25, y: yDir * 25, scale: 0.7 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 220,
        damping: 18,
      },
    },
  });

  const centerCodeVariants = {
    hidden: { opacity: 0, scale: 0, rotate: -20 },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 0.35,
      },
    },
  };

  const letterVariants = {
    hidden: { opacity: 0, y: 8, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  const eBarVariants = (index: number) => ({
    hidden: { opacity: 0, scaleX: 0 },
    visible: {
      opacity: 1,
      scaleX: 1,
      transition: {
        duration: 0.3,
        delay: 0.45 + index * 0.08,
        ease: 'easeOut',
      },
    },
  });

  const isHorizontal = layout === 'horizontal';
  const sizeMap = {
    sm: isHorizontal 
      ? { icon: 28, heightClass: 'h-6 sm:h-7', gap: 'gap-3', codexHeight: 'h-6 sm:h-7', subText: 'text-[8px]' } 
      : { icon: 56, heightClass: 'h-7 sm:h-8', gap: 'gap-1.5', codexHeight: 'h-7 sm:h-8', subText: 'text-[8px] tracking-[0.25em]' },
    md: isHorizontal 
      ? { icon: 36, heightClass: 'h-8 sm:h-9', gap: 'gap-3.5', codexHeight: 'h-8 sm:h-9', subText: 'text-[9px]' } 
      : { icon: 84, heightClass: 'h-8 sm:h-9', gap: 'gap-2', codexHeight: 'h-8 sm:h-9', subText: 'text-[10px] tracking-[0.35em]' },
    lg: isHorizontal 
      ? { icon: 48, heightClass: 'h-10 sm:h-11', gap: 'gap-4', codexHeight: 'h-10 sm:h-11', subText: 'text-[11px]' } 
      : { icon: 110, heightClass: 'h-10 sm:h-12', gap: 'gap-2.5', codexHeight: 'h-10 sm:h-12', subText: 'text-xs tracking-[0.4em]' },
    xl: isHorizontal 
      ? { icon: 64, heightClass: 'h-12 sm:h-14', gap: 'gap-5', codexHeight: 'h-12 sm:h-14', subText: 'text-xs' } 
      : { icon: 140, heightClass: 'h-14 sm:h-16', gap: 'gap-3', codexHeight: 'h-14 sm:h-16', subText: 'text-sm tracking-[0.45em]' },
  };

  const currentSize = sizeMap[size];

  return (
    <motion.div
      variants={animated ? containerVariants : undefined}
      initial={animated ? 'hidden' : 'visible'}
      animate="visible"
      className={`flex ${isHorizontal ? 'flex-row items-center justify-center' : 'flex-col items-center justify-center'} select-none ${currentSize.gap} ${className}`}
    >
      {/* Icon Emblem: Geometric X with center </> */}
      <div className="relative flex items-center justify-center shrink-0">
        
        {/* Subtle Ambient Glow */}
        <motion.div
          animate={animated ? {
            scale: [1, 1.15, 1],
            opacity: [0.35, 0.6, 0.35],
          } : undefined}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 via-indigo-500/20 to-transparent rounded-full blur-xl pointer-events-none"
        />

        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 200 200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-md overflow-visible block"
        >
          <defs>
            <linearGradient id="codexPurpleGrad" x1="20" y1="20" x2="100" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="codexDarkGrad" x1="120" y1="20" x2="190" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>

          {/* Top-Left Wing: Purple */}
          <motion.path
            d="M 28 28 L 78 28 L 94 72 L 72 94 L 28 50 Z"
            fill="url(#codexPurpleGrad)"
            variants={animated ? blockVariants(-1, -1) : undefined}
          />

          {/* Bottom-Left Wing: Purple */}
          <motion.path
            d="M 28 172 L 78 172 L 94 128 L 72 106 L 28 150 Z"
            fill="url(#codexPurpleGrad)"
            variants={animated ? blockVariants(-1, 1) : undefined}
          />

          {/* Top-Right Wing: Dark Slate / Black */}
          <motion.path
            d="M 172 28 L 122 28 L 106 72 L 128 94 L 172 50 Z"
            fill="url(#codexDarkGrad)"
            variants={animated ? blockVariants(1, -1) : undefined}
          />

          {/* Bottom-Right Wing: Dark Slate / Black */}
          <motion.path
            d="M 172 172 L 122 172 L 106 128 L 128 106 L 172 150 Z"
            fill="url(#codexDarkGrad)"
            variants={animated ? blockVariants(1, 1) : undefined}
          />

          {/* Center Code Symbol: </> */}
          <motion.g variants={animated ? centerCodeVariants : undefined}>
            {/* Left bracket < */}
            <path
              d="M 88 91 L 76 100 L 88 109"
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Slash / */}
            <path
              d="M 105 87 L 95 113"
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinecap="round"
            />
            {/* Right bracket > */}
            <path
              d="M 112 91 L 124 100 L 112 109"
              stroke="#0f172a"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
        </svg>
      </div>

      {/* Title & Subtitle Section */}
      <div className={`flex flex-col ${isHorizontal ? 'items-start justify-center' : 'items-center justify-center'}`}>
        
        {isHorizontal ? (
          /* Horizontal Mode: Precise 1:1 Vector Height Alignment */
          <svg
            viewBox="0 0 200 34"
            className={`${currentSize.heightClass} w-auto overflow-visible select-none block`}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="codexEGradHoriz" x1="130" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>

            {/* Letter C */}
            <motion.text
              x="8"
              y="26"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="26"
              fontWeight="900"
              fill={textColor}
              variants={animated ? letterVariants : undefined}
            >
              C
            </motion.text>

            {/* Letter O */}
            <motion.text
              x="48"
              y="26"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="26"
              fontWeight="900"
              fill={textColor}
              variants={animated ? letterVariants : undefined}
            >
              O
            </motion.text>

            {/* Letter D */}
            <motion.text
              x="90"
              y="26"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="26"
              fontWeight="900"
              fill={textColor}
              variants={animated ? letterVariants : undefined}
            >
              D
            </motion.text>

            {/* Custom E: 3 purple horizontal bars ≡ */}
            <motion.rect
              x="132"
              y="7.5"
              width="22"
              height="4"
              rx="2"
              fill="url(#codexEGradHoriz)"
              variants={animated ? eBarVariants(0) : undefined}
            />
            <motion.rect
              x="132"
              y="14.5"
              width="22"
              height="4"
              rx="2"
              fill="url(#codexEGradHoriz)"
              variants={animated ? eBarVariants(1) : undefined}
            />
            <motion.rect
              x="132"
              y="21.5"
              width="22"
              height="4"
              rx="2"
              fill="url(#codexEGradHoriz)"
              variants={animated ? eBarVariants(2) : undefined}
            />

            {/* Letter X */}
            <motion.text
              x="174"
              y="26"
              fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
              fontSize="26"
              fontWeight="900"
              fill={textColor}
              variants={animated ? letterVariants : undefined}
            >
              X
            </motion.text>

            {/* Subtitle if requested */}
            {showSubtitle && (
              <motion.text
                x="8"
                y="44"
                textLength="182"
                lengthAdjust="spacingAndGlyphs"
                fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                fontSize="9"
                fontWeight="900"
                fill={textColor}
                opacity="0.9"
              >
                CODING CLUB
              </motion.text>
            )}
          </svg>
        ) : (
          /* Vertical Mode (Default for Login Card): Original Prominent CODEX Title & Subtitle */
          <>
            <svg
              viewBox="0 0 220 34"
              className={`${currentSize.codexHeight} w-auto overflow-visible select-none`}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="codexEGradVert" x1="130" y1="0" x2="160" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              <motion.text
                x="8"
                y="26"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="26"
                fontWeight="900"
                fill={textColor}
                variants={animated ? letterVariants : undefined}
              >
                C
              </motion.text>

              <motion.text
                x="48"
                y="26"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="26"
                fontWeight="900"
                fill={textColor}
                variants={animated ? letterVariants : undefined}
              >
                O
              </motion.text>

              <motion.text
                x="90"
                y="26"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="26"
                fontWeight="900"
                fill={textColor}
                variants={animated ? letterVariants : undefined}
              >
                D
              </motion.text>

              <motion.rect
                x="132"
                y="7.5"
                width="22"
                height="4"
                rx="2"
                fill="url(#codexEGradVert)"
                variants={animated ? eBarVariants(0) : undefined}
              />
              <motion.rect
                x="132"
                y="14.5"
                width="22"
                height="4"
                rx="2"
                fill="url(#codexEGradVert)"
                variants={animated ? eBarVariants(1) : undefined}
              />
              <motion.rect
                x="132"
                y="21.5"
                width="22"
                height="4"
                rx="2"
                fill="url(#codexEGradVert)"
                variants={animated ? eBarVariants(2) : undefined}
              />

              <motion.text
                x="174"
                y="26"
                fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
                fontSize="26"
                fontWeight="900"
                fill={textColor}
                variants={animated ? letterVariants : undefined}
              >
                X
              </motion.text>
            </svg>

            {showSubtitle && (
              <motion.div
                initial={animated ? { opacity: 0, y: 4 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className={`font-extrabold uppercase font-mono ${subtitleClassName} ${currentSize.subText} mt-1`}
              >
                C O D I N G &nbsp; C L U B
              </motion.div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};
