const vscode = require('vscode');
const path = require("path");
const cp = require("child_process");
const builtin_classes = [
    "Object",
    "String",
    "Integer",
    "Float",
    "Boolean",
    "Class",
    "MainScript"
];
const global_keyword_name = [
    "inherit",
    "script_name",
    "true",
    "false",
    "none",
    "if",
    "for",
    "while",
    "def"
];
let user_functions = []
function getIndent(line) {
    return line.search(/\S|$/);
}

function activate(context) {
    const runCommand =
        vscode.commands.registerCommand(
            "gamescript.run",
            () => {
                const editor =
                    vscode.window.activeTextEditor;
            
                if (!editor) {
                    return;
                }
            
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

        // Built-in keywords
        for (const keyword of global_keyword_name) {
            items.push(
                new vscode.CompletionItem(
                    keyword,
                    vscode.CompletionItemKind.Keyword
                )
            );
        }

        // Built-in classes
        for (const className of builtin_classes) {
            items.push(
                new vscode.CompletionItem(
                    className,
                    vscode.CompletionItemKind.Class
                )
            );
        }

        // User-defined names
        const lines = document.getText().split("\n");

        for (const line of lines) {
            const trimmed = line.trim();

            // class Player
            if (trimmed.startsWith("class ")) {
                const name = trimmed
                    .slice("class ".length)
                    .split(/\s+/)[0];

                if (name) {
                    items.push(
                        new vscode.CompletionItem(
                            name,
                            vscode.CompletionItemKind.Class
                        )
                    );
                }
            }

            // def attack(
            else if (trimmed.startsWith("def ")) {
                const name = trimmed
                    .slice("def ".length)
                    .split(/[\s(]/)[0];

                if (name) {
                    items.push(
                        new vscode.CompletionItem(
                            name,
                            vscode.CompletionItemKind.Function
                        )
                    );
                }
            }

            // script_name MyGame
            else if (trimmed.startsWith("script_name ")) {
                const name = trimmed
                    .slice("script_name ".length)
                    .split(/\s+/)[0];

                if (name) {
                    items.push(
                        new vscode.CompletionItem(
                            name,
                            vscode.CompletionItemKind.Class
                        )
                    );
                }
            }
        }
        items.push(
            new vscode.CompletionItem(
                "#DOC#",
                vscode.CompletionItemKind.Struct
            ))
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
    const knownClasses = [...builtin_classes];

    let script_name = null;
    let inherit_class_name = null;
    let is_module = false;

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

        if (trimmed === "@module") {
            is_module = true;
            continue;
        }

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

        if (
            trimmed.startsWith("def ") ||
            trimmed.startsWith("class ")
        ) {
            if (indent === 0) {
                definitionIndent = indent;
            }
        }

        if (
            definitionIndent !== null &&
            indent <= definitionIndent &&
            !trimmed.startsWith("def ") &&
            !trimmed.startsWith("class ")
        ) {
            definitionIndent = null;
        }

        // -------------------------
        // @module restrictions
        // -------------------------

        if (is_module && definitionIndent === null) {
            const allowed =
                trimmed.startsWith("inherit ") ||
                trimmed.startsWith("script_name ") ||
                trimmed.startsWith("def ") ||
                trimmed.startsWith("class ") ||
                trimmed.startsWith("@");

            if (!allowed) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            0,
                            i,
                            line.length
                        ),
                        "Cannot put executing code out of definition blocks",
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
        }

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

        if (trimmed.startsWith("script_name ")) {
            const idx = line.indexOf("script_name");
            const name = line.slice(idx + 12).trim();

            if (script_name !== null) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            idx + 11
                        ),
                        'Too many keywords "script_name"',
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }

            if (name.length === 0) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        "Expect a script name",
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
            else if (knownClasses.includes(name)) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        `Script name "${name}" already exists`,
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
            else {
                script_name = name;
                knownClasses.push(name);
            }
        }

        // -------------------------
        // inherit
        // -------------------------

        if (trimmed.startsWith("inherit ")) {
            const idx = line.indexOf("inherit");
            const parent = line.slice(idx + 8).trim();

            if (inherit_class_name !== null) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            idx + 7
                        ),
                        'Too many keywords "inherit"',
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }

            if (parent.length === 0) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        "Expect an existing class",
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
            else if (parent === script_name) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        "Cannot inherit the script itself",
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
            else if (!knownClasses.includes(parent)) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        `Class "${parent}" does not exist`,
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }

            inherit_class_name = parent;
        }
        if (trimmed.startsWith("def")) {
            const idx = line.indexOf("def");
        
            if (trimmed.length === 3) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        "Expect a function name",
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
            else if (!line.includes("(")) {
                diagnostics.push(
                    new vscode.Diagnostic(
                        new vscode.Range(
                            i,
                            idx,
                            i,
                            line.length
                        ),
                        'Expect "("',
                        vscode.DiagnosticSeverity.Error
                    )
                );
            }
        }
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
        const wordRange = document.getWordRangeAtPosition(position);

        if (!wordRange) {
            return;
        }

        const word = document.getText(wordRange);
        const lines = document.getText().split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith("def ")) {
                
                const functionName = line
                    .slice(4)
                    .split(/[\s(]/)[0];
                let description = "There is no any description..."
                if (i-1>=0 && lines[i-1].startsWith("#DOC#")){
                    description = lines[i-1].slice(5)
                }

                if (functionName === word) {
                    return new vscode.Hover(
                        `## (Function) ${functionName} \n\n def ${functionName}() \n\n ${description}`
                    );
                }
            }
        }
    }
}