export function configureMermaidEditorOnDOMContentLoaded(diagramId, mermaid) {

    document.addEventListener('DOMContentLoaded', function () {

        mermaid.initialize({ startOnLoad: true, securityLevel: 'antiscript', });

        let editor = null;



        var d = [];

        mermaid.parseError = function (err, hash) {

            // Still got some weirdness with line numbers

            d = editor.deltaDecorations(d, [{
                range: new monaco.Range(err.hash.line, 1, err.hash.line, 1),
                options: {
                    glyphMarginClassName: 'errorIcon',
                    isWholeLine: true,
                    className: 'errorIcon'
                }
            }]);

        };

        function tryRender() {

            let txtDiagramData = document.getElementById('txtDiagramData');
            let diagram_area = document.getElementById('diagram_area');

            let oldScrollTop = diagram_area.parentElement.scrollTop;
            let oldScrollLeft = diagram_area.parentElement.scrollLeft;

            //debugger;

            try {
                if (mermaid.parse(editor.getValue())) {

                    d = editor.deltaDecorations(d, []);

                    mermaid.render('x', editor.getValue(), function (svg) {

                        if (!svg.startsWith('<svg aria-roledescription="error"')) {

                            diagram_area.innerHTML = svg;

                            if (zoomed) {
                                let viewAreaWidth = diagram_area.getBoundingClientRect().width;
                                let diagramWidth = diagram_area.firstChild.viewBox.baseVal.width;
                                let fullZoom = Math.max(diagramWidth / viewAreaWidth, 1) * 100;

                                diagram_area.firstChild.style.width = `${fullZoom}%`;

                                diagram_area.parentElement.scrollTop = oldScrollTop;
                                diagram_area.parentElement.scrollLeft = oldScrollLeft;
                            }
                        }
                    });
                }
            }
            catch (e) {
                // Some errors aren't dealt with by the try-parse method, not really
                // sure why. They end up here, and it blanks the diagram until the error
                // is fixed.

                //alert(e);
            }
        }

        document.getElementById('btnSave').addEventListener('click', async function () {

            let txtDiagramData = document.getElementById('txtDiagramData');

            await postData(`/diagrams/${diagramId}/update`, { data: editor.getValue() }).then(function (data) {
                alert(data['status'] == 'OK' ? 'Saved successfully' : 'Error?');
            });

        });

        document.getElementById('lnkChangeName').addEventListener('click', async function () {

            let lblName = document.getElementById('lblName');

            let newName = prompt('New name', lblName.innerText);

            await postData(`/diagrams/${diagramId}/rename`, { name: newName }).then(function (data) {
                if (data['status'] == 'OK') {
                    lblName.innerText = newName;
                }
                else {
                    alert('Error?');
                }

            });

        });

        document.getElementById('btnClose').addEventListener('click', async function () {

            if (originalData != editor.getValue()) {


            }

            window.location = '/documents';

            /*
            if (confirm("Save before closing?")) { // This isn't great

                let txtDiagramData = document.getElementById('txtDiagramData');

                await postData('/diagrams/<%= diagram.id %>/update', { data: editor.getValue() }).then(function (data) {
                    alert(data['status'] == 'OK' ? 'Saved successfully' : 'Error?');
                });
            }
*/

        });


        var zoomed = false;

        document.getElementById('btnZoom').addEventListener('click', function () {

            let diagram_area = document.getElementById('diagram_area');

            //document.getElementById('diagram_area').firstChild.setAttribute("viewBox", "0 0 1995 2601"); 
            //document.getElementById('diagram_area').firstChild.style.width="200%";
            //document.getElementById('diagram_area').firstChild.viewBox.baseVal.width // 1995
            //document.getElementById('diagram_area').getBoundingClientRect().width // 1077.671875

            if (zoomed) {
                diagram_area.firstChild.style.width = `100%`;
            }
            else {
                let viewAreaWidth = diagram_area.getBoundingClientRect().width;
                let diagramWidth = diagram_area.firstChild.viewBox.baseVal.width;
                let fullZoom = Math.max(diagramWidth / viewAreaWidth, 1) * 100;

                diagram_area.firstChild.style.width = `${fullZoom}%`;
            }

            zoomed = !zoomed;

        });

        async function postData(url = '', data = {}) {

            const response = await fetch(url, {
                method: 'POST',
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                headers: {
                    'Content-Type': 'application/json' // 'application/x-www-form-urlencoded',
                },
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                body: JSON.stringify(data) // body data type must match "Content-Type" header
            });

            return response.json(); // parses JSON response into native JavaScript objects
        }

        async function getData(url = '', data = {}) {

            const response = await fetch(url, {
                method: 'GET',
                mode: 'cors', // no-cors, *cors, same-origin
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                credentials: 'same-origin', // include, *same-origin, omit
                //headers: {
                //'Content-Type': 'application/json' // 'application/x-www-form-urlencoded',
                //},
                redirect: 'follow', // manual, *follow, error
                referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                //body: JSON.stringify(data) // body data type must match "Content-Type" header
            });

            return response.json(); // parses JSON response into native JavaScript objects
        }


        // Register a new language
        monaco.languages.register({ id: 'mermaid' });

        // Register a tokens provider for the language
        monaco.languages.setMonarchTokensProvider('mermaid', {

            keywords: {
                sequenceDiagram: {
                    typeKeywords: ['sequenceDiagram'],
                    blockKeywords: [
                        'alt',
                        'par',
                        'and',
                        'loop',
                        'else',
                        'end',
                        'rect',
                        'opt',
                        'alt',
                        'rect',
                    ],
                    keywords: [
                        'participant',
                        'as',
                        'Note',
                        'note',
                        'right of',
                        'left of',
                        'over',
                        'activate',
                        'deactivate',
                        'autonumber',
                        'title',
                        'actor',
                        'accDescription',
                        'link',
                        'links',
                    ]
                }
            },

            sequenceDiagramBlockKeywords: ['alt',
                'par',
                'and',
                'loop',
                'else',
                'end',
                'rect',
                'opt',
                'alt',
                'rect'],
            sequenceDiagramKeywords: ['participant',
                'as',
                'Note',
                'note',
                'right of',
                'left of',
                'over',
                'activate',
                'deactivate',
                'autonumber',
                'title',
                'actor',
                'accDescription',
                'link',
                'links'],

            tokenizer: {
                root: [
                    [/^\s*sequenceDiagram/, 'typeKeyword', 'sequenceDiagram'],
                ],
                sequenceDiagram: [
                    [/(title:?|accDescription)([^\r\n;]*$)/, ['keyword', 'string']],
                    [/(autonumber)([^\r\n\S]+off[^\r\n\S]*$)/, ['keyword', 'keyword']],
                    [
                        /(autonumber)([^\r\n\S]+\d+[^\r\n\S]+\d+[^\r\n\S]*$)/,
                        ['keyword', 'number'],
                    ],
                    [/(autonumber)([^\r\n\S]+\d+[^\r\n\S]*$)/, ['keyword', 'number']],
                    [
                        /(link\s+)(.*?)(:)(\s*.*?)(\s*@)(\s*[^\r\n;]+)/,
                        [
                            'keyword',
                            'variable',
                            'delimiter.bracket',
                            'string',
                            'delimiter.bracket',
                            'string',
                        ],
                    ],
                    [
                        /((?:links|properties)\s+)([^\r\n:]*?)(:\s+)/,
                        [
                            { token: 'keyword' },
                            { token: 'variable' },
                            {
                                token: 'delimiter.bracket',
                                nextEmbedded: 'javascript',
                                next: '@sequenceDiagramLinksProps'
                            },
                        ],
                    ],
                    [
                        /[a-zA-Z][\w$]*/,
                        {
                            cases: {
                                '@sequenceDiagramBlockKeywords': 'typeKeyword',
                                '@sequenceDiagramKeywords': 'keyword',
                                '@default': 'variable'
                            }
                        },
                    ],
                    [/(--?>?>|--?[)x])[+-]?/, 'transition'],
                    [/(:)([^:\n]*?$)/, ['delimiter.bracket', 'string']],
                    [/%%[^$]([^%]*(?!%%$)%?)*$/, 'comment'],
                ],
                sequenceDiagramLinksProps: [
                    // [/^:/, { token: 'delimiter.bracket', nextEmbedded: 'json' }],
                    [
                        /$|;/,
                        { nextEmbedded: '@pop', next: '@pop', token: 'delimiter.bracket' },
                    ],
                ]
            }
        });

        // Define a new theme that contains only rules that match this language
        monaco.editor.defineTheme('mermaid', {
            base: 'vs',
            inherit: false,
            rules: [
                { token: 'typeKeyword', foreground: '0404F5', fontStyle: 'bold' },
                { token: 'transition', foreground: '5577AA', fontStyle: 'bold' },
                { token: 'keyword', foreground: '0404F5', fontStyle: 'bold' },
                { token: 'variable', foreground: '23347A', fontStyle: '' },
                { token: 'string', foreground: '3F6D7B', fontStyle: 'bold' }
            ],
            colors: {
                'editor.foreground': '#000000'
            }
        });

        // Register a completion item provider for the new language
        monaco.languages.registerCompletionItemProvider('mermaid', {
            provideCompletionItems: () => {
                var suggestions = [
                    {
                        label: 'sequenceDiagram',
                        kind: monaco.languages.CompletionItemKind.Keyword,
                        insertText: 'sequenceDiagram'
                    }
                ];
                return { suggestions: suggestions };
            }
        });


        editor = monaco.editor.create(document.getElementById('txtDiagramData'), {
            //value: ` diagram.data `,
            value: 'Loading...',
            automaticLayout: true,
            scrollBeyondLastLine: false,
            language: 'mermaid',
            theme: 'mermaid',
            minimap: {
                enabled: false
            },
            //glyphMargin: false,
            folding: false,
            // Undocumented see https://github.com/Microsoft/vscode/issues/30795#issuecomment-410998882
            // lineDecorationsWidth: 0,
        });

        editor.onDidChangeModelContent(function (e) {
            tryRender();
        });


        let originalData = "";

        getData(`/diagrams/${diagramId}/fetch`).then(function (data) {

            originalData = data.data;

            editor.setValue(data.data);

            tryRender(); // Render the initial data on page load

        });


    });

}