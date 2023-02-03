export function configureMarkdownEditorOnDOMContentLoaded(pageId, marked) {

    document.addEventListener('DOMContentLoaded', function () {

        let editor = null;

        document.getElementById('btnSave').addEventListener('click', function () {
            document.getElementById('save-content').value = editor.getValue();
        });

        document.getElementById('btnClose').addEventListener('click', function () {
            if (confirm('Are you sure? Any unsaved changes will be lost?')) {
                window.location = window.location.pathname;
            }
        });
       
        var originalData = '';

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
                    wordWrap: true
                });

                editor.getModel().onDidChangeContent((event) => {
                    document.getElementById('previewArea').innerHTML = marked.parse(editor.getValue());
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