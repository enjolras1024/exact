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