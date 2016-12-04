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

(function() {
  var tabItems = document.getElementsByClassName('tab-item');
  var tabContents = document.getElementsByClassName('tab-content');
  var selectedIndex = 0;

  for (var i = 0; i < tabItems.length; ++i) {
    tabContents[i].style.display = 'none';
    tabItems[i].addEventListener('click', onClick);
  }

  tabContents[selectedIndex].style.display = '';

  function onClick(event) {
    for (var i = 0; i < tabItems.length; ++i) {
      if (tabItems[i] === event.target) {
        tabItems[selectedIndex].className = 'tab-item';
        tabContents[selectedIndex].style.display = 'none';

        selectedIndex = i;

        tabItems[selectedIndex].className = 'tab-item active';
        tabContents[selectedIndex].style.display = '';
        break;
      }
    }
  }
})();

(function() {
  var menuBtn = document.getElementsByClassName('menu-btn')[0];
  var menuBar = document.getElementsByClassName('menu-bar')[0];

  var menuBtnIsClicked = false;
  menuBtn.addEventListener('click', function() {
    menuBtnIsClicked = !menuBtnIsClicked;
    //menuBtn.className = menuBtnIsClicked ? 'menu-btn on' : 'menu-btn';
    //menuBar.style.display = menuBtnIsClicked ? 'block' : 'none';

    showAndHide(1);
  });


  var sideBtn = document.getElementsByClassName('side-btn')[0];
  var sideBar = document.getElementsByClassName('side-bar')[0];

  var sideBtnIsClicked = false;

  if (sideBtn) {
    sideBtn.addEventListener('click', function() {
      sideBtnIsClicked = !sideBtnIsClicked;
      //sideBtn.className = sideBtnIsClicked ? 'side-btn on' : 'side-btn';
      //sideBar.style.left = sideBtnIsClicked ? '0' : '-250px';

      showAndHide(2);
    });
  }


  function showAndHide(mode) {
    if (mode === 1) {
      if (menuBtnIsClicked) {
        sideBtnIsClicked = false;
      }
    } else {
      if (sideBtnIsClicked) {
        menuBtnIsClicked = false;
      }
    }



    menuBtn.className = menuBtnIsClicked ? 'menu-btn on' : 'menu-btn';
    menuBar.style.display = menuBtnIsClicked ? 'block' : 'none';

    if (sideBtn) {
      sideBtn.className = sideBtnIsClicked ? 'side-btn on' : 'side-btn';
      sideBar.style.left = sideBtnIsClicked ? '0' : '-250px';
    }

  }
})();