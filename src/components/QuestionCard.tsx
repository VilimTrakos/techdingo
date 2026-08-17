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
      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-card sm:p-8"
    >
      {eyebrow && (
        <div className="mb-3 text-xs font-extrabold tracking-[0.18em] text-indigo-600 uppercase">
          {eyebrow}
        </div>
      )}
      <h1
        ref={titleRef}
        id={titleId}
        className="text-xl leading-snug font-black text-pretty text-slate-900 sm:text-2xl"
        tabIndex={-1}
      >
        {question}
      </h1>
      {children && <div className="mt-7">{children}</div>}
    </section>
  );
}

export default QuestionCard;
