type P = { size?: number };
const s = (size = 22) => ({ width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const });

export const Pause = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 6.5v11M15 6.5v11" /></svg>;
export const Back = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>;
export const Next = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9.5 5.5 16 12l-6.5 6.5" /></svg>;
export const Restart = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3" /><path d="M4 4.5v3.5h3.5" /></svg>;
export const Undo = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 7 4.5 11.5 9 16" /><path d="M5 11.5h9a5 5 0 0 1 0 10h-2" /></svg>;
export const Lamp = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1h5c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3z" /></svg>;
export const Gear = ({ size }: P) => (
  <svg {...s(size)} aria-hidden><circle cx="12" cy="12" r="3" /><path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2 5.5 5.5" /></svg>
);
/** A match: a lit head when it's still to strike, burnt when spent. */
export const Match = ({ size = 22, spent = false }: P & { spent?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M9 21.5 15 7" stroke={spent ? 'rgba(255,255,255,.35)' : '#f2d6a8'} strokeWidth="2.2" strokeLinecap="round" />
    <ellipse cx="15.6" cy="5.6" rx="2.2" ry="2.8" transform="rotate(23 15.6 5.6)" fill={spent ? '#3a3440' : '#e8483a'} />
    {!spent && <path d="M16.5 1.2c1.8 1.6 2.4 3.5.8 5.2" stroke="#ffcf5a" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".85" />}
  </svg>
);
/** A paper lantern. */
export const Lantern = ({ size }: P) => <svg {...s(size)} aria-hidden><path d="M12 2.5v2M9 4.5h6M9 19.5h6M12 19.5v2" /><path d="M9 4.5C5.5 6 5.5 18 9 19.5h6c3.5-1.5 3.5-13.5 0-15z" /><path d="M7.2 9h9.6M7.2 15h9.6" opacity=".55" /></svg>;
/** Stars are chrysanthemum bursts, golden when earned. */
export const Star = ({ size = 22, on = true }: P & { on?: boolean }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    {Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2, x1 = 12 + Math.cos(a) * 3.2, y1 = 12 + Math.sin(a) * 3.2, x2 = 12 + Math.cos(a) * 9.5, y2 = 12 + Math.sin(a) * 9.5; return <path key={k} d={`M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`} stroke={on ? (k % 2 ? '#ff8a5a' : '#ffd86a') : 'rgba(255,255,255,.45)'} strokeWidth={on ? 1.7 : 1.2} strokeLinecap="round" />; })}
    {on && Array.from({ length: 12 }, (_, k) => { const a = (k / 12) * Math.PI * 2; return <circle key={k} cx={12 + Math.cos(a) * 10.2} cy={12 + Math.sin(a) * 10.2} r=".9" fill="#fff4c8" />; })}
    <circle cx="12" cy="12" r="2" fill={on ? '#fff4c8' : 'rgba(255,255,255,.45)'} />
  </svg>
);
