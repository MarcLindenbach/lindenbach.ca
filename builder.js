const fs = require('fs-extra');
const sitemap = require('./src/sitemap.json');

const build = () => {
  const { dirs, copy, html, galleries } = sitemap;

  fs.emptyDirSync('./dist');
  fs.copySync('./src/assets/', './dist/assets/');

  const gallerySubstitution = galleries.map(({ name }) => `
    <li><a href="/${name.toLowerCase()}/">${name}</a></li>
  `).join('');

  const compileTemplateWithSubs = (template, substitutions) => {
    const regexpSubs = /{{(.*)}}/ig;
    return template.match(regexpSubs).reduce((acc, subExpr) => {
      const subProp = subExpr.replace(/[{} ]/g, '');
      let substitution = substitutions[subProp];
      if (subProp === 'galleries') {
        substitution = gallerySubstitution;
      } else if (subProp === 'buster') {
        substitution = Math.floor(Math.random() * 1000000).toString();
      }
      const subContent = substitution.startsWith('./')
        ? fs.readFileSync(`./src/${substitution.replace('./', '')}`).toString()
        : substitution;
      return acc.replace(subExpr, subContent);
    }, template);
  };

  const baseHTML = fs.readFileSync('./src/base.html').toString();
  html.forEach((item) => {
    let contents = compileTemplateWithSubs(baseHTML, item.substitutions);
    fs.writeFileSync(`./dist/${item.out}`, contents);
  });

  galleries.forEach((gallery) => {
    fs.emptyDirSync(`./dist/${gallery.name.toLowerCase()}`);
    fs.copySync(
      `./src/${gallery.name.toLowerCase()}`,
      `./dist/${gallery.name.toLowerCase()}`,
    );
    let galleryHTML = baseHTML;
    let galleryTemplate = fs.readFileSync(`./src/${gallery.template}`).toString();
    galleryHTML = galleryHTML.replace('{{ content }}', galleryTemplate);
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

  console.log('Site built');
};

if (require.main === module) {
  build();
}

module.exports = {
  build,
};
