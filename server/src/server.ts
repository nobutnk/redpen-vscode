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
  createConnection,
  TextDocumentSyncKind,
  TextDocuments,
  ProposedFeatures,
  Diagnostic,
  InitializeResult,
  InitializeParams,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { Redpen, RedpenError } from "./redpen";

// Create a connection for the server. The connection uses
// stdin / stdout for message passing
let connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initilize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilites.
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize((params: InitializeParams) => {
  let capabilities = params.capabilities;
  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
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
  const settings = <Settings>change.settings;
  maxNumberOfProblems = settings.redpen.maxNumberOfProblems || 1000;
  // Revalidate any open text documents
  documents.all().forEach(validateTextDocument);
});

// set diagnostics when changes
function validateTextDocument(textDocument: TextDocument) {
  const redpenErrors: RedpenError[] = Redpen.execSync(
    textDocument.uri,
    maxNumberOfProblems
  );
  const diagnostics: Diagnostic[] = redpenErrors.map((v) => {
    return v.getDiagnostic();
  });

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((change) => {
  // Monitored files have change in VSCode
});

// Listen on the connection
connection.listen();
