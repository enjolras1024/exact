(function() {
  var boxes = document.getElementsByClassName('code-box');
  var sources = document.getElementsByClassName('code-behind');

  if (!boxes.length) { return; }

  for (var i = 0; i < boxes.length; ++i) {
    var mode, className = sources[i].className;
    if (className.indexOf('js-mode') >= 0) {
      mode = 'javascript';
    } else if (className.indexOf('xml-mode') >= 0) {
      mode = "text/html";
    }

    var myCodeMirror = CodeMirror(boxes[i], {
      value: sources[i].textContent,
      theme: 'alice',
      mode:  mode,
      lineNumbers: true,
      readOnly: 'nocursor'
    });
  }

})();