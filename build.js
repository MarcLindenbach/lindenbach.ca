const fs = require('fs-extra');
const sitemap = require('./src/sitemap.json');

const { dirs, copy, html, galleries } = sitemap;

fs.emptyDirSync('./dist');
fs.copySync('./src/assets/', './dist/assets/');

const gallerySubstitution = galleries.map(({ name }) => `
  <li><a href="/${name.toLowerCase()}/">${name}</a></li>
`).join('');

const baseHTML = fs.readFileSync('./src/base.html').toString();
html.forEach((item) => {
  let contents = baseHTML;
  const regexpSubs = /{{(.*)}}/ig;
  contents.match(regexpSubs).forEach((subExpr) => {
    const subProp = subExpr.replace(/[{} ]/g, '');
    let substitution = item.substitutions[subProp];
    if (subProp === 'galleries') {
      substitution = gallerySubstitution;
    }
    const subContent = substitution.startsWith('./')
      ? fs.readFileSync(`./src/${substitution.replace('./', '')}`).toString()
      : substitution;
    contents = contents.replace(subExpr, subContent);
  });
  fs.writeFileSync(`./dist/${item.out}`, contents);
});

galleries.forEach((gallery) => {
  fs.emptyDirSync(`./dist/${gallery.name.toLowerCase()}`);
  fs.copySync(
    `./src/${gallery.name.toLowerCase()}`,
    `./dist/${gallery.name.toLowerCase()}`,
  );
  let galleryHTML = baseHTML;
  let template = fs.readFileSync(`./src/${gallery.template}`).toString();
  galleryHTML = galleryHTML.replace('{{ content }}', template);
  galleryHTML = galleryHTML.replace('{{ galleries }}', gallerySubstitution);

  gallery.images.forEach(({ name, image }, i) => {
    let imgHTML = baseHTML;
    const imageElm = `
      <a
        href="/${gallery.name.toLowerCase()}/index.html"
        class="image-full"
        style="background-image: url(/${gallery.name.toLowerCase()}/${image})"
      ></a>`;
    imgHTML = imgHTML.replace('{{ content }}', imageElm);
    imgHTML = imgHTML.replace('{{ galleries }}', gallerySubstitution);
    fs.writeFileSync(`./dist/${gallery.name.toLowerCase()}/${name.toLowerCase()}.html`, imgHTML);

    galleryHTML = galleryHTML.replace(`{{ image[${i}] }}`, `/${gallery.name.toLowerCase()}/${image}`);
  });

    fs.writeFileSync(`./dist/${gallery.name.toLowerCase()}/index.html`, galleryHTML);
});
