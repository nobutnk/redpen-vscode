/* -----------------------------------------------------------
 * modified by takeo asai
 * extension for Redpen (http://redpen.cc)
 * -------------------------------------------------------- */
/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
"use strict";

import {
    IPCMessageReader, IPCMessageWriter,
    createConnection, IConnection, TextDocumentSyncKind,
    TextDocuments, ITextDocument, Diagnostic, DiagnosticSeverity,
    InitializeParams, InitializeResult, TextDocumentIdentifier,
    CompletionItem, CompletionItemKind
} from 'vscode-languageserver';

import {Redpen, RedpenError} from './redpen';

// Create a connection for the server. The connection uses 
// stdin / stdout for message passing
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
    // console.log("connection.onInitialize");
    workspaceRoot = params.rootPath;
    return {
        capabilities: {
            // Tell the client that the server works in FULL text document sync mode
            textDocumentSync: documents.syncKind
        }
    };
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    // console.log("documents.onDidChangeContent");
    validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
    redpen: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
    maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation as well.
connection.onDidChangeConfiguration((change) => {
    // console.log("connection.onDidChangeConfiguration");
    const settings = <Settings>change.settings;
    maxNumberOfProblems = settings.redpen.maxNumberOfProblems || 1000;
    // Revalidate any open text documents
    documents.all().forEach(validateTextDocument);
});

// set diagnostics when changes
function validateTextDocument(textDocument: ITextDocument) {
    // console.log("-------------diagnostics-----------");
    const redpenErrors: RedpenError[] = Redpen.execSync(textDocument.uri, maxNumberOfProblems);
    const diagnostics: Diagnostic[] = redpenErrors.map((v) => { return v.getDiagnostic(); });

    connection.sendDiagnostics({uri: textDocument.uri, diagnostics});
}

connection.onDidChangeWatchedFiles((change) => {
    // Monitored files have change in VSCode
    // connection.console.log("We recevied an file change event");
    // console.log("We recevied an file change event");
});

// Listen on the connection
connection.listen();
