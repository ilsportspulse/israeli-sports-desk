"use client";

import { useEffect, useMemo, useState } from "react";

import { siteConfig } from "@/config/site";
import { ArrowIcon, CheckIcon, TrophyIcon } from "@/components/icons";
import type { DailyQuiz as DailyQuizData } from "@/lib/quiz";

export function DailyQuiz({ quiz }: { quiz: DailyQuizData }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [complete, setComplete] = useState(false);
  const [shareLabel, setShareLabel] = useState("Share result");
  const [streak, setStreak] = useState(0);
  const question = quiz.questions[current];
  const selected = answers[current];
  const score = useMemo(
    () => answers.reduce((total, answer, index) => total + Number(answer === quiz.questions[index]?.correctIndex), 0),
    [answers, quiz.questions],
  );

  useEffect(() => {
    if (!complete) return;
    const stored = JSON.parse(window.localStorage.getItem("ilp-quiz-days") ?? "[]") as string[];
    const days = new Set([...stored, quiz.date]);
    window.localStorage.setItem("ilp-quiz-days", JSON.stringify(Array.from(days).sort()));
    let count = 0;
    const cursor = new Date(`${quiz.date}T00:00:00Z`);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      count += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    setStreak(count);
  }, [complete, quiz.date]);

  function choose(index: number) {
    if (selected !== undefined) return;
    setAnswers((existing) => {
      const next = [...existing];
      next[current] = index;
      return next;
    });
  }

  function nextQuestion() {
    if (selected === undefined) return;
    if (current === quiz.questions.length - 1) setComplete(true);
    else setCurrent((index) => index + 1);
  }

  function restart() {
    setCurrent(0);
    setAnswers([]);
    setComplete(false);
    setShareLabel("Share result");
  }

  async function shareResult() {
    const blocks = answers.map((answer, index) => answer === quiz.questions[index].correctIndex ? "🟦" : "⬜").join("");
    const text = `${siteConfig.shortName} Daily Five — ${score}/${quiz.questions.length}\n${blocks}`;
    try {
      if (navigator.share) await navigator.share({ title: quiz.title, text });
      else {
        await navigator.clipboard.writeText(text);
        setShareLabel("Result copied");
      }
    } catch {
      setShareLabel("Share cancelled");
    }
  }

  return (
    <section className="daily-quiz" id="daily-quiz" aria-labelledby="daily-quiz-title">
      <div className="quiz-intro">
        <span className="quiz-icon"><TrophyIcon size={27} /></span>
        <span className="eyebrow inverse">Play the news</span>
        <h2 id="daily-quiz-title">{quiz.title}</h2>
        <p>{quiz.dek}</p>
        <div className="quiz-rules"><strong>5 questions</strong><span>One attempt per answer</span><span>Sources revealed after every pick</span></div>
      </div>

      {!complete ? (
        <div className="quiz-card" aria-live="polite">
          <div className="quiz-progress"><span>Question {current + 1} of {quiz.questions.length}</span><div><i style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }} /></div></div>
          <h3>{question.question}</h3>
          <div className="quiz-answers">
            {question.answers.map((answer, index) => {
              const isCorrect = selected !== undefined && index === question.correctIndex;
              const isWrong = selected === index && index !== question.correctIndex;
              return <button key={answer} type="button" className={`${isCorrect ? "correct" : ""}${isWrong ? " wrong" : ""}`} onClick={() => choose(index)} disabled={selected !== undefined}><span>{String.fromCharCode(65 + index)}</span>{answer}{isCorrect ? <CheckIcon size={16} /> : null}</button>;
            })}
          </div>
          {selected !== undefined ? (
            <div className="quiz-explanation">
              <strong>{selected === question.correctIndex ? "Correct." : "Not this time."}</strong>
              <p>{question.explanation}</p>
              <a href={question.sourceUrl} target="_blank" rel="noreferrer">Check the source</a>
            </div>
          ) : null}
          <button className="quiz-next" type="button" onClick={nextQuestion} disabled={selected === undefined}>{current === quiz.questions.length - 1 ? "See my score" : "Next question"} <ArrowIcon size={17} /></button>
        </div>
      ) : (
        <div className="quiz-card quiz-result" aria-live="polite">
          <span className="result-mark"><TrophyIcon size={32} /></span>
          <small>Today’s final score</small>
          <strong>{score}<i>/ {quiz.questions.length}</i></strong>
          <h3>{score === quiz.questions.length ? "A perfect five." : score >= 3 ? "You know the desk." : "Tomorrow is a fresh fixture."}</h3>
          <p>{answers.map((answer, index) => answer === quiz.questions[index].correctIndex ? "●" : "○").join(" ")}</p>
          <span className="quiz-streak">{streak} day streak</span>
          <div><button type="button" onClick={shareResult}>{shareLabel}</button><button type="button" onClick={restart}>Play again</button></div>
        </div>
      )}
    </section>
  );
}
