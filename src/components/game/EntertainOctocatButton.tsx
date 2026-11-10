import styles from "./Runner.module.css";

export function EntertainOctocatButton({ onClick }: { onClick: () => void }) {
  return <button data-entertain-octocat className={`text-button ${styles.entry}`} onClick={onClick} aria-haspopup="dialog">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M7 7h10c2 0 3 2 3.5 4l1 5c.5 3-2 4-4 2l-2-2h-7l-2 2c-2 2-4.5 1-4-2l1-5C4 9 5 7 7 7Z" /><path d="M8 10v5m-2.5-2.5h5M16 11h.01M18 14h.01" strokeLinecap="round" /></svg>
    Entertain Octocat
  </button>;
}
