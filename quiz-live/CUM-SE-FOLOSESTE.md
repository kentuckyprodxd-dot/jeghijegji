# Quiz de cultură generală pentru TikTok LIVE

Pagina rulează singură, la nesfârșit:
1. Apare întrebarea, cu 4 variante (A, B, C, D), și un cronometru de 15 secunde.
2. Se arată răspunsul corect, împreună cu o curiozitate.
3. Trece la următoarea întrebare.

Sunt 113 întrebări, amestecate din nou la fiecare pornire, din categoriile: Geografie, România, Istorie, Știință, Spațiu, Animale, Sport, Cultură și Diverse. La fiecare 10 întrebări apare o pauză scurtă cu „Câte ai știut?” sau, dacă e conectat chatul, cu clasamentul.

## Cum îl pui pe live (TikTok LIVE Studio)
1. Deschide `quiz-live-descarcare.html` în Chrome.
2. Apasă `F` ca să intri pe ecran complet.
3. Apasă butonul ▶ (sau `Enter`). E nevoie de un click ca să pornească sunetul.
4. În TikTok LIVE Studio adaugă sursa **Captură fereastră** sau **Captură ecran** și alege fereastra de Chrome. Pune scena pe **vertical (9:16)**.
5. Sunetul: în LIVE Studio activează sunetul de pe calculator (desktop audio), ca să se audă muzica și efectele.

## Taste
- `Spațiu`: pauză / continuă
- `→`: următoarea întrebare
- `R`: arată răspunsul acum
- `M`: sunet pornit / oprit
- `F`: ecran complet

## Setări (le scrii după numele fișierului, în bara de adrese)
- `?t=20`: 20 de secunde pentru fiecare întrebare (implicit 15)
- `?r=10`: cât timp stă răspunsul pe ecran (implicit 7 s)
- `?pauza=15`: pauza vine după 15 întrebări (cu `0` dispare)
- `?vol=0.5`: volumul (de la 0 la 1)
- `?amestec=0`: întrebările vin mereu în aceeași ordine

Le poți combina, de exemplu: `quiz-live-descarcare.html?t=20&vol=0.6`

## Bonus: citește chatul singur (cu TikFinity)
Dacă ai TikFinity (tikfinity.zerody.one) pornit pe calculator, conectat la live-ul tău, pagina se leagă singură la el, prin WebSocket, la `ws://localhost:21213`. În colț apare „🟢 CHAT CONECTAT” și, de acolo:
- pagina numără câți au răspuns și arată procentele pentru fiecare variantă;
- afișează primii 3 care au răspuns corect (🥇🥈🥉);
- ține un clasament pe puncte, care apare în pauze. Primul care răspunde corect primește 4 puncte, al doilea 3, al treilea 2, iar ceilalți câte 1.

Oamenii scriu în chat doar litera, `A`, `B`, `C` sau `D` (merge și `1`–`4`). Contează doar primul răspuns al fiecăruia.

Ca să vezi cum arată fără live, deschide pagina cu `?demo=1`: răspunsurile din chat sunt simulate.
