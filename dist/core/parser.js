"use strict";
// E# Parser v2 - Curly brace syntax
// x = 5
// say "hello"
// if x > 3 { ... }
// while x > 0 { ... }
// loop 5 { ... }
// func name(a, b) { ... }
// class Name { ... }
// x++/--
// x += 1
Object.defineProperty(exports, "__esModule", { value: true });
exports.parse = parse;
const lexer_1 = require("./lexer");
function parse(source) {
    const tokens = (0, lexer_1.tokenize)(source);
    let pos = 0;
    const current = () => tokens[pos] || { type: lexer_1.TokenType.EOF, value: '', line: 0 };
    const peek = (offset = 0) => tokens[pos + offset] || { type: lexer_1.TokenType.EOF, value: '', line: 0 };
    const advance = () => tokens[pos++];
    const expect = (type, msg) => {
        const t = current();
        if (t.type !== type)
            throw new Error(`Line ${t.line}: Expected ${msg || lexer_1.TokenType[type]} but got '${t.value}'`);
        return advance();
    };
    const match = (type) => {
        if (current().type === type) {
            advance();
            return true;
        }
        return false;
    };
    function parseProgram() {
        const body = [];
        while (current().type !== lexer_1.TokenType.EOF) {
            body.push(parseStatement());
        }
        return { type: 'Program', body, line: 1 };
    }
    // === دوال مساعدة جديدة ===
    // دالة بتشوف هل اللي جاي ده شكل دالة سهم `(...) =>`
    function isArrowCandidate() {
        if (current().type !== lexer_1.TokenType.LPAREN)
            return false;
        // بنعد الأقواس عشان نتأكد إننا بنبص بعد القوس المقفول صح
        let parenLevel = 1;
        let i = pos + 1;
        while (i < tokens.length && parenLevel > 0) {
            if (tokens[i].type === lexer_1.TokenType.LPAREN)
                parenLevel++;
            if (tokens[i].type === lexer_1.TokenType.RPAREN)
                parenLevel--;
            i++;
        }
        // لو اللي بعد القوس هو سهم `=>` يبقى دي دالة سهم
        return tokens[i]?.type === lexer_1.TokenType.ARROW;
    }
    // دالة بتبني الـ AST لدالة السهم
    function parseArrowFunction() {
        const line = current().line;
        expect(lexer_1.TokenType.LPAREN, '"("');
        const params = [];
        if (current().type !== lexer_1.TokenType.RPAREN) {
            params.push(expect(lexer_1.TokenType.IDENTIFIER, 'parameter').value);
            while (match(lexer_1.TokenType.COMMA)) {
                params.push(expect(lexer_1.TokenType.IDENTIFIER, 'parameter').value);
            }
        }
        expect(lexer_1.TokenType.RPAREN, '")"');
        expect(lexer_1.TokenType.ARROW, '"=>"');
        let body;
        if (current().type === lexer_1.TokenType.LBRACE) {
            body = parseBraceBlock(); // لو الجسم عبارة عن بلوك كامل `{...}`
        }
        else {
            body = [{ type: 'ReturnStatement', value: parseExpression(), line }]; // لو الجسم تعبير واحد، بنعمل return ضمني
        }
        return { type: 'ArrowFunctionExpr', params, body, line };
    }
    // Parse statements inside { }
    function parseBraceBlock() {
        expect(lexer_1.TokenType.LBRACE, '"{"');
        const body = [];
        while (current().type !== lexer_1.TokenType.RBRACE && current().type !== lexer_1.TokenType.EOF) {
            body.push(parseStatement());
        }
        expect(lexer_1.TokenType.RBRACE, '"}"');
        return body;
    }
    function parseStatement() {
        const t = current();
        const line = t.line;
        if (t.type === lexer_1.TokenType.SET)
            return parseVarDeclaration(); // لو لقينا set ننفذ دالة التعريف
        if (t.type === lexer_1.TokenType.SAY)
            return parseSay();
        if (t.type === lexer_1.TokenType.IF)
            return parseIf();
        if (t.type === lexer_1.TokenType.WHILE)
            return parseWhile();
        if (t.type === lexer_1.TokenType.LOOP)
            return parseLoop();
        if (t.type === lexer_1.TokenType.FOR)
            return parseFor();
        if (t.type === lexer_1.TokenType.FUNC)
            return parseFunc();
        if (t.type === lexer_1.TokenType.CLASS)
            return parseClass();
        if (t.type === lexer_1.TokenType.RETURN)
            return parseReturn();
        if (t.type === lexer_1.TokenType.TRY)
            return parseTry();
        if (t.type === lexer_1.TokenType.BREAK)
            return parseBreak();
        if (t.type === lexer_1.TokenType.CONTINUE)
            return parseContinue();
        // Assignment: this.prop = value
        if (t.type === lexer_1.TokenType.THIS &&
            peek(1).type === lexer_1.TokenType.DOT &&
            peek(2).type === lexer_1.TokenType.IDENTIFIER &&
            peek(3).type === lexer_1.TokenType.ASSIGN) {
            advance();
            advance();
            const prop = advance().value;
            advance();
            const value = parseExpression();
            return {
                type: 'AssignProperty',
                object: { type: 'ThisExpr', line },
                property: prop,
                value,
                line
            };
        }
        // x++ or x--
        if (t.type === lexer_1.TokenType.IDENTIFIER &&
            (peek(1).type === lexer_1.TokenType.PLUSPLUS || peek(1).type === lexer_1.TokenType.MINUSMINUS)) {
            const name = advance().value;
            const op = advance().type === lexer_1.TokenType.PLUSPLUS ? '+' : '-';
            return {
                type: 'Assignment',
                name,
                value: {
                    type: 'BinaryExpr',
                    op,
                    left: { type: 'Identifier', name, line },
                    right: { type: 'NumberLiteral', value: 1, line },
                    line
                },
                line
            };
        }
        // x += val, x -= val, x *= val, x /= val
        if (t.type === lexer_1.TokenType.IDENTIFIER &&
            [lexer_1.TokenType.PLUSEQ, lexer_1.TokenType.MINUSEQ, lexer_1.TokenType.STAREQ, lexer_1.TokenType.SLASHEQ].includes(peek(1).type)) {
            const name = advance().value;
            const opToken = advance();
            const op = opToken.type === lexer_1.TokenType.PLUSEQ
                ? '+'
                : opToken.type === lexer_1.TokenType.MINUSEQ
                    ? '-'
                    : opToken.type === lexer_1.TokenType.STAREQ
                        ? '*'
                        : '/';
            const value = parseExpression();
            return {
                type: 'Assignment',
                name,
                value: {
                    type: 'BinaryExpr',
                    op,
                    left: { type: 'Identifier', name, line },
                    right: value,
                    line
                },
                line
            };
        }
        // Assignment: name = value
        if (t.type === lexer_1.TokenType.IDENTIFIER && peek(1).type === lexer_1.TokenType.ASSIGN) {
            const name = advance().value;
            advance();
            const value = parseExpression();
            return { type: 'Assignment', name, value, line };
        }
        // Assignment: name.prop = value OR name.prop += value OR name.prop++
        if (t.type === lexer_1.TokenType.IDENTIFIER &&
            peek(1).type === lexer_1.TokenType.DOT &&
            peek(2).type === lexer_1.TokenType.IDENTIFIER) {
            const opType = peek(3).type;
            // 1. التعامل مع ++ و -- (زي player.x++)
            if (opType === lexer_1.TokenType.PLUSPLUS || opType === lexer_1.TokenType.MINUSMINUS) {
                const name = advance().value;
                advance(); // .
                const prop = advance().value;
                const op = advance().type === lexer_1.TokenType.PLUSPLUS ? '+' : '-';
                return {
                    type: 'AssignProperty',
                    object: { type: 'Identifier', name, line },
                    property: prop,
                    value: {
                        type: 'BinaryExpr',
                        op: op,
                        left: {
                            type: 'PropertyAccess',
                            object: { type: 'Identifier', name, line },
                            property: prop,
                            line
                        },
                        right: { type: 'NumberLiteral', value: 1, line },
                        line
                    },
                    line
                };
            }
            // 2. التعامل مع +=, -=, *=, /=, =
            if ([
                lexer_1.TokenType.ASSIGN,
                lexer_1.TokenType.PLUSEQ,
                lexer_1.TokenType.MINUSEQ,
                lexer_1.TokenType.STAREQ,
                lexer_1.TokenType.SLASHEQ
            ].includes(opType)) {
                const name = advance().value;
                advance(); // .
                const prop = advance().value;
                const opTok = advance();
                let value = parseExpression();
                // لو العملية مش مجرد يساوي (=)، بنحولها لعملية حسابية
                if (opTok.type !== lexer_1.TokenType.ASSIGN) {
                    const op = opTok.type === lexer_1.TokenType.PLUSEQ
                        ? '+'
                        : opTok.type === lexer_1.TokenType.MINUSEQ
                            ? '-'
                            : opTok.type === lexer_1.TokenType.STAREQ
                                ? '*'
                                : '/';
                    value = {
                        type: 'BinaryExpr',
                        op,
                        left: {
                            type: 'PropertyAccess',
                            object: { type: 'Identifier', name, line },
                            property: prop,
                            line
                        },
                        right: value,
                        line
                    };
                }
                return {
                    type: 'AssignProperty',
                    object: { type: 'Identifier', name, line },
                    property: prop,
                    value,
                    line
                };
            }
        }
        // Index assignment: arr[0] = value OR arr[0] += value OR arr[0]++
        if (t.type === lexer_1.TokenType.IDENTIFIER && peek(1).type === lexer_1.TokenType.LBRACKET) {
            const name = advance().value;
            advance();
            const index = parseExpression();
            expect(lexer_1.TokenType.RBRACKET, '"]"');
            const nextT = current();
            // 1. التعامل مع ++ و -- للقوائم (زي list[0]++)
            if (nextT.type === lexer_1.TokenType.PLUSPLUS || nextT.type === lexer_1.TokenType.MINUSMINUS) {
                const op = advance().type === lexer_1.TokenType.PLUSPLUS ? '+' : '-';
                return {
                    type: 'AssignIndex',
                    object: { type: 'Identifier', name, line },
                    index,
                    value: {
                        type: 'BinaryExpr',
                        op,
                        left: { type: 'IndexAccess', object: { type: 'Identifier', name, line }, index, line },
                        right: { type: 'NumberLiteral', value: 1, line },
                        line
                    },
                    line
                };
            }
            // 2. التعامل مع +=, -=, *=, /=, = للقوائم
            if ([
                lexer_1.TokenType.ASSIGN,
                lexer_1.TokenType.PLUSEQ,
                lexer_1.TokenType.MINUSEQ,
                lexer_1.TokenType.STAREQ,
                lexer_1.TokenType.SLASHEQ
            ].includes(nextT.type)) {
                const opTok = advance();
                let value = parseExpression();
                if (opTok.type !== lexer_1.TokenType.ASSIGN) {
                    const op = opTok.type === lexer_1.TokenType.PLUSEQ
                        ? '+'
                        : opTok.type === lexer_1.TokenType.MINUSEQ
                            ? '-'
                            : opTok.type === lexer_1.TokenType.STAREQ
                                ? '*'
                                : '/';
                    value = {
                        type: 'BinaryExpr',
                        op,
                        left: { type: 'IndexAccess', object: { type: 'Identifier', name, line }, index, line },
                        right: value,
                        line
                    };
                }
                return {
                    type: 'AssignIndex',
                    object: { type: 'Identifier', name, line },
                    index,
                    value,
                    line
                };
            }
            let expr = {
                type: 'IndexAccess',
                object: { type: 'Identifier', name, line },
                index,
                line
            };
            expr = parsePostfixContinue(expr);
            return expr;
        }
        return parseExpressionStatement();
    }
    // دالة قراءة تعريف المتغير (set x = val)
    function parseVarDeclaration() {
        const line = current().line;
        advance(); // نتخطى كلمة set
        const name = expect(lexer_1.TokenType.IDENTIFIER, 'variable name').value;
        expect(lexer_1.TokenType.ASSIGN, '"="');
        const value = parseExpression();
        return { type: 'VarDeclaration', name, value, line };
    }
    function parseSay() {
        const line = current().line;
        advance();
        return { type: 'SayStatement', value: parseExpression(), line };
    }
    function parseIf() {
        const line = current().line;
        advance(); // if
        const condition = parseExpression();
        const thenBody = parseBraceBlock();
        let elseBody = [];
        if (match(lexer_1.TokenType.ELSE)) {
            if (current().type === lexer_1.TokenType.IF) {
                // else if → nested if inside elseBody
                elseBody = [parseIf()];
            }
            else {
                elseBody = parseBraceBlock();
            }
        }
        return { type: 'IfStatement', condition, thenBody, elseBody, line };
    }
    function parseWhile() {
        const line = current().line;
        advance();
        const condition = parseExpression();
        const body = parseBraceBlock();
        return { type: 'WhileStatement', condition, body, line };
    }
    function parseLoop() {
        const line = current().line;
        advance();
        const count = parseExpression();
        const body = parseBraceBlock();
        return { type: 'LoopStatement', count, body, line };
    }
    function parseFor() {
        const line = current().line;
        advance(); // for
        const varName = expect(lexer_1.TokenType.IDENTIFIER, 'variable name').value;
        expect(lexer_1.TokenType.IN, '"in"');
        const iterable = parseExpression();
        const body = parseBraceBlock();
        return { type: 'ForInStatement', varName, iterable, body, line };
    }
    function parseFunc() {
        const line = current().line;
        advance();
        const name = expect(lexer_1.TokenType.IDENTIFIER, 'function name').value;
        expect(lexer_1.TokenType.LPAREN, '"("');
        const params = [];
        if (current().type !== lexer_1.TokenType.RPAREN) {
            params.push(expect(lexer_1.TokenType.IDENTIFIER, 'parameter').value);
            while (match(lexer_1.TokenType.COMMA))
                params.push(expect(lexer_1.TokenType.IDENTIFIER, 'parameter').value);
        }
        expect(lexer_1.TokenType.RPAREN, '")"');
        const body = parseBraceBlock();
        return { type: 'FunctionDef', name, params, body, line };
    }
    function parseClass() {
        const line = current().line;
        advance();
        const name = expect(lexer_1.TokenType.IDENTIFIER, 'class name').value;
        let parent = null;
        if (match(lexer_1.TokenType.EXTENDS))
            parent = expect(lexer_1.TokenType.IDENTIFIER, 'parent class').value;
        expect(lexer_1.TokenType.LBRACE, '"{"');
        const methods = [];
        while (current().type !== lexer_1.TokenType.RBRACE && current().type !== lexer_1.TokenType.EOF) {
            if (current().type === lexer_1.TokenType.FUNC) {
                const mLine = current().line;
                advance();
                const mname = expect(lexer_1.TokenType.IDENTIFIER, 'method name').value;
                expect(lexer_1.TokenType.LPAREN, '"("');
                const params = [];
                if (current().type !== lexer_1.TokenType.RPAREN) {
                    params.push(expect(lexer_1.TokenType.IDENTIFIER, 'parameter').value);
                    while (match(lexer_1.TokenType.COMMA))
                        params.push(expect(lexer_1.TokenType.IDENTIFIER, 'parameter').value);
                }
                expect(lexer_1.TokenType.RPAREN, '")"');
                const body = parseBraceBlock();
                methods.push({ type: 'FunctionDef', name: mname, params, body, line: mLine });
            }
            else {
                throw new Error(`Line ${current().line}: Expected 'func' inside class, got '${current().value}'`);
            }
        }
        expect(lexer_1.TokenType.RBRACE, '"}"');
        return { type: 'ClassDef', name, parent, methods, line };
    }
    function parseReturn() {
        const line = current().line;
        advance();
        const t = current();
        if (t.type === lexer_1.TokenType.RBRACE || t.type === lexer_1.TokenType.EOF)
            return { type: 'ReturnStatement', value: null, line };
        return { type: 'ReturnStatement', value: parseExpression(), line };
    }
    function parseTry() {
        const line = current().line;
        advance();
        const tryBody = parseBraceBlock();
        expect(lexer_1.TokenType.CATCH, '"catch"');
        let errorVar = 'err';
        if (current().type === lexer_1.TokenType.IDENTIFIER)
            errorVar = advance().value;
        const catchBody = parseBraceBlock();
        return { type: 'TryStatement', tryBody, errorVar, catchBody, line };
    }
    // دالتين جداد عشان break و continue
    function parseBreak() {
        const line = current().line;
        advance(); // نتخطى كلمة break
        return { type: 'BreakStatement', line };
    }
    function parseContinue() {
        const line = current().line;
        advance(); // نتخطى كلمة continue
        return { type: 'ContinueStatement', line };
    }
    function parseExpressionStatement() {
        return parseExpression();
    }
    function parseExpression() {
        return parseConditional();
    }
    // دالة جديدة بتعالج الـ Ternary Operator
    function parseConditional() {
        let expr = parseOr();
        if (match(lexer_1.TokenType.QUESTION)) {
            const line = tokens[pos - 1].line;
            const thenExpr = parseExpression();
            expect(lexer_1.TokenType.COLON, '":" for ternary operator');
            const elseExpr = parseConditional(); // عشان نسمح بـ a ? b : c ? d : e
            return { type: 'ConditionalExpr', condition: expr, thenExpr, elseExpr, line };
        }
        return expr;
    }
    function parseOr() {
        let left = parseAnd();
        while (current().type === lexer_1.TokenType.OR) {
            const t = advance();
            left = { type: 'BinaryExpr', op: 'or', left, right: parseAnd(), line: t.line };
        }
        return left;
    }
    function parseAnd() {
        let left = parseNot();
        while (current().type === lexer_1.TokenType.AND) {
            const t = advance();
            left = { type: 'BinaryExpr', op: 'and', left, right: parseNot(), line: t.line };
        }
        return left;
    }
    function parseNot() {
        if (current().type === lexer_1.TokenType.NOT) {
            const t = advance();
            return { type: 'UnaryExpr', op: 'not', operand: parseNot(), line: t.line };
        }
        return parseComparison();
    }
    function parseComparison() {
        let left = parseAddition();
        while ([
            lexer_1.TokenType.EQ,
            lexer_1.TokenType.NEQ,
            lexer_1.TokenType.LT,
            lexer_1.TokenType.GT,
            lexer_1.TokenType.LTE,
            lexer_1.TokenType.GTE
        ].includes(current().type)) {
            const t = advance();
            const op = t.type === lexer_1.TokenType.EQ
                ? '=='
                : t.type === lexer_1.TokenType.NEQ
                    ? '!='
                    : t.type === lexer_1.TokenType.LT
                        ? '<'
                        : t.type === lexer_1.TokenType.GT
                            ? '>'
                            : t.type === lexer_1.TokenType.LTE
                                ? '<='
                                : '>=';
            left = { type: 'BinaryExpr', op, left, right: parseAddition(), line: t.line };
        }
        return left;
    }
    function parseAddition() {
        let left = parseMultiplication();
        while (current().type === lexer_1.TokenType.PLUS || current().type === lexer_1.TokenType.MINUS) {
            const t = advance();
            const op = t.type === lexer_1.TokenType.PLUS ? '+' : '-';
            left = { type: 'BinaryExpr', op, left, right: parseMultiplication(), line: t.line };
        }
        return left;
    }
    function parseMultiplication() {
        let left = parseUnary();
        while (current().type === lexer_1.TokenType.STAR ||
            current().type === lexer_1.TokenType.SLASH ||
            current().type === lexer_1.TokenType.PERCENT) {
            const t = advance();
            const op = t.type === lexer_1.TokenType.STAR ? '*' : t.type === lexer_1.TokenType.SLASH ? '/' : '%';
            left = { type: 'BinaryExpr', op, left, right: parseUnary(), line: t.line };
        }
        return left;
    }
    function parseUnary() {
        if (current().type === lexer_1.TokenType.MINUS) {
            const t = advance();
            return { type: 'UnaryExpr', op: '-', operand: parseUnary(), line: t.line };
        }
        return parsePostfix();
    }
    function parsePostfixContinue(expr) {
        while (true) {
            if (current().type === lexer_1.TokenType.DOT && peek(1).type === lexer_1.TokenType.IDENTIFIER) {
                const line = current().line;
                advance();
                const prop = advance().value;
                if (current().type === lexer_1.TokenType.LPAREN) {
                    advance();
                    const args = [];
                    if (current().type !== lexer_1.TokenType.RPAREN) {
                        args.push(parseExpression());
                        while (match(lexer_1.TokenType.COMMA))
                            args.push(parseExpression());
                    }
                    expect(lexer_1.TokenType.RPAREN, '")"');
                    expr = { type: 'MethodCall', object: expr, method: prop, args, line };
                }
                else {
                    expr = { type: 'PropertyAccess', object: expr, property: prop, line };
                }
            }
            else if (current().type === lexer_1.TokenType.LBRACKET) {
                const line = current().line;
                advance();
                const index = parseExpression();
                expect(lexer_1.TokenType.RBRACKET, '"]"');
                expr = { type: 'IndexAccess', object: expr, index, line };
            }
            else
                break;
        }
        return expr;
    }
    function parsePostfix() {
        let expr = parsePrimary();
        return parsePostfixContinue(expr);
    }
    function parsePrimary() {
        const t = current();
        const line = t.line;
        if (t.type === lexer_1.TokenType.NUMBER) {
            advance();
            return { type: 'NumberLiteral', value: parseFloat(t.value), line };
        }
        if (t.type === lexer_1.TokenType.STRING) {
            advance();
            return { type: 'StringLiteral', value: t.value, line };
        }
        if (t.type === lexer_1.TokenType.TRUE) {
            advance();
            return { type: 'BooleanLiteral', value: true, line };
        }
        if (t.type === lexer_1.TokenType.FALSE) {
            advance();
            return { type: 'BooleanLiteral', value: false, line };
        }
        if (t.type === lexer_1.TokenType.NOTHING) {
            advance();
            return { type: 'NothingLiteral', line };
        }
        if (t.type === lexer_1.TokenType.THIS) {
            advance();
            return { type: 'ThisExpr', line };
        }
        if (t.type === lexer_1.TokenType.ASK) {
            advance();
            return { type: 'AskExpr', prompt: parseExpression(), line };
        }
        if (t.type === lexer_1.TokenType.NEW) {
            advance();
            const cls = expect(lexer_1.TokenType.IDENTIFIER, 'class name').value;
            const args = [];
            if (match(lexer_1.TokenType.LPAREN)) {
                if (current().type !== lexer_1.TokenType.RPAREN) {
                    args.push(parseExpression());
                    while (match(lexer_1.TokenType.COMMA))
                        args.push(parseExpression());
                }
                expect(lexer_1.TokenType.RPAREN, '")"');
            }
            return { type: 'NewExpr', className: cls, args, line };
        }
        if (t.type === lexer_1.TokenType.LBRACKET) {
            advance();
            const elements = [];
            if (current().type !== lexer_1.TokenType.RBRACKET) {
                elements.push(parseExpression());
                while (match(lexer_1.TokenType.COMMA))
                    elements.push(parseExpression());
            }
            expect(lexer_1.TokenType.RBRACKET, '"]"');
            return { type: 'ArrayLiteral', elements, line };
        }
        // Dict literal — only parse { as dict if next token suggests key:value
        if (t.type === lexer_1.TokenType.LBRACE) {
            // Look ahead: if it's {} or "key": pattern, treat as dict
            if (peek(1).type === lexer_1.TokenType.RBRACE ||
                (peek(1).type === lexer_1.TokenType.STRING && peek(2).type === lexer_1.TokenType.COLON) ||
                (peek(1).type === lexer_1.TokenType.IDENTIFIER && peek(2).type === lexer_1.TokenType.COLON)) {
                advance();
                const entries = [];
                if (current().type !== lexer_1.TokenType.RBRACE) {
                    const key = parseExpression();
                    expect(lexer_1.TokenType.COLON, '":"');
                    const value = parseExpression();
                    entries.push({ key, value });
                    while (match(lexer_1.TokenType.COMMA)) {
                        const k = parseExpression();
                        expect(lexer_1.TokenType.COLON, '":"');
                        const v = parseExpression();
                        entries.push({ key: k, value: v });
                    }
                }
                expect(lexer_1.TokenType.RBRACE, '"}"');
                return { type: 'DictLiteral', entries, line };
            }
        }
        if (t.type === lexer_1.TokenType.LPAREN) {
            // هنا بنستخدم الدالة المساعدة عشان نعرف هل ده قوس عادي ولا بداية دالة سهم
            if (isArrowCandidate()) {
                return parseArrowFunction();
            }
            // لو مش دالة سهم، يبقى ده تعبير عادي بين قوسين
            advance();
            const expr = parseExpression();
            expect(lexer_1.TokenType.RPAREN, '")"');
            return expr;
        }
        if (t.type === lexer_1.TokenType.IDENTIFIER) {
            const name = advance().value;
            if (current().type === lexer_1.TokenType.LPAREN) {
                advance();
                const args = [];
                if (current().type !== lexer_1.TokenType.RPAREN) {
                    args.push(parseExpression());
                    while (match(lexer_1.TokenType.COMMA))
                        args.push(parseExpression());
                }
                expect(lexer_1.TokenType.RPAREN, '")"');
                return { type: 'FunctionCall', name, args, line };
            }
            return { type: 'Identifier', name, line };
        }
        throw new Error(`Line ${t.line}: Unexpected '${t.value}'`);
    }
    return parseProgram();
}
