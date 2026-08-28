const vscode = require('vscode');
const path = require("path");
const ignoreTypeCheckingUncorrectValueTypeWarning =
    vscode.workspace
        .getConfiguration("gamescript")
        .get("ignoreTypeCheckingUncorrectValueTypeWarning");

//const user_functions = new Map();
const user_variables = new Map()
function getIndent(line) {
    return line.search(/\S|$/);
}
function find_assignment(line){
    let in_string = false
    let depth = 0
    for (const [i, ch] of line.split("").entries()) {
        if (ch === '"'){
            in_string = !in_string
            continue
        }
        if (in_string){
            continue
        }
        if (ch === "("){
            depth += 1
        }
        else if (ch === ")"){
            depth -= 1
        }
            
        else if (ch === "=" && depth === 0){
            return i}
        }
    return -1
}
function activate(context) {
    const runCommand =
        vscode.commands.registerCommand(
            "gamescript.run",
            async () => {
                const editor =
                    vscode.window.activeTextEditor;

                if (!editor) {
                    return;
                }

                await vscode.commands.executeCommand(
                    "workbench.action.files.save"
                );

                const file =
                    editor.document.fileName;

                const runner =
                    path.join(
                        context.extensionPath,
                        "runner.py"
                    );

                const terminal =
                    vscode.window.createTerminal(
                        "GameScript"
                    );

                terminal.show();

                terminal.sendText(
                    `python "${runner}" "${file}"`
                );
            }
        );

    context.subscriptions.push(runCommand);
    const semanticProvider =
        vscode.languages.registerDocumentSemanticTokensProvider(
            ["gs", "gamescript"],
            new GSSemanticTokensProvider(),
            legend
        );

    context.subscriptions.push(
        semanticProvider
    );
    const collection =
        vscode.languages.createDiagnosticCollection("gamescript");

    context.subscriptions.push(collection);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(
            doc => {
                checkGS(doc, collection);
                semanticTokensChanged.fire();
            }
        )
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(
            e => {
                checkGS(e.document, collection);
                semanticTokensChanged.fire();
            }
        )
    );

    const provider =
        vscode.languages.registerCompletionItemProvider(
            ["gs", "gamescript"],
            new GSProvider(),
            "."
        );

    const hoverProvider =
        vscode.languages.registerHoverProvider(
            ["gs", "gamescript"],
            new GSHoverProvider()
        );

    context.subscriptions.push(hoverProvider);
    context.subscriptions.push(provider);
}

class GSProvider {
    provideCompletionItems(document, position) {
        const line =
            document.lineAt(position.line).text;

        const before =
            line.slice(0, position.character);

        const items = [];

        function add(name, kind) {
            items.push(
                new vscode.CompletionItem(name, kind)
            );
        }

        // String. mode
        if (before.endsWith("String.")) {
            add("join", vscode.CompletionItemKind.Method);
            add("length", vscode.CompletionItemKind.Method);
            add("upper", vscode.CompletionItemKind.Method);
            add("lower", vscode.CompletionItemKind.Method);
            add("repeat", vscode.CompletionItemKind.Method);
            add("contains", vscode.CompletionItemKind.Method);

            return items;
        }

        // Normal mode
        add("print", vscode.CompletionItemKind.Function);
        add("printinfo", vscode.CompletionItemKind.Function);
        add("printerr", vscode.CompletionItemKind.Function);
        add("printwarn", vscode.CompletionItemKind.Function);
        add("printbash", vscode.CompletionItemKind.Function);
        add("input", vscode.CompletionItemKind.Function);
        add("versinfo", vscode.CompletionItemKind.Function);
        add("is_integer", vscode.CompletionItemKind.Function);
        add("is_float", vscode.CompletionItemKind.Function);
        add("sum", vscode.CompletionItemKind.Function);
        add("sub", vscode.CompletionItemKind.Function);
        add("mul", vscode.CompletionItemKind.Function);
        add("div", vscode.CompletionItemKind.Function);

        add("String", vscode.CompletionItemKind.Class);
        add("true", vscode.CompletionItemKind.Keyword);
        add("false", vscode.CompletionItemKind.Keyword);
        add("none", vscode.CompletionItemKind.Keyword);
        add("NaN", vscode.CompletionItemKind.Variable);

        const vars =
            user_variables.get(document.uri.toString()) || [];
//
        for (const variable of vars) {
            const item =
            new vscode.CompletionItem(
                variable.name,
                vscode.CompletionItemKind.Variable
            );

            item.detail = variable.type;
                    
            items.push(item);
        }
//
        return items;
    }
}

