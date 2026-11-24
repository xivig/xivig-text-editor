import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const bootstrap5Snippets: Completion[] = [
  // --- STARTER & CDN ---
  snippetCompletion(
    `<!doctype html>
<html lang="\${1:en}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>\${2:Bootstrap 5 Application}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
  </head>
  <body>
    <div class="container py-5">
      <h1>\${3:Hello, Bootstrap 5!}</h1>
      \${4}
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
  </body>
</html>`,
    {
      label: 'b5-$',
      detail: 'Bootstrap 5 HTML5 Starter Template',
      info: 'Complete responsive HTML5 boilerplate with Bootstrap 5.3 CDN CSS & JS bundle.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">',
    {
      label: 'b5-cdn-css',
      detail: 'Bootstrap 5 CDN CSS Link Tag',
      info: 'Latest Bootstrap 5.3 minified stylesheet CDN link tag.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>',
    {
      label: 'b5-cdn-js',
      detail: 'Bootstrap 5 CDN Bundle Script Tag',
      info: 'Latest Bootstrap 5.3 minified JavaScript bundle (includes Popper).',
      type: 'snippet',
    }
  ),

  // --- GRID & LAYOUT ---
  snippetCompletion(
    '<div class="container">\n\t<div class="row">\n\t\t<div class="col">\n\t\t\t${1}\n\t\t</div>\n\t</div>\n</div>',
    {
      label: 'b5-grid',
      detail: 'Bootstrap 5 Grid: Container > Row > Col',
      info: 'Basic responsive 12-column grid container.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<div class="container\${1:-fluid}">\n\t\${2}\n</div>',
    {
      label: 'b5-container',
      detail: 'Bootstrap 5 Container',
      info: 'Responsive fixed or fluid layout container.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<div class="row">\n\t\${1}\n</div>',
    {
      label: 'b5-row',
      detail: 'Bootstrap 5 Grid Row',
      info: 'Flexbox row wrapper for column elements.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<div class="col-\${1:md-6}">\n\t\${2}\n</div>',
    {
      label: 'b5-col',
      detail: 'Bootstrap 5 Grid Column',
      info: 'Responsive column (e.g. col-md-6, col-lg-4, col-12).',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<div class="row row-cols-\${1:1} row-cols-md-\${2:3} g-\${3:4}">\n\t<div class="col">\n\t\t\${4}\n\t</div>\n</div>',
    {
      label: 'b5-row-cols',
      detail: 'Bootstrap 5 Row Columns with Gutter',
      info: 'Card grid or item grid with responsive column counts per row.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: NAVBAR & NAV ---
  snippetCompletion(
    `<nav class="navbar navbar-expand-\${1:lg} navbar-\${2:dark} bg-\${3:dark}">
  <div class="container\${4:-fluid}">
    <a class="navbar-brand" href="\${5:#}">\${6:Brand}</a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#\${7:navbarSupportedContent}" aria-controls="\${7:navbarSupportedContent}" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="\${7:navbarSupportedContent}">
      <ul class="navbar-nav me-auto mb-2 mb-\${1:lg}-0">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="\${8:#}">Home</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="\${9:#}">Link</a>
        </li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
            Dropdown
          </a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#">Action</a></li>
            <li><a class="dropdown-item" href="#">Another action</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">Something else here</a></li>
          </ul>
        </li>
      </ul>
      <form class="d-flex" role="search">
        <input class="form-control me-2" type="search" placeholder="Search" aria-label="Search">
        <button class="btn btn-outline-success" type="submit">Search</button>
      </form>
    </div>
  </div>
</nav>`,
    {
      label: 'b5-navbar',
      detail: 'Bootstrap 5 Responsive Navbar',
      info: 'Full responsive navigation bar with brand, hamburger toggler, nav links, dropdown, and search form.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<ul class="nav nav-\${1:pills}">
  <li class="nav-item">
    <a class="nav-link active" aria-current="page" href="\${2:#}">Active</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" href="\${3:#}">Link</a>
  </li>
  <li class="nav-item">
    <a class="nav-link disabled" aria-disabled="true">Disabled</a>
  </li>
</ul>`,
    {
      label: 'b5-nav',
      detail: 'Bootstrap 5 Navigation Tabs / Pills',
      info: 'Basic flexbox navigation with tabs or pills styling.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: CARD ---
  snippetCompletion(
    `<div class="card" style="width: \${1:18rem};">
  <img src="\${2:https://placehold.co/600x400}" class="card-img-top" alt="\${3:Card image}">
  <div class="card-body">
    <h5 class="card-title">\${4:Card Title}</h5>
    <p class="card-text">\${5:Some quick example text to build on the card title and make up the bulk of the card's content.}</p>
    <a href="\${6:#}" class="btn btn-\${7:primary}">\${8:Go somewhere}</a>
  </div>
</div>`,
    {
      label: 'b5-card',
      detail: 'Bootstrap 5 Card with Image & Body',
      info: 'Standard card component with image, header, text, and button.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div class="card text-center">
  <div class="card-header">
    \${1:Featured}
  </div>
  <div class="card-body">
    <h5 class="card-title">\${2:Special title treatment}</h5>
    <p class="card-text">\${3:With supporting text below as a natural lead-in to additional content.}</p>
    <a href="\${4:#}" class="btn btn-\${5:primary}">\${6:Button}</a>
  </div>
  <div class="card-footer text-body-secondary">
    \${7:2 days ago}
  </div>
</div>`,
    {
      label: 'b5-card-header-footer',
      detail: 'Bootstrap 5 Card with Header & Footer',
      info: 'Card component featuring header, body content, and muted footer.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: BUTTONS & BADGES ---
  snippetCompletion(
    '<button type="${1:button}" class="btn btn-${2:primary}">${3:Button}</button>',
    {
      label: 'b5-btn',
      detail: 'Bootstrap 5 Button',
      info: 'Standard styled button (primary, secondary, success, danger, warning, info, light, dark).',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<button type="${1:button}" class="btn btn-outline-${2:primary}">${3:Outline Button}</button>',
    {
      label: 'b5-btn-outline',
      detail: 'Bootstrap 5 Outline Button',
      info: 'Outline style button without solid background fill.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div class="btn-group" role="group" aria-label="\${1:Basic example}">
  <button type="button" class="btn btn-\${2:primary}">\${3:Left}</button>
  <button type="button" class="btn btn-\${2:primary}">\${4:Middle}</button>
  <button type="button" class="btn btn-\${2:primary}">\${5:Right}</button>
</div>`,
    {
      label: 'b5-btn-group',
      detail: 'Bootstrap 5 Button Group',
      info: 'Group multiple buttons together on a single line.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<span class="badge bg-${1:primary}">${2:New}</span>',
    {
      label: 'b5-badge',
      detail: 'Bootstrap 5 Badge',
      info: 'Small highlight tag or count indicator.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<span class="badge rounded-pill bg-${1:primary}">${2:Pill}</span>',
    {
      label: 'b5-badge-pill',
      detail: 'Bootstrap 5 Rounded Pill Badge',
      info: 'Badge with rounded pill border radius.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: ALERT & MODAL ---
  snippetCompletion(
    `<div class="alert alert-\${1:primary} alert-dismissible fade show" role="alert">
  \${2:<strong>Heads up!</strong> This is a dismissible alert.}
  <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
</div>`,
    {
      label: 'b5-alert',
      detail: 'Bootstrap 5 Dismissible Alert',
      info: 'Contextual feedback alert with close button and fade transition.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<!-- Button trigger modal -->
<button type="button" class="btn btn-\${1:primary}" data-bs-toggle="modal" data-bs-target="#\${2:exampleModal}">
  \${3:Launch Modal}
</button>

<!-- Modal -->
<div class="modal fade" id="\${2:exampleModal}" tabindex="-1" aria-labelledby="\${2:exampleModal}Label" aria-hidden="true">
  <div class="modal-dialog\${4: modal-dialog-centered}">
    <div class="modal-content">
      <div class="modal-header">
        <h1 class="modal-title fs-5" id="\${2:exampleModal}Label">\${5:Modal Title}</h1>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        \${6:Modal content goes here...}
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">\${7:Save changes}</button>
      </div>
    </div>
  </div>
</div>`,
    {
      label: 'b5-modal',
      detail: 'Bootstrap 5 Modal Dialog with Trigger',
      info: 'Accessible modal dialog with trigger button, backdrop, header, body, and footer.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: ACCORDION & CAROUSEL ---
  snippetCompletion(
    `<div class="accordion" id="\${1:accordionExample}">
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
        \${2:Accordion Item #1}
      </button>
    </h2>
    <div id="collapseOne" class="accordion-collapse collapse show" data-bs-parent="#\${1:accordionExample}">
      <div class="accordion-body">
        \${3:Content for the first accordion item.}
      </div>
    </div>
  </div>
  <div class="accordion-item">
    <h2 class="accordion-header">
      <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
        \${4:Accordion Item #2}
      </button>
    </h2>
    <div id="collapseTwo" class="accordion-collapse collapse" data-bs-parent="#\${1:accordionExample}">
      <div class="accordion-body">
        \${5:Content for the second accordion item.}
      </div>
    </div>
  </div>
</div>`,
    {
      label: 'b5-accordion',
      detail: 'Bootstrap 5 Accordion Collapse',
      info: 'Collapsible accordion component with multiple accordion items.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div id="\${1:carouselExample}" class="carousel slide" data-bs-ride="carousel">
  <div class="carousel-indicators">
    <button type="button" data-bs-target="#\${1:carouselExample}" data-bs-slide-to="0" class="active" aria-current="true" aria-label="Slide 1"></button>
    <button type="button" data-bs-target="#\${1:carouselExample}" data-bs-slide-to="1" aria-label="Slide 2"></button>
    <button type="button" data-bs-target="#\${1:carouselExample}" data-bs-slide-to="2" aria-label="Slide 3"></button>
  </div>
  <div class="carousel-inner">
    <div class="carousel-item active">
      <img src="\${2:https://placehold.co/1200x500}" class="d-block w-100" alt="\${3:First slide}">
      <div class="carousel-caption d-none d-md-block">
        <h5>\${4:First slide label}</h5>
        <p>\${5:Some representative placeholder content for the first slide.}</p>
      </div>
    </div>
    <div class="carousel-item">
      <img src="\${6:https://placehold.co/1200x500}" class="d-block w-100" alt="\${7:Second slide}">
    </div>
  </div>
  <button class="carousel-control-prev" type="button" data-bs-target="#\${1:carouselExample}" data-bs-slide="prev">
    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Previous</span>
  </button>
  <button class="carousel-control-next" type="button" data-bs-target="#\${1:carouselExample}" data-bs-slide="next">
    <span class="carousel-control-next-icon" aria-hidden="true"></span>
    <span class="visually-hidden">Next</span>
  </button>
</div>`,
    {
      label: 'b5-carousel',
      detail: 'Bootstrap 5 Carousel / Image Slider',
      info: 'Image carousel slider with indicators, captions, and previous/next navigation controls.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: DROPDOWN & OFFCANVAS ---
  snippetCompletion(
    `<div class="dropdown">
  <button class="btn btn-\${1:secondary} dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
    \${2:Dropdown Button}
  </button>
  <ul class="dropdown-menu">
    <li><a class="dropdown-item" href="\${3:#}">\${4:Action}</a></li>
    <li><a class="dropdown-item" href="\${5:#}">\${6:Another action}</a></li>
    <li><hr class="dropdown-divider"></li>
    <li><a class="dropdown-item" href="\${7:#}">\${8:Separated link}</a></li>
  </ul>
</div>`,
    {
      label: 'b5-dropdown',
      detail: 'Bootstrap 5 Dropdown Menu',
      info: 'Toggleable menu for displaying lists of links and actions.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<!-- Button trigger offcanvas -->
<button class="btn btn-\${1:primary}" type="button" data-bs-toggle="offcanvas" data-bs-target="#\${2:offcanvasExample}" aria-controls="\${2:offcanvasExample}">
  \${3:Open Offcanvas}
</button>

<!-- Offcanvas -->
<div class="offcanvas offcanvas-\${4:start}" tabindex="-1" id="\${2:offcanvasExample}" aria-labelledby="\${2:offcanvasExample}Label">
  <div class="offcanvas-header">
    <h5 class="offcanvas-title" id="\${2:offcanvasExample}Label">\${5:Offcanvas Title}</h5>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>
  <div class="offcanvas-body">
    <div>
      \${6:Some text as placeholder. In real life you can have the elements you have chosen.}
    </div>
  </div>
</div>`,
    {
      label: 'b5-offcanvas',
      detail: 'Bootstrap 5 Offcanvas Sidebar Drawer',
      info: 'Hidden sidebars for navigation, shopping carts, or extra details.',
      type: 'snippet',
    }
  ),

  // --- COMPONENTS: TABLE & PAGINATION ---
  snippetCompletion(
    `<div class="table-responsive">
  <table class="table table-\${1:striped} table-\${2:hover}">
    <thead>
      <tr>
        <th scope="col">#</th>
        <th scope="col">\${3:First}</th>
        <th scope="col">\${4:Last}</th>
        <th scope="col">\${5:Handle}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <th scope="row">1</th>
        <td>Mark</td>
        <td>Otto</td>
        <td>@mdo</td>
      </tr>
      <tr>
        <th scope="row">2</th>
        <td>Jacob</td>
        <td>Thornton</td>
        <td>@fat</td>
      </tr>
    </tbody>
  </table>
</div>`,
    {
      label: 'b5-table',
      detail: 'Bootstrap 5 Responsive Styled Table',
      info: 'Table component wrapped in responsive container with striped and hover classes.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<nav aria-label="\${1:Page navigation}">
  <ul class="pagination">
    <li class="page-item"><a class="page-link" href="#">Previous</a></li>
    <li class="page-item active"><a class="page-link" href="#">1</a></li>
    <li class="page-item"><a class="page-link" href="#">2</a></li>
    <li class="page-item"><a class="page-link" href="#">3</a></li>
    <li class="page-item"><a class="page-link" href="#">Next</a></li>
  </ul>
</nav>`,
    {
      label: 'b5-pagination',
      detail: 'Bootstrap 5 Pagination',
      info: 'Pagination component with active state and previous/next links.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<div class="progress" role="progressbar" aria-label="${1:Example}" aria-valuenow="${2:50}" aria-valuemin="0" aria-valuemax="100">\n\t<div class="progress-bar" style="width: ${2:50}%">${2:50}%</div>\n</div>',
    {
      label: 'b5-progress',
      detail: 'Bootstrap 5 Progress Bar',
      info: 'Custom progress bar with percentage fill and accessible attributes.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<div class="spinner-border text-${1:primary}" role="status">\n\t<span class="visually-hidden">Loading...</span>\n</div>',
    {
      label: 'b5-spinner',
      detail: 'Bootstrap 5 Spinner Loader',
      info: 'CSS-only spinner for loading states in projects.',
      type: 'snippet',
    }
  ),

  // --- FORMS ---
  snippetCompletion(
    `<div class="mb-3">
  <label for="\${1:exampleInput}" class="form-label">\${2:Email address}</label>
  <input type="\${3:email}" class="form-control" id="\${1:exampleInput}" placeholder="\${4:name@example.com}">
  <div class="form-text">\${5:We'll never share your email with anyone else.}</div>
</div>`,
    {
      label: 'b5-form-input',
      detail: 'Bootstrap 5 Form Control & Label',
      info: 'Standard text, email, or password input with label and helper text.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div class="form-floating mb-3">
  <input type="\${1:email}" class="form-control" id="\${2:floatingInput}" placeholder="\${3:name@example.com}">
  <label for="\${2:floatingInput}">\${4:Email address}</label>
</div>`,
    {
      label: 'b5-form-floating',
      detail: 'Bootstrap 5 Floating Label Input',
      info: 'Floating label that animates smoothly above input on focus or input.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<select class="form-select" aria-label="\${1:Default select example}">
  <option selected>\${2:Open this select menu}</option>
  <option value="1">\${3:One}</option>
  <option value="2">\${4:Two}</option>
  <option value="3">\${5:Three}</option>
</select>`,
    {
      label: 'b5-form-select',
      detail: 'Bootstrap 5 Custom Select Dropdown',
      info: 'Custom styled native form select element.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div class="form-check">
  <input class="form-check-input" type="checkbox" value="" id="\${1:flexCheckDefault}">
  <label class="form-check-label" for="\${1:flexCheckDefault}">
    \${2:Default checkbox}
  </label>
</div>`,
    {
      label: 'b5-form-check',
      detail: 'Bootstrap 5 Checkbox',
      info: 'Consistent, cross-browser styled checkbox.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div class="form-check form-switch">
  <input class="form-check-input" type="checkbox" role="switch" id="\${1:flexSwitchCheckDefault}">
  <label class="form-check-label" for="\${1:flexSwitchCheckDefault}">\${2:Default switch checkbox input}</label>
</div>`,
    {
      label: 'b5-form-switch',
      detail: 'Bootstrap 5 Toggle Switch',
      info: 'Toggle switch checkbox input.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<div class="input-group mb-3">
  <span class="input-group-text" id="\${1:basic-addon1}">\${2:@}</span>
  <input type="text" class="form-control" placeholder="\${3:Username}" aria-label="\${3:Username}" aria-describedby="\${1:basic-addon1}">
</div>`,
    {
      label: 'b5-input-group',
      detail: 'Bootstrap 5 Input Group with Addon',
      info: 'Extend form controls by adding text, buttons, or button groups on either side.',
      type: 'snippet',
    }
  ),
];
