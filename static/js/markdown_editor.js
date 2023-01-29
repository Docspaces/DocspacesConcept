import { marked } from "https://cdn.jsdelivr.net/npm/marked@4.2.12/lib/marked.esm.min.js";

export function markdownEditorPageLoaded(pageId) {

    document.addEventListener('DOMContentLoaded', function () {

    let editor = null;

    document.getElementById('btnSave').addEventListener('click', function () {
        document.getElementById('save-content').value = editor.getValue();
    });

    var originalData = '';

    httpGet(`/pages/${pageId}/fetch`).then(function (data) {

        originalData = data.data;

        editor = monaco.editor.create(document.getElementById('editor'), {
            value: data.data, // Empty by default, we'll load from the api
            automaticLayout: true,
            scrollBeyondLastLine: false,
            language: 'markdown',
            minimap: {
                enabled: false
            },
            folding: false
        });

        editor.getModel().onDidChangeContent((event) => {
            document.getElementById('previewArea').innerHTML = marked.parse(editor.getValue());
        });

        document.getElementById('previewArea').innerHTML = marked.parse(originalData);

    });

    async function httpGet(url = '', data = {}) {

        const response = await fetch(url, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            redirect: 'follow',
            referrerPolicy: 'no-referrer'
        });

        return response.json();
    }
    });

}