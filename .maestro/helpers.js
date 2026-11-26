/* global output */
/* eslint-disable no-unused-vars */

function generateDynamicCpf() {
  const rnd = () => Math.floor(Math.random() * 9);
  let n = Array.from({length: 9}, rnd);
  let d1 = 11 - (n.reduce((s, d, i) => s + d * (10 - i), 0) % 11);
  d1 = d1 >= 10 ? 0 : d1;
  n.push(d1);
  let d2 = 11 - (n.reduce((s, d, i) => s + d * (11 - i), 0) % 11);
  d2 = d2 >= 10 ? 0 : d2;
  n.push(d2);
  output.dynamicCpf = n.join('');
  output.dynamicEmail = 'cli_' + Date.now() + '@cashme.com';
}

function generateDynamicCnpj() {
  const rnd = () => Math.floor(Math.random() * 9);
  let n = Array.from({length: 8}, rnd).concat([0, 0, 0, 1]);
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let d1 = 11 - (n.reduce((s, d, i) => s + d * w1[i], 0) % 11);
  d1 = d1 >= 10 ? 0 : d1;
  n.push(d1);
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let d2 = 11 - (n.reduce((s, d, i) => s + d * w2[i], 0) % 11);
  d2 = d2 >= 10 ? 0 : d2;
  n.push(d2);
  output.dynamicCnpj = n.join('');
  output.dynamicMerchantEmail = 'loj_' + Date.now() + '@cashme.com';
}
