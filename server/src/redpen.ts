/* -----------------------------------------------------------
 * created by takeo asai
 * extension for Redpen (http://redpen.cc)
 * -------------------------------------------------------- */

"use strict";

/// <reference path="../typings/node/node.d.ts" />

import * as path from "path";
import {execSync} from "child_process";
import {Diagnostic, DiagnosticSeverity, Files} from "vscode-languageserver";

export class Redpen {
    static execSync(filename: string, limit: number = 1000): RedpenError[] {
        filename = path.relative("file:", filename);
        const cmd = `redpen -l ${limit} -r json2 /${filename}`;
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
    private code: string;
    private message: string;
    private severity: DiagnosticSeverity;
    private position: {
        start: {offset: number, line: number},
        end: {offset: number, line: number}
    };

    constructor(params) {
        this.code = params["validator"];
        this.message = params["message"];
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
            code: this.code,
            message: this.message,
            source: "Redpen"
        };
    }
}