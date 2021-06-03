const fs = require('fs-extra');

const build = () => {
  const sitemap = JSON.parse(fs.readFileSync('./src/sitemap.json'));
  const { dirs, copy, html, galleries } = sitemap;

  fs.emptyDirSync('./dist');
  fs.copySync('./src/assets/', './dist/assets/');

  const gallerySubstitution = galleries.map(({ name }) => `
    <li><a href="/${name.toLowerCase()}/">${name}</a></li>
  `).join('');

  const compileTemplateWithSubs = (template, substitutions) => {
    const regexpSubs = /{{(.+?)}}/ig;
    return (template.match(regexpSubs) || []).reduce((acc, subExpr) => {
      const subProp = subExpr.replace(/[{} ]/g, '');
      let substitution = substitutions[subProp] || '';
      if (subProp === 'galleries') {
        substitution = gallerySubstitution;
      } else if (subProp === 'buster') {
        substitution = Math.floor(Math.random() * 1000000).toString();
      }
      const subContent = substitution.startsWith('./')
        ? compileTemplateWithSubs(fs.readFileSync(`./src/${substitution.replace('./', '')}`).toString(), substitutions)
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

    const substitutions = {
      content: `./${gallery.template}`,
      subtitle: gallery.name,
      ...gallery.images.reduce((acc, { name, image }, i) => {
        acc[`image_${i}`] = `/${gallery.name.toLowerCase()}/${image}`;
        acc[`link_${i}`] = `/${gallery.name.toLowerCase()}/${name.toLowerCase()}.html`;
        return acc;
      }, {}),
    };

    const galleryHTML = compileTemplateWithSubs(baseHTML, substitutions);
    fs.writeFileSync(`./dist/${gallery.name.toLowerCase()}/index.html`, galleryHTML);


    gallery.images.forEach(({ name, image }, i) => {
      const nextImage = gallery.images[i + 1];
      const linkUrl = nextImage
        ? `/${gallery.name.toLowerCase()}/${nextImage.name.toLowerCase()}.html`
        : `/${gallery.name.toLowerCase()}/index.html`;
      const imageElm = `
        <a
          href="${linkUrl}"
          class="image-full"
          style="background-image: url(/${gallery.name.toLowerCase()}/${image})"
        ></a>`;
      const substitutions = {
        content: imageElm,
        subtitle: `${gallery.name} - ${name}`,
      };
      const imgHTML = compileTemplateWithSubs(baseHTML, substitutions);
      fs.writeFileSync(`./dist/${gallery.name.toLowerCase()}/${name.toLowerCase()}.html`, imgHTML);
    });
  });

  console.log('Site built');
};

if (require.main === module) {
  build();
}

module.exports = {
  build,
};
