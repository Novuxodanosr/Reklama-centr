const sharp=require('sharp');const fs=require('fs');
const OUT='D:/САЙТ/Instagram';
(async()=>{
// Аватар: знак логотипа белым на фирменном красном, с запасом под круглую обрезку Instagram.
let svg=fs.readFileSync('D:/САЙТ/RC/app/icon.svg','utf8');
svg=svg.replace(/<rect [^>]*\/>/,'<rect width="137" height="135.25" fill="#E4142F"/>')
       .replace('<g fill="#fff" transform="translate(10.3 10.1) scale(0.85)">','<g fill="#fff" transform="translate(27.4 27.05) scale(0.6)">');
await sharp(Buffer.from(svg),{density:1200}).resize(1080,1080,{fit:'cover'}).png().toFile(OUT+'/avatar.png');
// Посты: 4:5, 1080×1350. Номер = порядок публикации; последний (9) окажется в сетке первым, слева сверху.
const posts=['heraldry-star','octobank-set-box','paynet-letters','eriell-floor8','mexxi-stand','octobank-pavilion','oz-makon-night','tmz-stele-night','infinity-letter'];
for(const [i,id] of posts.entries()){
  await sharp('D:/САЙТ/RC/public/works/'+id+'.webp').resize(1080,1350,{fit:'cover',position:'attention',kernel:'lanczos3'}).sharpen({sigma:0.6}).jpeg({quality:92,mozjpeg:true}).toFile(`${OUT}/posts/${i+1}-${id}.jpg`);
}
console.log('ok');
})();
