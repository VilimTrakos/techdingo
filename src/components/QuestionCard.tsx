import { useEffect, useId, useRef, type ReactNode } from 'react';

export interface QuestionCardProps {
  question: string;
  children?: ReactNode;
  eyebrow?: ReactNode;
}

export function QuestionCard({ question, children, eyebrow }: QuestionCardProps) {
  const titleId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, [question]);

  return (
    <section
      aria-labelledby={titleId}
      className="animate-pop-in relative overflow-hidden rounded-[1.75rem] border-2 border-cloud-200 bg-white p-5 shadow-[0_6px_0_#d4ddd0,0_18px_36px_rgba(23,32,42,0.08)] sm:p-8"
    >
      <div
        className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-brand-500 via-lime-300 to-cyan-400"
        aria-hidden="true"
      />
      {eyebrow && (
        <div className="mb-3 mt-1 text-xs font-black tracking-[0.18em] text-brand-700 uppercase">
          {eyebrow}
        </div>
      )}
      <h1
        ref={titleRef}
        id={titleId}
        className="text-pretty text-xl font-black leading-snug text-ink-950 focus-visible:outline-none sm:text-2xl"
        tabIndex={-1}
      >
        {question}
      </h1>
      {children && <div className="mt-7">{children}</div>}
    </section>
  );
}

export default QuestionCard;
