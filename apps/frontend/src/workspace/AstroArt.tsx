/** Ilustración decorativa original; no representa un cálculo ni una gráfica científica. */
export function AstroArt() {
  return (
    <svg
      className="astro-art"
      viewBox="0 0 420 240"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="planet" x2="1" y2="1">
          <stop stopColor="#57d8ed" />
          <stop offset="1" stopColor="#775ce9" />
        </linearGradient>
        <linearGradient id="visor" x2="1" y2="1">
          <stop stopColor="#1d3154" />
          <stop offset="1" stopColor="#47386c" />
        </linearGradient>
      </defs>
      <g className="orbit-lines" fill="none" stroke="currentColor" opacity=".3">
        <ellipse
          cx="213"
          cy="127"
          rx="178"
          ry="56"
          transform="rotate(-16 213 127)"
        />
        <ellipse
          cx="213"
          cy="127"
          rx="198"
          ry="72"
          transform="rotate(-16 213 127)"
        />
        <path d="M53 199h302M94 178l-17 43M160 178l-6 43M224 178l7 43M288 178l18 43" />
      </g>
      <g className="orbit-satellite">
        <circle cx="335" cy="83" r="22" fill="url(#planet)" />
        <ellipse
          cx="335"
          cy="83"
          rx="37"
          ry="9"
          fill="none"
          stroke="#d4b8ff"
          strokeWidth="4"
          transform="rotate(-28 335 83)"
        />
      </g>
      <g className="astronaut" stroke="#a5a4d1" strokeWidth="2.5">
        <path
          d="M161 134l-25-10-20 20 8 12 24-12 10 42 20 8 39-2 14-24-1-25 22 10 10-12-30-30"
          fill="#f3f5ff"
        />
        <path
          d="M168 178l-10 31 16 6 18-31M199 184l8 30 18-4-6-31"
          fill="#f3f5ff"
        />
        <rect x="157" y="135" width="57" height="39" rx="14" fill="#edf1ff" />
        <rect x="176" y="141" width="24" height="15" rx="5" fill="#8b7ce6" />
        <circle cx="192" cy="89" r="48" fill="#f3f5ff" />
        <circle cx="195" cy="87" r="37" fill="url(#visor)" />
        <path
          d="M171 77q15-25 37-12"
          stroke="#b7d4ff"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="238" cy="94" r="12" fill="#f3f5ff" />
      </g>
      <g fill="currentColor" opacity=".7">
        <path d="M79 48l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM286 23l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <circle cx="121" cy="79" r="2" />
        <circle cx="286" cy="146" r="3" />
        <circle cx="368" cy="136" r="2" />
      </g>
    </svg>
  );
}

export function AcademicArt() {
  return (
    <svg
      className="astro-art academic-art"
      viewBox="0 0 420 240"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="academic-plane" x2="1" y2="1">
          <stop stopColor="#e1ecff" />
          <stop offset="1" stopColor="#8aa5db" stopOpacity=".2" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="currentColor" opacity=".2">
        <path d="M44 170l163-91 166 90-163 67zM84 148l163 90M125 125l164 90M166 102l164 91M85 192l163-90M126 214l164-90" />
      </g>
      <path
        d="M99 167l108-60 109 59-108 60z"
        fill="url(#academic-plane)"
        stroke="currentColor"
        opacity=".75"
      />
      <g
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M208 166V49m0 0l-6 11m6-11l6 11M208 166l95-53m0 0l-13 2m13-2l-5 12M208 166l-80-44m0 0l5 12m-5-12l13 1" />
      </g>
      <g fill="currentColor">
        <circle cx="208" cy="166" r="6" />
        <circle cx="303" cy="113" r="4" />
        <circle cx="128" cy="122" r="4" />
      </g>
      <g stroke="currentColor" strokeWidth="2" fill="none" opacity=".5">
        <path d="M320 27h-10v60h10M372 27h10v60h-10" />
      </g>
      <g
        fill="currentColor"
        opacity=".6"
        fontSize="17"
        fontFamily="Georgia,serif"
      >
        <text x="324" y="49">
          a
        </text>
        <text x="352" y="49">
          b
        </text>
        <text x="324" y="74">
          c
        </text>
        <text x="352" y="74">
          d
        </text>
      </g>
    </svg>
  );
}