function checkGS(doc, collection) {
    if (
        doc.languageId !== "gs" &&
        doc.languageId !== "gamescript"
    ) {
        return;
    }

    const diagnostics = [];
    const lines = doc.getText().split("\n");

    const variables = [];

    checkBrackets(lines, diagnostics);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed === "") {
            continue;
        }

        // -------------------------
        // Comments
        // -------------------------

        if (trimmed.startsWith("#")) {
            continue;
        }
        const assignment = find_assignment(line);
            
        if (assignment !== -1) {
            const left = line.slice(0, assignment).trim();
            const value = line.slice(assignment + 1).trim();
        
            const colon = left.indexOf(":");
        
            let name;
            let type = "?";
        
            if (colon !== -1) {
                name = left.slice(0, colon).trim();
                type = left.slice(colon + 1).trim();
            }
            else {
                name = left;
            }
        
            if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
                variables.push({
                    name,
                    type,
                    value
                });
            }
            if ((value.startsWith("\"") && value.endsWith("\"") && type!=="String") || (!value.startsWith("\"") && !value.endsWith("\"") && type==="String" && value!=="?" && value!=="none")){
                if (!ignoreTypeCheckingUncorrectValueTypeWarning){
                    diagnostics.push(
                        new vscode.Diagnostic(
                            new vscode.Range(
                                i,
                                0,
                                i,
                                line.length
                            ),
                            `type is ${type}, but value is not the correct type`,
                            vscode.DiagnosticSeverity.Warning
                        )
                    );
                }
            }
        }
        else if (line.includes(":")) {
            const colon = line.indexOf(":");
        
            const name =
                line.slice(0, colon).trim();
        
            const type =
                line.slice(colon + 1).trim();
        
            if (
                /^[A-Za-z_][A-Za-z0-9_]*$/.test(name) &&
                /^[A-Za-z_?][A-Za-z0-9_?]*$/.test(type)
            ) {
                variables.push({
                    name,
                    type,
                    value: "?"
                });
            }
        }


        //const indent = getIndent(line);
//
        //// -------------------------
        //// Definitions
        //// -------------------------
//
        //if (trimmed.startsWith("def ")) {
        //    if (indent === 0) {
        //        definitionIndent = 4;
        //    }
        //    else if (
        //        definitionIndent !== null &&
        //        indent !== definitionIndent
        //    ) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    0,
        //                    i,
        //                    line.length
        //                ),
        //                "Invalid indent",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //}
        //else if (definitionIndent !== null) {
        //    if (
        //        indent !== definitionIndent &&
        //        indent > definitionIndent
        //    ) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    0,
        //                    i,
        //                    line.length
        //                ),
        //                "Invalid indent",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
