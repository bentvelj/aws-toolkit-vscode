/*!
 * Copyright 2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as path from 'path'
import * as vscode from 'vscode'
import { ExtensionUtilities } from '../shared/extensionUtilities'

interface WebviewParams<TRequest, TResponse, TState> {
    id: string
    name: string
    webviewJs: string
    context: vscode.ExtensionContext
    initialState?: TState
    persistSessions?: boolean
    persistWithoutFocus?: boolean
    cssFiles?: string[]
    jsFiles?: string[]
    libFiles?: string[]
    onDidReceiveMessageFunction(
        request: TRequest,
        postMessageFn: (response: TResponse) => Thenable<boolean>,
        destroyWebviewFn: () => any
    ): void
    onDidDisposeFunction?(): void
}

// TODO: add types for the state functions
export interface VsCode<TRequest, State> {
    postMessage(output: TRequest): void
    setState(state: State): void
    getState(): State | undefined
}

export async function createVueWebview<TRequest, TResponse, TState>(
    params: WebviewParams<TRequest, TResponse, TState>
) {
    const libsPath: string = path.join(params.context.extensionPath, 'media', 'libs')
    const jsPath: string = path.join(params.context.extensionPath, 'media', 'js')
    const cssPath: string = path.join(params.context.extensionPath, 'media', 'css')
    const webviewPath: string = path.join(params.context.extensionPath, 'compiledWebviews')

    const view = vscode.window.createWebviewPanel(params.id, params.name, vscode.ViewColumn.Beside, {
        enableScripts: true,
        localResourceRoots: [
            vscode.Uri.file(libsPath),
            vscode.Uri.file(jsPath),
            vscode.Uri.file(cssPath),
            vscode.Uri.file(webviewPath),
        ],
        retainContextWhenHidden: params.persistWithoutFocus,
    })

    const loadLibs = ExtensionUtilities.getFilesAsVsCodeResources(
        libsPath,
        ['vue.min.js', ...(params.libFiles ?? [])],
        view.webview
    ).concat(
        ExtensionUtilities.getFilesAsVsCodeResources(
            jsPath,
            ['loadVsCodeApi.js', ...(params.jsFiles ?? [])],
            view.webview
        )
    )

    const loadCss = ExtensionUtilities.getFilesAsVsCodeResources(cssPath, [...(params.cssFiles ?? [])], view.webview)

    let scripts: string = ''
    let stylesheets: string = ''

    loadLibs.forEach(element => {
        scripts = scripts.concat(`<script src="${element}"></script>\n\n`)
    })

    loadCss.forEach(element => {
        stylesheets = stylesheets.concat(`<link rel="stylesheet" href="${element}">\n\n`)
    })

    const mainScript: vscode.Uri = view.webview.asWebviewUri(vscode.Uri.file(path.join(webviewPath, params.webviewJs)))

    view.title = params.name
    view.webview.html = `<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        
        <!-- how do we not require unsafe eval? -->
        <meta
            http-equiv="Content-Security-Policy"
            content=
                "default-src 'none';
                img-src ${view.webview.cspSource} https:;
                script-src ${view.webview.cspSource} 'unsafe-eval';
                style-src ${view.webview.cspSource};
                font-src 'self' data:;"
        >
    </head>
    <body>
        <div id="vueApp">{{ counter }}</div>
        <!-- Dependencies -->
        ${scripts}
        <!-- Main -->
        <script src="${mainScript}"></script>
    </body>
</html>`

    // message in initial state since we don't have access to the ReactDOM call at this level (since we webpack separately).
    // TODO: Is there a better way to do this?
    if (params.initialState) {
        view.webview.postMessage(params.initialState)
    }

    view.webview.onDidReceiveMessage(
        // type the any if necessary
        (message: any) => {
            params.onDidReceiveMessageFunction(
                message,
                response => view.webview.postMessage(response),
                // tslint:disable-next-line: no-unsafe-any
                () => view.dispose()
            )
        },
        undefined,
        params.context.subscriptions
    )

    view.onDidDispose(
        () => {
            if (params.onDidDisposeFunction) {
                params.onDidDisposeFunction()
            }
        },
        undefined,
        params.context.subscriptions
    )
}