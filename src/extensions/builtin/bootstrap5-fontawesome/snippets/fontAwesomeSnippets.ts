import { snippetCompletion, Completion } from '@codemirror/autocomplete';

export const fontAwesomeSnippets: Completion[] = [
  // --- CDN LINK ---
  snippetCompletion(
    '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
    {
      label: 'fa-$',
      detail: 'Font Awesome 6 CDN Stylesheet Link',
      info: 'Font Awesome 6.5.1 all.min.css CDN link tag.',
      type: 'snippet',
    }
  ),

  // --- GENERAL ICON PATTERNS ---
  snippetCompletion(
    '<i class="fa-solid fa-\${1:star}"></i>',
    {
      label: 'fa-icon',
      detail: 'Font Awesome Solid Icon',
      info: 'Standard solid style icon element (e.g. fa-star, fa-user, fa-check).',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<i class="fa-regular fa-\${1:heart}"></i>',
    {
      label: 'fa-icon-regular',
      detail: 'Font Awesome Regular (Outline) Icon',
      info: 'Regular outline style icon element.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<i class="fa-brands fa-\${1:github}"></i>',
    {
      label: 'fa-icon-brands',
      detail: 'Font Awesome Brand Icon',
      info: 'Brand logo icon element (e.g. fa-github, fa-twitter, fa-google).',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<button type="\${1:button}" class="btn btn-\${2:primary}">
  <i class="fa-solid fa-\${3:check} me-2"></i>\${4:Submit}
</button>`,
    {
      label: 'fa-btn',
      detail: 'Bootstrap Button with Font Awesome Icon',
      info: 'Button with leading Font Awesome icon and margin spacing.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<i class="fa-solid fa-\${1:camera} fa-\${2:2x}"></i>',
    {
      label: 'fa-icon-size',
      detail: 'Font Awesome Icon with Size (2x, 3x, lg)',
      info: 'Icon with scaling size modifier (fa-2xs, fa-xs, fa-sm, fa-lg, fa-xl, fa-2xl, fa-2x, fa-3x).',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    '<i class="fa-solid fa-spinner fa-spin"></i>',
    {
      label: 'fa-spin',
      detail: 'Font Awesome Spinning Spinner Icon',
      info: 'Animated spinning loader icon.',
      type: 'snippet',
    }
  ),
  snippetCompletion(
    `<span class="fa-stack fa-\${1:2x}">
  <i class="fa-solid fa-\${2:circle} fa-stack-2x"></i>
  <i class="fa-solid fa-\${3:flag} fa-stack-1x fa-inverse"></i>
</span>`,
    {
      label: 'fa-stack',
      detail: 'Font Awesome Stacked Icons',
      info: 'Stack multiple icons together to create composite glyphs.',
      type: 'snippet',
    }
  ),

  // --- POPULAR SOLID ICONS ---
  snippetCompletion('<i class="fa-solid fa-house"></i>', {
    label: 'fa-house',
    detail: 'Font Awesome House / Home Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-user"></i>', {
    label: 'fa-user',
    detail: 'Font Awesome User Profile Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-magnifying-glass"></i>', {
    label: 'fa-search',
    detail: 'Font Awesome Search / Magnifying Glass Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-gear"></i>', {
    label: 'fa-gear',
    detail: 'Font Awesome Gear / Settings Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-envelope"></i>', {
    label: 'fa-envelope',
    detail: 'Font Awesome Envelope / Mail Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-bell"></i>', {
    label: 'fa-bell',
    detail: 'Font Awesome Bell Notification Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-check"></i>', {
    label: 'fa-check',
    detail: 'Font Awesome Checkmark Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-xmark"></i>', {
    label: 'fa-xmark',
    detail: 'Font Awesome X / Close Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-trash"></i>', {
    label: 'fa-trash',
    detail: 'Font Awesome Trash / Delete Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-bars"></i>', {
    label: 'fa-bars',
    detail: 'Font Awesome Hamburger Menu Bars Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-heart"></i>', {
    label: 'fa-heart',
    detail: 'Font Awesome Heart Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-star"></i>', {
    label: 'fa-star',
    detail: 'Font Awesome Star Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-arrow-right"></i>', {
    label: 'fa-arrow-right',
    detail: 'Font Awesome Arrow Right Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-circle-check"></i>', {
    label: 'fa-circle-check',
    detail: 'Font Awesome Circle Check (Success) Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-circle-xmark"></i>', {
    label: 'fa-circle-xmark',
    detail: 'Font Awesome Circle Xmark (Danger) Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-circle-info"></i>', {
    label: 'fa-circle-info',
    detail: 'Font Awesome Circle Info Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-triangle-exclamation"></i>', {
    label: 'fa-warning',
    detail: 'Font Awesome Triangle Exclamation (Warning) Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-code"></i>', {
    label: 'fa-code',
    detail: 'Font Awesome Code Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-solid fa-terminal"></i>', {
    label: 'fa-terminal',
    detail: 'Font Awesome Terminal Icon',
    type: 'snippet',
  }),

  // --- POPULAR BRAND ICONS ---
  snippetCompletion('<i class="fa-brands fa-github"></i>', {
    label: 'fa-github',
    detail: 'Font Awesome GitHub Brand Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-brands fa-x-twitter"></i>', {
    label: 'fa-twitter',
    detail: 'Font Awesome X / Twitter Brand Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-brands fa-facebook"></i>', {
    label: 'fa-facebook',
    detail: 'Font Awesome Facebook Brand Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-brands fa-linkedin"></i>', {
    label: 'fa-linkedin',
    detail: 'Font Awesome LinkedIn Brand Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-brands fa-google"></i>', {
    label: 'fa-google',
    detail: 'Font Awesome Google Brand Icon',
    type: 'snippet',
  }),
  snippetCompletion('<i class="fa-brands fa-youtube"></i>', {
    label: 'fa-youtube',
    detail: 'Font Awesome YouTube Brand Icon',
    type: 'snippet',
  }),
];
