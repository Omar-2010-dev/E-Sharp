// E# Lexer v2 - Simplified syntax

export enum TokenType {
  NUMBER,
  STRING,
  BOOLEAN,
  IDENTIFIER,
  PLUS,
  MINUS,
  STAR,
  SLASH,
  PERCENT,
  PLUSPLUS,
  MINUSMINUS,
  PLUSEQ,
  MINUSEQ,
  STAREQ,
  SLASHEQ,
  EQ,
  NEQ,
  LT,
  GT,
  LTE,
  GTE,
  AND,
  OR,
  NOT,
  ASSIGN,
  COMMA,
  LPAREN,
  RPAREN,
  LBRACKET,
  RBRACKET,
  LBRACE,
  RBRACE,
  COLON,
  DOT,
  // Keywords
  SAY,
  SET, // أمر تعريف المتغيرات الجديد
  ASK,
  IF,
  ELSE,
  WHILE,
  LOOP,
  FOR,
  IN,
  FUNC,
  RETURN,
  CLASS,
  NEW,
  THIS,
  EXTENDS,
  TRY,
  CATCH,
  END,
  BREAK, // إضافة جديدة للتحكم في اللوب
  CONTINUE, // إضافة جديدة للتحكم في اللوب
  TRUE,
  FALSE,
  NOTHING,
  // === الإضافات الجديدة ===
  QUESTION, // للـ Ternary Operator `?`
  ARROW, // للـ Arrow Functions `=>`
  EOF
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
}

const KEYWORDS: Record<string, TokenType> = {
  say: TokenType.SAY,
  set: TokenType.SET, // ربطنا الكلمة بالرمز بتاعها
  ask: TokenType.ASK,
  if: TokenType.IF,
  else: TokenType.ELSE,
  while: TokenType.WHILE,
  loop: TokenType.LOOP,
  for: TokenType.FOR,
  in: TokenType.IN,
  func: TokenType.FUNC,
  return: TokenType.RETURN,
  class: TokenType.CLASS,
  new: TokenType.NEW,
  this: TokenType.THIS,
  extends: TokenType.EXTENDS,
  try: TokenType.TRY,
  catch: TokenType.CATCH,
  break: TokenType.BREAK,
  continue: TokenType.CONTINUE,
  end: TokenType.END,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  nothing: TokenType.NOTHING,
  and: TokenType.AND,
  or: TokenType.OR,
  not: TokenType.NOT,
  plus: TokenType.PLUS,
  minus: TokenType.MINUS,
  mod: TokenType.PERCENT,
  times: TokenType.STAR
};

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;

  const peek = () => (pos < source.length ? source[pos] : '\0');

  while (pos < source.length) {
    const ch = source[pos];

    // Whitespace
    if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
      if (ch === '\n') line++;
      pos++;
      continue;
    }

    // Comments
    if (ch === '/' && source[pos + 1] === '/') {
      while (pos < source.length && source[pos] !== '\n') pos++;
      continue;
    }

    // Numbers
    if (ch >= '0' && ch <= '9') {
      let num = '';
      while (
        pos < source.length &&
        ((source[pos] >= '0' && source[pos] <= '9') || source[pos] === '.')
      )
        num += source[pos++];
      tokens.push({ type: TokenType.NUMBER, value: num, line });
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const q = source[pos++];
      let str = '';
      while (pos < source.length && source[pos] !== q) {
        if (source[pos] === '\\') {
          pos++;
          const escaped = source[pos++];
          // هنا بنعالج الرموز الخاصة زي سطر جديد أو مسافة
          if (escaped === 'n') str += '\n';
          else if (escaped === 't') str += '\t';
          else if (escaped === 'r') str += '\r';
          else str += escaped;
        } else str += source[pos++];
      }
      if (pos < source.length) pos++;
      tokens.push({ type: TokenType.STRING, value: str, line });
      continue;
    }

    // Identifiers & keywords
    if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
      let id = '';
      while (
        pos < source.length &&
        ((source[pos] >= 'a' && source[pos] <= 'z') ||
          (source[pos] >= 'A' && source[pos] <= 'Z') ||
          (source[pos] >= '0' && source[pos] <= '9') ||
          source[pos] === '_')
      )
        id += source[pos++];

      const lower = id.toLowerCase();
      const kw = KEYWORDS[lower];
      tokens.push({
        type: kw !== undefined ? kw : TokenType.IDENTIFIER,
        value: kw !== undefined ? lower : id,
        line
      });
      continue;
    }

    // Symbols
    pos++;
    switch (ch) {
      case '?':
        tokens.push({ type: TokenType.QUESTION, value: '?', line });
        break;
      case ',':
        tokens.push({ type: TokenType.COMMA, value: ',', line });
        break;
      case '(':
        tokens.push({ type: TokenType.LPAREN, value: '(', line });
        break;
      case ')':
        tokens.push({ type: TokenType.RPAREN, value: ')', line });
        break;
      case '[':
        tokens.push({ type: TokenType.LBRACKET, value: '[', line });
        break;
      case ']':
        tokens.push({ type: TokenType.RBRACKET, value: ']', line });
        break;
      case '.':
        tokens.push({ type: TokenType.DOT, value: '.', line });
        break;
      case '{':
        tokens.push({ type: TokenType.LBRACE, value: '{', line });
        break;
      case '}':
        tokens.push({ type: TokenType.RBRACE, value: '}', line });
        break;
      case ':':
        tokens.push({ type: TokenType.COLON, value: ':', line });
        break;
      case '+':
        if (peek() === '+') {
          pos++;
          tokens.push({ type: TokenType.PLUSPLUS, value: '++', line });
        } else if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.PLUSEQ, value: '+=', line });
        } else tokens.push({ type: TokenType.PLUS, value: '+', line });
        break;
      case '-':
        if (peek() === '-') {
          pos++;
          tokens.push({ type: TokenType.MINUSMINUS, value: '--', line });
        } else if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.MINUSEQ, value: '-=', line });
        } else tokens.push({ type: TokenType.MINUS, value: '-', line });
        break;
      case '*':
        if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.STAREQ, value: '*=', line });
        } else tokens.push({ type: TokenType.STAR, value: '*', line });
        break;
      case '/':
        if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.SLASHEQ, value: '/=', line });
        } else tokens.push({ type: TokenType.SLASH, value: '/', line });
        break;
      case '%':
        tokens.push({ type: TokenType.PERCENT, value: '%', line });
        break;
      case '=':
        if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.EQ, value: '==', line });
        }
        // هنا المكان الصح للسهم عشان يفهم => صح
        else if (peek() === '>') {
          pos++;
          tokens.push({ type: TokenType.ARROW, value: '=>', line });
        } else tokens.push({ type: TokenType.ASSIGN, value: '=', line });
        break;
      case '!':
        if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.NEQ, value: '!=', line });
        } else tokens.push({ type: TokenType.NOT, value: '!', line });
        break;
      case '<':
        if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.LTE, value: '<=', line });
        } else tokens.push({ type: TokenType.LT, value: '<', line });
        break;
      case '>':
        if (peek() === '=') {
          pos++;
          tokens.push({ type: TokenType.GTE, value: '>=', line });
        } else tokens.push({ type: TokenType.GT, value: '>', line });
        break;
      case '&':
        if (peek() === '&') {
          pos++;
          tokens.push({ type: TokenType.AND, value: '&&', line });
        }
        break;
      case '|':
        if (peek() === '|') {
          pos++;
          tokens.push({ type: TokenType.OR, value: '||', line });
        }
        break;
    }
  }

  tokens.push({ type: TokenType.EOF, value: '', line });
  return tokens;
}
