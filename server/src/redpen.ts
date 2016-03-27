"use strict";

/// <reference path="../typings/node/node.d.ts" />

const path = require("path");

import {execSync} from "child_process";
import {Diagnostic, DiagnosticSeverity} from "vscode-languageserver";

export class Redpen {
    static execSync(filename: string): RedpenError[] {
        filename = path.relative("file:", filename);
        const cmd = "redpen -l 1000 -r json2 /" + filename;
        const stdout = execSync(cmd, {encoding: "utf8"});

        // parse json to redpen_error
        function parse(param): RedpenError[] {
            if (param["errors"] !== undefined) {
                let errors: RedpenError[] = [];
                for (const p of param["errors"]) {
                    errors = errors.concat(parse(p));
                }
                return errors;
            } else {
                return [new RedpenError(param)];
            }
        }
        const json = JSON.parse(stdout.toString());

        return parse(json[0]);
    }
}

export class RedpenError {
    private message: string;
    private severity: DiagnosticSeverity;
    private position: {
        start: {offset: number, line: number},
        end: {offset: number, line: number}
    };

    constructor(params) {
        this.message = params["validator"];
        this.message += ": ";
        this.message += params["message"];
        this.severity = DiagnosticSeverity.Warning;

        const p = params["position"];
        this.position = {
            start: {offset: p["start"]["offset"], line: p["start"]["line"] === 0 ? 0 : p["start"]["line"] - 1},
            end:  {offset: p["end"]["offset"], line: p["end"]["line"] === 0 ? 0 : p["end"]["line"] - 1}
        };
    }
    getDiagnostic(): Diagnostic {
        const p  = this.position;
        return {
            severity: this.severity,
            range: {
                start: { line: p.start.line, character: p.start.offset},
                end: { line: p.end.line, character: p.end.offset }
            },
            message: this.message
        };
    }
}