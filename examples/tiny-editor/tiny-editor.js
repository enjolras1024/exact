function TinyEditor() {
  Exact.Component.apply(this, arguments);
}

Exact.defineClass({
  constructor: TinyEditor, extend: Exact.Component,
  statics: {
    template: Exact.Skin.query('.template .tiny-editor'),
    defaults: function() {
      return {
        fontColor: 'black',
        height: 300,
        width: 600
      }
    },
    resources: {
      commands: [
        {name: 'bold', icon: 'text-bold', title: 'bold'},
        {name: 'italic', icon: 'text-italic', title: 'italic'},
        {name: 'underline', icon: 'text-underline', title: 'underline'},
        {name: 'subscript', icon: 'text-subscript', title: 'subscript'},
        {name: 'superscript', icon: 'text-superscript', title: 'superscript'},
        {name: 'justifyLeft', icon: 'text-align-left', title: 'align left'},
        {name: 'justifyCenter',  icon: 'text-align-center', title: 'align center'},
        {name: 'justifyRight', icon: 'text-align-right', title: 'align right'},
        {name: 'insertOrderedList', icon: 'text-ordered-list', title: 'ordered list'},
        {name: 'insertUnorderedList', icon: 'text-bullets-list', title: 'bullets list'},
        {name: 'undo', icon: 'action-undo', title: 'undo'},
        {name: 'redo', icon: 'action-redo', title: 'redo'}
      ]
    }
  },
  ready: function() {
    this.onCmdCheck = this.onCmdCheck.bind(this);
    this.on('click', this.onCmdCheck);
    this.on('keyup', this.onCmdCheck);
    this.on('mouseup', this.onCmdCheck);
    this.body.on('paste', this.onPaste.bind(this));
  },
  execCmd: function(name, value) {
    document.execCommand(name, false, value);
  },
  checkCmd: function(name) {
    if (name === 'undo' || name === 'redo') {
      return document.queryCommandEnabled(name);
    }
    return document.queryCommandState(name);
  },
  getData: function getData(type) {
    var $body = this.body.$skin;
    if (type === 'html') {
      return $body.innerHTML;
    } else if (type === 'text') {
      return $body.textContent || $body.innerText;
    }
    return '';
  },
  setData: function setData(type, data) {
    if (type === 'html') {
      this.body.set('innerHTML', data);
    } else if (type === 'text') {
      this.body.set('innerHTML', filterText(data));
    }
  },
  onPaste: function(event) {
    event.preventDefault();
    if (event.clipboardData) {
      this.execCmd('insertHTML', filterText(event.clipboardData.getData('text/plain')))
    } else {
      var range,  html = filterText(window.clipboardData.getData("Text"));
      if (document.getSelection) {
        var frag = document.createDocumentFragment();
        var div = document.createElement('div');
        div.innerHTML = html;
        while (div.firstChild) {
          frag.appendChild(div.firstChild);
        }
        range = document.getSelection().getRangeAt(0);
        range.deleteContents();
        range.insertNode(frag);
      } else if (document.selection) {
        range = document.selection.createRange();
        range.pasteHTML(html);
      }
    }
  },
  onCmdCheck: function() {
    this.send('check');
  },
  onFontSizeChange: function(event) {
    this.body.style.set('fontSize', event.target.value);
  }
});

function filterText(text) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[ ]/g, '&nbsp;').replace(/\n/g, '<br>');
}

var editor = Exact.Component.create(TinyEditor, {fontColor: '#666'});
editor.setData('text', 'This editor should work well in IE8~11.');
editor.attach(Exact.Skin.query('#editor'));