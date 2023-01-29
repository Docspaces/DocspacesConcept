document.addEventListener('DOMContentLoaded', function () {

    const resizer = document.getElementById('split_view_resize_handle');
    const leftPanel = resizer.previousElementSibling;
    const rightPanel = resizer.nextElementSibling;

    let mouse_track_x = 0;
    let mouse_track_y = 0;
    let resizer_leftWidth = 0;

    const resizer_mousedown = function (e) {

        mouse_track_x = e.clientX;
        mouse_track_y = e.clientY;

        resizer_leftWidth = leftPanel.getBoundingClientRect().width;

        document.addEventListener('mousemove', resizer_mousemove);
        document.addEventListener('mouseup', resizer_mouseup);

        //resizer.style.cursor = 'col-resize';
        //document.body.style.cursor = 'col-resize';

        leftPanel.style.userSelect = 'none';
        rightPanel.style.userSelect = 'none';

        leftPanel.style.pointerEvents = 'none';
        rightPanel.style.pointerEvents = 'none';
    }

    const resizer_mousemove = function (e) {

        const dx = e.clientX - mouse_track_x;
        const dy = e.clientY - mouse_track_y;

        const newLeftWidth = Math.min(((resizer_leftWidth + dx) * 100) / resizer.parentNode.getBoundingClientRect().width, 75.0);
        leftPanel.style.width = `${newLeftWidth}%`;

        rightPanel.style.maxWidth = `calc(${100-newLeftWidth}vw - 18px)`
    }

    const resizer_mouseup = function (e) {

        //resizer.style.cursor = 'cursor';
        //document.body.style.cursor = 'cursor';

        leftPanel.style.userSelect = 'all';
        rightPanel.style.userSelect = 'all';

        leftPanel.style.pointerEvents = 'auto';
        rightPanel.style.pointerEvents = 'auto';

        //leftPanel.style.removeProperty('pointerEvents');
        //rightPanel.style.removeProperty('pointerEvents');

        document.removeEventListener('mousemove', resizer_mousemove);
        document.removeEventListener('mouseup', resizer_mouseup);
    }

    resizer.addEventListener('mousedown', resizer_mousedown);
});