//
        //    if (indent <= 0) {
        //        definitionIndent = null;
        //    }
        //}

        // -------------------------
        // //
        // -------------------------

        const commentIndex =
            line.indexOf("//");

        if (
            commentIndex !== -1 &&
            line[commentIndex - 1] !== "#"
        ) {
            diagnostics.push(
                new vscode.Diagnostic(
                    new vscode.Range(
                        i,
                        commentIndex,
                        i,
                        commentIndex + 2
                    ),
                    'GameScript file not allowed "//" note',
                    vscode.DiagnosticSeverity.Error
                )
            );
        }

        // -------------------------
        // DOC
        // -------------------------

        const docIndex =
            line.indexOf("DOC");

        if (
            docIndex !== -1 &&
            !trimmed.startsWith("#")
        ) {
            diagnostics.push(
                new vscode.Diagnostic(
                    new vscode.Range(
                        i,
                        docIndex,
                        i,
                        docIndex + 3
                    ),
                    '"DOC" Object has no usage without "#"',
                    vscode.DiagnosticSeverity.Information
                )
            );
        }

        // -------------------------
        // def
        // -------------------------

        //if (line.startsWith("def ")) {
        //    const idx =
        //        line.indexOf("def ");
//
        //    if (trimmed.length === 4) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                "Expect a function name",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else if (!line.includes("(")) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                'Expect "("',
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else if (
        //        !line.includes(":") ||
        //        trimmed.indexOf(":") <
        //        trimmed.indexOf(")")
        //    ) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    line.length,
        //                    i,
        //                    line.length
        //                ),
        //                'Expect ":"',
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else {
        //        const func =
        //            trimmed.slice(
        //                trimmed.indexOf("def ") + 4,
        //                trimmed.indexOf("(")
        //            );
//
        //        if (
        //            !/^[A-Za-z_][A-Za-z0-9_]*$/.test(func)
        //        ) {
        //            diagnostics.push(
        //                new vscode.Diagnostic(
        //                    new vscode.Range(
        //                        i,
        //                        idx + 4,
        //                        i,
        //                        idx + 4 + func.length
        //                    ),
        //                    "Invalid function name",
        //                    vscode.DiagnosticSeverity.Error
        //                )
        //            );
        //        }
        //        else {
        //            functions.push(func);
        //        }
        //    }
        //}
    }

    // Store the complete function list for this file.
    //user_functions.set(
    //    doc.uri.toString(),
    //    functions
    //);
    user_variables.set(
        doc.uri.toString(),
        variables
    );
    collection.set(
        doc.uri,
        diagnostics
    );
}

function checkBrackets(lines, diagnostics) {
    const stack = [];

    const pairs = {
        ")": "(",
        "]": "[",
        "}": "{"
    };

    const opens =
        new Set(["(", "[", "{"]);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.startsWith("#")) {
            continue;
        }

        for (let j = 0; j < line.length; j++) {
            const ch = line[j];

            if (opens.has(ch)) {
                stack.push({
                    ch,
                    i,
                    j
                });
            }
            else if (ch in pairs) {
                const last = stack.pop();

                if (
                    !last ||
                    last.ch !== pairs[ch]
                ) {
                    diagnostics.push(
                        new vscode.Diagnostic(
                            new vscode.Range(
                                i,
                                j,
                                i,
                                j + 1
                            ),
                            `expected matching for '${ch}'`,
                            vscode.DiagnosticSeverity.Error
                        )
                    );
                }
            }
        }
    }

    while (stack.length > 0) {
        const unclosed = stack.pop();

        diagnostics.push(
            new vscode.Diagnostic(
                new vscode.Range(
                    unclosed.i,
                    unclosed.j,
                    unclosed.i,
                    unclosed.j + 1
                ),
                `Unclosed bracket '${unclosed.ch}'`,
                vscode.DiagnosticSeverity.Error
            )
        );
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};

