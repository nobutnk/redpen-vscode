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
} from "vscode-languageserver";

import {Redpen, RedpenError} from "./redpen";

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
  workspaceRoot = params.rootPath;
  return {
    capabilities: {
      // Tell the client that the server works in FULL text document sync mode
      textDocumentSync: documents.syncKind,
      // Tell the client that the server support code complete
      completionProvider: {
        resolveProvider: true
      }
    }
  };
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
  languageServerExample: ExampleSettings;
}

// These are the example settings we defined in the client's package.json
// file
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// hold the maxNumberOfProblems setting
let maxNumberOfProblems: number;
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
  let settings = <Settings>change.settings;
  maxNumberOfProblems = settings.languageServerExample.maxNumberOfProblems || 100;
  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

function validateTextDocument(textDocument: ITextDocument) {
    const redpenErrors: RedpenError[] = Redpen.execSync(textDocument.uri);

    let diagnostics: Diagnostic[] = [];
    for (const err of redpenErrors) {
        diagnostics.push(err.getDiagnostic());
    }

    connection.sendDiagnostics({uri: textDocument.uri, diagnostics});
}

connection.onDidChangeWatchedFiles((change) => {
  // Monitored files have change in VSCode
  connection.console.log("We recevied an file change event");
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentIdentifier): CompletionItem[] => {
  // The pass parameter contains the position of the text document in 
  // which code complete got requested. For the example we ignore this
  // info and always provide the same completion items.
  return [
    {
      label: "TypeScript",
      kind: CompletionItemKind.Text,
      data: 1
    },
    {
      label: "JavaScript",
      kind: CompletionItemKind.Text,
      data: 2
    }
  ];
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  if (item.data === 1) {
    item.detail = "TypeScript details",
    item.documentation = "TypeScript documentation";
  } else if (item.data === 2) {
    item.detail = "JavaScript details",
    item.documentation = "JavaScript documentation";
  }
  return item;
});

// Listen on the connection
connection.listen();