// BACKUP / EXAMPLE ONLY — not loaded by index.html.
// Live products come from Supabase (see README.md for the required schema).
// Kept here as a reference for the exact shape + category names app.js expects.
const PRODUCTS = [
 {id:1,name:'Тримери для стрижки собак',category:'Обладнання та інструменти для грумінгу',price:1899,oldPrice:2199,stock:4,img:'https://images.unsplash.com/photo-1591946614720-90a587da4a36?auto=format&fit=crop&w=800&q=80',desc:'Професійний тример для домашнього грумінгу.'},
 {id:2,name:'Металева миска подвійна',category:'Годівниці, поїлки та миски для домашніх тварин',price:349,oldPrice:null,stock:18,img:'https://images.unsplash.com/photo-1601758064135-4b1c4a1a0b1c?auto=format&fit=crop&w=800&q=80',desc:'Зручна подвійна миска для їжі та води.'},
 {id:3,name:'Лоток для котів закритий',category:'Туалетні лотки для тварин і аксесуари',price:899,oldPrice:1099,stock:6,img:'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',desc:'Закритий лоток з дверцятами та фільтром запаху.'},
 {id:4,name:'Антигельмінтні таблетки',category:'Ветеринарні препарати та засоби',price:249,oldPrice:null,stock:25,img:'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=800&q=80',desc:'Перед застосуванням проконсультуйтеся з ветеринаром.'},
 {id:5,name:'Шампунь для чутливої шкіри',category:'Засоби по догляду за тваринами',price:419,oldPrice:null,stock:12,img:'https://images.unsplash.com/photo-1611173622933-91942d394b04?auto=format&fit=crop&w=800&q=80',desc:'Делікатний догляд за шерстю та шкірою.'},
 {id:6,name:'Іграшка-канат для собак',category:'Іграшки для домашніх тварин',price:249,oldPrice:329,stock:20,img:'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',desc:'Міцна іграшка для активних ігор.'},
 {id:7,name:'Сухий корм для собак Premium',category:'Корм для собак і котів',price:799,oldPrice:null,stock:30,img:'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?auto=format&fit=crop&w=800&q=80',desc:'Збалансований повсякденний раціон для дорослих собак.'},
 {id:8,name:'В’ялене м’ясо для собак',category:'Ласощі для домашніх тварин',price:159,oldPrice:null,stock:0,img:'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80',desc:'Натуральні ласощі для заохочення.'},
 {id:9,name:'Шлейка для прогулянок',category:'Товари для прогулянок і подорожей з тваринами',price:459,oldPrice:549,stock:9,img:'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=800&q=80',desc:'Зручна шлейка для прогулянок та поїздок.'},
 {id:10,name:'Засіб для догляду за вухами',category:'Догляд та гігієна тварин',price:289,oldPrice:null,stock:14,img:'https://images.unsplash.com/photo-1581887936036-3f4f7f0b6679?auto=format&fit=crop&w=800&q=80',desc:'Гігієнічний засіб для регулярного догляду.'},
 {id:11,name:'Лежак для собак м’який',category:'Спальні місця для домашніх тварин, килимки',price:749,oldPrice:899,stock:7,img:'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=800&q=80',desc:'М’яке спальне місце для комфортного відпочинку.'}
];
