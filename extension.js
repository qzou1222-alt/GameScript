const vscode = require('vscode');
const path = require("path");
//const cp = require("child_process");
//const builtin_classes = [
//    "Object",
//    "String",
//    "Integer",
//    "Float",
//    "Boolean",
//    "Class",
//    "MainScript"
//];
//const global_keyword_name = [
//    "inherit",
//    "script_name",
//    "true",
//    "false",
//    "none",
//    "if",
//    "for",
//    "while",
//    "def"
//];
//let user_functions = []
function getIndent(line) {
    return line.search(/\S|$/);
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
    const collection =
        vscode.languages.createDiagnosticCollection("gamescript");

    context.subscriptions.push(collection);

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(
            doc => checkGS(doc, collection)
        )
    );

    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(
            e => checkGS(e.document, collection)
        )
    );
    const provider = vscode.languages.registerCompletionItemProvider(
        ["gs", "gamescript"],
        new GSProvider()
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
        const items = [];

        
        items.push(
            new vscode.CompletionItem(
                "#DOC#",
                vscode.CompletionItemKind.Struct
            ));
        items.push(
            new vscode.CompletionItem(
                "print",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "printerr",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "printwarn",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "printbash",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "versinfo",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "printinfo",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "input",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "is_integer",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "is_float",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "sum",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "sub",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "div",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "mul",
                vscode.CompletionItemKind.Function
            ));
        items.push(
            new vscode.CompletionItem(
                "NaN",
                vscode.CompletionItemKind.Variable
            ));
        items.push(
            new vscode.CompletionItem(
                "none",
                vscode.CompletionItemKind.Keyword
            ));
        items.push(
            new vscode.CompletionItem(
                "true",
                vscode.CompletionItemKind.Keyword
            ));
        items.push(
            new vscode.CompletionItem(
                "false",
                vscode.CompletionItemKind.Keyword
            ));
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
    user_functions=[]
    // Classes known in this file.
    //const knownClasses = [...builtin_classes];

    //let script_name = null;
    //let inherit_class_name = null;
    //let is_module = false;

    let definitionIndent = null;

    checkBrackets(lines, diagnostics);

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed === "") {
            continue;
        }

        // -------------------------
        // @module
        // -------------------------

        //if (trimmed === "@module") {
        //    is_module = true;
        //    continue;
        //}

        // -------------------------
        // Comments
        // -------------------------

        if (trimmed.startsWith("#")) {
            continue;
        }

        const indent = getIndent(line);

        // -------------------------
        // Definitions
        // -------------------------

        //if (
        //    trimmed.startsWith("def ") ||
        //    trimmed.startsWith("class ")
        //) {
        //    if (indent === 0) {
        //        definitionIndent = indent;
        //    }
        //}

        //if (
        //    definitionIndent !== null &&
        //    indent <= definitionIndent &&
        //    !trimmed.startsWith("def ") &&
        //    !trimmed.startsWith("class ")
        //) {
        //    definitionIndent = null;
        //}

        // -------------------------
        // @module restrictions
        // -------------------------

        //if (is_module && definitionIndent === null) {
        //    const allowed =
        //        trimmed.startsWith("inherit ") ||
        //        trimmed.startsWith("script_name ") ||
        //        trimmed.startsWith("def ") ||
        //        trimmed.startsWith("class ") ||
        //        trimmed.startsWith("@");

        //    if (!allowed) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    0,
        //                    i,
        //                    line.length
        //                ),
        //                "Cannot put executing code out of definition blocks",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //}

        // -------------------------
        // //
        // -------------------------

        const commentIndex = line.indexOf("//");

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

        const docIndex = line.indexOf("DOC");

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
        // script_name
        // -------------------------

        //if (trimmed.startsWith("script_name ")) {
        //    const idx = line.indexOf("script_name");
        //    const name = line.slice(idx + 12).trim();
//
        //    if (script_name !== null) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    idx + 11
        //                ),
        //                'Too many keywords "script_name"',
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
//
        //    if (name.length === 0) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                "Expect a script name",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else if (knownClasses.includes(name)) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                `Script name "${name}" already exists`,
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else {
        //        script_name = name;
        //        knownClasses.push(name);
        //    }
        //}
//
        //// -------------------------
        //// inherit
        //// -------------------------
//
        //if (trimmed.startsWith("inherit ")) {
        //    const idx = line.indexOf("inherit");
        //    const parent = line.slice(idx + 8).trim();
//
        //    if (inherit_class_name !== null) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    idx + 7
        //                ),
        //                'Too many keywords "inherit"',
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
//
        //    if (parent.length === 0) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                "Expect an existing class",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else if (parent === script_name) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                "Cannot inherit the script itself",
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
        //    else if (!knownClasses.includes(parent)) {
        //        diagnostics.push(
        //            new vscode.Diagnostic(
        //                new vscode.Range(
        //                    i,
        //                    idx,
        //                    i,
        //                    line.length
        //                ),
        //                `Class "${parent}" does not exist`,
        //                vscode.DiagnosticSeverity.Error
        //            )
        //        );
        //    }
//
        //    inherit_class_name = parent;
        //}
        //if (trimmed.startsWith("def")) {
        //    const idx = line.indexOf("def");
        //
        //    if (trimmed.length === 3) {
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
        //}
    }

    collection.set(doc.uri, diagnostics);
}

