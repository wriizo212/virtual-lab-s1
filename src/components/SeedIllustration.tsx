export function SeedIllustration() {
  return <svg className="seed-art" viewBox="0 0 420 360" role="img" aria-label="Biji benih dengan testa, radikel dan pucuk muda">
    <defs><linearGradient id="seed" x2="1" y2="1"><stop stopColor="#d9b47a"/><stop offset="1" stopColor="#9b6238"/></linearGradient></defs>
    <circle cx="220" cy="174" r="135" fill="#e1eddf"/><circle cx="220" cy="174" r="113" fill="none" stroke="#c9dbc7" strokeDasharray="3 9"/>
    <path d="M214 172C198 142 211 110 237 80" fill="none" stroke="#4f8855" strokeWidth="9" strokeLinecap="round"/>
    <path d="M223 111C179 106 167 74 174 57C207 55 231 76 223 111M227 98C230 65 255 49 281 57C277 87 255 104 227 98" fill="#719e65"/>
    <path d="M223 189C217 226 181 231 190 267C193 281 208 285 203 300" fill="none" stroke="#f8f3dc" strokeWidth="11" strokeLinecap="round"/>
    <path d="M202 165C157 145 151 182 171 211C192 239 230 222 244 196C257 170 239 149 220 157Z" fill="url(#seed)" stroke="#96613c" strokeWidth="2"/>
    <path d="M214 161C207 179 210 201 227 210" fill="none" stroke="#eed4a9" strokeWidth="4"/>
    <g fill="none" stroke="#82968b" strokeWidth="1.5"><path d="M259 68H325V53"/><path d="M171 191H95V175"/><path d="M192 263H305V281"/></g>
    <g fill="#456457" fontSize="13" fontFamily="system-ui"><text x="299" y="43">PUCUK</text><text x="63" y="165">TESTA</text><text x="282" y="302">RADIKEL</text></g>
  </svg>;
}