class GSHoverProvider {
    provideHover(document, position) {
        const lineText =
            document.lineAt(position.line).text;

        const currentDocIndex =
            lineText.indexOf("#DOC#");

        if (
            currentDocIndex !== -1 &&
            position.character >= currentDocIndex &&
            position.character <= currentDocIndex + 5
        ) {
            let startLine = position.line;
            let endLine = position.line;

            while (startLine > 0) {
                const previousLine =
                    document.lineAt(startLine - 1).text;

                if (
                    previousLine.indexOf("#DOC#") === -1
                ) {
                    break;
                }

                startLine--;
            }

            while (
                endLine + 1 <
                document.lineCount
            ) {
                const nextLine =
                    document.lineAt(endLine + 1).text;

                if (
                    nextLine.indexOf("#DOC#") === -1
                ) {
                    break;
                }

                endLine++;
            }

            let text = "";

            for (
                let line = startLine;
                line <= endLine;
                line++
            ) {
                const currentLine =
                    document.lineAt(line).text;

                const index =
                    currentLine.indexOf("#DOC#");

                text +=
                    currentLine
                        .slice(index + 5)
                        .trim();

                if (line < endLine) {
                    text += "\n";
                }
            }

            const docRange =
                new vscode.Range(
                    new vscode.Position(
                        position.line,
                        currentDocIndex
                    ),
                    new vscode.Position(
                        position.line,
                        currentDocIndex + 5
                    )
                );

            const md =
                new vscode.MarkdownString();

            md.appendCodeblock(
                "(Document) #DOC# ...",
                "gamescript"
            );

            md.appendMarkdown(text);

            return new vscode.Hover(
                md,
                docRange
            );
        }

        const wordRange =
            document.getWordRangeAtPosition(position);

        if (!wordRange) {
            return;
        }

        const word =
            document.getText(wordRange);

        const md =
            new vscode.MarkdownString();

        const line =
            document.lineAt(position.line).text;

        let name;
        let type;
        let vartype = "Object";
        let varvaluename = "?";
        let args = "";
        let returns = "none";
        let doc =
            "· There is no documentation available.";

        let inherits = " < Object";
        const variables =
            user_variables.get(document.uri.toString()) || [];

        const variable = variables.find(
            v => v.name === word
        );

        if (variable) {
            const md = new vscode.MarkdownString();
        
            md.appendCodeblock(
                `(Variable) ${variable.name}: ${variable.type} = ${variable.value}`,
                "gamescript"
            );
        
            return new vscode.Hover(md, wordRange);
        }
        if (line.includes("String.join")) {
            name = "String.join";
            type = "Function";
            args = "*strings: String, sep: String";
            returns = "String";
            doc = "Join strings with a separator.";
        }

        if (line.includes("String.upper")) {
            name = "String.upper";
            type = "Function";
            args = "string: String";
            returns = "String";
            doc = "Convert a string to uppercase.";
        }

        if (line.includes("String.lower")) {
            name = "String.lower";
            type = "Function";
            args = "string: String";
            returns = "String";
            doc = "Convert a string to lowercase.";
        }

        if (line.includes("String.repeat")) {
            name = "String.repeat";
            type = "Function";
            args = "string: String, amount: Integer";
            returns = "String";
            doc = "Repeat a string as amount times";
        }

        if (line.includes("String.contains")) {
            name = "String.contains";
            type = "Function";
            args = "string: String, contains: String";
            returns = "Boolean";
            doc = "Check the string is in contains.";
        }

        if (line.includes("String.length")) {
            name = "String.length";
            type = "Function";
            args = "string: String";
            returns = "Integer";
            doc = "Get the length of the string.";
        }

        if (word === "print") {
            name = "print";
            type = "Function";
            args =
                '*values: Object, printtype: <"message","warning","error","information">';
            doc =
                "Print messages to terminal as the given printtype.";
        }

        if (word === "printwarn") {
            name = "printwarn";
            type = "Function";
            args =
                "message: Object, fatal: Boolean = false";
            doc =
                "Print a message to terminal as yellow warning.";
        }

        if (word === "printerr") {
            name = "printerr";
            type = "Function";
            args =
                "message: Object, fatal: Boolean = false";
            doc =
                "Print a message to terminal as red ERROR.";
        }

        if (word === "printinfo") {
            name = "printinfo";
            type = "Function";
            args = "message: Object";
            doc =
                "Print a message to terminal as blue information.";
        }

        if (word === "versinfo") {
            name = "versinfo";
            type = "Function";
            doc =
                "Print GameScript (and Python)'s version information to terminal.";
        }

        if (word === "printbash") {
            name = "printbash";
            type = "Function";
            args = "*values: Object";
            doc =
                "Print messages to terminal as normal text.";
        }

        if (word === "input") {
            name = "input";
            type = "Function";
            args = "prompt: String";
            returns = "String";
            doc =
                "Ask the user and get the answer.";
        }

        if (word === "is_integer") {
            name = "is_integer";
            type = "Function";
            args = "value: Object";
            returns = "Boolean";
            doc =
                "Check if an object is a valid integer.";
        }

        if (word === "is_float") {
            name = "is_float";
            type = "Function";
            args = "value: Object";
            returns = "Boolean";
            doc =
                "Check if an object is a valid floating-point number.";
        }

        if (word === "sum") {
            name = "sum";
            type = "Function";
            args = "*values: <Integer, Float>";
            returns = "<Integer, Float>";
            doc =
                "get the result of x plus y in values.";
        }

        if (word === "sub") {
            name = "sub";
            type = "Function";
            args = "*values: <Integer, Float>";
            returns = "<Integer, Float>";
            doc =
                "get the result of x minus y in values.";
        }

        if (word === "mul") {
            name = "mul";
            type = "Function";
            args = "*values: <Integer, Float>";
            returns = "<Integer, Float>";
            doc =
                "get the result of x times y in values.";
        }

        if (word === "div") {
            name = "div";
            type = "Function";
            args = "*values: <Integer, Float>";
            returns = "<Integer, Float>";
            doc =
                "get the result of x divides y in values.";
        }

        if (word === "NaN") {
            name = "NaN";
            type = "Variable";
            vartype = "Float";
            varvaluename = "NaN";
            doc = 'NaN, means "Not A Number".';
        }

        if (word === "String") {
            name = "String";
            type = "Class";
            doc = "";
        }

        if (!name || !type) {
            return;
        }

        if (type === "Function") {
            md.appendCodeblock(
                `(${type}) def ${name}(${args}) -> ${returns}`,
                "gamescript"
            );
        }
        else if (type === "Variable") {
            md.appendCodeblock(
                `(${type}) ${name}: ${vartype} = ${varvaluename}`,
                "gamescript"
            );
        }
        else if (type === "Class") {
            md.appendCodeblock(
                `(${type}) ${name}${inherits}`,
                "gamescript"
            );
        }
        else {
            md.appendCodeblock(
                `(Unknown) ${name}: ? = ?`
            );
        }

        md.appendMarkdown(doc);

        return new vscode.Hover(
            md,
            wordRange
        );
    }
}
const tokenTypes = ["variable"];
const tokenModifiers = [];

const semanticTokensChanged =
    new vscode.EventEmitter();

const legend =
    new vscode.SemanticTokensLegend(
        tokenTypes,
        tokenModifiers
    );

class GSSemanticTokensProvider {
    onDidChangeSemanticTokens = semanticTokensChanged.event;

    provideDocumentSemanticTokens(document) {
        const builder =
            new vscode.SemanticTokensBuilder(legend);

        const variables =
            user_variables.get(
                document.uri.toString()
            ) || [];

        const variableNames =
            new Set(
                variables.map(v => v.name)
            );

        for (let i = 0; i < document.lineCount; i++) {
            const line =
                document.lineAt(i).text;

            for (
                const match of line.matchAll(
                    /\b[A-Za-z_][A-Za-z0-9_]*\b/g
                )
            ) {
                const word = match[0];

                if (!variableNames.has(word)) {
                    continue;
                }

                builder.push(
                    i,
                    match.index,
                    word.length,
                    0,
                    0
                );
            }
        }

        return builder.build();
    }
}