function checkBrackets(lines, diagnostics) {
    const stack = [];

    const pairs = {
        ")": "(",
        "]": "[",
        "}": "{"
    };

    const opens = new Set(["(", "[", "{"]);

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

                if (!last || last.ch !== pairs[ch]) {
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
        const lineText = document.lineAt(position.line).text;
        const currentDocIndex = lineText.indexOf("#DOC#");
    
        // Check whether the cursor is actually over #DOC#
        if (
            currentDocIndex !== -1 &&
            position.character >= currentDocIndex &&
            position.character <= currentDocIndex + 5
        ) {
            let startLine = position.line;
            let endLine = position.line;
        
            // Look upward
            while (startLine > 0) {
                const previousLine = document.lineAt(startLine - 1).text;
            
                if (previousLine.indexOf("#DOC#") === -1) {
                    break;
                }
            
                startLine--;
            }
        
            // Look downward
            while (endLine + 1 < document.lineCount) {
                const nextLine = document.lineAt(endLine + 1).text;
            
                if (nextLine.indexOf("#DOC#") === -1) {
                    break;
                }
            
                endLine++;
            }
        
            // Collect documentation
            let text = "";
        
            for (let line = startLine; line <= endLine; line++) {
                const currentLine = document.lineAt(line).text;
                const index = currentLine.indexOf("#DOC#");
            
                text += currentLine.slice(index + 5).trim();
            
                if (line < endLine) {
                    text += "\n";
                }
            }
        
            // Range of the #DOC# currently being hovered
            const docRange = new vscode.Range(
                new vscode.Position(
                    position.line,
                    currentDocIndex
                ),
                new vscode.Position(
                    position.line,
                    currentDocIndex + 5
                )
            );
        
            const md = new vscode.MarkdownString();
        
            md.appendCodeblock(
                "(Document) #DOC# ...",
                "gamescript"
            );
        
            md.appendMarkdown(text);
        
            return new vscode.Hover(md, docRange);
        }
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return;
        }
        
        const word = document.getText(wordRange);
        const md = new vscode.MarkdownString();
        let name;
        let type;
        let vartype = "Object"
        let varvaluename = "?";
        let args = "";
        let returns = "none";
        let doc = "· There is no documentation available.";
        if (word === "print") {
            name = "print";
            type = "Function";
            args = "*values: Object, printtype: <\"message\",\"warning\",\"error\",\"information\">";
            doc = "Print messages to terminal as the given printtype.";
        }
        if (word === "printwarn") {
            name = "printwarn";
            type = "Function";
            args = "message: Object, fatal: Boolean = false";
            doc = "Print a message to terminal as yellow warning.\n\nIf fatal is true, will quit the whole program.";
        }
        if (word === "printerr") {
            name = "printerr";
            type = "Function";
            args = "message: Object, fatal: Boolean = false";
            doc = "Print a message to terminal as red ERROR.\n\nIf fatal is true, will quit the whole program.";
        }
        if (word === "printinfo") {
            name = "printinfo";
            type = "Function";
            args = "message: Object";
            doc = "Print a message to terminal as blue information.";
        }
        if (word === "versinfo") {
            name = "versinfo";
            type = "Function";
            doc = "Print GameScript (and Python)'s version information to terminal.\n\nIf your Python version is lower than 3.12, versinfo will output a warning.";
        }
        if (word === "printbash") {
            name = "printbash";
            type = "Function";
            args = "*values: Object";
            doc = "Print messages to terminal as normal text.";
        }
        if (word === "input") {
            name = "input";
            type = "Function";
            args = "prompt: String";
            doc = "Ask the user and get the answer.";
            returns = "String";
        }
        if (word === "is_integer") {
            name = "is_integer";
            type = "Function";
            args = "value: Object";
            doc = "Check if an object is a valid integer.";
            returns = "Boolean";
        }
        if (word === "is_float") {
            name = "is_float";
            type = "Function";
            args = "value: Object";
            doc = "Check if an object is a valid floating-point number.";
            returns = "Boolean";
        }
        if (word === "sum") {
            name = "sum";
            type = "Function";
            args = "*values: <Integer, Float>";
            doc = "get the result of x plus y in values.";
            returns = "<Integer, Float>";
        }
        if (word === "sub") {
            name = "sub";
            type = "Function";
            args = "*values: <Integer, Float>";
            doc = "get the result of x minus y in values.";
            returns = "<Integer, Float>";
        }
        if (word === "mul") {
            name = "mul";
            type = "Function";
            args = "*values: <Integer, Float>";
            doc = "get the result of x times y in values.";
            returns = "<Integer, Float>";
        }
        if (word === "div") {
            name = "div";
            type = "Function";
            args = "*values: <Integer, Float>";
            doc = "get the result of x divides y in values.";
            returns = "<Integer, Float>";
        }
        if (word === "NaN") {
            name = "NaN";
            type = "Variable";
            vartype = "Float"
            doc = "NaN, means \"Not A Number\".";
            varvaluename = "NaN";
        }
        if (!name || !type) {
            return;
        }
        if (type==="Function"){
            md.appendCodeblock(
                `(${type}) def ${name}(${args}) -> ${returns}`,
                "gamescript"
            );
        }
        else if (type==="Variable"){
            md.appendCodeblock(
                `(${type}) ${name}: ${vartype} = ${varvaluename}`,
                "gamescript"
            );
        }
        else {
            md.appendCodeblock(
                `(Unknown) ${name}`
            )
        }
        md.appendMarkdown(doc);
        return new vscode.Hover(md, wordRange);
    }
}