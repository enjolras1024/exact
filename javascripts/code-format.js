(function() {
  //var boxes = document.getElementsByClassName('code-box');
  var sources = document.getElementsByClassName('code-behind');

  if (!sources.length) { return; }

  for (var i = 0; i < sources.length; ++i) {
    var mode, className = sources[i].className;
    if (className.indexOf('js-mode') >= 0) {
      mode = 'javascript';
    } else if (className.indexOf('xml-mode') >= 0) {
      mode = "text/html";
    }

    var myCodeMirror = CodeMirror(sources[i].parentNode, {
      value: sources[i].textContent,
      theme: 'alice',
      mode:  mode,
      lineNumbers: false,
      readOnly: 'nocursor'
    });
  }

})();