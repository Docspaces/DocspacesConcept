export function configureMarkdownEditorOnDOMContentLoaded(pageId, marked) {

    document.addEventListener('DOMContentLoaded', function () {

        let editor = null;
        var originalData = '';
        var changed = false;

        document.getElementById('btnSave').addEventListener('click', function () {
            document.getElementById('save-content').value = editor.getValue();
        });

        document.getElementById('btnClose').addEventListener('click', function () {
            if (!changed || confirm('Are you sure? Any unsaved changes will be lost?')) {
                window.location = window.location.pathname;
            }
        });
       

        // Some weirdness on the pageId 0 case -- the fetch does bring back blank data, so it should
        // work, but it's served as a 304 (or whatever) content not changed, and that messes with the
        // way I'm doing something, not sure why.

        if (pageId == '0') {

            editor = monaco.editor.create(document.getElementById('editor'), {
                value: '',
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

        } else {

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
                    folding: false,
                    wordWrap: true,
                    // Disable intellisense stuff because it just doesn't make sense in this setup
                    quickSuggestions: {
                        "other": false,
                        "comments": false,
                        "strings": false
                    },
                    parameterHints: {
                        enabled: false
                    },
                    ordBasedSuggestions: false,
                    acceptSuggestionOnEnter: "off",
                    suggestOnTriggerCharacters: false,
                    tabCompletion: "off",
                    wordBasedSuggestions: false
                });

                editor.getModel().onDidChangeContent((event) => {
                    document.getElementById('previewArea').innerHTML = marked.parse(editor.getValue());

                    changed = true;
                });

                document.getElementById('previewArea').innerHTML = marked.parse(originalData);

            });
        }

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