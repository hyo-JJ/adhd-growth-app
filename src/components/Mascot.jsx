const FACES = {
  default: (
    <>
      <circle cx="41" cy="58" r="3.2" fill="#3a2e27" />
      <circle cx="63" cy="58" r="3.2" fill="#3a2e27" />
      <path d="M44 70q8 7 16 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  happy: (
    <>
      <path d="M36 56q5-6 10 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M58 56q5-6 10 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M42 68q10 10 20 0" stroke="#3a2e27" strokeWidth="3.2" strokeLinecap="round" fill="none" />
    </>
  ),
  shy: (
    <>
      <path d="M36 58q5-5 10 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M58 58q5-5 10 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M46 69q6 4 12 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  focus: (
    <>
      <path d="M35 52l11 4" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" />
      <path d="M69 52l-11 4" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" />
      <circle cx="41" cy="60" r="3" fill="#3a2e27" />
      <circle cx="63" cy="60" r="3" fill="#3a2e27" />
      <path d="M47 72q5 3 10 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  love: (
    <>
      <path
        d="M41 55c-3-4-9-2-9 2 0 4 9 9 9 9s9-5 9-9c0-4-6-6-9-2z"
        fill="#e2705a"
      />
      <path
        d="M63 55c-3-4-9-2-9 2 0 4 9 9 9 9s9-5 9-9c0-4-6-6-9-2z"
        fill="#e2705a"
      />
      <path d="M44 70q8 6 16 0" stroke="#3a2e27" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  idea: (
    <>
      <circle cx="41" cy="58" r="4.2" fill="#3a2e27" />
      <circle cx="63" cy="58" r="4.2" fill="#3a2e27" />
      <ellipse cx="52" cy="72" rx="6" ry="5" fill="#3a2e27" />
    </>
  ),
};

export default function Mascot({ mood = 'default', size = 56, className = '' }) {
  return (
    <svg
      className={'mascot ' + className}
      width={size}
      height={size}
      viewBox="0 0 104 104"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="52" cy="60" r="40" fill="#FBDDBB" />
      <path
        d="M52 22c0-8 6-14 6-14s-10-1-13 6c-1-6-9-9-9-9s0 9 6 13c-4 1-7 5-7 5s9 3 14-1z"
        fill="#5FAE6E"
      />
      <circle cx="30" cy="66" r="6" fill="#F5A98B" opacity="0.7" />
      <circle cx="74" cy="66" r="6" fill="#F5A98B" opacity="0.7" />
      {FACES[mood] || FACES.default}
    </svg>
  );
}
