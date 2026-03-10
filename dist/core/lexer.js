"use strict";
// E# Lexer v2 - Simplified syntax
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
exports.tokenize = tokenize;
var TokenType;
(function (TokenType) {
    TokenType[TokenType["NUMBER"] = 0] = "NUMBER";
    TokenType[TokenType["STRING"] = 1] = "STRING";
    TokenType[TokenType["BOOLEAN"] = 2] = "BOOLEAN";
    TokenType[TokenType["IDENTIFIER"] = 3] = "IDENTIFIER";
    TokenType[TokenType["PLUS"] = 4] = "PLUS";
    TokenType[TokenType["MINUS"] = 5] = "MINUS";
    TokenType[TokenType["STAR"] = 6] = "STAR";
    TokenType[TokenType["SLASH"] = 7] = "SLASH";
    TokenType[TokenType["PERCENT"] = 8] = "PERCENT";
    TokenType[TokenType["PLUSPLUS"] = 9] = "PLUSPLUS";
    TokenType[TokenType["MINUSMINUS"] = 10] = "MINUSMINUS";
    TokenType[TokenType["PLUSEQ"] = 11] = "PLUSEQ";
    TokenType[TokenType["MINUSEQ"] = 12] = "MINUSEQ";
    TokenType[TokenType["STAREQ"] = 13] = "STAREQ";
    TokenType[TokenType["SLASHEQ"] = 14] = "SLASHEQ";
    TokenType[TokenType["EQ"] = 15] = "EQ";
    TokenType[TokenType["NEQ"] = 16] = "NEQ";
    TokenType[TokenType["LT"] = 17] = "LT";
    TokenType[TokenType["GT"] = 18] = "GT";
    TokenType[TokenType["LTE"] = 19] = "LTE";
    TokenType[TokenType["GTE"] = 20] = "GTE";
    TokenType[TokenType["AND"] = 21] = "AND";
    TokenType[TokenType["OR"] = 22] = "OR";
    TokenType[TokenType["NOT"] = 23] = "NOT";
    TokenType[TokenType["ASSIGN"] = 24] = "ASSIGN";
    TokenType[TokenType["COMMA"] = 25] = "COMMA";
    TokenType[TokenType["LPAREN"] = 26] = "LPAREN";
    TokenType[TokenType["RPAREN"] = 27] = "RPAREN";
    TokenType[TokenType["LBRACKET"] = 28] = "LBRACKET";
    TokenType[TokenType["RBRACKET"] = 29] = "RBRACKET";
    TokenType[TokenType["LBRACE"] = 30] = "LBRACE";
    TokenType[TokenType["RBRACE"] = 31] = "RBRACE";
    TokenType[TokenType["COLON"] = 32] = "COLON";
    TokenType[TokenType["DOT"] = 33] = "DOT";
    // Keywords
    TokenType[TokenType["SAY"] = 34] = "SAY";
    TokenType[TokenType["SET"] = 35] = "SET";
    TokenType[TokenType["ASK"] = 36] = "ASK";
    TokenType[TokenType["IF"] = 37] = "IF";
    TokenType[TokenType["ELSE"] = 38] = "ELSE";
    TokenType[TokenType["WHILE"] = 39] = "WHILE";
    TokenType[TokenType["LOOP"] = 40] = "LOOP";
    TokenType[TokenType["FOR"] = 41] = "FOR";
    TokenType[TokenType["IN"] = 42] = "IN";
    TokenType[TokenType["FUNC"] = 43] = "FUNC";
    TokenType[TokenType["RETURN"] = 44] = "RETURN";
    TokenType[TokenType["CLASS"] = 45] = "CLASS";
    TokenType[TokenType["NEW"] = 46] = "NEW";
    TokenType[TokenType["THIS"] = 47] = "THIS";
    TokenType[TokenType["EXTENDS"] = 48] = "EXTENDS";
    TokenType[TokenType["TRY"] = 49] = "TRY";
    TokenType[TokenType["CATCH"] = 50] = "CATCH";
    TokenType[TokenType["END"] = 51] = "END";
    TokenType[TokenType["BREAK"] = 52] = "BREAK";
    TokenType[TokenType["CONTINUE"] = 53] = "CONTINUE";
    TokenType[TokenType["TRUE"] = 54] = "TRUE";
    TokenType[TokenType["FALSE"] = 55] = "FALSE";
    TokenType[TokenType["NOTHING"] = 56] = "NOTHING";
    // === الإضافات الجديدة ===
    TokenType[TokenType["QUESTION"] = 57] = "QUESTION";
    TokenType[TokenType["ARROW"] = 58] = "ARROW";
    TokenType[TokenType["EOF"] = 59] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
const KEYWORDS = {
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
function tokenize(source) {
    const tokens = [];
    let pos = 0;
    let line = 1;
    const peek = () => (pos < source.length ? source[pos] : '\0');
    while (pos < source.length) {
        const ch = source[pos];
        // Whitespace
        if (ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n') {
            if (ch === '\n')
                line++;
            pos++;
            continue;
        }
        // Comments
        if (ch === '/' && source[pos + 1] === '/') {
            while (pos < source.length && source[pos] !== '\n')
                pos++;
            continue;
        }
        // Numbers
        if (ch >= '0' && ch <= '9') {
            let num = '';
            while (pos < source.length &&
                ((source[pos] >= '0' && source[pos] <= '9') || source[pos] === '.'))
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
                    if (escaped === 'n')
                        str += '\n';
                    else if (escaped === 't')
                        str += '\t';
                    else if (escaped === 'r')
                        str += '\r';
                    else
                        str += escaped;
                }
                else
                    str += source[pos++];
            }
            if (pos < source.length)
                pos++;
            tokens.push({ type: TokenType.STRING, value: str, line });
            continue;
        }
        // Identifiers & keywords
        if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_') {
            let id = '';
            while (pos < source.length &&
                ((source[pos] >= 'a' && source[pos] <= 'z') ||
                    (source[pos] >= 'A' && source[pos] <= 'Z') ||
                    (source[pos] >= '0' && source[pos] <= '9') ||
                    source[pos] === '_'))
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
                }
                else if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.PLUSEQ, value: '+=', line });
                }
                else
                    tokens.push({ type: TokenType.PLUS, value: '+', line });
                break;
            case '-':
                if (peek() === '-') {
                    pos++;
                    tokens.push({ type: TokenType.MINUSMINUS, value: '--', line });
                }
                else if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.MINUSEQ, value: '-=', line });
                }
                else
                    tokens.push({ type: TokenType.MINUS, value: '-', line });
                break;
            case '*':
                if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.STAREQ, value: '*=', line });
                }
                else
                    tokens.push({ type: TokenType.STAR, value: '*', line });
                break;
            case '/':
                if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.SLASHEQ, value: '/=', line });
                }
                else
                    tokens.push({ type: TokenType.SLASH, value: '/', line });
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
                }
                else
                    tokens.push({ type: TokenType.ASSIGN, value: '=', line });
                break;
            case '!':
                if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.NEQ, value: '!=', line });
                }
                else
                    tokens.push({ type: TokenType.NOT, value: '!', line });
                break;
            case '<':
                if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.LTE, value: '<=', line });
                }
                else
                    tokens.push({ type: TokenType.LT, value: '<', line });
                break;
            case '>':
                if (peek() === '=') {
                    pos++;
                    tokens.push({ type: TokenType.GTE, value: '>=', line });
                }
                else
                    tokens.push({ type: TokenType.GT, value: '>', line });
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
