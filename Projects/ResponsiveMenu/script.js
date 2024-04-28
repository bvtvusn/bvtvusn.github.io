const menuItems = {
  "Home": {"link": "#"},
  "About": {
    "link": "#about",
    "children": {
      "Team": {"link": "#team"},
      "Mission": {"link": "#mission"},
      "Values": {
        "link": "#values",
        "children": {
          "Integrity": {"link": "#integrity"},
          "Excellence": {"link": "#excellence"}
        }
      }
    }
  },
  "Services": {
    "link": "#services",
    "children": {
      "Web Design": {"link": "#web-design"},
      "Graphic Design": {"link": "#graphic-design"}
    }
  },
  "Contact": {"link": "#contact"}
};

const menuElement = document.getElementById('menu');
const navigationPathElement = document.getElementById('navigationPath');
let navigationPath = [];

function renderMenu() {
    navigationPathElement.innerHTML = ''; // Clear previous content
    navigationPath.forEach(path => {
        const pathItem = document.createElement('div');
        pathItem.textContent = path;
        navigationPathElement.appendChild(pathItem);
    });
    let currentLevel = menuItems;
    navigationPath.forEach(key => {
        currentLevel = currentLevel[key].children;
    });
    menuElement.innerHTML = '';
    renderParentButton();
    for (let label in currentLevel) {
        if (currentLevel.hasOwnProperty(label)) {
            const item = currentLevel[label];
            const menuItem = document.createElement('div');
            menuItem.classList.add('menu-item');
            menuItem.textContent = label;
            menuItem.addEventListener('click', () => {
                handleMenuItemClick(item, label);
            });
            menuElement.appendChild(menuItem);
        }
    }
}

function renderParentButton() {
    let parentButton = document.querySelector('.parent-button');
    if (!parentButton) {
        parentButton = document.createElement('div');
        parentButton.classList.add('parent-button');
        parentButton.innerHTML = '<i class="fas fa-chevron-left"></i>'; // FontAwesome chevron-left icon
        parentButton.addEventListener('click', navigateToParent);
        menuElement.insertBefore(parentButton, menuElement.firstChild);
    }
    parentButton.style.display = navigationPath.length ? 'block' : 'none';
}

function handleMenuItemClick(item, label) {
    if (item.children) {
        navigationPath.push(label);
        renderMenu();                    
    } else {
        window.location.href = item.link;
    }
}

function navigateToParent() {
    navigationPath.pop();
    renderMenu();
}

function toggleMenu() {
    const menuContainer = document.querySelector('.menu-container');
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuContainer.style.left === '0px') {
        menuContainer.style.left = '-200px'; // Hide the menu
        menuToggle.innerHTML = '<i class="fas fa-bars"></i> Menu'; // Change the hamburger icon to bars
    } else {
        menuContainer.style.left = '0px'; // Show the menu
        menuToggle.innerHTML = '<i class="fas fa-times"></i> Close'; // Change the hamburger icon to times (close)
    }
}


renderMenu();
