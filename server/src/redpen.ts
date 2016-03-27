"use strict";

const execSync = require("child_process").execSync;

import {Diagnostic, DiagnosticSeverity} from "vscode-languageserver";

export class Redpen {
    static execSync(filename: string): RedpenError[] {
        const cmd = "redpen -r json2 " + filename;
        return [];
    }
}

export class RedpenError {
    private message: string;
    private severity: DiagnosticSeverity;
    range: Range;
    getDiagnostic(): Diagnostic {
        return {
            severity: this.severity,
            range: {
                start: { line: 0, character: 20},
                end: { line: 0, character: 20 + 10 }
            },
            message: this.message
        };
    }
}